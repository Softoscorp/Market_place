from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/verifications", tags=["verifications"])

@router.post("/apply", response_model=schemas.VerificationApplicationOut)
def apply_for_verification(
    app_in: schemas.VerificationApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.agent:
        raise HTTPException(status_code=403, detail="Only agents can apply for verification")

    existing = db.query(models.VerificationApplication).filter(
        models.VerificationApplication.agent_id == current_user.id,
        models.VerificationApplication.tier == app_in.tier,
        models.VerificationApplication.status.in_([models.VerificationStatus.pending, models.VerificationStatus.approved])
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail=f"Already have a pending or approved application for {app_in.tier} tier")

    new_app = models.VerificationApplication(
        agent_id=current_user.id,
        tier=app_in.tier,
        status=models.VerificationStatus.pending,
        proof_urls=app_in.proof_urls
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

@router.get("/my-status", response_model=List[schemas.VerificationApplicationOut])
def get_my_verification_status(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.agent:
        raise HTTPException(status_code=403, detail="Only agents have verification status")

    apps = db.query(models.VerificationApplication).filter(
        models.VerificationApplication.agent_id == current_user.id
    ).order_by(models.VerificationApplication.created_at.desc()).all()
    return apps

@router.get("/admin", response_model=List[schemas.VerificationApplicationOut])
def list_verifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    apps = db.query(models.VerificationApplication).order_by(models.VerificationApplication.created_at.desc()).all()
    return apps

class ReviewApplicationRequest(schemas.BaseModel):
    reviewer_notes: str | None = None

@router.post("/admin/{app_id}/approve", response_model=schemas.VerificationApplicationOut)
def approve_verification(
    app_id: int,
    req: ReviewApplicationRequest | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    app = db.query(models.VerificationApplication).filter(models.VerificationApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if app.status != models.VerificationStatus.pending:
        raise HTTPException(status_code=400, detail="Application is not pending")

    app.status = models.VerificationStatus.approved
    app.reviewed_at = datetime.utcnow()
    if req and req.reviewer_notes:
        app.reviewer_notes = req.reviewer_notes

    user = db.query(models.User).filter(models.User.id == app.agent_id).first()
    if user:
        user.verification_tier = app.tier
        user.is_verified = True 

    db.commit()
    db.refresh(app)
    return app

@router.post("/admin/{app_id}/reject", response_model=schemas.VerificationApplicationOut)
def reject_verification(
    app_id: int,
    req: ReviewApplicationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    app = db.query(models.VerificationApplication).filter(models.VerificationApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if app.status != models.VerificationStatus.pending:
        raise HTTPException(status_code=400, detail="Application is not pending")

    app.status = models.VerificationStatus.rejected
    app.reviewed_at = datetime.utcnow()
    app.reviewer_notes = req.reviewer_notes

    db.commit()
    db.refresh(app)
    return app

from fastapi import UploadFile, File
from ..services.supabase_storage import upload_file
from ..services.file_validation import validate_proof
import uuid

@router.post("/upload-proof")
async def upload_verification_proof(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.agent:
        raise HTTPException(status_code=403, detail="Only agents can upload proof")

    file_bytes = validate_proof(file)
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    if ext not in {"jpg", "jpeg", "png", "webp", "gif", "pdf"}:
        ext = "jpg"
    path = f"verifications/{current_user.id}/{uuid.uuid4()}.{ext}"
    
    url = upload_file(
        file_bytes, 
        "rental-media", 
        path, 
        file.content_type or "application/octet-stream"
    )
    
    return {"url": url}
