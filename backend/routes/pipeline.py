import os
import shutil
from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import User
from services.auth import get_current_user
from services.pipeline import run_pipeline
from pathlib import Path

router = APIRouter(prefix="/pipeline", tags=["pipeline"])

DOWNLOAD_DIR = Path.home() / ".postflow" / "downloads"


@router.post("/{video_id}/run")
def run_video_pipeline(video_id: str, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import QueuedVideo
    video = db.query(QueuedVideo).filter(QueuedVideo.id == video_id, QueuedVideo.user_id == current_user.id).first()
    if not video:
        return {"error": "Not found"}
    video.status = "downloading"
    db.commit()
    background_tasks.add_task(run_pipeline_bg, video_id, current_user.id)
    return {"status": "started", "video_id": video_id}


def run_pipeline_bg(video_id: str, user_id: str):
    from database import SessionLocal
    db = SessionLocal()
    try:
        run_pipeline(video_id, db, user_id)
    finally:
        db.close()


@router.post("/{video_id}/retry")
def retry_video_pipeline(video_id: str, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import QueuedVideo
    video = db.query(QueuedVideo).filter(QueuedVideo.id == video_id, QueuedVideo.user_id == current_user.id).first()
    if not video:
        return {"error": "Not found"}
    video.status = "downloading"
    video.error_msg = None
    db.commit()
    background_tasks.add_task(run_pipeline_bg, video_id, current_user.id)
    return {"status": "retrying", "video_id": video_id}


@router.get("/pending-downloads")
def get_pending_downloads(db: Session = Depends(get_db)):
    from models import QueuedVideo
    videos = db.query(QueuedVideo).filter(
        QueuedVideo.status.in_(["pending", "scheduled"]),
        QueuedVideo.local_path == None,
    ).limit(2).all()
    return [{"id": v.id, "original_url": v.original_url, "title": v.title, "status": v.status} for v in videos]


@router.post("/{video_id}/deliver")
async def deliver_video(video_id: str, background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db)):
    from models import QueuedVideo
    video = db.query(QueuedVideo).filter(QueuedVideo.id == video_id).first()
    if not video:
        return {"error": "Not found"}

    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    dest = DOWNLOAD_DIR / f"{video_id}{ext}"

    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    video.local_path = str(dest)
    video.error_msg = None
    if video.status not in ("scheduled",):
        video.status = "ready"
    db.commit()

    print(f"[Deliver] Received {dest} ({dest.stat().st_size // 1024}KB) for video {video_id} — status={video.status}")
    return {"status": "received", "video_id": video_id}
