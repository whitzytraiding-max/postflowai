from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Source, User
from services.auth import get_current_user

router = APIRouter(prefix="/sources", tags=["sources"])


class CreateSourceBody(BaseModel):
    platform: str
    tag: str
    min_views: Optional[int] = 50000
    max_age_days: Optional[int] = 7
    videos_per_day: Optional[int] = 3
    post_to_platform: str
    language: Optional[str] = "any"
    auto_approve: Optional[bool] = False


class UpdateSourceBody(BaseModel):
    is_active: Optional[bool] = None
    min_views: Optional[int] = None
    max_age_days: Optional[int] = None
    videos_per_day: Optional[int] = None
    post_to_platform: Optional[str] = None
    tag: Optional[str] = None
    language: Optional[str] = None
    auto_approve: Optional[bool] = None


@router.get("")
def list_sources(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Source).filter(Source.user_id == current_user.id).order_by(Source.created_at.desc()).all()


@router.post("")
def create_source(body: CreateSourceBody, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    source = Source(
        user_id=current_user.id,
        platform=body.platform,
        tag=body.tag,
        min_views=body.min_views,
        max_age_days=body.max_age_days,
        videos_per_day=body.videos_per_day,
        post_to_platform=body.post_to_platform,
        language=body.language or "any",
        auto_approve=body.auto_approve or False,
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


@router.patch("/{source_id}")
def update_source(source_id: str, body: UpdateSourceBody, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id, Source.user_id == current_user.id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(source, field, value)
    db.commit()
    db.refresh(source)
    return source


@router.delete("/{source_id}")
def delete_source(source_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id, Source.user_id == current_user.id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    db.delete(source)
    db.commit()
    return {"ok": True}
