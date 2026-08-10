import os
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..config import settings
from ..contact_filter import find_external_contact_info
from ..database import get_db
from ..dependencies import get_current_user, require_agent
from ..services.supabase_storage import upload_file, delete_file
from ..services.file_validation import validate_image
from ..services.ttl_cache import ttl_cache
from ..translation import translate_with_cache

_view_executor = ThreadPoolExecutor(max_workers=2)


def _increment_view_count_async(listing_id: int):
    """Bump a listing's view_count without delaying the API response.

    Runs a single UPDATE in its own connection/thread so the request can return
    immediately; a failure here is never fatal.
    """
    def _bump():
        try:
            from ..database import SessionLocal
            from sqlalchemy import text
            with SessionLocal() as s:
                s.execute(
                    text("UPDATE listings SET view_count = COALESCE(view_count, 0) + 1 WHERE id = :id"),
                    {"id": listing_id},
                )
                s.commit()
        except Exception:
            pass

    _view_executor.submit(_bump)


def _get_agent_metrics(db: Session, listings: list[models.Listing]) -> dict[int, dict[str, float | int]]:
    """Batched agent metrics (ratings + 60-day respond rate) in a handful of queries.

    The DB work is cached for 60s keyed on the agent IDs, so repeat views of
    listings for the same agent are served from memory instead of re-running
    three queries every time.
    """
    agent_ids = {listing.agent_id for listing in listings if getattr(listing, "agent_id", None) is not None}
    if not agent_ids:
        return {}
    return _agent_metrics_db(tuple(sorted(agent_ids)), db)


@ttl_cache(ttl_seconds=60)
def _agent_metrics_db(agent_ids: tuple[int, ...], _db: Session) -> dict[int, dict[str, float | int]]:
    metrics_by_agent_id: dict[int, dict[str, float | int]] = {}

    # 1) Ratings summary for all agents in one grouped query.
    rating_rows = (
        _db.query(
            models.AgentRating.agent_id,
            func.avg(models.AgentRating.stars),
            func.count(models.AgentRating.id),
        )
        .filter(models.AgentRating.agent_id.in_(agent_ids))
        .group_by(models.AgentRating.agent_id)
        .all()
    )
    for agent_id, avg, count in rating_rows:
        metrics_by_agent_id.setdefault(agent_id, {})["average_rating"] = round(float(avg), 2) if avg is not None else 0.0
        metrics_by_agent_id.setdefault(agent_id, {})["rating_count"] = count or 0

    # 2) Respond rate (last 60 days), batched: pull the relevant conversations
    #    and all of their messages in exactly two queries instead of N+1.
    cutoff = datetime.utcnow() - timedelta(days=60)
    conversations = (
        _db.query(models.Conversation)
        .filter(
            models.Conversation.agent_id.in_(agent_ids),
            models.Conversation.created_at >= cutoff,
        )
        .all()
    )
    conv_ids = [conv.id for conv in conversations]
    messages_by_conv: dict[int, list[models.Message]] = {}
    if conv_ids:
        msgs = (
            _db.query(models.Message)
            .filter(models.Message.conversation_id.in_(conv_ids))
            .order_by(models.Message.created_at.asc())
            .all()
        )
        for msg in msgs:
            messages_by_conv.setdefault(msg.conversation_id, []).append(msg)

    responded_by_agent: dict[int, int] = {}
    measurable_by_agent: dict[int, int] = {}
    for conv in conversations:
        agent_id = conv.agent_id
        conv_msgs = messages_by_conv.get(conv.id, [])
        renter_msgs = [m for m in conv_msgs if m.sender_id != agent_id]
        agent_msgs = [m for m in conv_msgs if m.sender_id == agent_id]

        if not renter_msgs:
            continue

        first_renter_msg = renter_msgs[0]
        measurable_by_agent[agent_id] = measurable_by_agent.get(agent_id, 0) + 1
        deadline = first_renter_msg.created_at + timedelta(hours=24)
        if any(m.created_at <= deadline for m in agent_msgs):
            responded_by_agent[agent_id] = responded_by_agent.get(agent_id, 0) + 1

    for agent_id in agent_ids:
        entry = metrics_by_agent_id.setdefault(agent_id, {"average_rating": 0.0, "rating_count": 0})
        measurable = measurable_by_agent.get(agent_id, 0)
        entry["respond_rate"] = round((responded_by_agent.get(agent_id, 0) / measurable) * 100, 1) if measurable else 100.0

    return metrics_by_agent_id

router = APIRouter(prefix="/listings", tags=["listings"])


