from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=schemas.ReportOut, status_code=201)
def create_report(
    payload: schemas.ReportCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if payload.target_type == models.ReportTargetType.listing:
        exists = db.query(models.Listing).filter(models.Listing.id == payload.target_id).first()
    else:
        exists = db.query(models.User).filter(models.User.id == payload.target_id).first()
    if not exists:
        raise HTTPException(status_code=404, detail="Report target not found")

    report = models.Report(
        reporter_id=current_user.id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        reason=payload.reason,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
