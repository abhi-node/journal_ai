"""
Simplified daily review scheduling service.
Handles scheduling and cancellation of daily review tasks without complex locking or Redis state management.
"""

import logging
from typing import Optional
from uuid import UUID
from datetime import datetime, date, time, timedelta, timezone
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.core.config import settings
from app.core.celery_app import celery_app
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


class DailyReviewScheduler:
    """
    Simple scheduler for daily review tasks.
    Each user can have exactly one scheduled review task at a time.
    """
    
    def calculate_next_review_time(
        self, 
        review_time: time, 
        user_timezone: str,
        force_tomorrow: bool = False
    ) -> datetime:
        """
        Calculate the next review time in UTC.
        
        Args:
            review_time: Time of day for the review
            user_timezone: User's timezone string
            force_tomorrow: If True, always schedule for tomorrow
            
        Returns:
            datetime in UTC for the next review
        """
        try:
            tz = ZoneInfo(user_timezone)
            now_user_tz = datetime.now(tz)
            today = now_user_tz.date()
            
            # Create datetime for today at review_time
            review_datetime = datetime.combine(today, review_time, tzinfo=tz)
            
            # Schedule for tomorrow if forced or if time has passed
            if force_tomorrow or review_datetime <= now_user_tz:
                review_datetime += timedelta(days=1)
                logger.info(f"Scheduling review for tomorrow at {review_datetime}")
            else:
                logger.info(f"Scheduling review for today at {review_datetime}")
            
            # Convert to UTC
            return review_datetime.astimezone(timezone.utc)
            
        except Exception as e:
            logger.error(f"Error calculating review time: {str(e)}")
            # Fallback to 24 hours from now
            return datetime.now(timezone.utc) + timedelta(days=1)
    
    def schedule_review(
        self,
        user_id: UUID,
        review_time: time,
        user_timezone: str
    ) -> Optional[str]:
        """
        Schedule a daily review task for a user.
        Cancels any existing scheduled task before creating a new one.
        
        Args:
            user_id: User's UUID
            review_time: Time for daily review
            user_timezone: User's timezone
            
        Returns:
            Task ID if scheduled successfully, None otherwise
        """
        from app.models.user import User
        from app.models.review import Review, ReviewType
        from app.core.timezone_utils import get_user_current_date
        
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.error(f"User {user_id} not found")
                return None
            
            # Cancel any existing scheduled task
            if user.daily_review_task_id:
                try:
                    celery_app.control.revoke(user.daily_review_task_id, terminate=True)
                    logger.info(f"Cancelled existing task {user.daily_review_task_id} for user {user_id}")
                except Exception as e:
                    logger.warning(f"Could not cancel task {user.daily_review_task_id}: {e}")
            
            # Check if review exists today to determine scheduling
            today = get_user_current_date(user_timezone)
            review_exists_today = db.query(Review).filter(
                and_(
                    Review.user_id == user_id,
                    Review.date == today,
                    Review.type == ReviewType.DAILY
                )
            ).first() is not None
            
            # Calculate next review time
            next_review_utc = self.calculate_next_review_time(
                review_time, 
                user_timezone,
                force_tomorrow=review_exists_today
            )
            
            # Schedule the task
            from app.tasks.review_tasks import generate_daily_review
            
            task = generate_daily_review.apply_async(
                args=[str(user_id)],
                kwargs={'user_timezone': user_timezone},
                eta=next_review_utc
            )
            
            # Update user record
            user.daily_review_time = review_time
            user.daily_review_task_id = task.id
            db.commit()
            
            logger.info(f"Scheduled review task {task.id} for user {user_id} at {next_review_utc}")
            return task.id
            
        except Exception as e:
            logger.error(f"Error scheduling review for user {user_id}: {str(e)}")
            db.rollback()
            return None
        finally:
            db.close()
    
    def reschedule_review(
        self,
        user_id: UUID,
        new_review_time: time,
        user_timezone: str
    ) -> Optional[str]:
        """
        Reschedule an existing review to a new time.
        This is just an alias for schedule_review for backward compatibility.
        
        Args:
            user_id: User's UUID
            new_review_time: New time for the review
            user_timezone: User's timezone
            
        Returns:
            New task ID if rescheduled successfully
        """
        return self.schedule_review(user_id, new_review_time, user_timezone)
    
    def cancel_scheduled_review(self, user_id: UUID) -> bool:
        """
        Cancel a scheduled review task for a user.
        
        Args:
            user_id: User's UUID
            
        Returns:
            True if cancelled successfully, False otherwise
        """
        from app.models.user import User
        
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.daily_review_task_id:
                logger.info(f"No scheduled review found for user {user_id}")
                return False
            
            # Revoke the Celery task
            try:
                celery_app.control.revoke(user.daily_review_task_id, terminate=True)
                logger.info(f"Revoked task {user.daily_review_task_id} for user {user_id}")
            except Exception as e:
                logger.warning(f"Error revoking task: {e}")
            
            # Clear task reference
            user.daily_review_task_id = None
            user.daily_review_time = None
            db.commit()
            
            logger.info(f"Cancelled review schedule for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error cancelling review for user {user_id}: {str(e)}")
            db.rollback()
            return False
        finally:
            db.close()
    
    def schedule_next_daily_review(
        self,
        user_id: UUID,
        user_timezone: str
    ) -> Optional[str]:
        """
        Schedule the next daily review (called after a review completes).
        Always schedules for tomorrow at the user's configured time.
        
        Args:
            user_id: User's UUID
            user_timezone: User's timezone
            
        Returns:
            Task ID if scheduled successfully
        """
        from app.models.user import User
        
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user or not user.daily_review_time:
                logger.warning(f"User {user_id} has no review time configured")
                return None
            
            # Always schedule for tomorrow when called after review completion
            tz = ZoneInfo(user_timezone)
            tomorrow = datetime.now(tz).date() + timedelta(days=1)
            next_review = datetime.combine(
                tomorrow,
                user.daily_review_time,
                tzinfo=tz
            )
            next_review_utc = next_review.astimezone(timezone.utc)
            
            # Schedule the task
            from app.tasks.review_tasks import generate_daily_review
            
            task = generate_daily_review.apply_async(
                args=[str(user_id)],
                kwargs={'user_timezone': user_timezone},
                eta=next_review_utc
            )
            
            # Update user record
            user.daily_review_task_id = task.id
            db.commit()
            
            logger.info(f"Scheduled next review {task.id} for user {user_id} at {next_review_utc}")
            return task.id
            
        except Exception as e:
            logger.error(f"Error scheduling next review for user {user_id}: {str(e)}")
            db.rollback()
            return None
        finally:
            db.close()
    
    def get_scheduled_task(self, user_id: UUID) -> Optional[dict]:
        """
        Get information about a user's scheduled review.
        
        Args:
            user_id: User's UUID
            
        Returns:
            Dictionary with task info or None
        """
        from app.models.user import User
        
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user or not user.daily_review_task_id:
                return None
            
            return {
                'task_id': user.daily_review_task_id,
                'review_time': user.daily_review_time.isoformat() if user.daily_review_time else None,
                'scheduled': True
            }
            
        except Exception as e:
            logger.error(f"Error getting scheduled task for user {user_id}: {str(e)}")
            return None
        finally:
            db.close()


# Singleton instance - using a more descriptive name
daily_review_scheduler = DailyReviewScheduler()

# Backward compatibility aliases
task_manager = daily_review_scheduler