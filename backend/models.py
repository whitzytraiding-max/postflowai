import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Source(Base):
    __tablename__ = "sources"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False, index=True)
    platform = Column(String, nullable=False)          # "tiktok", "instagram", "youtube"
    tag = Column(String, nullable=False)               # e.g. "#forex"
    min_views = Column(Integer, default=50000)
    max_age_days = Column(Integer, default=7)
    videos_per_day = Column(Integer, default=3)
    post_to_platform = Column(String, nullable=False)  # "instagram", "youtube", "both"
    language = Column(String, default="any")            # "any", "en", "es", "ar", etc.
    auto_approve = Column(Boolean, default=False)       # skip manual approval, go straight to ready
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    queued_videos = relationship("QueuedVideo", back_populates="source", cascade="all, delete-orphan")


class QueuedVideo(Base):
    __tablename__ = "queued_videos"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False, index=True)
    source_id = Column(String, ForeignKey("sources.id"), nullable=False)
    original_url = Column(String, nullable=False)
    platform = Column(String, nullable=False)          # where it was found
    title = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    local_path = Column(String, nullable=True)
    status = Column(String, default="pending")         # pending | downloading | ready | posting | posted | failed
    scheduled_at = Column(DateTime, nullable=True)
    posted_at = Column(DateTime, nullable=True)
    post_to_platform = Column(String, nullable=False)
    ai_caption = Column(Text, nullable=True)
    error_msg = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    source = relationship("Source", back_populates="queued_videos")
    post_history = relationship("PostHistory", back_populates="queued_video", cascade="all, delete-orphan")


class ConnectedAccount(Base):
    __tablename__ = "connected_accounts"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False, index=True)
    platform = Column(String, nullable=False)          # "instagram", "youtube", "tiktok"
    account_name = Column(String, nullable=False)
    credentials_json = Column(Text, nullable=False)    # encrypted JSON blob
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AutopilotSettings(Base):
    __tablename__ = "autopilot_settings"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, unique=True, nullable=False, index=True)
    enabled = Column(Boolean, default=False)
    posts_per_day = Column(Integer, default=5)
    start_hour = Column(Integer, default=8)    # e.g. 8 = 8am
    end_hour = Column(Integer, default=22)     # e.g. 22 = 10pm
    end_date = Column(DateTime, nullable=True) # stop autopilot after this date
    updated_at = Column(DateTime, default=datetime.utcnow)


class PostHistory(Base):
    __tablename__ = "post_history"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False, index=True)
    queued_video_id = Column(String, ForeignKey("queued_videos.id"), nullable=False)
    platform = Column(String, nullable=False)
    post_url = Column(String, nullable=True)
    posted_at = Column(DateTime, default=datetime.utcnow)
    caption = Column(Text, nullable=True)
    status = Column(String, default="success")         # "success" or "failed"

    queued_video = relationship("QueuedVideo", back_populates="post_history")
