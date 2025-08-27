from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.schemas import Note, NoteCreate
from app.schemas.user import User
from app.crud import note as crud_note

router = APIRouter()


@router.get("/daily/{target_date}", response_model=List[Note])
def get_daily_notes(
    target_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all notes for a specific date for the current user.
    """
    notes = crud_note.get_notes_by_date(
        db=db,
        user_id=current_user.id,
        target_date=target_date
    )
    return notes


@router.get("/range", response_model=List[Note])
def get_notes_range(
    start_date: date,
    end_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get notes between a date range for the current user.
    """
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    notes = crud_note.get_notes_by_date_range(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )
    return notes


@router.get("/{note_id}", response_model=Note)
def get_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific note by ID for the current user.
    """
    note = crud_note.get_note_by_id(
        db=db,
        note_id=note_id,
        user_id=current_user.id
    )
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return note