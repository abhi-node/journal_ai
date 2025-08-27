from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from uuid import UUID


class NoteBase(BaseModel):
    content: str
    date: date


class NoteCreate(NoteBase):
    pass


class NoteInDBBase(NoteBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class Note(NoteInDBBase):
    pass


class NoteInDB(NoteInDBBase):
    pass