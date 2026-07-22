from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
PHONE_REGEX = re.compile(r"^\+?[0-9\s\-]{7,15}$")


@router.post("/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    if not payload.email or not EMAIL_REGEX.match(payload.email.strip()):
        raise HTTPException(
            status_code=400,
            detail="Invalid email format. Please enter a valid email address (e.g., user@domain.com)."
        )

    if payload.phone:
        clean_phone = payload.phone.strip()
        if not PHONE_REGEX.match(clean_phone):
            raise HTTPException(
                status_code=400,
                detail="Invalid phone number format. Please enter a valid phone number (e.g., +905331234567)."
            )

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=payload.email.strip().lower(),
        password_hash=hash_password(payload.password),
        name=payload.name,
        phone=payload.phone or "",
        role=payload.role,
        language=payload.language,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return schemas.TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if user.account_status != models.AccountStatus.active:
        raise HTTPException(
            status_code=403,
            detail=f"This account is {user.account_status.value}."
            + (f" Reason: {user.status_reason}" if user.status_reason else ""),
        )

    token = create_access_token(subject=str(user.id))
    return schemas.TokenResponse(access_token=token, user=user)


@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully. You can now log in with your new password."}

