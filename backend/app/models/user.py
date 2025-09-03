from sqlalchemy import Column, String, DateTime, JSON, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    goals = Column(JSON, default=dict)
    stats = Column(JSON, default=lambda: {
        "level": 1,
        "total_xp": 0,
        "skill_categories": {},
        "streak_days": 0,
        "total_entries": 0
    })
    
    # Daily review scheduling fields
    daily_review_task_id = Column(String, nullable=True)  # Current scheduled Celery task ID
    daily_review_time = Column(Time, nullable=True)  # UTC time for daily review
    
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")