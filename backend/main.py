from fastapi import FastAPI
import logging
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

# Create FastAPI instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to JournalAI API"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        # Lightweight settings check only; avoid touching the DB here
        db_url_set = bool(settings.DATABASE_URL)
        redis_url_set = bool(settings.REDIS_URL)
        return {
            "status": "healthy",
            "db_url": "set" if db_url_set else "missing",
            "redis_url": "set" if redis_url_set else "missing",
            "env": settings.ENVIRONMENT,
        }
    except Exception as e:
        logging.exception("Health check failed: %s", e)
        return {"status": "unhealthy", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
