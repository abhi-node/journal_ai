# Tech Stack - JournalAI

## Frontend (Mobile)

### Core Framework
- **React Native** - Cross-platform mobile development
- **Expo** - Build system and development tools
- **TypeScript** - Type safety and better developer experience

### Styling
- **Tailwind CSS** (via NativeWind) - Utility-first styling
- **React Native Reanimated** - Smooth animations

### State Management
- **Redux Toolkit** - Global state management
- **React Query** - Server state and caching

### Key Libraries
- **React Navigation** - Navigation between screens
- **Expo AV** - Audio recording functionality
- **AsyncStorage** - Local data persistence

## Backend

### API Framework
- **Python 3.11+** - Primary language
- **FastAPI** - Modern, fast web framework
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Database
- **PostgreSQL** - Primary database
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations

### Infrastructure
- **AWS ECS** - Container orchestration
- **Docker** - Containerization
- **AWS ALB** - Load balancing
- **CloudWatch** - Logging and monitoring

## External Services

### AI/ML
- **OpenAI API**
  - Whisper API - Voice transcription
  - GPT-4 - Review generation and analysis
  - Embeddings - Semantic search

### Cloud Services
- **AWS S3** - Audio file storage
- **AWS CloudFront** - CDN for media delivery
- **AWS RDS** - Managed PostgreSQL

## Database Schema

### Tables

#### users
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- name (VARCHAR)
- created_at (TIMESTAMP)
- goals (JSONB)
- stats (JSONB)
```

**Goals Format:**
```json
{
  "current_goals": "Text from user about immediate goals",
  "yearly_goals": "Text from user about 1-year vision",
  "ten_year_vision": "Text from user about 10-year vision",
  "priority_areas": ["health", "career", "relationships", "personal"]
}
```

**Stats Format:**
```json
{
  "level": 1,
  "total_xp": 0,
  "skill_categories": {
    "health": {"xp": 0, "level": 1},
    "career": {"xp": 0, "level": 1},
    "relationships": {"xp": 0, "level": 1}
  },
  "streak_days": 0,
  "total_entries": 0
}
```

#### notes
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- content (TEXT) -- Transcribed text from voice
- created_at (TIMESTAMP)
- date (DATE) -- The day this note belongs to
```
*Notes are append-only throughout the day. Multiple entries per day combine into daily context.*

#### reviews
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- type (ENUM: 'daily', 'weekly')
- date (DATE)
- score (INTEGER 0-100)
- content (JSONB)
- created_at (TIMESTAMP)
```

**Daily Review Content Format:**
```json
{
  "score": 75,
  "summary": "You had a productive day with significant progress on your fitness goals.",
  "achievements": [
    "Completed morning workout routine",
    "Prepared healthy meals for the week",
    "Had meaningful conversation with partner"
  ],
  "areas_for_improvement": [
    "Missed opportunity to work on side project",
    "Screen time exceeded target by 2 hours"
  ],
  "goal_progress": {
    "health": "Great progress - workout completed, healthy eating maintained",
    "career": "Limited progress - focused on routine tasks",
    "relationships": "Good engagement with family"
  },
  "tomorrow_recommendations": [
    "Block 2 hours for side project work",
    "Set screen time limits before 9 PM",
    "Continue workout momentum"
  ],
  "xp_earned": {
    "health": 50,
    "career": 10,
    "relationships": 25
  }
}
```

**Weekly Review Content Format:**
```json
{
  "average_score": 68,
  "week_summary": "Consistent progress on health goals, but career goals need more focus.",
  "daily_scores": [65, 72, 80, 55, 70, 75, 62],
  "top_achievements": [
    "Maintained workout streak for 7 days",
    "Completed project milestone",
    "Quality time with family on weekend"
  ],
  "patterns": {
    "positive": ["Morning routines consistent", "Healthy eating maintained"],
    "negative": ["Late night screen time", "Procrastination on side projects"]
  },
  "next_week_focus": [
    "Dedicate 10 hours to side project",
    "Implement 9 PM digital sunset",
    "Schedule two networking calls"
  ],
  "total_xp_earned": {
    "health": 280,
    "career": 120,
    "relationships": 150
  }
}
```

#### tasks
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- review_id (UUID, FK) -- Links to the review that generated this task
- description (TEXT)
- priority (ENUM: 'high', 'medium', 'low')
- completed (BOOLEAN)
- completed_at (TIMESTAMP)
- created_at (TIMESTAMP)
```
*Tasks are AI-generated recommendations from reviews. They help users take concrete actions toward their goals.*

## API Structure

### Endpoints

#### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Authenticate user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Invalidate refresh token

#### Notes
- `POST /notes/transcribe` - Transcribe audio to text and save
- `POST /notes/add` - Add text note directly
- `GET /notes/daily/{date}` - Get all notes for a specific day
- `GET /notes/range` - Get notes between date range

#### Reviews
- `GET /reviews/daily/{date}` - Get daily review
- `GET /reviews/weekly/{week_start_date}` - Get weekly review
- `POST /reviews/generate/daily` - Trigger daily review generation
- `POST /reviews/generate/weekly` - Trigger weekly review generation
- `GET /reviews/history` - Get paginated review history

#### Users
- `GET /users/profile` - Get user profile with goals and stats
- `PUT /users/goals` - Update user goals
- `GET /users/stats` - Get current stats and XP
- `PUT /users/onboarding` - Complete onboarding with initial goals

#### Tasks
- `GET /tasks/active` - Get current uncompleted tasks
- `GET /tasks/daily` - Get today's recommended tasks
- `PUT /tasks/{id}/complete` - Mark task as completed
- `GET /tasks/history` - Get completed tasks history

## Development Tools

### Code Quality
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Black** - Python formatting
- **Pytest** - Python testing
- **Jest** - JavaScript testing

### CI/CD
- **GitHub Actions** - Automated workflows
- **Docker Hub** - Container registry
- **AWS CodeDeploy** - Deployment automation

## Security

### Authentication
- **JWT** - Token-based authentication
- **Refresh tokens** - Secure token rotation
- **bcrypt** - Password hashing

### Data Protection
- **HTTPS** - All API communication
- **Environment variables** - Secrets management
- **AWS Secrets Manager** - Production secrets
- **Input validation** - SQL injection prevention

## Performance Considerations

### Caching
- **Redis** - Session management and caching
- **React Query** - Client-side caching
- **CloudFront** - CDN caching

### Optimization
- **Database indexing** - Query optimization
- **Lazy loading** - Frontend performance
- **Audio compression** - Reduce storage costs
- **Batch processing** - Review generation

## Monitoring

### Application
- **Sentry** - Error tracking
- **CloudWatch** - Metrics and logs
- **New Relic** - APM (optional)

### Infrastructure
- **AWS CloudWatch** - Resource monitoring
- **Health checks** - Service availability