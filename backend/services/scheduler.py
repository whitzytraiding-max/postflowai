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
    Runs at midnight. For each autopilot user, schedules videos per-source:
    each source's videos_per_day setting drives how many slots it gets today.
    Times are spread evenly across the user's start_hour–end_hour window.
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

            if settings.end_date and now > settings.end_date:
                settings.enabled = False
                db.commit()
                print(f"[Scheduler] Autopilot ended for user {user_id}")
                continue

            active_sources = db.query(Source).filter(
                Source.user_id == user_id,
                Source.is_active == True,
            ).all()

            if not active_sources:
                continue

            to_schedule = _collect_slots(active_sources, today_start, today_end, db)

            if not to_schedule:
                print(f"[Scheduler] No pending videos for user {user_id} — running discovery")
                _run_discovery_for_user(user_id, db)
                to_schedule = _collect_slots(active_sources, today_start, today_end, db)

            if not to_schedule:
                continue

            window_start = today_start.replace(hour=settings.start_hour)
            window_end = today_start.replace(hour=settings.end_hour)
            window_minutes = (settings.end_hour - settings.start_hour) * 60
            interval_minutes = window_minutes / max(len(to_schedule), 1)

            for i, video in enumerate(to_schedule):
                slot_offset = int(interval_minutes * i)
                variance = random.randint(-20, 20)
                post_time = window_start + timedelta(minutes=slot_offset + variance)
                post_time = max(window_start, min(post_time, window_end - timedelta(minutes=1)))
                video.scheduled_at = post_time
                video.status = "scheduled"
                print(f"[Scheduler] Scheduled video {video.id} for {post_time.strftime('%H:%M')} UTC")

        db.commit()
    finally:
        db.close()


def _collect_slots(sources, today_start, today_end, db):
    """Pick pending/ready videos for each source up to its videos_per_day quota."""
    to_schedule = []
    for source in sources:
        already = db.query(QueuedVideo).filter(
            QueuedVideo.source_id == source.id,
            QueuedVideo.status == "scheduled",
            QueuedVideo.scheduled_at >= today_start,
            QueuedVideo.scheduled_at < today_end,
        ).count()
        slots = max(0, source.videos_per_day - already)
        if slots == 0:
            continue
        pending = db.query(QueuedVideo).filter(
            QueuedVideo.source_id == source.id,
            QueuedVideo.status.in_(["pending", "ready"]),
        ).order_by(QueuedVideo.created_at.asc()).limit(slots).all()
        to_schedule.extend(pending)
    return to_schedule


def check_and_post_scheduled():
    """Runs every 15 minutes. Posts any scheduled videos whose time has come."""
    from services.pipeline import run_pipeline
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        # Only post ONE video per tick — prevents burst-posting if multiple missed their window.
        # Also pick up "ready" videos stuck from the pending→ready race (file delivered but status
        # was never restored to "scheduled") and "pending" videos with a file already on disk.
        video = db.query(QueuedVideo).filter(
            QueuedVideo.status.in_(["scheduled", "ready"]),
            (QueuedVideo.scheduled_at == None) | (QueuedVideo.scheduled_at <= now),
            QueuedVideo.local_path != None,
        ).order_by(QueuedVideo.scheduled_at.asc().nullsfirst()).first()

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


def _recover_stuck_posting():
    """
    Called on startup. Resets any video stuck in 'posting' back to 'ready'
    so it can be retried. Happens when Render restarts mid-pipeline.
    """
    db = SessionLocal()
    try:
        stuck = db.query(QueuedVideo).filter(QueuedVideo.status == "posting").all()
        for v in stuck:
            v.status = "ready"
            print(f"[Scheduler] Recovered stuck 'posting' video: {v.id} ({v.title[:40] if v.title else '?'})")
        if stuck:
            db.commit()
    finally:
        db.close()


def _maybe_schedule_today():
    """
    Called on startup. If any source has unfilled slots for today, run schedule_daily_posts.
    Covers the case where the server was down at midnight and missed the cron.
    Checks slot counts directly so discovery runs even when queue is empty.
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
            active_sources = db.query(Source).filter(
                Source.user_id == settings.user_id,
                Source.is_active == True,
            ).all()
            total_target = sum(s.videos_per_day for s in active_sources)
            if not total_target:
                continue
            already_scheduled = db.query(QueuedVideo).filter(
                QueuedVideo.user_id == settings.user_id,
                QueuedVideo.status == "scheduled",
                QueuedVideo.scheduled_at >= today_start,
                QueuedVideo.scheduled_at < today_end,
            ).count()
            if already_scheduled < total_target:
                needs_scheduling = True
                break

        if needs_scheduling:
            print("[Scheduler] Missed midnight cron — running schedule_daily_posts on startup")
            schedule_daily_posts()
    finally:
        db.close()


def start_scheduler():
    _recover_stuck_posting()
    _maybe_schedule_today()
    scheduler.add_job(daily_discovery, "interval", hours=6, id="daily_discovery", replace_existing=True)
    scheduler.add_job(schedule_daily_posts, "cron", hour=0, minute=0, id="schedule_daily_posts", replace_existing=True)
    scheduler.add_job(check_and_post_scheduled, "interval", minutes=15, id="check_and_post", replace_existing=True)
    scheduler.start()
    print("[Scheduler] Started. Discovery=6h, Scheduling=midnight, Posting=every 15min.")
