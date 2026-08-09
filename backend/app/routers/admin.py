from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import require_admin, require_customer_care_or_admin
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


# Pre-made email templates shown in the admin panel. `content` is plain text;
# newlines are converted to <br> when rendered via Resend.
EMAIL_TEMPLATES: dict[str, dict[str, str]] = {
    "phone_update": {
        "subject": "Action needed: update your phone number",
        "content": (
            "Hi there,\n\n"
            "We don't have a valid phone number on your House Agent account. "
            "To keep your account secure and receive platform notifications, "
            "please log in and update your phone number in your profile settings.\n\n"
            "If you need help, just reply to this email.\n\n"
            "Best regards,\nHouse Agent Support"
        ),
    },
    "account_verify": {
        "subject": "Please verify your account",
        "content": (
            "Hi there,\n\n"
            "To continue using your House Agent account, please complete account "
            "verification. You can find the verification option in your profile.\n\n"
            "If you have any questions, reply to this email.\n\n"
            "Best regards,\nHouse Agent Support"
        ),
    },
    "complaint_response": {
        "subject": "Update on your complaint",
        "content": (
            "Hi there,\n\n"
            "Thank you for getting in touch. We've reviewed your report and are "
            "looking into it. We'll get back to you with an update as soon as we can.\n\n"
            "Best regards,\nHouse Agent Support"
        ),
    },
}


@router.get("/users", response_model=list[schemas.AdminUserOut])
def list_users(
    role: str | None = None,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    query = db.query(models.User).filter(models.User.role != models.UserRole.admin)
    if role:
        query = query.filter(models.User.role == role)
    return query.order_by(models.User.created_at.desc()).all()


@router.patch("/users/{user_id}/status", response_model=schemas.AdminUserOut)
def update_user_status(
    user_id: int,
    payload: schemas.UpdateUserStatusRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == models.UserRole.admin:
        raise HTTPException(status_code=400, detail="Can't change status of another admin account")

    user.account_status = payload.account_status
    user.status_reason = payload.reason
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/role", response_model=schemas.AdminUserOut)
def update_user_role(
    user_id: int,
    payload: schemas.UpdateUserRoleRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == models.UserRole.admin:
        raise HTTPException(status_code=400, detail="Can't change role of an admin account")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/account-status", response_model=schemas.AdminUserOut)
def set_user_account_status(
    user_id: int,
    payload: schemas.AdminSetAccountStatusRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == models.UserRole.admin and user.id != admin.id:
        raise HTTPException(status_code=400, detail="Can't change status of another admin account")

    user.account_status = payload.status
    user.status_reason = payload.status_reason
    db.commit()
    db.refresh(user)
    return user


@router.patch("/agents/{agent_id}/verify", response_model=schemas.AdminUserOut)
def set_agent_verified(
    agent_id: int,
    payload: schemas.SetVerifiedRequest,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    agent = (
        db.query(models.User)
        .filter(models.User.id == agent_id, models.User.role == models.UserRole.agent)
        .first()
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.is_verified = payload.is_verified
    db.commit()
    db.refresh(agent)
    return agent


@router.get("/kyc", response_model=list[schemas.KYCDocumentOut])
def list_kyc_documents(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    query = db.query(models.KYCDocument)
    if status_filter:
        query = query.filter(models.KYCDocument.status == status_filter)
    return query.order_by(models.KYCDocument.created_at.desc()).all()


@router.patch("/kyc/{document_id}/review", response_model=schemas.KYCDocumentOut)
def review_kyc_document(
    document_id: int,
    status: models.KYCStatus,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    doc = db.query(models.KYCDocument).filter(models.KYCDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="KYC document not found")
        
    doc.status = status
    
    # If approved, automatically verify the agent
    if status == models.KYCStatus.approved:
        agent = db.query(models.User).filter(models.User.id == doc.agent_id).first()
        if agent:
            agent.is_verified = True
            
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/reports", response_model=list[schemas.AdminReportOut])
def list_reports(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    query = db.query(models.Report)
    if status_filter:
        query = query.filter(models.Report.status == status_filter)
    return query.order_by(models.Report.created_at.desc()).all()


@router.patch("/reports/{report_id}", response_model=schemas.ReportOut)
def review_report(
    report_id: int,
    payload: schemas.ReviewReportRequest,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = payload.status
    db.commit()
    db.refresh(report)
    return report


@router.get("/conversations", response_model=list[schemas.AdminConversationOut])
def list_all_conversations(
    db: Session = Depends(get_db),
    moderator: models.User = Depends(require_customer_care_or_admin),
):
    convs = db.query(models.Conversation).order_by(models.Conversation.created_at.desc()).all()
    out = []
    for conv in convs:
        last_message_at = conv.created_at
        last_msg = (
            db.query(models.Message)
            .filter(models.Message.conversation_id == conv.id)
            .order_by(models.Message.created_at.desc())
            .first()
        )
        if last_msg:
            last_message_at = last_msg.created_at
        out.append(
            schemas.AdminConversationOut(
                id=conv.id,
                renter=schemas.AdminConversationUserOut(
                    id=conv.renter.id, name=conv.renter.name, email=conv.renter.email
                ),
                agent=schemas.AdminConversationUserOut(
                    id=conv.agent.id, name=conv.agent.name, email=conv.agent.email
                ),
                last_message_at=last_message_at,
            )
        )
    return out


@router.get("/conversations/{conversation_id}/messages", response_model=list[schemas.MessageOut])
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    moderator: models.User = Depends(require_customer_care_or_admin),
):
    from .messaging import _serialize_message

    messages = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == conversation_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )
    return [_serialize_message(m, moderator, db) for m in messages]


@router.get("/email-logs", response_model=list[schemas.EmailLogOut])
def list_email_logs(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    """Audit trail of every platform email — admin-only."""
    return (
        db.query(models.EmailLog)
        .order_by(models.EmailLog.created_at.desc())
        .limit(200)
        .all()
    )


@router.post("/send-email", status_code=200)
def send_email_to_user(
    payload: schemas.SendEmailRequest,
    db: Session = Depends(get_db),
    moderator: models.User = Depends(require_customer_care_or_admin),
):
    """
    Sends an email via Resend API to any user.
    Requires RESEND_API_KEY in backend environment variables.
    Every email is recorded in email_logs for accountability.
    """
    if payload.template_key and payload.template_key not in EMAIL_TEMPLATES:
        raise HTTPException(status_code=400, detail="Unknown email template")
    try:
        import resend
        from ..config import settings
        resend.api_key = settings.resend_api_key
        if not resend.api_key:
            raise ValueError("RESEND_API_KEY is not configured.")
        params: resend.Emails.SendParams = {
            "from": settings.resend_from_email or "noreply@houseagent.co",
            "to": [payload.email],
            "subject": payload.subject,
            "html": f"<p>{payload.content.replace(chr(10), '<br>')}</p>",
        }
        resend.Emails.send(params)

        log = models.EmailLog(
            sender_id=moderator.id,
            recipient_email=payload.email,
            subject=payload.subject,
            content=payload.content,
            template_key=payload.template_key,
        )
        db.add(log)
        db.commit()
        return {"message": "Email sent successfully"}
    except Exception as e:
        logger.error(f"Failed to send email via Resend: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email. Please try again later.")
