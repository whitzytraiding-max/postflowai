from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import Source, User
from services.auth import get_current_user
from services.discovery import discover_videos_for_source

router = APIRouter(prefix="/discovery", tags=["discovery"])

_last_run_state = {"last_run_at": None, "last_discovered": 0}


@router.post("/run")
def run_discovery(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    active_sources = db.query(Source).filter(
        Source.user_id == current_user.id,
        Source.is_active == True,
    ).all()

    total = 0
    for source in active_sources:
        try:
            videos = discover_videos_for_source(source, db)
            total += len(videos)
        except Exception as e:
            print(f"[Discovery Route] Error for source {source.id}: {e}")

    _last_run_state["last_run_at"] = datetime.utcnow().isoformat()
    _last_run_state["last_discovered"] = total
    return {"discovered": total}


@router.get("/status")
def discovery_status():
    return _last_run_state
