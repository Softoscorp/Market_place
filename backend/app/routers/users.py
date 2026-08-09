import os
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user
from ..config import settings
from ..services.supabase_storage import upload_file, delete_file
from ..services.file_validation import validate_image
from ..services.agent_metrics import batch_respond_rates
from ..services.ttl_cache import ttl_cache

logger = logging.getLogger(__name__)

router = APIRouter(tags=["users"])

# Local fallback dir — only used when Supabase env vars are not configured
UPLOAD_AVATAR_DIR = os.path.join(settings.media_root, "avatars")
os.makedirs(UPLOAD_AVATAR_DIR, exist_ok=True)


@router.get("/users/me", response_model=schemas.MeOut)
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    out = schemas.MeOut.model_validate(current_user)
    out.respond_rate = current_user.agent_respond_rate(db) if current_user.role == models.UserRole.agent else None
    return out


@router.post("/users/me/ping", status_code=204)
def ping_presence(current_user: models.User = Depends(get_current_user)):
    """Lightweight heartbeat — called every 60s from the frontend to keep last_seen_at fresh.
    Returns 204 No Content. last_seen_at is already stamped by get_current_user."""
    return None


@router.patch("/users/me", response_model=schemas.MeOut)
def update_me(
    payload: schemas.UpdateMeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    out = schemas.MeOut.model_validate(current_user)
    out.respond_rate = current_user.agent_respond_rate(db) if current_user.role == models.UserRole.agent else None
    return out


@router.post("/users/me/avatar", response_model=schemas.MeOut)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    ext = os.path.splitext(file.filename or "")[1].lower()
    ext = ext if ext in {".jpg", ".jpeg", ".png", ".webp", ".gif"} else ".jpg"
    storage_path = f"avatars/avatar_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    contents = validate_image(file)

    # Delete old avatar from Supabase (or local disk for legacy uploads)
    old_url: str | None = current_user.avatar_url  # type: ignore
    if old_url:
        if old_url.startswith("/media/"):
            old_disk_path = os.path.join(settings.media_root, old_url.lstrip("/"))
            try:
                if os.path.isfile(old_disk_path):
                    os.remove(old_disk_path)
            except Exception as e:
                logger.warning(f"Could not delete old local avatar {old_disk_path}: {e}")
        elif "/storage/v1/object/public/rental-media/" in old_url:
            old_storage_path = old_url.split("/storage/v1/object/public/rental-media/")[-1]
            try:
                delete_file("rental-media", old_storage_path)
            except Exception as e:
                logger.warning(f"Could not delete old Supabase avatar {old_storage_path}: {e}")

    # Upload to Supabase Storage (auto-falls back to local disk if Supabase not configured)
    public_url = upload_file(
        file_bytes=contents,
        bucket="rental-media",
        path=storage_path,
        content_type=file.content_type or "image/jpeg",
    )

    current_user.avatar_url = public_url  # type: ignore
    db.commit()
    db.refresh(current_user)
    out = schemas.MeOut.model_validate(current_user)
    out.respond_rate = current_user.agent_respond_rate(db) if current_user.role == models.UserRole.agent else None
    return out


@router.post("/users/me/push-token", status_code=status.HTTP_200_OK)
def save_push_token(
    payload: schemas.PushTokenRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Check if subscription already exists
    existing = db.query(models.PushSubscription).filter(
        models.PushSubscription.endpoint == payload.endpoint
    ).first()

    if existing:
        # Only allow the current user to claim their own token — never reassign
        # someone else's subscription to us (push-token takeover).
        if existing.user_id != current_user.id:
            raise HTTPException(status_code=409, detail="This subscription is already registered to another account")
        existing.p256dh = payload.p256dh
        existing.auth = payload.auth
    else:
        new_sub = models.PushSubscription(
            user_id=current_user.id,
            endpoint=payload.endpoint,
            p256dh=payload.p256dh,
            auth=payload.auth
        )
        db.add(new_sub)

    db.commit()
    return {"status": "ok", "message": "Push subscription saved successfully"}

@router.get("/users/me/saved", response_model=list[schemas.SavedPropertyOut])
def get_saved_properties(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    saved = db.query(models.SavedProperty).filter(models.SavedProperty.user_id == current_user.id).order_by(models.SavedProperty.created_at.desc()).all()
    return saved


@router.post("/users/me/saved/{listing_id}", response_model=schemas.SavedPropertyOut, status_code=status.HTTP_201_CREATED)
def save_property(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    existing = db.query(models.SavedProperty).filter(
        models.SavedProperty.user_id == current_user.id,
        models.SavedProperty.listing_id == listing_id
    ).first()
    
    if existing:
        return existing
        
    new_saved = models.SavedProperty(user_id=current_user.id, listing_id=listing_id)
    db.add(new_saved)
    db.commit()
    db.refresh(new_saved)
    return new_saved


@router.delete("/users/me/saved/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_saved_property(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    existing = db.query(models.SavedProperty).filter(
        models.SavedProperty.user_id == current_user.id,
        models.SavedProperty.listing_id == listing_id
    ).first()
    
    if not existing:
        raise HTTPException(status_code=404, detail="Saved property not found")
        
    db.delete(existing)
    db.commit()
    return None


@router.post("/users/me/kyc", response_model=schemas.KYCDocumentOut, status_code=status.HTTP_201_CREATED)
def submit_kyc_document(
    payload: schemas.KYCDocumentCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.agent:  # type: ignore
        raise HTTPException(status_code=403, detail="Only agents can submit KYC documents")
        
    doc = models.KYCDocument(
        agent_id=current_user.id,
        document_url=payload.document_url,
        status=models.KYCStatus.pending
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/agents/{agent_id}", response_model=schemas.AgentProfileOut)
def get_agent_profile(agent_id: int, db: Session = Depends(get_db)):
    agent = (
        db.query(models.User)
        .filter(models.User.id == agent_id, models.User.role == models.UserRole.agent)
        .first()
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    avg, count = agent.agent_rating_summary(db)

    agent_out = schemas.PublicUserOut.model_validate(agent)
    agent_out.respond_rate = batch_respond_rates(db, [agent_id]).get(agent_id)

    listings = (
        db.query(models.Listing)
        .options(
            selectinload(models.Listing.agent),
            selectinload(models.Listing.photos),
        )
        .filter(
            models.Listing.agent_id == agent_id,
            models.Listing.status == models.ListingStatus.active,
        )
        .order_by(models.Listing.created_at.desc())
        .all()
    )
    listing_outs = []
    for listing in listings:
        out = schemas.ListingOut.model_validate(listing)
        out.agent_average_rating = avg
        out.agent_rating_count = count
        listing_outs.append(out)

    return schemas.AgentProfileOut(
        agent=agent_out,
        average_rating=avg,
        rating_count=count,
        listings=listing_outs,
    )


@router.get("/agents", response_model=list[schemas.PublicUserOut])
@ttl_cache(ttl_seconds=15)
def list_agents(db: Session = Depends(get_db)):
    agents = db.query(models.User).filter(models.User.role == models.UserRole.agent).limit(10).all()
    results = []
    agent_ids = [agent.id for agent in agents]
    active_listing_counts = {
        agent_id: count
        for agent_id, count in db.query(models.Listing.agent_id, func.count(models.Listing.id))
        .filter(
            models.Listing.agent_id.in_(agent_ids),
            models.Listing.status == models.ListingStatus.active,
        )
        .group_by(models.Listing.agent_id)
    }
    respond_rates = batch_respond_rates(db, agent_ids)
    for agent in agents:
        out = schemas.PublicUserOut.model_validate(agent)
        out.respond_rate = respond_rates.get(agent.id)
        out.active_listings = active_listing_counts.get(agent.id, 0)
        results.append(out)
    return results

@router.post("/me/deactivate", response_model=schemas.PublicUserOut)
def deactivate_my_account(
    payload: schemas.DeactivateAccountRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    current_user.account_status = models.AccountStatus.suspended
    current_user.status_reason = payload.reason or "User deactivated their own account"
    db.commit()
    db.refresh(current_user)
    return current_user
