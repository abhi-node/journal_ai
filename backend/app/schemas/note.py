from pydantic import BaseModel, field_serializer
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timezone
from uuid import UUID


class NoteEntry(BaseModel):
    timestamp: str
    content: str


class NoteContent(BaseModel):
    entries: List[NoteEntry]


class NoteBase(BaseModel):
    content: Dict[str, Any]  # JSONB field that contains {"entries": [...]}
    date: date


class NoteCreate(NoteBase):
    pass


class NoteInDBBase(NoteBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    
    @field_serializer('created_at')
    def serialize_created_at(self, created_at: datetime) -> str:
        # Ensure timezone-aware datetime is serialized with timezone info
        if created_at.tzinfo is None:
            # If naive, assume UTC
            created_at = created_at.replace(tzinfo=timezone.utc)
        return created_at.isoformat()
    
    class Config:
        from_attributes = True


class Note(NoteInDBBase):
    pass


class NoteInDB(NoteInDBBase):
    pass