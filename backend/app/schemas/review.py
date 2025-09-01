from pydantic import BaseModel, Field, field_serializer
from typing import Optional, Dict, List, Any, Literal
from datetime import datetime, date, timezone
from uuid import UUID
from enum import Enum


class ReviewType(str, Enum):
    daily = "daily"
    weekly = "weekly"


class EmotionType(str, Enum):
    energized = "energized"
    happy = "happy"
    content = "content"
    calm = "calm"
    focused = "focused"
    anxious = "anxious"
    stressed = "stressed"
    sad = "sad"
    frustrated = "frustrated"
    tired = "tired"


class DailyReviewContent(BaseModel):
    score: int = Field(ge=0, le=100)
    day_overview: str
    emotional_color: EmotionType
    achievements: List[str]
    areas_for_improvement: List[str]
    goal_progress: Dict[str, str]
    tomorrow_recommendations: List[str]
    xp_earned: Dict[str, int]


class WeeklyReviewContent(BaseModel):
    average_score: float = Field(ge=0, le=100)
    week_summary: str
    daily_scores: List[int]
    top_achievements: List[str]
    patterns: Dict[str, List[str]]
    next_week_focus: List[str]
    total_xp_earned: Dict[str, int]


class ReviewBase(BaseModel):
    type: ReviewType
    date: date
    score: int = Field(ge=0, le=100)
    content: Dict[str, Any]


class ReviewCreate(ReviewBase):
    pass


class ReviewInDBBase(ReviewBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    
    @field_serializer('created_at')
    def serialize_created_at(self, created_at: datetime) -> str:
        # Ensure timezone-aware datetime is serialized with timezone info
        if created_at.tzinfo is None:
            # If naive, assume UTC
            created_at = created_at.replace(tzinfo=timezone.utc)
        return created_at.isoformat()
    
    class Config:
        from_attributes = True


class Review(ReviewInDBBase):
    pass


class ReviewInDB(ReviewInDBBase):
    pass