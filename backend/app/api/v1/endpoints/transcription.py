from typing import Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
import logging
import tempfile
import os

from app.db.session import get_db
from app.models.user import User as UserModel
from app.models.note import Note
from app.core.config import settings
from app.api.v1.endpoints.auth import get_current_user
from app.crud import note as crud_note
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
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Transcribe an audio file and save to daily notes.
    
    Accepts audio files in various formats (mp3, wav, m4a, webm, etc.)
    and transcribes them using OpenAI's Whisper API.
    """
    try:
        # Validate file type
        allowed_types = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/mp4", 
                        "audio/webm", "audio/x-wav", "audio/x-m4a", 
                        "application/octet-stream"]  # octet-stream for unknown types
        
        if audio.content_type and audio.content_type not in allowed_types:
            # Still try to process if it looks like an audio file
            logger.warning(f"Unusual content type: {audio.content_type}")
        
        # Save uploaded file temporarily with correct extension
        # Get the file extension from the uploaded file or default to .m4a
        file_extension = os.path.splitext(audio.filename)[1] if audio.filename else ".m4a"
        if not file_extension:
            file_extension = ".m4a"
        
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
            
        # Log file size to debug empty files
        file_size = os.path.getsize(temp_file_path)
        
        # Check for empty or very small files
        if file_size < 100:  # Less than 100 bytes is likely corrupt or empty
            logger.error(f"Audio file too small: {file_size} bytes")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Audio file is empty or corrupted (size: {file_size} bytes)"
            )
        
        
        try:
            # Check if OpenAI client is initialized
            if not openai_client:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="OpenAI service is not available. Check API key configuration."
                )
            
            # Transcribe using OpenAI's latest model
            
            # Read and validate file header
            with open(temp_file_path, "rb") as test_file:
                header = test_file.read(20)  # Read more bytes for better validation
                
                # Validate file format based on header
                if file_extension == ".m4a":
                    # M4A/MP4 files should have 'ftyp' at bytes 4-7
                    if len(header) >= 8 and header[4:8] != b'ftyp':
                        logger.error(f"Invalid M4A file header: {header[:8].hex()}")
                        logger.error("Expected 'ftyp' signature at bytes 4-7")
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid M4A audio file format"
                        )
                elif file_extension == ".wav":
                    # WAV files should start with 'RIFF'
                    if not header.startswith(b'RIFF'):
                        logger.warning("File may not be a valid WAV audio file")
                
                # Check if file appears to be mostly silence (all zeros or very low values)
                test_file.seek(file_size // 2)  # Check middle of file
                middle_sample = test_file.read(100)
                if all(b == 0 for b in middle_sample):
                    logger.warning("Audio file appears to contain silence (all zeros in middle)")
            
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
                    audio_file.seek(0)  # Reset file pointer
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
                logger.error(f"File size was: {file_size} bytes")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No speech detected in the audio"
                )
            
            # Check for suspiciously short transcriptions
            if len(transcription_text.strip()) < 10 and file_size > 10000:
                logger.error(f"Transcription too short for file size!")
                logger.error(f"Transcription: '{transcription_text}' ({len(transcription_text)} chars)")
                logger.error(f"File size: {file_size} bytes (expected ~1000 chars per 100KB)")
                logger.error("Likely causes:")
                logger.error("1. Audio is silence/very quiet (mic not capturing)")
                logger.error("2. Wrong audio format/encoding")
                logger.error("3. Audio session conflict on device")
                logger.error("4. File corruption during transmission")
                
                # Still return the transcription but with a warning
                transcription_text = f"[WARNING: Short transcription for {file_size} byte file] {transcription_text}"
            
            # Save transcription to daily note
            today = date.today()
            
            # Check if a note already exists for today
            existing_notes = crud_note.get_notes_by_date(
                db=db,
                user_id=current_user.id,
                target_date=today
            )
            
            if existing_notes:
                # Append to existing note
                note = existing_notes[0]
                # Add timestamp before new transcription
                timestamp = datetime.now(timezone.utc).strftime("%H:%M:%S")
                new_content = f"\n\n[{timestamp}] {transcription_text}"
                note.content = f"{note.content}{new_content}" if note.content else transcription_text
                db.commit()
                note_id = note.id
            else:
                # Create new note
                new_note = Note(
                    user_id=current_user.id,
                    content=transcription_text,
                    date=today,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(new_note)
                db.commit()
                db.refresh(new_note)
                note_id = new_note.id
            
            return {
                "success": True,
                "transcription": transcription_text,
                "note_id": str(note_id),
                "date": today.isoformat()
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transcribe audio: {str(e)}"
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