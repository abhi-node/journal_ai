# Implementation Plan for Notes and Reviews Creation

## Overview
This document outlines the implementation strategy for creating notes via voice recording and generating reviews automatically.

## 1. Notes Creation System

### 1.1 Voice Recording Flow
**When user clicks "Start Recording" button on HomeScreen:**

#### Frontend Implementation:
```typescript
// HomeScreen.tsx additions
1. Use Expo AV library for audio recording
2. Request microphone permissions
3. Start recording audio with visual feedback
4. Show recording timer and waveform visualization
5. Auto-save recordings in chunks (30-second intervals)
6. Stop recording on user action or timeout (5 minutes max)
```

#### API Endpoints to Add:
```python
# backend/app/api/v1/endpoints/notes.py

POST /notes/transcribe
- Accepts: Audio file (multipart/form-data)
- Process: 
  1. Upload audio to AWS S3
  2. Send to OpenAI Whisper API for transcription
  3. Create or append to today's note
- Returns: Transcribed note object

POST /notes/add
- Accepts: { content: string, date: date }
- Process: Create or append to existing note for the date
- Returns: Updated note object
```

### 1.2 Note Aggregation Logic
```python
# backend/app/crud/note.py

def create_or_append_note(db, user_id, content, date):
    existing_note = get_notes_by_date(db, user_id, date)
    
    if existing_note:
        # Append with timestamp separator
        updated_content = f"{existing_note.content}\n\n---\n[{datetime.now()}]\n{content}"
        existing_note.content = updated_content
        db.commit()
        return existing_note
    else:
        # Create new note
        return create_note(db, NoteCreate(content=content, date=date), user_id)
```

### 1.3 Recording State Management
```typescript
// frontend/src/store/slices/recordingSlice.ts
interface RecordingState {
  isRecording: boolean
  recordingDuration: number
  audioUri: string | null
  transcriptionInProgress: boolean
  error: string | null
}

// Actions:
- startRecording
- stopRecording
- uploadAudio
- transcriptionComplete
- recordingError
```

## 2. Reviews Generation System

### 2.1 Daily Review Generation

#### Scheduled Task (Backend):
```python
# backend/app/tasks/review_generator.py

from celery import Celery
from datetime import datetime, time

@celery.task
def generate_daily_reviews():
    """Run daily at 9 PM user's local time"""
    users = get_active_users_for_timezone(current_hour=21)
    
    for user in users:
        notes = get_daily_notes(user.id, date.today())
        
        if notes:
            review_content = call_openai_for_review(
                notes=notes,
                user_goals=user.goals,
                review_type='daily'
            )
            
            create_review(
                user_id=user.id,
                type='daily',
                date=date.today(),
                score=review_content['score'],
                content=review_content
            )
            
            # Send push notification
            send_review_notification(user.id, 'daily')
```

#### OpenAI Integration:
```python
# backend/app/services/ai_service.py

def generate_daily_review(notes: List[Note], goals: dict) -> dict:
    prompt = f"""
    Based on today's journal entries and the user's goals, generate a daily review.
    
    User Goals:
    {json.dumps(goals)}
    
    Today's Notes:
    {combine_notes(notes)}
    
    Generate a review with:
    1. Score (0-100)
    2. Day Overview - A detailed chronological or thematic recap of what happened today
    3. Emotional Color - Single emotion from: energized, happy, content, calm, focused, anxious, stressed, sad, frustrated, tired
    4. Achievements - Specific wins and completed tasks
    5. Areas for improvement
    6. Goal progress per category
    7. Tomorrow's recommendations
    8. XP earned per category
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)
```

### 2.2 Weekly Review Generation

```python
@celery.task
def generate_weekly_reviews():
    """Run every Sunday at 9 PM"""
    if datetime.today().weekday() != 6:  # Sunday
        return
        
    users = get_active_users_for_timezone(current_hour=21)
    
    for user in users:
        daily_reviews = get_week_reviews(user.id)
        week_notes = get_week_notes(user.id)
        
        if daily_reviews:
            review_content = generate_weekly_review(
                daily_reviews=daily_reviews,
                notes=week_notes,
                goals=user.goals
            )
            
            create_review(
                user_id=user.id,
                type='weekly',
                date=date.today(),
                score=review_content['average_score'],
                content=review_content
            )
            
            # Update user stats
            update_user_stats(user.id, review_content['total_xp_earned'])
            
            # Send push notification
            send_review_notification(user.id, 'weekly')
```

