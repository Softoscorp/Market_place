import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import settings
from ..contact_filter import find_external_contact_info
from ..database import get_db
from ..dependencies import get_current_user, require_agent
from ..services.supabase_storage import upload_file, delete_file

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


def _serialize_listing(listing: models.Listing, db: Session) -> schemas.ListingOut:
    avg, count = listing.agent.agent_rating_summary(db)
    out = schemas.ListingOut.model_validate(listing)
    out.agent_average_rating = avg
    out.agent_rating_count = count
    return out


def _get_owned_listing(listing_id: int, db: Session, current_user: models.User) -> models.Listing:
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.agent_id != current_user.id:
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
        furnished=payload.furnished,
        parking=payload.parking,
        pet_friendly=payload.pet_friendly,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing, db)


@router.get("", response_model=schemas.PaginatedListings)
def browse_listings(
    house_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    location: Optional[str] = None,
    keyword: Optional[str] = None,
    sort: str = Query("newest", pattern="^(newest|price_asc|price_desc)$"),
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
        query = query.filter(models.Listing.house_type == house_type)
    if min_price is not None:
        query = query.filter(models.Listing.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Listing.price <= max_price)
    if location:
        query = query.filter(models.Listing.location.ilike(f"%{location}%"))
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
    else:
        query = query.order_by(models.Listing.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    serialized = [_serialize_listing(l, db) for l in items]

    return schemas.PaginatedListings(items=serialized, total=total, page=page, page_size=page_size)


@router.get("/{listing_id}", response_model=schemas.ListingOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return _serialize_listing(listing, db)


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
    return _serialize_listing(listing, db)


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
        if photo.url.startswith("/media/"):
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
    filename = f"{uuid.uuid4().hex}{ext}"
    path = f"listings/{filename}"
    
    file_bytes = file.file.read()
    
    # Supabase or local URL is returned
    url = upload_file(file_bytes, "rental-media", path, file.content_type or "image/jpeg")

    photo = models.ListingPhoto(
        listing_id=listing.id, url=url, order=len(listing.photos)
    )
    db.add(photo)
    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing, db)


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
    if photo.url.startswith("/media/"):
        path = photo.url.replace("/media/", "")
        delete_file("rental-media", path)
    else:
        parts = photo.url.split("rental-media/")
        if len(parts) > 1:
            delete_file("rental-media", parts[1])
        
    db.delete(photo)
    db.commit()
    db.refresh(listing)
    return _serialize_listing(listing, db)
