from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from database import get_db
from models import AutopilotSettings, QueuedVideo, PostHistory

router = APIRouter(prefix="/autopilot", tags=["autopilot"])


class SaveAutopilotBody(BaseModel):
    user_id: str
    enabled: bool
    posts_per_day: Optional[int] = 5
    start_hour: Optional[int] = 8
    end_hour: Optional[int] = 22
    days: Optional[int] = None        # run for X days from now
    end_date: Optional[str] = None    # ISO date string, alternative to days


@router.get("")
def get_autopilot(user_id: str, db: Session = Depends(get_db)):
    settings = db.query(AutopilotSettings).filter(AutopilotSettings.user_id == user_id).first()
    if not settings:
        return {
            "enabled": False,
            "posts_per_day": 5,
            "start_hour": 8,
            "end_hour": 22,
            "end_date": None,
        }

    # Today's stats
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    posted_today = db.query(PostHistory).filter(
        PostHistory.user_id == user_id,
        PostHistory.status == "success",
        PostHistory.posted_at >= today_start,
        PostHistory.posted_at < today_end,
    ).count()

    scheduled_today = db.query(QueuedVideo).filter(
        QueuedVideo.user_id == user_id,
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
        QueuedVideo.user_id == user_id,
        QueuedVideo.status == "pending",
    ).count()

    return {
        "enabled": settings.enabled,
        "posts_per_day": settings.posts_per_day,
        "start_hour": settings.start_hour,
        "end_hour": settings.end_hour,
        "end_date": settings.end_date.isoformat() if settings.end_date else None,
        "posted_today": posted_today,
        "scheduled_today": len(scheduled_today),
        "next_post_at": next_post,
        "pending_in_queue": pending_count,
    }


@router.post("")
def save_autopilot(body: SaveAutopilotBody, db: Session = Depends(get_db)):
    settings = db.query(AutopilotSettings).filter(AutopilotSettings.user_id == body.user_id).first()

    end_date = None
    if body.days:
        end_date = datetime.utcnow() + timedelta(days=body.days)
    elif body.end_date:
        end_date = datetime.fromisoformat(body.end_date)

    if settings:
        settings.enabled = body.enabled
        settings.posts_per_day = body.posts_per_day or 5
        settings.start_hour = body.start_hour if body.start_hour is not None else 8
        settings.end_hour = body.end_hour if body.end_hour is not None else 22
        settings.end_date = end_date
        settings.updated_at = datetime.utcnow()
    else:
        settings = AutopilotSettings(
            user_id=body.user_id,
            enabled=body.enabled,
            posts_per_day=body.posts_per_day or 5,
            start_hour=body.start_hour if body.start_hour is not None else 8,
            end_hour=body.end_hour if body.end_hour is not None else 22,
            end_date=end_date,
        )
        db.add(settings)

    db.commit()

    # If just enabled, schedule today's posts immediately (don't wait for midnight)
    if body.enabled:
        from services.scheduler import schedule_daily_posts
        import threading
        threading.Thread(target=schedule_daily_posts, daemon=True).start()

    return {"ok": True}


@router.post("/trigger")
def trigger_now(user_id: str, db: Session = Depends(get_db)):
    """Manually trigger today's scheduling immediately."""
    from services.scheduler import schedule_daily_posts, check_and_post_scheduled
    import threading
    threading.Thread(target=schedule_daily_posts, daemon=True).start()
    return {"ok": True, "message": "Scheduling triggered"}
