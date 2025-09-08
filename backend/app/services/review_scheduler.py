"""
Simplified review scheduler service that delegates to the task_manager.
"""

from datetime import time
from typing import Optional, Tuple
from uuid import UUID
import logging
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.task_manager import task_manager

logger = logging.getLogger(__name__)


class ReviewScheduler:
    """
    Facade for review scheduling that uses the centralized TaskManager.
    Provides backward compatibility for existing API endpoints.
    """
    
    @staticmethod
    def schedule_or_reschedule_review(
        db: Session,
        user_id: UUID, 
        review_time: time,
        user_timezone: str
    ) -> Tuple[str, str]:
        """
        Schedule or reschedule a daily review using the new task manager.
        
        This method:
        1. Checks if a review exists for today
        2. Schedules appropriately (today or tomorrow)
        3. Ensures only one active task per user
        
        Args:
            db: Database session
            user_id: User's UUID
            review_time: Time for daily review
            user_timezone: User's timezone string
            
        Returns:
            Tuple of (task_id, scheduled_time_message)
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                raise ValueError(f"User {user_id} not found")
            
            # Use the new task manager to reschedule
            task_id = task_manager.reschedule_review(
                user_id=user_id,
                new_review_time=review_time,
                user_timezone=user_timezone
            )
            
            if not task_id:
                raise Exception("Failed to schedule review")
            
            # Update user record
            user.daily_review_time = review_time
            user.daily_review_task_id = task_id
            db.commit()
            
            # Get scheduled task info for return message
            task_info = task_manager.get_scheduled_task(user_id)
            scheduled_time = task_info.get('scheduled_time', 'Unknown time')
            
            logger.info(f"Scheduled review {task_id} for user {user_id}")
            
            return task_id, scheduled_time
            
        except Exception as e:
            logger.error(f"Error scheduling review for user {user_id}: {str(e)}")
            db.rollback()
            raise
    
    @staticmethod
    def cancel_scheduled_review(db: Session, user_id: UUID) -> bool:
        """
        Cancel a user's scheduled review.
        
        Args:
            db: Database session
            user_id: User's UUID
            
        Returns:
            True if successfully cancelled, False otherwise
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                logger.info(f"User {user_id} not found")
                return False
            
            # Cancel using task manager
            success = task_manager.cancel_scheduled_review(user_id)
            
            if success:
                # Clear user's review settings
                user.daily_review_task_id = None
                user.daily_review_time = None
                db.commit()
                logger.info(f"Cancelled review schedule for user {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error cancelling review for user {user_id}: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def get_scheduled_review_info(db: Session, user_id: UUID) -> Optional[dict]:
        """
        Get information about a user's scheduled review.
        
        Args:
            db: Database session
            user_id: User's UUID
            
        Returns:
            Dictionary with review schedule info or None
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user or not user.daily_review_time:
                return None
            
            # Get task info from task manager
            task_info = task_manager.get_scheduled_task(user_id)
            
            if task_info:
                return {
                    'scheduled': True,
                    'time': user.daily_review_time.isoformat(),
                    'timezone': task_info.get('timezone'),
                    'next_run': task_info.get('scheduled_time'),
                    'task_id': task_info.get('task_id')
                }
            else:
                return {
                    'scheduled': False,
                    'time': user.daily_review_time.isoformat() if user.daily_review_time else None
                }
                
        except Exception as e:
            logger.error(f"Error getting review info for user {user_id}: {str(e)}")
            return None