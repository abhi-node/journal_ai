from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "JournalAI"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()