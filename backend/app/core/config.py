from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://journalai:journalai@127.0.0.1:5432/journalai"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "JournalAI"
    
    # OpenAI Configuration
    OPENAI_API_KEY: str
    
    # Redis Configuration
    REDIS_URL: str = "redis://127.0.0.1:6379/0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
