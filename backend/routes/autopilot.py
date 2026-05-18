from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from database import get_db
from models import AutopilotSettings, QueuedVideo, PostHistory, Source, User
from services.auth import get_current_user

router = APIRouter(prefix="/autopilot", tags=["autopilot"])


class SaveAutopilotBody(BaseModel):
    enabled: bool
    start_hour: Optional[int] = 8
    end_hour: Optional[int] = 22
    days: Optional[int] = None
    end_date: Optional[str] = None


@router.get("")
def get_autopilot(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = db.query(AutopilotSettings).filter(AutopilotSettings.user_id == current_user.id).first()

    active_sources = db.query(Source).filter(
        Source.user_id == current_user.id,
        Source.is_active == True,
    ).all()
    posts_per_day_from_sources = sum(s.videos_per_day for s in active_sources)
    active_sources_count = len(active_sources)

    if not settings:
        return {
            "enabled": False,
            "start_hour": 8,
            "end_hour": 22,
            "end_date": None,
            "posts_per_day_from_sources": posts_per_day_from_sources,
            "active_sources_count": active_sources_count,
        }

    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    posted_today = db.query(PostHistory).filter(
        PostHistory.user_id == current_user.id,
        PostHistory.status == "success",
        PostHistory.posted_at >= today_start,
        PostHistory.posted_at < today_end,
    ).count()

    scheduled_today = db.query(QueuedVideo).filter(
        QueuedVideo.user_id == current_user.id,
        QueuedVideo.status == "scheduled",
        QueuedVideo.scheduled_at >= today_start,
        QueuedVideo.scheduled_at < today_end,
    ).all()

    next_post = None
    for v in sorted(scheduled_today, key=lambda x: x.scheduled_at or datetime.max):
        if v.scheduled_at and v.scheduled_at > now:
            next_post = v.scheduled_at.isoformat()
            break

    pending_count = db.query(QueuedVideo).filter(
        QueuedVideo.user_id == current_user.id,
        QueuedVideo.status == "pending",
    ).count()

    return {
        "enabled": settings.enabled,
        "start_hour": settings.start_hour,
        "end_hour": settings.end_hour,
        "end_date": settings.end_date.isoformat() if settings.end_date else None,
        "posts_per_day_from_sources": posts_per_day_from_sources,
        "active_sources_count": active_sources_count,
        "posted_today": posted_today,
        "scheduled_today": len(scheduled_today),
        "next_post_at": next_post,
        "pending_in_queue": pending_count,
    }


@router.post("")
def save_autopilot(body: SaveAutopilotBody, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings = db.query(AutopilotSettings).filter(AutopilotSettings.user_id == current_user.id).first()

    end_date = None
    if body.days:
        end_date = datetime.utcnow() + timedelta(days=body.days)
    elif body.end_date:
        end_date = datetime.fromisoformat(body.end_date)

    if settings:
        settings.enabled = body.enabled
        settings.start_hour = body.start_hour if body.start_hour is not None else 8
        settings.end_hour = body.end_hour if body.end_hour is not None else 22
        settings.end_date = end_date
        settings.updated_at = datetime.utcnow()
    else:
        settings = AutopilotSettings(
            user_id=current_user.id,
            enabled=body.enabled,
            start_hour=body.start_hour if body.start_hour is not None else 8,
            end_hour=body.end_hour if body.end_hour is not None else 22,
            end_date=end_date,
        )
        db.add(settings)

    db.commit()

    if body.enabled:
        from services.scheduler import schedule_daily_posts
        import threading
        threading.Thread(target=schedule_daily_posts, daemon=True).start()

    return {"ok": True}


@router.post("/trigger")
def trigger_now(current_user: User = Depends(get_current_user)):
    from services.scheduler import schedule_daily_posts
    import threading
    threading.Thread(target=schedule_daily_posts, daemon=True).start()
    return {"ok": True}
