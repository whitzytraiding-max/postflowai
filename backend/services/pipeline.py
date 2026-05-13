import os
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

    # 1. Download
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
    for target in targets:
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
