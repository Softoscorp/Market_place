from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user
from ..services.ttl_cache import clear_cache

router = APIRouter(prefix="/claims", tags=["Claims"])

# ---------------------------------------------------------------------------
# Trust / anti-abuse
# ---------------------------------------------------------------------------

DEFAULT_MAX_ACTIVE_CLAIMS = 3
LOW_TRUST_MAX_ACTIVE_CLAIMS = 1
LOW_TRUST_THRESHOLD = 50
TRUST_PER_OWNER_RELEASED = 25
TRUST_PER_SELF_CANCELLED = 10
TRUST_PER_COMPLETED = 15


def _trust_scores(db: Session, user_id: int) -> dict:
    """Computes a user's claim trust from their claim history.

    Trust = 100 - 25*(owner-released) - 10*(self-cancelled) + 15*(completed),
    clamped to [0, 100]. Users who claim and abandon (get released by the
    owner) or cancel repeatedly lose trust; completing deals builds it back.
    """
    rows = (
        db.query(models.Claim.status, models.Claim.released_by)
        .filter(models.Claim.claimer_id == user_id)
        .all()
    )
    owner_released = sum(1 for s, rb in rows if s == models.ClaimStatus.released and rb != user_id)
    self_cancelled = sum(1 for s, rb in rows if s == models.ClaimStatus.released and rb == user_id)
    completed = sum(1 for s, _ in rows if s == models.ClaimStatus.completed)
    active = sum(1 for s, _ in rows if s == models.ClaimStatus.claimed)

    trust = 100 - TRUST_PER_OWNER_RELEASED * owner_released - TRUST_PER_SELF_CANCELLED * self_cancelled + TRUST_PER_COMPLETED * completed
    trust = max(0, min(100, trust))

    max_active = LOW_TRUST_MAX_ACTIVE_CLAIMS if trust < LOW_TRUST_THRESHOLD else DEFAULT_MAX_ACTIVE_CLAIMS
    return {
        "trust": trust,
        "active": active,
        "max_active": max_active,
        "completed": completed,
        "owner_released": owner_released,
        "self_cancelled": self_cancelled,
    }


def _check_claim_quota(db: Session, user: models.User):
    """Verifies the claimer is allowed to make a new claim."""
    if user.verification_tier == models.VerificationTier.none:
        raise HTTPException(status_code=403, detail="claim_requires_verification")
    scores = _trust_scores(db, user.id)
    if scores["active"] >= scores["max_active"]:
        raise HTTPException(status_code=429, detail="claim_limit_reached")


def _active_claim(db: Session, target_type: str, target_id: int) -> models.Claim | None:
    return (
        db.query(models.Claim)
        .filter(
            models.Claim.target_type == target_type,
            models.Claim.target_id == target_id,
            models.Claim.status == models.ClaimStatus.claimed,
        )
        .first()
    )


def _target_owner(db: Session, target_type: str, target_id: int) -> int | None:
    """Returns the user id that owns the target (agent for listings, profile owner for roommates)."""
    if target_type == "listing":
        listing = db.query(models.Listing).filter(models.Listing.id == target_id).first()
        return listing.agent_id if listing else None
    if target_type == "roommate":
        profile = db.query(models.RoommateProfile).filter(models.RoommateProfile.id == target_id).first()
        return profile.user_id if profile else None
    return None


def _is_admin(user: models.User) -> bool:
    return user.role in (models.UserRole.admin, models.UserRole.customer_care)


# ---------------------------------------------------------------------------
# Claiming
# ---------------------------------------------------------------------------

