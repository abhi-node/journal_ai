"""
Enhanced task management service for proper task deletion from Celery queues.
Handles task cancellation by actually removing tasks from Redis queues.
"""

import logging
import json
import redis
from typing import Optional, Set
from uuid import UUID
from celery.result import AsyncResult
from celery import Celery

from app.core.config import settings
from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


class TaskManager:
    """Manages Celery tasks with proper deletion capabilities."""
    
    def __init__(self):
        """Initialize Redis connection for direct queue manipulation."""
        self.redis_client = redis.from_url(settings.REDIS_URL)
        self.active_tasks_key = "journalai:active_review_tasks"
        
    def register_task(self, user_id: UUID, task_id: str) -> None:
        """
        Register a task as active for a user.
        Stores in Redis for validation during execution.
        """
        try:
            # Store user_id -> task_id mapping
            user_key = f"journalai:user_task:{str(user_id)}"
            self.redis_client.set(user_key, task_id, ex=86400)  # Expire after 24 hours
            
            # Also store task_id -> user_id for reverse lookup
            task_key = f"journalai:task_user:{task_id}"
            self.redis_client.set(task_key, str(user_id), ex=86400)
            
            logger.info(f"Registered task {task_id} for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to register task {task_id}: {str(e)}")
    
    def is_task_valid(self, user_id: UUID, task_id: str) -> bool:
        """
        Check if a task is still valid (not cancelled).
        Called at the beginning of task execution.
        """
        try:
            user_key = f"journalai:user_task:{str(user_id)}"
            current_task = self.redis_client.get(user_key)
            
            if current_task:
                current_task = current_task.decode('utf-8') if isinstance(current_task, bytes) else current_task
                is_valid = current_task == task_id
                
                if not is_valid:
                    logger.info(f"Task {task_id} is no longer valid for user {user_id} (current: {current_task})")
                
                return is_valid
            
            # No task registered, consider invalid
            logger.info(f"No active task found for user {user_id}")
            return False
            
        except Exception as e:
            logger.error(f"Error checking task validity: {str(e)}")
            # On error, allow execution (fail open)
            return True
    
    def cancel_and_delete_task(self, user_id: UUID, task_id: str) -> bool:
        """
        Cancel a task and remove it from all queues.
        This is more thorough than just revoking.
        """
        try:
            success = True
            
            # Step 1: Revoke the task (marks it as cancelled)
            try:
                AsyncResult(task_id, app=celery_app).revoke(terminate=True)
                logger.info(f"Revoked task {task_id}")
            except Exception as e:
                logger.warning(f"Failed to revoke task {task_id}: {str(e)}")
                success = False
            
            # Step 2: Remove from Redis active task tracking
            user_key = f"journalai:user_task:{str(user_id)}"
            task_key = f"journalai:task_user:{task_id}"
            
            self.redis_client.delete(user_key)
            self.redis_client.delete(task_key)
            logger.info(f"Removed task {task_id} from active tracking")
            
            # Step 3: Remove from Celery queues directly
            removed_count = self._remove_from_queues(task_id)
            if removed_count > 0:
                logger.info(f"Removed {removed_count} instances of task {task_id} from queues")
            
            return success
            
        except Exception as e:
            logger.error(f"Error cancelling task {task_id}: {str(e)}")
            return False
    
    def _remove_from_queues(self, task_id: str) -> int:
        """
        Remove a task from all Celery queues in Redis.
        Returns the number of tasks removed.
        """
        removed_count = 0
        
        try:
            # Get all Celery queues
            queues = self.redis_client.keys('celery*')
            
            for queue in queues:
                queue_str = queue.decode('utf-8') if isinstance(queue, bytes) else queue
                
                # Skip non-queue keys
                if not any(x in queue_str for x in ['celery', '_kombu']):
                    continue
                
                # Get all tasks in the queue
                queue_length = self.redis_client.llen(queue)
                if queue_length == 0:
                    continue
                
                # Process each task in the queue
                tasks = self.redis_client.lrange(queue, 0, -1)
                for task_data in tasks:
                    try:
                        task_str = task_data.decode('utf-8') if isinstance(task_data, bytes) else task_data
                        
                        # Parse the task JSON to check ID
                        try:
                            task_json = json.loads(task_str)
                            # Check various possible ID locations
                            if (task_json.get('headers', {}).get('id') == task_id or
                                task_json.get('id') == task_id):
                                # Remove this task from the queue
                                self.redis_client.lrem(queue, 0, task_data)
                                removed_count += 1
                                logger.debug(f"Removed task {task_id} from queue {queue_str}")
                        except json.JSONDecodeError:
                            # Not JSON, check if task_id is in the string
                            if task_id in task_str:
                                self.redis_client.lrem(queue, 0, task_data)
                                removed_count += 1
                                
                    except Exception as e:
                        logger.debug(f"Error processing task in queue: {str(e)}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error removing task from queues: {str(e)}")
        
        return removed_count
    
    def get_active_task_for_user(self, user_id: UUID) -> Optional[str]:
        """
        Get the currently active task ID for a user.
        """
        try:
            user_key = f"journalai:user_task:{str(user_id)}"
            task_id = self.redis_client.get(user_key)
            
            if task_id:
                return task_id.decode('utf-8') if isinstance(task_id, bytes) else task_id
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting active task for user {user_id}: {str(e)}")
            return None
    
    def clear_all_tasks_for_user(self, user_id: UUID) -> int:
        """
        Clear all tasks for a specific user.
        Returns the number of tasks cleared.
        """
        cleared_count = 0
        
        try:
            # Get current task if any
            current_task = self.get_active_task_for_user(user_id)
            
            if current_task:
                if self.cancel_and_delete_task(user_id, current_task):
                    cleared_count += 1
            
            # Also search for any tasks containing the user ID in queues
            queues = self.redis_client.keys('celery*')
            
            for queue in queues:
                tasks = self.redis_client.lrange(queue, 0, -1)
                for task_data in tasks:
                    try:
                        task_str = task_data.decode('utf-8') if isinstance(task_data, bytes) else task_data
                        if str(user_id) in task_str:
                            self.redis_client.lrem(queue, 0, task_data)
                            cleared_count += 1
                    except:
                        continue
                        
        except Exception as e:
            logger.error(f"Error clearing tasks for user {user_id}: {str(e)}")
        
        return cleared_count


# Singleton instance
task_manager = TaskManager()