from typing import Dict, Optional
from uuid import UUID
import logging
from celery import Task
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.user import User
from app.services.ai_skills import generate_initial_skills, generate_additional_skills

logger = logging.getLogger(__name__)


class DatabaseTask(Task):
    """Base task with database session management."""
    _db = None

    @property
    def db(self) -> Session:
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        """Clean up database session after task completion."""
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(
    base=DatabaseTask,
    bind=True,
    name="app.tasks.skill_tasks.generate_initial_skills_task",
    max_retries=3,
    default_retry_delay=60,  # Retry after 1 minute
)
def generate_initial_skills_task(
    self, user_id: str, goals: Dict[str, str]
) -> Dict[str, any]:
    """
    Generate initial skills for a user during onboarding.
    
    Args:
        user_id: The user's ID as string (will be converted to UUID)
        goals: The user's goals dictionary
        
    Returns:
        Dictionary with status and generated skills
    """
    try:
        # Convert string ID to UUID
        user_uuid = UUID(user_id)
        
        # Get the user from database
        user = self.db.query(User).filter(User.id == user_uuid).first()
        if not user:
            logger.error(f"User {user_id} not found for initial skill generation")
            return {"status": "error", "message": f"User {user_id} not found"}
        
        logger.info(f"Generating initial skills for user {user_id} (Celery task)")
        
        # Generate initial skills using the AI service
        initial_skills = generate_initial_skills(goals)
        
        if not initial_skills:
            logger.warning(f"No skills generated for user {user_id}")
            return {"status": "error", "message": "Failed to generate skills"}
        
        # Initialize user stats if not present
        if user.stats is None:
            user.stats = {}
        
        # Update user stats with generated skills
        updated_stats = user.stats.copy() if user.stats else {}
        updated_stats["skill_categories"] = initial_skills
        updated_stats["level"] = updated_stats.get("level", 1)
        updated_stats["total_xp"] = updated_stats.get("total_xp", 0)
        updated_stats["streak_days"] = updated_stats.get("streak_days", 0)
        updated_stats["total_entries"] = updated_stats.get("total_entries", 0)
        
        user.stats = updated_stats
        flag_modified(user, "stats")
        
        # Commit the changes
        self.db.commit()
        
        logger.info(f"Successfully generated {len(initial_skills)} skills for user {user_id}")
        logger.info(f"Skills generated: {list(initial_skills.keys())}")
        
        return {
            "status": "success",
            "user_id": user_id,
            "skills_count": len(initial_skills),
            "skills": list(initial_skills.keys())
        }
        
    except Exception as exc:
        logger.error(f"Error generating initial skills for user {user_id}: {str(exc)}")
        self.db.rollback()
        
        # Retry the task with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@celery_app.task(
    base=DatabaseTask,
    bind=True,
    name="app.tasks.skill_tasks.generate_additional_skills_task",
    max_retries=3,
    default_retry_delay=60,
)
def generate_additional_skills_task(
    self,
    user_id: str,
    new_goals: Dict[str, str],
    old_goals: Optional[Dict[str, str]] = None
) -> Dict[str, any]:
    """
    Generate additional skills when user updates their goals.
    
    Args:
        user_id: The user's ID as string
        new_goals: The user's new goals
        old_goals: The user's previous goals (optional)
        
    Returns:
        Dictionary with status and newly added skills
    """
    try:
        # Convert string ID to UUID
        user_uuid = UUID(user_id)
        
        # Get the user from database
        user = self.db.query(User).filter(User.id == user_uuid).first()
        if not user:
            logger.error(f"User {user_id} not found for additional skill generation")
            return {"status": "error", "message": f"User {user_id} not found"}
        
        # Check if user has existing skills
        if not user.stats or "skill_categories" not in user.stats:
            logger.info(f"User {user_id} has no existing skills, generating initial skills instead")
            # If no existing skills, generate initial skills
            return generate_initial_skills_task.apply_async(
                args=[user_id, new_goals]
            ).get()
        
        current_skills = user.stats["skill_categories"]
        
        # Check if goals are exactly the same
        if old_goals and are_goals_identical(old_goals, new_goals):
            logger.info(f"Goals are identical for user {user_id}, skipping skill generation")
            return {
                "status": "success",
                "message": "Goals unchanged, no new skills needed",
                "user_id": user_id,
                "new_skills_count": 0
            }
        
        logger.info(f"Generating additional skills for user {user_id} (Celery task)")
        
        # Generate additional skills based on goal changes
        new_skills = generate_additional_skills(
            current_skills=current_skills,
            new_goals=new_goals,
            old_goals=old_goals
        )
        
        if new_skills:
            # Merge new skills with existing ones
            updated_stats = user.stats.copy()
            updated_stats["skill_categories"].update(new_skills)
            user.stats = updated_stats
            flag_modified(user, "stats")
            
            # Commit the changes
            self.db.commit()
            
            logger.info(f"Added {len(new_skills)} new skills for user {user_id}")
            logger.info(f"New skills: {list(new_skills.keys())}")
            
            return {
                "status": "success",
                "user_id": user_id,
                "new_skills_count": len(new_skills),
                "new_skills": list(new_skills.keys())
            }
        else:
            logger.info(f"No new skills generated for user {user_id}")
            return {
                "status": "success",
                "message": "No new skills to add",
                "user_id": user_id,
                "new_skills_count": 0
            }
            
    except Exception as exc:
        logger.error(f"Error generating additional skills for user {user_id}: {str(exc)}")
        self.db.rollback()
        
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


def are_goals_identical(old_goals: Dict[str, str], new_goals: Dict[str, str]) -> bool:
    """
    Check if goals are exactly the same.
    
    Returns True if goals are identical (no new skills needed), False if they're different at all.
    """
    # Check each goal field for exact equality (case-insensitive, trimmed)
    for key in ['current_goals', 'yearly_goals', 'ten_year_vision']:
        old_value = old_goals.get(key, '').strip().lower()
        new_value = new_goals.get(key, '').strip().lower()
        
        # If any field is different, goals have changed
        if old_value != new_value:
            return False
    
    return True  # Goals are exactly the same