"""
Service module for scheduling and managing daily review tasks.
Handles Celery task scheduling with ETA and revocation patterns.
"""

from datetime import datetime, time, timedelta, timezone
from typing import Optional, Tuple
from uuid import UUID
import logging
from celery.result import AsyncResult
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.models.user import User
from app.services.task_manager import task_manager

logger = logging.getLogger(__name__)


class ReviewScheduler:
    """Manages scheduled daily review tasks."""
    
    @staticmethod
    def calculate_next_review_utc(review_time: time, user_timezone: str) -> datetime:
        """
        Calculate next review datetime in UTC.
        If the time hasn't passed today, schedule for today.
        Otherwise, schedule for tomorrow.
        
        Args:
            review_time: Time of day for review (e.g., 21:00 for 9 PM)
            user_timezone: Timezone string (e.g., "America/New_York")
            
        Returns:
            datetime: Next review time in UTC
        """
        try:
            tz = ZoneInfo(user_timezone)
            now_user_tz = datetime.now(tz)
            
            # Create datetime for today at review_time in user's timezone
            review_today = datetime.combine(
                now_user_tz.date(),
                review_time,
                tzinfo=tz
            )
            
            # If the time has already passed today, schedule for tomorrow
            if review_today <= now_user_tz:
                review_today += timedelta(days=1)
                logger.info(f"Review time has passed for today, scheduling for tomorrow: {review_today}")
            else:
                logger.info(f"Scheduling review for today: {review_today}")
            
            # Convert to UTC for Celery
            review_utc = review_today.astimezone(timezone.utc)
            logger.info(f"Converted to UTC: {review_utc}")
            
            return review_utc
            
        except Exception as e:
            logger.error(f"Error calculating next review time: {str(e)}")
            # Fallback to 24 hours from now if there's an error
            return datetime.now(timezone.utc) + timedelta(days=1)
    
    @staticmethod
    def schedule_or_reschedule_review(
        db: Session,
        user_id: UUID, 
        review_time: time,
        user_timezone: str
    ) -> Tuple[str, datetime]:
        """
        Schedule or reschedule a daily review.
        Checks if review exists for today and schedules accordingly.
        
        Args:
            db: Database session
            user_id: User's UUID
            review_time: Time for daily review
            user_timezone: User's timezone string
            
        Returns:
            Tuple of (task_id, scheduled_utc_datetime)
        """
        from app.tasks.review_tasks import generate_daily_review
        from app.models.review import Review, ReviewType
        from sqlalchemy import and_
        from app.core.timezone_utils import get_user_current_date
        
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                raise ValueError(f"User {user_id} not found")
            
            # 1. Cancel and delete existing task if exists
            if user.daily_review_task_id:
                logger.info(f"Cancelling and deleting existing task {user.daily_review_task_id} for user {user_id}")
                try:
                    # Use TaskManager to properly delete the task
                    task_manager.cancel_and_delete_task(user_id, user.daily_review_task_id)
                except Exception as e:
                    logger.warning(f"Error cancelling task {user.daily_review_task_id}: {str(e)}")
            
            # 2. Check if daily review already exists for today
            today_user_tz = get_user_current_date(user_timezone)
            existing_review_today = db.query(Review).filter(
                and_(
                    Review.user_id == user_id,
                    Review.date == today_user_tz,
                    Review.type == ReviewType.DAILY
                )
            ).first()
            
            # 3. Calculate next review time based on whether today's review exists
            if existing_review_today:
                # Review exists for today, schedule for tomorrow at the specified time
                logger.info(f"Daily review already exists for today ({today_user_tz}), scheduling for tomorrow")
                
                tz = ZoneInfo(user_timezone)
                now_user_tz = datetime.now(tz)
                
                # Create datetime for tomorrow at review_time
                tomorrow_date = today_user_tz + timedelta(days=1)
                review_tomorrow = datetime.combine(
                    tomorrow_date,
                    review_time,
                    tzinfo=tz
                )
                
                next_review_utc = review_tomorrow.astimezone(timezone.utc)
                logger.info(f"Scheduling for tomorrow: {next_review_utc}")
                
            else:
                # No review for today, use normal scheduling logic
                logger.info(f"No review exists for today ({today_user_tz}), using normal scheduling logic")
                next_review_utc = ReviewScheduler.calculate_next_review_utc(
                    review_time, user_timezone
                )
            
            # 4. Schedule new task with ETA
            logger.info(f"Scheduling new review for user {user_id} at {next_review_utc}")
            task = generate_daily_review.apply_async(
                args=[str(user_id)],
                kwargs={'user_timezone': user_timezone},
                eta=next_review_utc
            )
            
            # 5. Register task with TaskManager
            task_manager.register_task(user_id, task.id)
            
            # 6. Update user record with new task ID and time
            user.daily_review_task_id = task.id
            user.daily_review_time = review_time
            db.commit()
            
            logger.info(f"Successfully scheduled and registered review task {task.id} for user {user_id}")
            
            return task.id, next_review_utc
            
        except Exception as e:
            logger.error(f"Error scheduling review for user {user_id}: {str(e)}")
            db.rollback()
            raise
    
    @staticmethod
    def schedule_next_review(db: Session, user_id: UUID, user_timezone: str) -> Optional[str]:
        """
        Schedule the next review (24 hours from now).
        Called after a review completes to chain the next one.
        
        Args:
            db: Database session
            user_id: User's UUID
            user_timezone: User's timezone string
            
        Returns:
            Task ID of scheduled task, or None if scheduling failed
        """
        from app.tasks.review_tasks import generate_daily_review
        
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user or not user.daily_review_time:
                logger.warning(f"User {user_id} has no scheduled review time set")
                return None
            
            # Calculate next review time (same time tomorrow)
            tomorrow_utc = datetime.now(timezone.utc) + timedelta(days=1)
            
            # Schedule new task
            task = generate_daily_review.apply_async(
                args=[str(user_id)],
                kwargs={'user_timezone': user_timezone},
                eta=tomorrow_utc
            )
            
            # Register task with TaskManager
            task_manager.register_task(UUID(user_id), task.id)
            
            # Update user's task ID
            user.daily_review_task_id = task.id
            db.commit()
            
            logger.info(f"Scheduled and registered next review task {task.id} for user {user_id} at {tomorrow_utc}")
            
            return task.id
            
        except Exception as e:
            logger.error(f"Error scheduling next review for user {user_id}: {str(e)}")
            db.rollback()
            return None
    
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
            
            if not user or not user.daily_review_task_id:
                logger.info(f"No scheduled review to cancel for user {user_id}")
                return False
            
            # Cancel and delete the task properly
            task_manager.cancel_and_delete_task(user_id, user.daily_review_task_id)
            
            # Clear the task ID and time
            user.daily_review_task_id = None
            user.daily_review_time = None
            db.commit()
            
            logger.info(f"Cancelled scheduled review for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error cancelling review for user {user_id}: {str(e)}")
            db.rollback()
            return False