def _check_no_contact_info(title: str, description: str):
    for field_name, value in (("title", title), ("description", description)):
        if value is None:
            continue
        reason = find_external_contact_info(value)
        if reason:
            raise HTTPException(
                status_code=400,
                detail=f"Your {field_name} {reason}. Keep contact details out of listings — "
                f"renters can message you directly through the platform.",
            )


def _serialize_listing(listing: models.Listing, db: Session, agent_metrics: dict[int, dict[str, float | int]] | None = None) -> schemas.ListingOut:
    metrics = agent_metrics.get(listing.agent_id) if agent_metrics else None
    avg = metrics["average_rating"] if metrics else None
    count = metrics["rating_count"] if metrics else 0
    respond_rate = metrics["respond_rate"] if metrics else None

    out = schemas.ListingOut.model_validate(listing)
    out.agent.respond_rate = respond_rate
    out.agent_average_rating = avg
    out.agent_rating_count = count
    return out


def _get_owned_listing(listing_id: int, db: Session, current_user: models.User) -> models.Listing:
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.agent_id != current_user.id:  # type: ignore
        raise HTTPException(status_code=403, detail="Only the listing agent can do this")
    return listing


@router.post("", response_model=schemas.ListingOut, status_code=201)
def create_listing(
    payload: schemas.ListingCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_agent),
):
    _check_no_contact_info(payload.title, payload.description)

    listing = models.Listing(
        agent_id=current_user.id,
        title=payload.title,
        description=payload.description,
        price=payload.price,
        house_type=payload.house_type,
        location=payload.location,
        distance_to_university=payload.distance_to_university,
        furnished=payload.furnished,
        parking=payload.parking,
        pet_friendly=payload.pet_friendly,
        generator=payload.generator,
        pool=payload.pool,
        gym=payload.gym,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing, db, _get_agent_metrics(db, [listing]))


@router.get("/location-counts", response_model=list[schemas.LocationCount])
@ttl_cache(ttl_seconds=30)
def location_counts(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Listing.location, func.count(models.Listing.id))
        .filter(models.Listing.status == "active")
        .group_by(models.Listing.location)
        .all()
    )
    return [schemas.LocationCount(location=location, count=count) for location, count in rows]


