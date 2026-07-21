import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import and_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import settings
from ..contact_filter import find_external_contact_info
from ..database import get_db
from ..dependencies import get_current_user, require_renter
from ..translation import get_translation_service
from ..services.supabase_storage import upload_file

router = APIRouter(prefix="/messages", tags=["messages"])


def _get_conversation_for_user(conversation_id: int, db: Session, user: models.User) -> models.Conversation:
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if user.id not in (conv.renter_id, conv.agent_id):
        raise HTTPException(status_code=403, detail="Not a participant in this conversation")
    return conv


def _serialize_message(message: models.Message, reader: models.User, db: Session) -> schemas.MessageOut:
    text = None
    was_translated = False

    if message.message_type == models.MessageType.text:
        if not message.original_language or message.original_language == reader.language:
            text = message.original_text
        else:
            cache = message.translations or {}
            if reader.language in cache:
                text = cache[reader.language]
            else:
                service = get_translation_service()
                translated = service.translate(
                    message.original_text, message.original_language, reader.language
                )
                cache = {**cache, reader.language: translated}
                message.translations = cache
                db.add(message)
                db.commit()
                db.refresh(message)
                text = translated
            was_translated = True

    out = schemas.MessageOut.model_validate(message)
    out.text = text
    out.was_translated = was_translated
    return out


def _serialize_conversation(conv: models.Conversation, current_user: models.User, db: Session) -> schemas.ConversationOut:
    last_message_row = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == conv.id)
        .order_by(models.Message.created_at.desc())
        .first()
    )
    unread_count = (
        db.query(models.Message)
        .filter(
            models.Message.conversation_id == conv.id,
            models.Message.sender_id != current_user.id,
            models.Message.is_read.is_(False),
        )
        .count()
    )
    out = schemas.ConversationOut.model_validate(conv)
    out.last_message = _serialize_message(last_message_row, current_user, db) if last_message_row else None
    out.unread_count = unread_count
    return out


@router.post("/conversations", response_model=schemas.ConversationOut, status_code=201)
def start_conversation(
    payload: schemas.StartConversationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_renter),
):
    listing = db.query(models.Listing).filter(models.Listing.id == payload.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    reason = find_external_contact_info(payload.message)
    if reason:
        raise HTTPException(
            status_code=400,
            detail=f"Your message {reason}. Keep contact details in the platform's chat only.",
        )

    conv = (
        db.query(models.Conversation)
        .filter(
            and_(
                models.Conversation.listing_id == payload.listing_id,
                models.Conversation.renter_id == current_user.id,
            )
        )
        .first()
    )
    if not conv:
        conv = models.Conversation(
            listing_id=payload.listing_id,
            renter_id=current_user.id,
            agent_id=listing.agent_id,
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    message = models.Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        message_type=models.MessageType.text,
        original_text=payload.message,
        original_language=current_user.language,
    )
    db.add(message)
    db.commit()
    db.refresh(conv)

    return _serialize_conversation(conv, current_user, db)


@router.get("/conversations", response_model=list[schemas.ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    convs = (
        db.query(models.Conversation)
        .filter(
            (models.Conversation.renter_id == current_user.id)
            | (models.Conversation.agent_id == current_user.id)
        )
        .order_by(models.Conversation.created_at.desc())
        .all()
    )
    return [_serialize_conversation(c, current_user, db) for c in convs]


@router.get("/conversations/{conversation_id}/messages", response_model=list[schemas.MessageOut])
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    conv = _get_conversation_for_user(conversation_id, db, current_user)

    db.query(models.Message).filter(
        models.Message.conversation_id == conv.id,
        models.Message.sender_id != current_user.id,
        models.Message.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()

    messages = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == conv.id)
        .order_by(models.Message.created_at.asc())
        .all()
    )
    return [_serialize_message(m, current_user, db) for m in messages]


@router.post("/conversations/{conversation_id}/messages", response_model=schemas.MessageOut, status_code=201)
def send_text_message(
    conversation_id: int,
    body: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    conv = _get_conversation_for_user(conversation_id, db, current_user)

    reason = find_external_contact_info(body)
    if reason:
        raise HTTPException(
            status_code=400,
            detail=f"Your message {reason}. Keep contact details in the platform's chat only.",
        )

    message = models.Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        message_type=models.MessageType.text,
        original_text=body,
        original_language=current_user.language,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return _serialize_message(message, current_user, db)


@router.post("/conversations/{conversation_id}/voice", response_model=schemas.MessageOut, status_code=201)
def send_voice_message(
    conversation_id: int,
    file: UploadFile = File(...),
    duration_seconds: float = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    conv = _get_conversation_for_user(conversation_id, db, current_user)

    if duration_seconds > settings.max_voice_message_seconds:
        raise HTTPException(
            status_code=400,
            detail=f"Voice messages can't be longer than {settings.max_voice_message_seconds} seconds",
        )

    ext = os.path.splitext(file.filename or "")[1] or ".webm"
    filename = f"{uuid.uuid4().hex}{ext}"
    path = f"voice_messages/{filename}"

    file_bytes = file.file.read()
    url = upload_file(file_bytes, "rental-media", path, file.content_type or "audio/webm")

    message = models.Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        message_type=models.MessageType.voice,
        audio_url=url,
        audio_duration_seconds=duration_seconds,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return _serialize_message(message, current_user, db)