@router.post("", response_model=schemas.ClaimOut)
def claim_target(
    req: schemas.ClaimRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    target_type = req.target_type.value

    owner_id = _target_owner(db, target_type, req.target_id)
    if owner_id is None:
        raise HTTPException(status_code=404, detail="Target not found")

    if target_type == "listing":
        listing = db.query(models.Listing).filter(models.Listing.id == req.target_id).first()
        if listing.status != models.ListingStatus.active:
            raise HTTPException(status_code=409, detail="This listing is no longer available")
    elif target_type == "roommate":
        profile = db.query(models.RoommateProfile).filter(models.RoommateProfile.id == req.target_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Roommate profile not found")

    # Nobody can claim their own item — that would be pointless / used to block.
    if owner_id == current_user.id:
        raise HTTPException(status_code=403, detail="You cannot claim your own item")

    existing = _active_claim(db, target_type, req.target_id)
    if existing:
        raise HTTPException(status_code=409, detail="This item has already been claimed")

    _check_claim_quota(db, current_user)

    claim = models.Claim(
        target_type=target_type,
        target_id=req.target_id,
        claimer_id=current_user.id,
        status=models.ClaimStatus.claimed,
    )
    db.add(claim)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This item has already been claimed")
    db.refresh(claim)

    clear_cache()
    return claim


@router.get("/status", response_model=schemas.ClaimStatusOut)
def claim_status(
    target_type: schemas.ClaimTargetType,
    target_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    target = target_type.value
    claim = _active_claim(db, target, target_id)
    owner_id = _target_owner(db, target, target_id)
    if not claim:
        return schemas.ClaimStatusOut(
            claimed=False,
            can_release=owner_id == current_user.id,
        )
    claimer_name = claim.claimer.name if claim.claimer else None
    return schemas.ClaimStatusOut(
        claimed=True,
        by_me=claim.claimer_id == current_user.id,
        claimer_name=claimer_name,
        created_at=claim.created_at,
        can_release=owner_id == current_user.id,
    )


@router.post("/cancel", response_model=schemas.ClaimStatusOut)
def cancel_claim(
    req: schemas.ClaimRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """The claimer backs out. Costs trust (self-cancelled), frees the item."""
    target = req.target_type.value
    claim = _active_claim(db, target, req.target_id)
    if not claim:
        raise HTTPException(status_code=404, detail="No active claim found")
    if claim.claimer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the claimer can cancel their own claim")

    now = datetime.utcnow()
    claim.status = models.ClaimStatus.released
    claim.released_at = now
    claim.released_by = current_user.id
    db.commit()

    clear_cache()
    return schemas.ClaimStatusOut(claimed=False, can_release=False)


@router.post("/release", response_model=schemas.ClaimStatusOut)
def release_claim(
    req: schemas.ClaimRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Owner (or admin) cancels a hold — item returns to the market."""
    target = req.target_type.value
    claim = _active_claim(db, target, req.target_id)
    if not claim:
        raise HTTPException(status_code=404, detail="No active claim found")

    owner_id = _target_owner(db, target, req.target_id)
    if not (owner_id == current_user.id or _is_admin(current_user)):
        raise HTTPException(status_code=403, detail="Only the owner can release this claim")

    claim.status = models.ClaimStatus.released
    claim.released_at = datetime.utcnow()
    claim.released_by = current_user.id
    db.commit()

    clear_cache()
    return schemas.ClaimStatusOut(claimed=False, can_release=False)


@router.post("/complete", response_model=schemas.ClaimStatusOut)
def complete_claim(
    req: schemas.ClaimRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Owner (or admin) closes the deal — the item stays off the market.

    For listings, the listing is also flipped to `rented` so it can never
    reappear in search. This is the ONLY way to take an item permanently off.
    """
    target = req.target_type.value
    claim = _active_claim(db, target, req.target_id)
    if not claim:
        raise HTTPException(status_code=404, detail="No active claim found")

    owner_id = _target_owner(db, target, req.target_id)
    if not (owner_id == current_user.id or _is_admin(current_user)):
        raise HTTPException(status_code=403, detail="Only the owner can complete this claim")

    claim.status = models.ClaimStatus.completed
    claim.released_at = datetime.utcnow()
    claim.released_by = current_user.id
    claim.completed_at = datetime.utcnow()

    if target == "listing":
        listing = db.query(models.Listing).filter(models.Listing.id == req.target_id).first()
        if listing:
            listing.status = models.ListingStatus.rented
    db.commit()

    clear_cache()
    return schemas.ClaimStatusOut(
        claimed=False,
        by_me=claim.claimer_id == current_user.id,
        can_release=False,
    )


@router.get("/my-trust", response_model=schemas.ClaimTrustOut)
def my_trust(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    scores = _trust_scores(db, current_user.id)
    return schemas.ClaimTrustOut(
        trust=scores["trust"],
        active=scores["active"],
        max_active=scores["max_active"],
        completed=scores["completed"],
        owner_released=scores["owner_released"],
        self_cancelled=scores["self_cancelled"],
    )


@router.get("/mine", response_model=list[schemas.ClaimOut])
def my_claims(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    claims = (
        db.query(models.Claim)
        .filter(models.Claim.claimer_id == current_user.id)
        .order_by(models.Claim.created_at.desc())
        .all()
    )
    result = []
    for claim in claims:
        out = schemas.ClaimOut.model_validate(claim)
        out.claimer_name = claim.claimer.name if claim.claimer else None
        result.append(out)
    return result


@router.get("/owner", response_model=list[schemas.ClaimOut])
def owner_claims(
    target_type: schemas.ClaimTargetType,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Active claims on targets the current user owns (listings they posted
    or roommate profiles they created) — used by the agent dashboard."""
    target = target_type.value
    if target == "listing":
        listing_ids = [
            row[0]
            for row in db.query(models.Listing.id)
            .filter(models.Listing.agent_id == current_user.id)
            .all()
        ]
        if not listing_ids:
            return []
        claims = (
            db.query(models.Claim)
            .filter(
                models.Claim.target_type == "listing",
                models.Claim.target_id.in_(listing_ids),
                models.Claim.status == models.ClaimStatus.claimed,
            )
            .order_by(models.Claim.created_at.desc())
            .all()
        )
    else:
        profile_ids = [
            row[0]
            for row in db.query(models.RoommateProfile.id)
            .filter(models.RoommateProfile.user_id == current_user.id)
            .all()
        ]
        if not profile_ids:
            return []
        claims = (
            db.query(models.Claim)
            .filter(
                models.Claim.target_type == "roommate",
                models.Claim.target_id.in_(profile_ids),
                models.Claim.status == models.ClaimStatus.claimed,
            )
            .order_by(models.Claim.created_at.desc())
            .all()
        )
    result = []
    for claim in claims:
        out = schemas.ClaimOut.model_validate(claim)
        out.claimer_name = claim.claimer.name if claim.claimer else None
        result.append(out)
    return result


@router.get("/admin/all", response_model=list[schemas.ClaimOut])
def admin_list_claims(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    claims = (
        db.query(models.Claim)
        .filter(models.Claim.status == models.ClaimStatus.claimed)
        .order_by(models.Claim.created_at.desc())
        .all()
    )
    result = []
    for claim in claims:
        out = schemas.ClaimOut.model_validate(claim)
        out.claimer_name = claim.claimer.name if claim.claimer else None
        result.append(out)
    return result