@router.get("", response_model=schemas.PaginatedListings)
@ttl_cache(ttl_seconds=15)
def browse_listings(
    house_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    location: Optional[str] = None,
    keyword: Optional[str] = None,
    furnished: Optional[bool] = None,
    parking: Optional[bool] = None,
    pet_friendly: Optional[bool] = None,
    generator: Optional[bool] = None,
    pool: Optional[bool] = None,
    gym: Optional[bool] = None,
    sort: str = Query("newest", pattern="^(newest|price_asc|price_desc|most_viewed)$"),
    status_filter: Optional[str] = Query("active", alias="status"),
    agent_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.Listing)

    if status_filter:
        query = query.filter(models.Listing.status == status_filter)
    if house_type:
        # Normalize legacy/cosmetic labels to DB enum values (e.g. "Studio" -> "1+0")
        normalized = house_type.strip().lower()
        if normalized == "studio":
            house_type = "1+0"
        if house_type in {member.value for member in models.HouseType}:
            query = query.filter(models.Listing.house_type == house_type)
    if min_price is not None:
        query = query.filter(models.Listing.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Listing.price <= max_price)
    if location:
        query = query.filter(models.Listing.location.ilike(f"%{location}%"))
    if furnished is not None:
        query = query.filter(models.Listing.furnished == furnished)
    if parking is not None:
        query = query.filter(models.Listing.parking == parking)
    if pet_friendly is not None:
        query = query.filter(models.Listing.pet_friendly == pet_friendly)
    if generator is not None:
        query = query.filter(models.Listing.generator == generator)
    if pool is not None:
        query = query.filter(models.Listing.pool == pool)
    if gym is not None:
        query = query.filter(models.Listing.gym == gym)
    if keyword:
        like = f"%{keyword}%"
        query = query.filter(
            or_(models.Listing.title.ilike(like), models.Listing.description.ilike(like))
        )
    if agent_id:
        query = query.filter(models.Listing.agent_id == agent_id)

    if sort == "price_asc":
        query = query.order_by(models.Listing.price.asc())
    elif sort == "price_desc":
        query = query.order_by(models.Listing.price.desc())
    elif sort == "most_viewed":
        query = query.order_by(models.Listing.view_count.desc())
    else:
        query = query.order_by(models.Listing.created_at.desc())

    total = query.count()
    items = (
        query.options(selectinload(models.Listing.agent), selectinload(models.Listing.photos))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    agent_metrics = _get_agent_metrics(db, items)
    serialized = [_serialize_listing(listing_obj, db, agent_metrics) for listing_obj in items]

    return schemas.PaginatedListings(items=serialized, total=total, page=page, page_size=page_size)


@ttl_cache(ttl_seconds=10)
def _get_listing_serialized(listing_id: int, _db: Session) -> schemas.ListingOut | None:
    listing = (
        _db.query(models.Listing)
        .options(selectinload(models.Listing.agent), selectinload(models.Listing.photos))
        .filter(models.Listing.id == listing_id)
        .first()
    )
    if not listing:
        return None
    return _serialize_listing(listing, _db, _get_agent_metrics(_db, [listing]))


@router.get("/{listing_id}", response_model=schemas.ListingOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    _increment_view_count_async(listing_id)
    result = _get_listing_serialized(listing_id, db)
    if result is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return result


@router.get("/{listing_id}/translation", response_model=schemas.ListingTranslationOut)
def get_listing_translation(
    listing_id: int,
    target_lang: str = Query("tr", min_length=2, max_length=5),
    db: Session = Depends(get_db),
):
    """Translate a listing's title + description into `target_lang`.

    Source language is auto-detected (translation service omits `source`), so
    an English listing can be read in Turkish and vice versa. Translations are
    computed on demand and cached in-memory by translate_with_cache.
    """
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status != "active":
        raise HTTPException(status_code=404, detail="Listing not found")

    return schemas.ListingTranslationOut(
        id=listing.id,
        title=translate_with_cache(listing.title, None, target_lang),
        description=translate_with_cache(listing.description, None, target_lang),
        target_lang=target_lang,
    )


@router.patch("/{listing_id}", response_model=schemas.ListingOut)
def update_listing(
    listing_id: int,
    payload: schemas.ListingUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    listing = _get_owned_listing(listing_id, db, current_user)
    updates = payload.model_dump(exclude_unset=True)

    _check_no_contact_info(
        updates.get("title", listing.title), updates.get("description", listing.description)
    )

    for field, value in updates.items():
        setattr(listing, field, value)
    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing, db, _get_agent_metrics(db, [listing]))


@router.delete("/{listing_id}", status_code=204)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    listing = _get_owned_listing(listing_id, db, current_user)
    
    # Delete physical photo files
    for photo in listing.photos:
        db.delete(photo)
        if photo.url.startswith("/media/"):  # type: ignore
            path = photo.url.replace("/media/", "")
            delete_file("rental-media", path)
        else:
            # Handle supabase urls by extracting the path
            # Supposing url is https://..../storage/v1/object/public/rental-media/listings/uuid.jpg
            # We can extract the part after rental-media/
            parts = photo.url.split("rental-media/")
            if len(parts) > 1:
                delete_file("rental-media", parts[1])
            
    db.delete(listing)
    db.commit()
    return None


@router.post("/{listing_id}/photos", response_model=schemas.ListingOut)
def upload_photo(
    listing_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    listing = _get_owned_listing(listing_id, db, current_user)

    if len(listing.photos) >= settings.max_listing_photos:
        raise HTTPException(
            status_code=400,
            detail=f"Max {settings.max_listing_photos} photos per listing",
        )

    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    ext = ext.lower() if ext in {".jpg", ".jpeg", ".png", ".webp", ".gif"} else ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    path = f"listings/{filename}"
    
    file_bytes = validate_image(file)
    
    # Supabase or local URL is returned
    url = upload_file(file_bytes, "rental-media", path, "image/jpeg" if ext == ".jpg" else ("image/png" if ext == ".png" else ("image/webp" if ext == ".webp" else "image/gif")))

    photo = models.ListingPhoto(
        listing_id=listing.id, url=url, order=len(listing.photos)
    )
    db.add(photo)
    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing, db, _get_agent_metrics(db, [listing]))


@router.delete("/{listing_id}/photos/{photo_id}", response_model=schemas.ListingOut)
def delete_photo(
    listing_id: int,
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    listing = _get_owned_listing(listing_id, db, current_user)
    photo = (
        db.query(models.ListingPhoto)
        .filter(models.ListingPhoto.id == photo_id, models.ListingPhoto.listing_id == listing_id)
        .first()
    )
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    # Remove file
    if photo.url.startswith("/media/"):  # type: ignore
        path = photo.url.replace("/media/", "")
        delete_file("rental-media", path)
    else:
        parts = photo.url.split("rental-media/")
        if len(parts) > 1:
            delete_file("rental-media", parts[1])
        
    db.delete(photo)
    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing, db, _get_agent_metrics(db, [listing]))
