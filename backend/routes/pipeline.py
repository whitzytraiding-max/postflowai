from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from services.pipeline import run_pipeline

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.post("/{video_id}/run")
def run_video_pipeline(
    video_id: str,
    user_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Trigger download -> caption -> post for a queued video."""
    from models import QueuedVideo
    video = db.query(QueuedVideo).filter(QueuedVideo.id == video_id).first()
    if not video:
        return {"error": "Not found"}
    video.status = "downloading"
    db.commit()

    # Run in background so endpoint returns immediately
    background_tasks.add_task(run_pipeline_bg, video_id, user_id)
    return {"status": "started", "video_id": video_id}


def run_pipeline_bg(video_id: str, user_id: str):
    from database import SessionLocal
    db = SessionLocal()
    try:
        run_pipeline(video_id, db, user_id)
    finally:
        db.close()


@router.post("/{video_id}/retry")
def retry_video_pipeline(
    video_id: str,
    user_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Reset a failed video to pending and re-run the pipeline."""
    from models import QueuedVideo
    video = db.query(QueuedVideo).filter(QueuedVideo.id == video_id).first()
    if not video:
        return {"error": "Not found"}
    video.status = "downloading"
    video.error_msg = None
    db.commit()

    background_tasks.add_task(run_pipeline_bg, video_id, user_id)
    return {"status": "retrying", "video_id": video_id}
