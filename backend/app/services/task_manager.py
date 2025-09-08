"""
Enhanced task management service with idempotency, distributed locking, and Celery Beat integration.
Ensures only one daily review per user with proper scheduling and rescheduling logic.
"""

import logging
import redis
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime, date, time, timedelta, timezone
from zoneinfo import ZoneInfo

from app.core.config import settings
from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


class TaskManager:
    """
    Manages daily review tasks with the following guarantees:
    1. Only one scheduled review per user at any time
    2. Idempotency for review generation (one review per day)
    3. Proper rescheduling logic based on review completion status
    4. No tasks scheduled in the past
    """
    
    def __init__(self):
        """Initialize Redis connection for distributed locking and state management."""
        self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.lock_timeout = 10  # seconds
        self.idempotency_ttl = 86400  # 24 hours
        
    def acquire_lock(self, key: str, timeout: int = None) -> bool:
        """
        Acquire a distributed lock using Redis.
        
        Args:
            key: Lock key
            timeout: Lock timeout in seconds
            
        Returns:
            True if lock acquired, False otherwise
        """
        timeout = timeout or self.lock_timeout
        return self.redis_client.set(
            f"lock:{key}", 
            "1", 
            nx=True, 
            ex=timeout
        )
    
    def release_lock(self, key: str) -> None:
        """Release a distributed lock."""
        self.redis_client.delete(f"lock:{key}")
    
    def set_idempotency_key(self, user_id: UUID, date: date) -> bool:
        """
        Set an idempotency key to prevent duplicate reviews for the same day.
        
        Args:
            user_id: User's UUID
            date: Date of the review
            
        Returns:
            True if key was set (no existing review), False if key already exists
        """
        key = f"review:idempotent:{user_id}:{date.isoformat()}"
        return self.redis_client.set(key, "1", nx=True, ex=self.idempotency_ttl)
    
    def check_idempotency(self, user_id: UUID, date: date) -> bool:
        """
        Check if a review has already been processed for this user and date.
        
        Returns:
            True if review already exists, False otherwise
        """
        key = f"review:idempotent:{user_id}:{date.isoformat()}"
        return self.redis_client.exists(key) > 0
    
    def get_scheduled_task(self, user_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get the currently scheduled task information for a user.
        
        Returns:
            Dictionary with task info or None if no task scheduled
        """
        key = f"review:scheduled:{user_id}"
        task_info = self.redis_client.hgetall(key)
        return task_info if task_info else None
    
    def set_scheduled_task(self, user_id: UUID, task_info: Dict[str, Any]) -> None:
        """
        Store information about a scheduled task.
        
        Args:
            user_id: User's UUID
            task_info: Dictionary containing task_id, scheduled_time, etc.
        """
        key = f"review:scheduled:{user_id}"
        # Clear any existing task info
        self.redis_client.delete(key)
        # Set new task info with expiry
        if task_info:
            self.redis_client.hset(key, mapping=task_info)
            # Expire after 48 hours (gives buffer for task execution)
            self.redis_client.expire(key, 172800)
    
    def clear_scheduled_task(self, user_id: UUID) -> None:
        """Clear scheduled task information for a user."""
        key = f"review:scheduled:{user_id}"
        self.redis_client.delete(key)
    
    def calculate_next_review_time(
        self, 
        review_time: time, 
        user_timezone: str,
        review_exists_today: bool = False
    ) -> datetime:
        """
        Calculate the next review time based on current conditions.
        
        Args:
            review_time: Desired time for the review (e.g., 21:00)
            user_timezone: User's timezone string
            review_exists_today: Whether a review already exists for today
            
        Returns:
            datetime in UTC for the next review
        """
        try:
            tz = ZoneInfo(user_timezone)
            now_user_tz = datetime.now(tz)
            today = now_user_tz.date()
            
            # Create datetime for today at review_time
            review_datetime = datetime.combine(today, review_time, tzinfo=tz)
            
            # Determine when to schedule
            if review_exists_today:
                # Review already exists for today, schedule for tomorrow
                review_datetime += timedelta(days=1)
                logger.info(f"Review exists for today, scheduling for tomorrow: {review_datetime}")
            elif review_datetime <= now_user_tz:
                # Time has passed for today, schedule for tomorrow
                review_datetime += timedelta(days=1)
                logger.info(f"Time has passed for today, scheduling for tomorrow: {review_datetime}")
            else:
                # Schedule for today
                logger.info(f"Scheduling for today: {review_datetime}")
            
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
        user_timezone: str,
        review_exists_today: bool = False
    ) -> Optional[str]:
        """
        Schedule a daily review with proper locking and idempotency.
        
        Args:
            user_id: User's UUID
            review_time: Time for the review
            user_timezone: User's timezone
            review_exists_today: Whether a review already exists for today
            
        Returns:
            Task ID if scheduled successfully, None otherwise
        """
        lock_key = f"schedule:{user_id}"
        
        if not self.acquire_lock(lock_key):
            logger.warning(f"Could not acquire lock for scheduling review for user {user_id}")
            return None
        
        try:
            # Cancel any existing scheduled task
            self.cancel_scheduled_review(user_id)

            # Best-effort purge of any other stray scheduled review tasks
            try:
                pre_purged = self.purge_user_scheduled_review_tasks(user_id)
                if pre_purged:
                    logger.info(f"Pre-schedule purge removed {pre_purged} stray task(s) for user {user_id}")
            except Exception as purge_err:
                logger.warning(f"Failed pre-schedule purge for user {user_id}: {purge_err}")
            
            # Calculate next review time
            next_review_utc = self.calculate_next_review_time(
                review_time, 
                user_timezone, 
                review_exists_today
            )
            
            # Import here to avoid circular dependency
            from app.tasks.review_tasks import generate_daily_review
            
            # Schedule the task with Celery
            task = generate_daily_review.apply_async(
                args=[str(user_id)],
                kwargs={'user_timezone': user_timezone},
                eta=next_review_utc
            )
            
            # Store task information
            task_info = {
                'task_id': task.id,
                'scheduled_time': next_review_utc.isoformat(),
                'review_time': review_time.isoformat(),
                'timezone': user_timezone
            }
            self.set_scheduled_task(user_id, task_info)
            
            logger.info(f"Scheduled review task {task.id} for user {user_id} at {next_review_utc}")

            # Post-schedule purge: ensure only the new task remains
            try:
                post_purged = self.purge_user_scheduled_review_tasks(user_id, keep_task_id=task.id)
                if post_purged:
                    logger.info(f"Post-schedule purge removed {post_purged} stray task(s) for user {user_id}")
            except Exception as purge_err:
                logger.warning(f"Failed post-schedule purge for user {user_id}: {purge_err}")
            return task.id
            
        except Exception as e:
            logger.error(f"Error scheduling review for user {user_id}: {str(e)}")
            return None
        finally:
            self.release_lock(lock_key)
    
    def reschedule_review(
        self,
        user_id: UUID,
        new_review_time: time,
        user_timezone: str
    ) -> Optional[str]:
        """
        Reschedule an existing review to a new time.
        
        This handles the logic for:
        1. If no review exists today and new time is in future today -> schedule today
        2. If no review exists today and new time has passed -> schedule tomorrow
        3. If review exists today -> schedule tomorrow
        
        Args:
            user_id: User's UUID
            new_review_time: New time for the review
            user_timezone: User's timezone
            
        Returns:
            New task ID if rescheduled successfully
        """
        from app.models.review import Review, ReviewType
        from app.db.session import SessionLocal
        from sqlalchemy import and_
        from app.core.timezone_utils import get_user_current_date
        
        # Check if review exists for today
        db = SessionLocal()
        try:
            today = get_user_current_date(user_timezone)
            review_exists = db.query(Review).filter(
                and_(
                    Review.user_id == user_id,
                    Review.date == today,
                    Review.type == ReviewType.DAILY
                )
            ).first() is not None
            
            # Schedule with appropriate logic
            return self.schedule_review(
                user_id,
                new_review_time,
                user_timezone,
                review_exists_today=review_exists
            )
            
        finally:
            db.close()
    
    def cancel_scheduled_review(self, user_id: UUID) -> bool:
        """
        Cancel a scheduled review task.
        
        Args:
            user_id: User's UUID
            
        Returns:
            True if cancelled successfully
        """
        try:
            # Get existing task info
            task_info = self.get_scheduled_task(user_id)
            
            if task_info and 'task_id' in task_info:
                # Revoke the Celery task
                celery_app.control.revoke(task_info['task_id'], terminate=True)
                logger.info(f"Revoked task {task_info['task_id']} for user {user_id}")
            
            # Clear stored task info
            self.clear_scheduled_task(user_id)
            
            # Best-effort purge of any stray scheduled review tasks for this user
            try:
                purged = self.purge_user_scheduled_review_tasks(user_id)
                if purged:
                    logger.info(f"Purged {purged} stray scheduled review task(s) for user {user_id}")
            except Exception as purge_err:
                logger.warning(f"Failed to purge stray tasks for user {user_id}: {purge_err}")
            return True
            
        except Exception as e:
            logger.error(f"Error cancelling review for user {user_id}: {str(e)}")
            return False
    
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
        from app.db.session import SessionLocal
        
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
            
            # Import here to avoid circular dependency
            from app.tasks.review_tasks import generate_daily_review
            
            # Schedule the task
            task = generate_daily_review.apply_async(
                args=[str(user_id)],
                kwargs={'user_timezone': user_timezone},
                eta=next_review_utc
            )
            
            # Store task information
            task_info = {
                'task_id': task.id,
                'scheduled_time': next_review_utc.isoformat(),
                'review_time': user.daily_review_time.isoformat(),
                'timezone': user_timezone
            }
            self.set_scheduled_task(user_id, task_info)

            # Best-effort purge of any other scheduled review tasks for this user
            try:
                purged = self.purge_user_scheduled_review_tasks(user_id, keep_task_id=task.id)
                if purged:
                    logger.info(f"After scheduling, purged {purged} stray task(s) for user {user_id}")
            except Exception as purge_err:
                logger.warning(f"Failed to purge stray tasks post-schedule for user {user_id}: {purge_err}")
            
            # Update user record
            user.daily_review_task_id = task.id
            db.commit()
            
            logger.info(f"Scheduled next review {task.id} for user {user_id} at {next_review_utc}")
            return task.id
            
        except Exception as e:
            logger.error(f"Error scheduling next review: {str(e)}")
            db.rollback()
            return None
        finally:
            db.close()

    def purge_user_scheduled_review_tasks(self, user_id: UUID, keep_task_id: Optional[str] = None) -> int:
        """
        Revoke any scheduled Celery review tasks for a given user that may be
        lingering in workers' scheduled queues.

        Args:
            user_id: User's UUID
            keep_task_id: Optional task id to keep (do not revoke)

        Returns:
            Count of tasks revoked.
        """
        revoked = 0
        try:
            insp = celery_app.control.inspect()
            scheduled = insp.scheduled() or {}
            target_user = str(user_id)
            for worker, entries in scheduled.items():
                if not entries:
                    continue
                for entry in entries:
                    req = entry.get('request', {})
                    task_id = req.get('id')
                    task_name = req.get('name') or req.get('type') or req.get('task')
                    args = req.get('args')
                    kwargs = req.get('kwargs') or {}

                    if task_name != 'app.tasks.review_tasks.generate_daily_review':
                        continue

                    # Match user by args or kwargs; args can be list or string
                    user_match = False
                    if isinstance(args, (list, tuple)):
                        user_match = len(args) > 0 and str(args[0]) == target_user
                    elif isinstance(args, str):
                        user_match = target_user in args
                    else:
                        user_id_kw = kwargs.get('user_id')
                        if user_id_kw and str(user_id_kw) == target_user:
                            user_match = True

                    if user_match and task_id and task_id != keep_task_id:
                        try:
                            celery_app.control.revoke(task_id, terminate=True)
                            revoked += 1
                            logger.info(f"Revoked stray scheduled review task {task_id} for user {user_id} on worker {worker}")
                        except Exception as e:
                            logger.warning(f"Failed to revoke task {task_id} on worker {worker}: {e}")
        except Exception as e:
            logger.warning(f"Inspector error during purge for user {user_id}: {e}")
        return revoked


# Singleton instance
task_manager = TaskManager()
