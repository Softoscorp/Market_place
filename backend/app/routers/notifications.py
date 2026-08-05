"""
Notifications router — handles FCM token registration and web push subscription.
POST /notifications/register-token     → saves FCM token for native Android
POST /notifications/register-web-push  → saves VAPID web push subscription
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


# ─── FCM (Android) ────────────────────────────────────────────────────────────

class FcmTokenRequest(BaseModel):
    token: str
    platform: str = "android"


@router.post("/register-token", status_code=200)
def register_fcm_token(
    payload: FcmTokenRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Save or update the FCM device token for the current user."""
    existing = (
        db.query(models.FcmToken)
        .filter(models.FcmToken.token == payload.token)
        .first()
    )
    if existing:
        # Reassign to current user in case device changed hands
        existing.user_id = current_user.id
        existing.platform = payload.platform
    else:
        db.add(models.FcmToken(
            user_id=current_user.id,
            token=payload.token,
            platform=payload.platform,
        ))
    db.commit()
    return {"status": "ok"}


# ─── Web Push (VAPID / Browser) ───────────────────────────────────────────────

class WebPushRequest(BaseModel):
    endpoint: str
    keys: dict  # {"p256dh": "...", "auth": "..."}


@router.post("/register-web-push", status_code=200)
def register_web_push(
    payload: WebPushRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Save or update a Web Push (VAPID) subscription for the current user."""
    existing = (
        db.query(models.PushSubscription)
        .filter(models.PushSubscription.endpoint == payload.endpoint)
        .first()
    )
    if existing:
        existing.user_id = current_user.id
        existing.p256dh = payload.keys.get("p256dh", existing.p256dh)
        existing.auth = payload.keys.get("auth", existing.auth)
    else:
        db.add(models.PushSubscription(
            user_id=current_user.id,
            endpoint=payload.endpoint,
            p256dh=payload.keys.get("p256dh", ""),
            auth=payload.keys.get("auth", ""),
        ))
    db.commit()
    return {"status": "ok"}
