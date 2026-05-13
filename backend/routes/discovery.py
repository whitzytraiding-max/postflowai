from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import Source
from services.discovery import discover_videos_for_source

router = APIRouter(prefix="/discovery", tags=["discovery"])

# Simple in-memory state for last run info
_last_run_state = {
    "last_run_at": None,
    "last_discovered": 0,
    "last_already_seen": 0,
}


@router.post("/run")
def run_discovery(user_id: str, db: Session = Depends(get_db)):
    """Manually trigger discovery for all active sources for a user."""
    active_sources = db.query(Source).filter(
        Source.user_id == user_id,
        Source.is_active == True
    ).all()

    total_discovered = 0
    total_already_seen = 0

    for source in active_sources:
        try:
            videos = discover_videos_for_source(source, db)
            total_discovered += len(videos)
        except Exception as e:
            print(f"[Discovery Route] Error for source {source.id}: {e}")

    _last_run_state["last_run_at"] = datetime.utcnow().isoformat()
    _last_run_state["last_discovered"] = total_discovered
    _last_run_state["last_already_seen"] = total_already_seen

    return {
        "discovered": total_discovered,
        "already_seen": total_already_seen,
    }


@router.get("/status")
def discovery_status():
    """Return last run time and counts."""
    return _last_run_state
