from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Source

router = APIRouter(prefix="/sources", tags=["sources"])


class CreateSourceBody(BaseModel):
    user_id: str
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
def list_sources(user_id: str, db: Session = Depends(get_db)):
    sources = db.query(Source).filter(Source.user_id == user_id).order_by(Source.created_at.desc()).all()
    return sources


@router.post("")
def create_source(body: CreateSourceBody, db: Session = Depends(get_db)):
    source = Source(
        user_id=body.user_id,
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
def update_source(source_id: str, body: UpdateSourceBody, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    if body.is_active is not None:
        source.is_active = body.is_active
    if body.min_views is not None:
        source.min_views = body.min_views
    if body.max_age_days is not None:
        source.max_age_days = body.max_age_days
    if body.videos_per_day is not None:
        source.videos_per_day = body.videos_per_day
    if body.post_to_platform is not None:
        source.post_to_platform = body.post_to_platform
    if body.tag is not None:
        source.tag = body.tag
    if body.language is not None:
        source.language = body.language
    if body.auto_approve is not None:
        source.auto_approve = body.auto_approve
    db.commit()
    db.refresh(source)
    return source


@router.delete("/{source_id}")
def delete_source(source_id: str, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    db.delete(source)
    db.commit()
    return {"ok": True}
