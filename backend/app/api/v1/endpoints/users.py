from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import Any, Optional
from uuid import UUID
from datetime import time
from app.db.session import get_db
from app.schemas.user import User, UserGoals, UserUpdate
from app.models.user import User as UserModel
from app.api.v1.endpoints.auth import get_current_user
from app.tasks.skill_tasks import generate_initial_skills_task, generate_additional_skills_task
from app.services.review_scheduler import ReviewScheduler
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class GoalsUpdate(BaseModel):
    current_goals: str
    yearly_goals: str
    ten_year_vision: str


class UpdateReviewScheduleRequest(BaseModel):
    time: str  # HH:MM format
    timezone: str  # e.g., "America/New_York"


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


@router.get("/review-schedule")
def get_review_schedule(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's current review schedule settings.
    """
    return {
        "scheduled": current_user.daily_review_task_id is not None,
        "time_utc": current_user.daily_review_time.isoformat() if current_user.daily_review_time else None,
        "task_id": current_user.daily_review_task_id
    }


@router.put("/review-schedule")
def update_review_schedule(
    request: UpdateReviewScheduleRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update or create review schedule for the current user.
    The time should be in HH:MM format and will be scheduled in the user's timezone.
    """
    try:
        # Parse time from HH:MM format
        time_parts = request.time.split(':')
        if len(time_parts) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid time format. Use HH:MM"
            )
        
        hour = int(time_parts[0])
        minute = int(time_parts[1])
        
        if hour < 0 or hour > 23 or minute < 0 or minute > 59:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid time. Hour must be 0-23, minute must be 0-59"
            )
        
        review_time = time(hour=hour, minute=minute)
        
        # Schedule or reschedule the review
        task_id, next_review_utc = ReviewScheduler.schedule_or_reschedule_review(
            db=db,
            user_id=current_user.id,
            review_time=review_time,
            user_timezone=request.timezone
        )
        
        logger.info(f"Updated review schedule for user {current_user.id}: task {task_id} at {next_review_utc}")
        
        return {
            "success": True,
            "task_id": task_id,
            "next_review_utc": next_review_utc.isoformat(),
            "time_utc": review_time.isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid time format: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error updating review schedule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update review schedule"
        )


@router.delete("/review-schedule")
def disable_review_schedule(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disable scheduled reviews for the current user.
    """
    success = ReviewScheduler.cancel_scheduled_review(db, current_user.id)
    
    if success:
        return {"success": True, "message": "Review schedule disabled"}
    else:
        return {"success": False, "message": "No scheduled review to disable"}