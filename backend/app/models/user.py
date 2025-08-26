from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
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
        "skill_categories": {
            "health": {"xp": 0, "level": 1},
            "career": {"xp": 0, "level": 1},
            "relationships": {"xp": 0, "level": 1}
        },
        "streak_days": 0,
        "total_entries": 0
    })