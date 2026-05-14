import random
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal
from models import Source, QueuedVideo, AutopilotSettings, PostHistory

MIN_POST_GAP_SECONDS = 3600  # 1 hour minimum between posts to the same platform

scheduler = BackgroundScheduler()


def daily_discovery():
    """Runs every 6 hours. Queries all active Sources and runs discovery for each."""
    print("[Scheduler] Running discovery job...")
    from services.discovery import discover_videos_for_source
    db = SessionLocal()
    try:
        active_sources = db.query(Source).filter(Source.is_active == True).all()
        total = 0
        for source in active_sources:
            try:
                videos = discover_videos_for_source(source, db)
                total += len(videos)
            except Exception as e:
                print(f"[Scheduler] Discovery error for source {source.id}: {e}")
        print(f"[Scheduler] Discovery complete. Total: {total}")
    finally:
        db.close()


def schedule_daily_posts():
    """
    Runs at midnight. For each autopilot user, picks today's videos and
    assigns evenly-spaced scheduled_at times throughout the day.
    """
    print("[Scheduler] Scheduling today's autopilot posts...")
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        settings_list = db.query(AutopilotSettings).filter(
            AutopilotSettings.enabled == True
        ).all()

        for settings in settings_list:
            user_id = settings.user_id

            # Disable if end_date has passed
            if settings.end_date and now > settings.end_date:
                settings.enabled = False
                db.commit()
                print(f"[Scheduler] Autopilot ended for user {user_id}")
                continue

            # Count how many are already scheduled for today
            already_scheduled = db.query(QueuedVideo).filter(
                QueuedVideo.user_id == user_id,
                QueuedVideo.status == "scheduled",
                QueuedVideo.scheduled_at >= today_start,
                QueuedVideo.scheduled_at < today_end,
            ).count()

            slots_needed = max(0, settings.posts_per_day - already_scheduled)
            if slots_needed == 0:
                continue

            # Get oldest pending/ready videos (ready = auto-approved)
            pending = db.query(QueuedVideo).filter(
                QueuedVideo.user_id == user_id,
                QueuedVideo.status.in_(["pending", "ready"]),
            ).order_by(QueuedVideo.created_at.asc()).limit(slots_needed).all()

            if not pending:
                print(f"[Scheduler] No pending videos for user {user_id} — running discovery")
                _run_discovery_for_user(user_id, db)
                pending = db.query(QueuedVideo).filter(
                    QueuedVideo.user_id == user_id,
                    QueuedVideo.status.in_(["pending", "ready"]),
                ).order_by(QueuedVideo.created_at.asc()).limit(slots_needed).all()

            total_slots = settings.posts_per_day
            window_minutes = (settings.end_hour - settings.start_hour) * 60
            interval_minutes = window_minutes / max(total_slots, 1)

            for i, video in enumerate(pending):
                slot_offset = int(interval_minutes * (already_scheduled + i))
                variance = random.randint(-20, 20)  # ±20 min human-like drift
                post_time = today_start.replace(hour=settings.start_hour) + timedelta(minutes=slot_offset + variance)
                # Keep within the allowed window
                window_start = today_start.replace(hour=settings.start_hour)
                window_end = today_start.replace(hour=settings.end_hour)
                post_time = max(window_start, min(post_time, window_end - timedelta(minutes=1)))
                video.scheduled_at = post_time
                video.status = "scheduled"
                print(f"[Scheduler] Scheduled video {video.id} for {post_time.strftime('%H:%M')} UTC")

        db.commit()
    finally:
        db.close()


def check_and_post_scheduled():
    """Runs every 15 minutes. Posts any scheduled videos whose time has come."""
    from services.pipeline import run_pipeline
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        # Only post ONE video per tick — prevents burst-posting if multiple missed their window
        video = db.query(QueuedVideo).filter(
            QueuedVideo.status == "scheduled",
            QueuedVideo.scheduled_at <= now,
        ).order_by(QueuedVideo.scheduled_at.asc()).first()

        if video:
            # Enforce 1-hour minimum gap per platform
            platforms = ["instagram", "youtube"] if video.post_to_platform == "both" else [video.post_to_platform]
            too_soon = False
            for platform in platforms:
                last = db.query(PostHistory).filter(
                    PostHistory.user_id == video.user_id,
                    PostHistory.platform == platform,
                    PostHistory.status == "success",
                ).order_by(PostHistory.posted_at.desc()).first()
                if last and (now - last.posted_at).total_seconds() < MIN_POST_GAP_SECONDS:
                    remaining = int((MIN_POST_GAP_SECONDS - (now - last.posted_at).total_seconds()) / 60)
                    print(f"[Scheduler] Skipping {video.id} — {platform} posted {remaining}min ago, waiting for 1h gap")
                    too_soon = True
                    break
            if too_soon:
                return

            print(f"[Scheduler] Posting video {video.id}: {video.title[:50]}")
            try:
                run_pipeline(video.id, db, video.user_id)
            except Exception as e:
                print(f"[Scheduler] Post error for video {video.id}: {e}")
                video.status = "failed"
                video.error_msg = str(e)
                db.commit()
    finally:
        db.close()


def _run_discovery_for_user(user_id: str, db):
    from services.discovery import discover_videos_for_source
    sources = db.query(Source).filter(
        Source.user_id == user_id,
        Source.is_active == True
    ).all()
    for source in sources:
        try:
            discover_videos_for_source(source, db)
        except Exception as e:
            print(f"[Scheduler] Discovery error: {e}")


def _maybe_schedule_today():
    """
    Called on startup. If no videos are scheduled for today yet, run schedule_daily_posts now.
    Covers the case where the server was down at midnight and missed the cron.
    """
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        settings_list = db.query(AutopilotSettings).filter(
            AutopilotSettings.enabled == True
        ).all()

        needs_scheduling = False
        for settings in settings_list:
            already_scheduled = db.query(QueuedVideo).filter(
                QueuedVideo.user_id == settings.user_id,
                QueuedVideo.status == "scheduled",
                QueuedVideo.scheduled_at >= today_start,
                QueuedVideo.scheduled_at < today_end,
            ).count()
            if already_scheduled < settings.posts_per_day:
                needs_scheduling = True
                break

        if needs_scheduling:
            print("[Scheduler] Missed midnight cron — running schedule_daily_posts on startup")
            schedule_daily_posts()
    finally:
        db.close()


def start_scheduler():
    _maybe_schedule_today()
    scheduler.add_job(daily_discovery, "interval", hours=6, id="daily_discovery", replace_existing=True)
    scheduler.add_job(schedule_daily_posts, "cron", hour=0, minute=0, id="schedule_daily_posts", replace_existing=True)
    scheduler.add_job(check_and_post_scheduled, "interval", minutes=15, id="check_and_post", replace_existing=True)
    scheduler.start()
    print("[Scheduler] Started. Discovery=6h, Scheduling=midnight, Posting=every 15min.")
