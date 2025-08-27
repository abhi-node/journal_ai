from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, notes, reviews

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])