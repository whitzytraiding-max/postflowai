import os
import time
import random
from datetime import datetime
from sqlalchemy.orm import Session
from models import QueuedVideo, ConnectedAccount, PostHistory
from services.downloader import download_video
from services.caption import generate_caption


def run_pipeline(video_id: str, db: Session, user_id: str) -> dict:
    """
    Full pipeline: download -> caption -> post.
    Returns {"success": bool, "post_url": str, "error": str}
    """
    video = db.query(QueuedVideo).filter(QueuedVideo.id == video_id).first()
    if not video:
        return {"success": False, "error": "Video not found"}

    platform = video.post_to_platform  # "youtube", "instagram", or "both"
    targets = ["youtube", "instagram"] if platform == "both" else [platform]

    # 1. Download (skip if already delivered by Windows agent)
    if video.local_path and os.path.exists(video.local_path):
        print(f"[Pipeline] Using pre-delivered file: {video.local_path}")
        local_path = video.local_path
        video.status = "ready"
        db.commit()
    elif os.environ.get("RENDER"):
        # On Render we can't download from YouTube directly (datacenter IP block).
        # Reset to pending so the Windows agent picks it up on its next poll.
        print(f"[Pipeline] No local file for {video_id} — resetting to pending for Windows agent")
        video.status = "pending"
        video.local_path = None
        db.commit()
        return {"success": False, "error": "Waiting for Windows agent to deliver file"}
    else:
        video.status = "downloading"
        db.commit()
        try:
            local_path = download_video(video.original_url, video.id)
            video.local_path = local_path
            video.status = "ready"
            db.commit()
        except Exception as e:
            video.status = "failed"
            video.error_msg = f"Download failed: {e}"
            db.commit()
            return {"success": False, "error": video.error_msg}

    # 2. Caption
    if not video.ai_caption:
        try:
            from models import Source
            source = db.query(Source).filter(Source.id == video.source_id).first()
            tag = source.tag if source else video.platform
            caption = generate_caption(video.title, tag, platform)
            video.ai_caption = caption
            db.commit()
        except Exception as e:
            video.ai_caption = video.title  # fallback
            db.commit()

    # 3. Post to each target platform
    video.status = "posting"
    db.commit()

    results = []
    for i, target in enumerate(targets):
        # Human-like pre-post pause: 1–8 min before first post, 4–12 min between platforms
        if i == 0:
            delay = random.randint(60, 480)
        else:
            delay = random.randint(240, 720)
        print(f"[Pipeline] Waiting {delay//60}m {delay%60}s before posting to {target}...")
        time.sleep(delay)
        # Use source-pinned account if set, otherwise first active account
        pinned_id = None
        if video.source:
            if target == "instagram":
                pinned_id = video.source.instagram_account_id
            elif target == "youtube":
                pinned_id = video.source.youtube_account_id

        if pinned_id:
            account = db.query(ConnectedAccount).filter(
                ConnectedAccount.id == pinned_id,
                ConnectedAccount.user_id == user_id,
                ConnectedAccount.is_active == True,
            ).first()
        else:
            account = db.query(ConnectedAccount).filter(
                ConnectedAccount.user_id == user_id,
                ConnectedAccount.platform == target,
                ConnectedAccount.is_active == True,
            ).first()

        if not account:
            results.append({"platform": target, "success": False, "error": f"No connected {target} account"})
            continue

        try:
            post_url = None
            if target == "youtube":
                from services.youtube_poster import post_to_youtube
                post_url = post_to_youtube(local_path, video.title, video.ai_caption, account.credentials_json)
            elif target == "instagram":
                from services.instagram_poster import post_to_instagram
                post_url = post_to_instagram(local_path, video.ai_caption, account.credentials_json)

            history = PostHistory(
                user_id=user_id,
                queued_video_id=video.id,
                platform=target,
                post_url=post_url,
                posted_at=datetime.utcnow(),
                caption=video.ai_caption,
                status="success",
            )
            db.add(history)
            results.append({"platform": target, "success": True, "post_url": post_url})

        except Exception as e:
            history = PostHistory(
                user_id=user_id,
                queued_video_id=video.id,
                platform=target,
                post_url=None,
                posted_at=datetime.utcnow(),
                caption=video.ai_caption or "",
                status="failed",
            )
            db.add(history)
            results.append({"platform": target, "success": False, "error": str(e)})

    db.commit()

    any_success = any(r["success"] for r in results)
    video.status = "posted" if any_success else "failed"
    if any_success:
        video.posted_at = datetime.utcnow()
    else:
        video.error_msg = "; ".join(r.get("error", "") for r in results if not r["success"])
    db.commit()

    return {"success": any_success, "results": results}
