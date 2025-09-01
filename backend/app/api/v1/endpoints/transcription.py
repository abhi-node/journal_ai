from typing import Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from uuid import UUID
import logging
import base64
import tempfile
import os

from app.db.session import get_db
from app.models.user import User as UserModel
from app.models.note import Note
from app.core.config import settings
from app.api.v1.endpoints.auth import get_current_user
from app.crud import note as crud_note
from app.tasks.transcription_tasks import process_audio_transcription
from openai import OpenAI

logger = logging.getLogger(__name__)


router = APIRouter()

# Initialize OpenAI client
try:
    openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {str(e)}")
    openai_client = None

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    user_timezone: Optional[str] = Form(None),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Queue audio file for transcription processing.
    
    Accepts audio files in various formats (mp3, wav, m4a, webm, etc.)
    and queues them for async transcription using Celery.
    
    Args:
        audio: Audio file to transcribe
        user_timezone: User's timezone (e.g., "America/New_York")
    """
    try:
        # Validate file type
        allowed_types = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/mp4", 
                        "audio/webm", "audio/x-wav", "audio/x-m4a", 
                        "application/octet-stream"]  # octet-stream for unknown types
        
        if audio.content_type and audio.content_type not in allowed_types:
            # Still try to process if it looks like an audio file
            logger.warning(f"Unusual content type: {audio.content_type}")
        
        # Get the file extension from the uploaded file or default to .m4a
        file_extension = os.path.splitext(audio.filename)[1] if audio.filename else ".m4a"
        if not file_extension:
            file_extension = ".m4a"
        
        # Read audio content
        content = await audio.read()
        
        # Check for empty or very small files
        file_size = len(content)
        if file_size < 100:  # Less than 100 bytes is likely corrupt or empty
            logger.error(f"Audio file too small: {file_size} bytes")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Audio file is empty or corrupted (size: {file_size} bytes)"
            )
        
        # Encode audio to base64 for Celery task
        audio_data_base64 = base64.b64encode(content).decode('utf-8')
        
        # Queue transcription task
        logger.info(f"Queueing transcription task for user {current_user.id} with timezone {user_timezone}")
        task = process_audio_transcription.delay(
            str(current_user.id),
            audio_data_base64,
            file_extension,
            user_timezone
        )
        logger.info(f"Transcription task queued with ID: {task.id}")
        
        return {
            "success": True,
            "message": "Transcription queued successfully",
            "task_id": task.id,
            "status": "processing",
            "timezone": user_timezone or "UTC"
        }
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to queue transcription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue transcription: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Check if the transcription service is available."""
    # Check if OpenAI client is properly initialized
    if not openai_client:
        return {
            "status": "unhealthy", 
            "service": "transcription",
            "error": "OpenAI client not initialized"
        }
    
    # Check if API key is set
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your-openai-api-key":
        return {
            "status": "unhealthy",
            "service": "transcription",
            "error": "OpenAI API key not configured"
        }
    
    return {
        "status": "healthy", 
        "service": "transcription",
        "model": "whisper-1 (with gpt-4o-transcribe fallback)"
    }