from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, List, Any
from datetime import datetime
from uuid import UUID


# Goals Schema
class UserGoals(BaseModel):
    current_goals: Optional[str] = None
    yearly_goals: Optional[str] = None
    ten_year_vision: Optional[str] = None
    priority_areas: List[str] = Field(default_factory=lambda: ["health", "career", "relationships", "personal"])


# Skill Category Schema
class SkillCategory(BaseModel):
    xp: int = 0
    level: int = 1


# Stats Schema
class UserStats(BaseModel):
    level: int = 1
    total_xp: int = 0
    skill_categories: Dict[str, SkillCategory] = Field(default_factory=lambda: {
        "health": {"xp": 0, "level": 1},
        "career": {"xp": 0, "level": 1},
        "relationships": {"xp": 0, "level": 1}
    })
    streak_days: int = 0
    total_entries: int = 0


# User Base Schema
class UserBase(BaseModel):
    email: EmailStr
    name: str
    goals: Optional[UserGoals] = Field(default_factory=UserGoals)
    stats: Optional[UserStats] = Field(default_factory=UserStats)


# User Create Schema (for registration)
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    
    @validator('password')
    def validate_password(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v


# User Update Schema
class UserUpdate(BaseModel):
    name: Optional[str] = None
    goals: Optional[UserGoals] = None
    
    class Config:
        exclude_unset = True


# User In DB Schema (internal)
class UserInDBBase(UserBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# User Response Schema (for API responses)
class User(UserInDBBase):
    pass


# User In DB Schema with password hash (internal only)
class UserInDB(UserInDBBase):
    password_hash: str