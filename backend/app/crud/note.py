from typing import List, Optional
from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.note import Note
from app.schemas.note import NoteCreate


def get_notes_by_date(db: Session, user_id: UUID, target_date: date) -> List[Note]:
    return db.query(Note).filter(
        and_(
            Note.user_id == user_id,
            Note.date == target_date
        )
    ).order_by(Note.created_at).all()


def get_notes_by_date_range(
    db: Session, 
    user_id: UUID, 
    start_date: date, 
    end_date: date
) -> List[Note]:
    return db.query(Note).filter(
        and_(
            Note.user_id == user_id,
            Note.date >= start_date,
            Note.date <= end_date
        )
    ).order_by(Note.date.desc(), Note.created_at.desc()).all()


def create_note(db: Session, note: NoteCreate, user_id: UUID) -> Note:
    db_note = Note(
        user_id=user_id,
        content=note.content,
        date=note.date
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


def get_note_by_id(db: Session, note_id: UUID, user_id: UUID) -> Optional[Note]:
    return db.query(Note).filter(
        and_(
            Note.id == note_id,
            Note.user_id == user_id
        )
    ).first()