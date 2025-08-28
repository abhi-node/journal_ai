from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import Any
from uuid import UUID
from app.db.session import get_db
from app.schemas.user import User, UserGoals, UserUpdate
from app.models.user import User as UserModel
from app.api.v1.endpoints.auth import get_current_user
from app.tasks.skill_tasks import generate_initial_skills_task, generate_additional_skills_task
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class GoalsUpdate(BaseModel):
    current_goals: str
    yearly_goals: str
    ten_year_vision: str


@router.put("/create_goals", response_model=User)
def create_goals(
    goals: GoalsUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Update user goals after signup. Skills are generated in the background.
    """
    # Update user goals
    current_user.goals = {
        "current_goals": goals.current_goals,
        "yearly_goals": goals.yearly_goals,
        "ten_year_vision": goals.ten_year_vision
    }
    
    # Initialize stats if not present
    if current_user.stats is None:
        current_user.stats = {
            "level": 1,
            "total_xp": 0,
            "skill_categories": {},
            "streak_days": 0,
            "total_entries": 0
        }
        flag_modified(current_user, "stats")
    
    # Save goals immediately
    db.commit()
    db.refresh(current_user)
    
    # Generate skills asynchronously via Celery (non-blocking)
    logger.info(f"Queueing initial skill generation task for user {current_user.id}")
    task = generate_initial_skills_task.delay(str(current_user.id), current_user.goals)
    logger.info(f"Skill generation task queued with ID: {task.id}")
    
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
    Skills are generated in the background only if goals have changed.
    """
    goals_changed = False
    old_goals = None
    
    # Update user name if provided
    if user_update.name is not None:
        current_user.name = user_update.name
    
    # Update goals if provided
    if user_update.goals is not None:
        # Store old goals for comparison
        old_goals = current_user.goals.copy() if current_user.goals else None
        
        # Update to new goals
        new_goals = {
            "current_goals": user_update.goals.current_goals,
            "yearly_goals": user_update.goals.yearly_goals,
            "ten_year_vision": user_update.goals.ten_year_vision
        }
        
        # Check if goals have actually changed
        if old_goals:
            for key in ['current_goals', 'yearly_goals', 'ten_year_vision']:
                if old_goals.get(key) != new_goals.get(key):
                    goals_changed = True
                    break
        else:
            goals_changed = True  # No old goals means this is the first time
        
        current_user.goals = new_goals
        
        # Ensure stats exist
        if current_user.stats is None:
            current_user.stats = {
                "level": 1,
                "total_xp": 0,
                "skill_categories": {},
                "streak_days": 0,
                "total_entries": 0
            }
            flag_modified(current_user, "stats")
    
    # Save changes immediately
    db.commit()
    db.refresh(current_user)
    
    # Generate skills via Celery only if goals changed
    if goals_changed and user_update.goals is not None:
        logger.info(f"Goals changed for user {current_user.id}, queueing skill generation task")
        task = generate_additional_skills_task.delay(
            str(current_user.id), 
            current_user.goals,
            old_goals
        )
        logger.info(f"Additional skills task queued with ID: {task.id}")
    else:
        logger.info(f"Goals unchanged for user {current_user.id}, skipping skill generation")
    
    return current_user