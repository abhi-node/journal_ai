from sqlalchemy import Column, String, Integer, DateTime, Date, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
import enum
from app.db.base_class import Base


class ReviewType(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"


class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(Enum(ReviewType), nullable=False)
    date = Column(Date, nullable=False, index=True)
    score = Column(Integer, nullable=False)
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="reviews")