from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..dependencies import get_current_user

router = APIRouter(prefix="/roommates", tags=["Roommates"])

@router.get("", response_model=List[schemas.RoommateProfileOut])
def list_roommates(db: Session = Depends(get_db)):
    profiles = db.query(models.RoommateProfile).all()
    return profiles

@router.post("", response_model=schemas.RoommateProfileOut, status_code=status.HTTP_201_CREATED)
def create_roommate_profile(
    profile_in: schemas.RoommateProfileCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.renter:
        raise HTTPException(status_code=403, detail="Only renters can create roommate profiles")
        
    # We now allow multiple roommate profiles, e.g. for different listings

    db_profile = models.RoommateProfile(
        user_id=current_user.id,
        listing_id=profile_in.listing_id,
        name=profile_in.name,
        age=profile_in.age,
        gender=profile_in.gender,
        occupation=profile_in.occupation,
        university=profile_in.university,
        profile_type=profile_in.profile_type,
        house_type=profile_in.house_type,
        nationality=profile_in.nationality,
        budget=profile_in.budget,
        looking_for_city=profile_in.looking_for_city,
        move_in_date=profile_in.move_in_date,
        duration_months=profile_in.duration_months,
        bio=profile_in.bio,
        habits=profile_in.habits,
        gender_preference=profile_in.gender_preference,
        avatar_url=profile_in.avatar_url,
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

@router.get("/{profile_id}", response_model=schemas.RoommateProfileOut)
def get_roommate_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(models.RoommateProfile).filter(models.RoommateProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
