from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db
from models import QueuedVideo, User
from services.auth import get_current_user

router = APIRouter(prefix="/queue", tags=["queue"])


class UpdateQueueBody(BaseModel):
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    ai_caption: Optional[str] = None


@router.get("")
def list_queue(current_user: User = Depends(get_current_user), status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(QueuedVideo).filter(QueuedVideo.user_id == current_user.id)
    if status:
        query = query.filter(QueuedVideo.status == status)
    return query.order_by(QueuedVideo.created_at.desc()).all()


@router.patch("/{video_id}")
def update_queue_item(video_id: str, body: UpdateQueueBody, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    video = db.query(QueuedVideo).filter(QueuedVideo.id == video_id, QueuedVideo.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if body.status is not None:
        video.status = body.status
    if body.scheduled_at is not None:
        video.scheduled_at = body.scheduled_at
    if body.ai_caption is not None:
        video.ai_caption = body.ai_caption
    db.commit()
    db.refresh(video)
    return video


@router.delete("/{video_id}")
def delete_queue_item(video_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    video = db.query(QueuedVideo).filter(QueuedVideo.id == video_id, QueuedVideo.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    db.delete(video)
    db.commit()
    return {"ok": True}


@router.post("/{video_id}/approve")
def approve_video(video_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    video = db.query(QueuedVideo).filter(QueuedVideo.id == video_id, QueuedVideo.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    video.status = "ready"
    db.commit()
    db.refresh(video)
    return video
