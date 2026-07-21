from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user, require_renter

router = APIRouter(tags=["ratings"])


@router.post(
    "/listings/{listing_id}/ratings",
    response_model=schemas.ApartmentRatingOut,
    status_code=201,
)
def rate_apartment(
    listing_id: int,
    payload: schemas.ApartmentRatingCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_renter),
):
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    has_conversation = (
        db.query(models.Conversation)
        .filter(
            models.Conversation.listing_id == listing_id,
            models.Conversation.renter_id == current_user.id,
        )
        .first()
    )
    if not has_conversation:
        raise HTTPException(
            status_code=400,
            detail="Message the agent about this listing before rating it.",
        )

    existing = (
        db.query(models.ApartmentRating)
        .filter(
            models.ApartmentRating.listing_id == listing_id,
            models.ApartmentRating.renter_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already rated this apartment")

    rating = models.ApartmentRating(
        listing_id=listing_id,
        renter_id=current_user.id,
        stars=payload.stars,
        comment=payload.comment,
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating


@router.get("/listings/{listing_id}/ratings", response_model=list[schemas.ApartmentRatingOut])
def list_apartment_ratings(listing_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.ApartmentRating)
        .filter(models.ApartmentRating.listing_id == listing_id)
        .order_by(models.ApartmentRating.created_at.desc())
        .all()
    )


@router.post("/agents/{agent_id}/ratings", response_model=schemas.AgentRatingOut, status_code=201)
def rate_agent(
    agent_id: int,
    payload: schemas.AgentRatingCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_renter),
):
    agent = (
        db.query(models.User)
        .filter(models.User.id == agent_id, models.User.role == models.UserRole.agent)
        .first()
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    has_conversation = (
        db.query(models.Conversation)
        .filter(
            models.Conversation.agent_id == agent_id,
            models.Conversation.renter_id == current_user.id,
        )
        .first()
    )
    if not has_conversation:
        raise HTTPException(
            status_code=400,
            detail="Message this agent before rating them.",
        )

    existing = (
        db.query(models.AgentRating)
        .filter(
            models.AgentRating.agent_id == agent_id,
            models.AgentRating.renter_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already rated this agent")

    rating = models.AgentRating(
        agent_id=agent_id,
        renter_id=current_user.id,
        stars=payload.stars,
        comment=payload.comment,
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating


@router.get("/agents/{agent_id}/ratings", response_model=list[schemas.AgentRatingOut])
def list_agent_ratings(agent_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.AgentRating)
        .filter(models.AgentRating.agent_id == agent_id)
        .order_by(models.AgentRating.created_at.desc())
        .all()
    )