## 3. Implementation Phases

### Phase 1: Audio Recording Infrastructure (Week 1)
- [ ] Set up AWS S3 bucket for audio storage
- [ ] Implement audio recording in React Native
- [ ] Create audio upload endpoint
- [ ] Integrate OpenAI Whisper API

### Phase 2: Note Creation Flow (Week 1-2)
- [ ] Implement transcription endpoint
- [ ] Add note creation/append logic
- [ ] Update frontend recording UI
- [ ] Add recording state management

### Phase 3: Review Generation (Week 2-3)
- [ ] Set up Celery for task scheduling
- [ ] Implement OpenAI review generation
- [ ] Create review generation endpoints
- [ ] Add timezone-aware scheduling

### Phase 4: Notifications & Stats (Week 3)
- [ ] Implement push notifications
- [ ] Add XP calculation system
- [ ] Update user stats after reviews
- [ ] Create streak tracking

### Phase 5: Testing & Optimization (Week 4)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] User feedback integration

## 4. Technical Requirements

### Backend Dependencies to Add:
```python
# requirements.txt
celery==5.3.0
redis==5.0.0
boto3==1.28.0  # AWS SDK
openai==1.0.0
python-multipart==0.0.6  # File uploads
```

### Frontend Dependencies to Add:
```json
// package.json
{
  "expo-av": "~13.0.0",
  "expo-notifications": "~0.20.0",
  "expo-task-manager": "~11.0.0",
  "react-native-voice": "^3.2.4"
}
```

### Environment Variables:
```env
# Backend
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=journal-ai-audio
REDIS_URL=redis://localhost:6379
CELERY_BROKER_URL=redis://localhost:6379

# Frontend
EXPO_PUBLIC_AUDIO_UPLOAD_URL=https://api.journal-ai.com/upload
```

## 5. Database Considerations

### Indexes to Add:
```sql
CREATE INDEX idx_notes_user_date ON notes(user_id, date DESC);
CREATE INDEX idx_reviews_user_type_date ON reviews(user_id, type, date DESC);
CREATE INDEX idx_users_timezone ON users(timezone);
```

### New Fields for User Table:
```python
# backend/app/models/user.py additions
timezone = Column(String, default='UTC')
notification_settings = Column(JSON, default={
    'daily_review': True,
    'weekly_review': True,
    'review_time': '21:00'
})
last_recording_date = Column(Date)
```

## 6. Security Considerations

1. **Audio File Validation**: 
   - Max file size: 50MB
   - Allowed formats: .m4a, .mp3, .wav
   - Virus scanning on upload

2. **Rate Limiting**:
   - Max 60 recordings per day per user
   - Max 5 concurrent transcriptions

3. **Data Privacy**:
   - Audio files encrypted at rest in S3
   - Auto-delete audio files after 30 days
   - GDPR compliance for data export/deletion

## 7. Monitoring & Analytics

### Metrics to Track:
- Average recording duration
- Transcription accuracy/errors
- Review generation success rate
- User engagement with reviews
- XP progression patterns
- Streak maintenance

### Error Handling:
- Retry failed transcriptions (3x with exponential backoff)
- Fallback to manual note entry if transcription fails
- Queue review generation if OpenAI is unavailable
- Notify admin of repeated failures

## 8. Future Enhancements

1. **Voice Commands**: "Start journal", "Stop recording"
2. **Smart Prompts**: AI-suggested reflection questions
3. **Voice Feedback**: Audio playback of reviews
4. **Mood Detection**: Analyze tone/sentiment from voice
5. **Goal Adjustment**: AI-recommended goal modifications
6. **Social Features**: Share achievements with accountability partners
7. **Export Options**: PDF/CSV export of journal and reviews
8. **Multi-language Support**: Transcription and reviews in multiple languages