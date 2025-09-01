from typing import Dict, Optional
from uuid import UUID
from datetime import date, datetime, timezone
import logging
import os
import tempfile
import base64
from celery import Task
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy import and_
from openai import OpenAI

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.user import User
from app.models.note import Note
from app.core.config import settings
from app.core.timezone_utils import (
    get_user_current_date,
    get_day_boundaries_in_utc,
    get_default_timezone
)
from app.crud import note as crud_note

logger = logging.getLogger(__name__)

# Initialize OpenAI client
try:
    openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {str(e)}")
    openai_client = None


class DatabaseTask(Task):
    """Base task with database session management."""
    _db = None

    @property
    def db(self) -> Session:
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        """Clean up database session after task completion."""
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(
    base=DatabaseTask,
    bind=True,
    name="app.tasks.transcription_tasks.process_audio_transcription",
    max_retries=3,
    default_retry_delay=30,  # Retry after 30 seconds
)
def process_audio_transcription(
    self, 
    user_id: str, 
    audio_data: str,  # Base64 encoded audio data
    file_extension: str = ".m4a",
    user_timezone: Optional[str] = None
) -> Dict[str, any]:
    """
    Process audio transcription asynchronously.
    
    Args:
        user_id: The user's ID as string (will be converted to UUID)
        audio_data: Base64 encoded audio file data
        file_extension: The file extension (e.g., ".m4a", ".wav", ".mp3")
        user_timezone: User's timezone (e.g., "America/New_York")
        
    Returns:
        Dictionary with status and transcription result
    """
    try:
        # Convert string ID to UUID
        user_uuid = UUID(user_id)
        
        # Get the user from database
        user = self.db.query(User).filter(User.id == user_uuid).first()
        if not user:
            logger.error(f"User {user_id} not found for transcription")
            return {"status": "error", "message": f"User {user_id} not found"}
        
        logger.info(f"Processing audio transcription for user {user_id} (Celery task)")
        
        # Check if OpenAI client is initialized
        if not openai_client:
            logger.error("OpenAI client not initialized")
            return {
                "status": "error",
                "message": "OpenAI service is not available"
            }
        
        # Decode base64 audio data
        try:
            audio_bytes = base64.b64decode(audio_data)
        except Exception as e:
            logger.error(f"Failed to decode audio data: {str(e)}")
            return {
                "status": "error",
                "message": "Invalid audio data encoding"
            }
        
        # Check audio size
        file_size = len(audio_bytes)
        if file_size < 100:
            logger.error(f"Audio file too small: {file_size} bytes")
            return {
                "status": "error",
                "message": f"Audio file is empty or corrupted (size: {file_size} bytes)"
            }
        
        # Save audio to temporary file for OpenAI API
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
        
        try:
            # Validate file format based on header
            with open(temp_file_path, "rb") as test_file:
                header = test_file.read(20)
                
                if file_extension == ".m4a":
                    if len(header) >= 8 and header[4:8] != b'ftyp':
                        logger.error(f"Invalid M4A file header")
                        return {
                            "status": "error",
                            "message": "Invalid M4A audio file format"
                        }
                elif file_extension == ".wav":
                    if not header.startswith(b'RIFF'):
                        logger.warning("File may not be a valid WAV audio file")
            
            # Transcribe using OpenAI
            with open(temp_file_path, "rb") as audio_file:
                try:
                    # Try using whisper-1 which is more stable
                    transcript = openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="text"
                    )
                except Exception as e:
                    # Try gpt-4o-transcribe as fallback
                    logger.warning(f"Failed with whisper-1: {str(e)}, trying gpt-4o-transcribe")
                    audio_file.seek(0)
                    transcript = openai_client.audio.transcriptions.create(
                        model="gpt-4o-transcribe",
                        file=audio_file,
                        response_format="text"
                    )
            
            # Handle different response types
            if hasattr(transcript, 'text'):
                transcription_text = transcript.text
            elif isinstance(transcript, str):
                transcription_text = transcript
            else:
                transcription_text = str(transcript)
            
            if not transcription_text or transcription_text.strip() == "":
                logger.error("No speech detected in the audio file")
                return {
                    "status": "error",
                    "message": "No speech detected in the audio"
                }
            
            # Save transcription to daily note
            # Use user's timezone to determine the correct date
            if not user_timezone:
                user_timezone = get_default_timezone()
            
            # Get the current date in user's timezone
            user_date = get_user_current_date(user_timezone)
            
            # Get UTC boundaries for the user's day
            start_utc, end_utc = get_day_boundaries_in_utc(user_date, user_timezone)
            
            # Check if a note already exists for this day in user's timezone
            existing_note = self.db.query(Note).filter(
                and_(
                    Note.user_id == user_uuid,
                    Note.date == user_date
                )
            ).first()
            
            # Current timestamp in UTC
            current_utc = datetime.now(timezone.utc)
            
            if existing_note:
                # Append to existing note's JSON structure
                note = existing_note
                
                # Get existing content or initialize
                content = note.content if note.content else {"entries": []}
                
                # Add new entry with UTC timestamp
                new_entry = {
                    "timestamp": current_utc.isoformat(),
                    "content": transcription_text
                }
                
                content["entries"].append(new_entry)
                note.content = content
                
                # Mark the content field as modified for SQLAlchemy to detect the change
                flag_modified(note, 'content')
                
                self.db.commit()
                self.db.refresh(note)
                note_id = note.id
                
                logger.info(f"Updated existing note with new entry. Total entries: {len(content['entries'])}")
            else:
                # Create new note with JSON structure
                content = {
                    "entries": [
                        {
                            "timestamp": current_utc.isoformat(),
                            "content": transcription_text
                        }
                    ]
                }
                
                new_note = Note(
                    user_id=user_uuid,
                    content=content,
                    date=user_date,
                    created_at=current_utc
                )
                self.db.add(new_note)
                self.db.commit()
                self.db.refresh(new_note)
                note_id = new_note.id
            
            logger.info(f"Successfully transcribed audio for user {user_id}")
            logger.info(f"Transcription length: {len(transcription_text)} characters")
            logger.info(f"Note ID: {note_id}")
            
            return {
                "status": "success",
                "user_id": user_id,
                "transcription": transcription_text,
                "note_id": str(note_id),
                "date": user_date.isoformat(),
                "timestamp": current_utc.isoformat(),
                "character_count": len(transcription_text),
                "timezone": user_timezone
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
    except Exception as exc:
        logger.error(f"Error processing transcription for user {user_id}: {str(exc)}")
        self.db.rollback()
        
        # Retry the task with exponential backoff
        raise self.retry(exc=exc, countdown=30 * (2 ** self.request.retries))