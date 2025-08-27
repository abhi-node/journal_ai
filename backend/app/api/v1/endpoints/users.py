from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any
from uuid import UUID
from app.db.session import get_db
from app.schemas.user import User, UserGoals, UserUpdate
from app.models.user import User as UserModel
from app.api.v1.endpoints.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()


class GoalsUpdate(BaseModel):
    current_goals: str
    yearly_goals: str
    ten_year_vision: str
    priority_areas: list[str]


@router.put("/create_goals", response_model=User)
def create_goals(
    goals: GoalsUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Update user goals after signup.
    """
    # Update user goals
    current_user.goals = {
        "current_goals": goals.current_goals,
        "yearly_goals": goals.yearly_goals,
        "ten_year_vision": goals.ten_year_vision,
        "priority_areas": goals.priority_areas
    }
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.get("/me", response_model=User)
def get_current_user_info(
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Get current user information.
    """
    return current_user


@router.put("/me", response_model=User)
def update_user_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Update current user profile including name and goals.
    """
    # Update user name if provided
    if user_update.name is not None:
        current_user.name = user_update.name
    
    # Update goals if provided
    if user_update.goals is not None:
        current_user.goals = {
            "current_goals": user_update.goals.current_goals,
            "yearly_goals": user_update.goals.yearly_goals,
            "ten_year_vision": user_update.goals.ten_year_vision,
            "priority_areas": user_update.goals.priority_areas
        }
    
    db.commit()
    db.refresh(current_user)
    
    return current_user