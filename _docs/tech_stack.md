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
- email (VARCHAR)
- name (VARCHAR)
- created_at (TIMESTAMP)
- goals (JSONB)
  - current_goals
  - yearly_goals
  - ten_year_vision
- stats (JSONB)
  - level
  - xp
  - skill_categories
- preferences (JSONB)
  - review_time
  - notification_settings
```

#### notes
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- content (TEXT)
- audio_url (VARCHAR)
- created_at (TIMESTAMP)
- date (DATE)
- categories (JSONB)
- sentiment (FLOAT)
```

#### reviews
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- type (ENUM: 'daily', 'weekly')
- date (DATE)
- score (INTEGER 0-100)
- content (JSONB)
  - summary
  - achievements
  - improvements
  - recommendations
- created_at (TIMESTAMP)
```

#### tasks
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- review_id (UUID, FK)
- description (TEXT)
- completed (BOOLEAN)
- created_at (TIMESTAMP)
```

## API Structure

### Endpoints

#### Authentication
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

#### Notes
- `POST /notes/create`
- `GET /notes/daily/{date}`
- `POST /notes/transcribe`

#### Reviews
- `GET /reviews/daily/{date}`
- `GET /reviews/weekly/{week}`
- `POST /reviews/generate`

#### Users
- `GET /users/profile`
- `PUT /users/goals`
- `GET /users/stats`

#### Tasks
- `GET /tasks/recommendations`
- `PUT /tasks/{id}/complete`

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