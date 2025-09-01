from sqlalchemy import Column, String, DateTime, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.base_class import Base


class Note(Base):
    __tablename__ = "notes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(JSONB, nullable=False, default=lambda: {"entries": []})
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    date = Column(Date, nullable=False, index=True)
    
    user = relationship("User", back_populates="notes")