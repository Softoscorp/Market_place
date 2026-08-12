from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import ValidationError
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .. import models, schemas
from ..database import get_db
from ..security import create_access_token, hash_password, verify_password, create_password_reset_token, decode_password_reset_token

router = APIRouter(prefix="/auth", tags=["auth"])


import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
PHONE_REGEX = re.compile(r"^\+?[0-9\s\-]{7,15}$")


# Simple in-memory rate limiter (per-IP). Production should use Redis.
_RATE_LIMIT_MAX = 20
_RATE_LIMIT_WINDOW_SECONDS = 300
_rate_attempts: dict[str, list[datetime]] = {}


def _rate_limit(ip: str):
    now = datetime.utcnow()
    attempts = [t for t in _rate_attempts.get(ip, []) if now - t < timedelta(seconds=_RATE_LIMIT_WINDOW_SECONDS)]
    if len(attempts) >= _RATE_LIMIT_MAX:
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Please try again later.",
        )
    attempts.append(now)
    _rate_attempts[ip] = attempts


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.RegisterRequest, request: Request, db: Session = Depends(get_db)):
    _rate_limit(_client_ip(request))

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
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")
        
    if payload.device_id:
        existing_device = db.query(models.User).filter(models.User.device_id == payload.device_id).first()
        if existing_device:
            raise HTTPException(
                status_code=403, 
                detail="An account has already been created from this device. Please use your existing account."
            )

    user = models.User(
        email=payload.email.strip().lower(),
        password_hash=hash_password(payload.password),
        name=payload.name,
        phone=payload.phone or "",
        role=payload.role,
        language=payload.language,
        device_id=payload.device_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return schemas.TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, request: Request, db: Session = Depends(get_db)):
    _rate_limit(_client_ip(request))

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


@router.post("/google", response_model=schemas.TokenResponse)
def google_auth(payload: schemas.GoogleAuthRequest, request: Request, db: Session = Depends(get_db)):
    _rate_limit(_client_ip(request))
    
    from ..config import settings
    if not settings.google_client_id or settings.google_client_id == "YOUR_GOOGLE_CLIENT_ID":
        raise HTTPException(status_code=500, detail="Google Sign-In is not configured yet. Missing Client ID.")
        
    try:
        idinfo = id_token.verify_oauth2_token(
            payload.credential, 
            google_requests.Request(), 
            settings.google_client_id
        )
        
        email = idinfo.get('email')
        if not email:
            raise HTTPException(status_code=400, detail="Google token did not contain an email address")
            
        email = email.lower().strip()
        name = idinfo.get('name', 'Google User')
        
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            # First time user, register them
            role = payload.role if payload.role else models.UserRole.renter
            if role in (models.UserRole.admin, models.UserRole.customer_care):
                role = models.UserRole.renter # Prevent privilege escalation via Google Auth
                
            user = models.User(
                email=email,
                # Random password for Google users since they don't log in via password
                password_hash=hash_password(secrets.token_urlsafe(32)),
                name=name,
                phone="",
                role=role,
                language="en",
                is_verified=True, # Emails from Google are implicitly verified
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        elif user.account_status != models.AccountStatus.active:
            raise HTTPException(
                status_code=403,
                detail=f"This account is {user.account_status.value}."
                + (f" Reason: {user.status_reason}" if user.status_reason else ""),
            )
            
        token = create_access_token(subject=str(user.id))
        return schemas.TokenResponse(access_token=token, user=user)
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google credential: {str(e)}")


@router.post("/forgot-password")
def forgot_password(payload: schemas.ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    _rate_limit(_client_ip(request))

    user = db.query(models.User).filter(models.User.email == payload.email).first()
    # Always return the same message whether or not the email exists (anti-enumeration).
    if user is None:
        return {"message": "If an account exists for this email, a reset link has been sent."}

    token = create_password_reset_token(user.email)
    reset_link = f"https://market-place-chi-lime.vercel.app/login?reset_token={token}&email={user.email}"

    try:
        from ..config import settings
        import resend
        resend.api_key = settings.resend_api_key
        if not resend.api_key:
            return {"message": "If an account exists for this email, a reset link has been sent."}
        params: resend.Emails.SendParams = {
            "from": settings.resend_from_email or "noreply@houseagent.co",
            "to": [user.email],
            "subject": "Reset your House Agent password",
            "html": (
                f"<p>Hello {user.name},</p>"
                f"<p>We received a request to reset your password. Click the link below to set a new one:</p>"
                f"<p><a href=\"{reset_link}\">Reset my password</a></p>"
                f"<p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>"
            ),
        }
        resend.Emails.send(params)
    except Exception:
        pass

    return {"message": "If an account exists for this email, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    _rate_limit(_client_ip(request))

    email = decode_password_reset_token(payload.token)
    if email is None or email.lower() != payload.email.strip().lower():
        raise HTTPException(status_code=400, detail="Invalid or expired reset link. Please request a new one.")

    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link. Please request a new one.")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully. You can now log in with your new password."}

