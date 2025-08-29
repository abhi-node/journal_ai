from celery import Celery
from app.core.config import settings

# Create Celery instance
celery_app = Celery(
    "journalai",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.skill_tasks", "app.tasks.transcription_tasks"]  # Ensure tasks are discovered
)

# Configure Celery
celery_app.conf.update(
    # Task imports
    imports=["app.tasks.skill_tasks", "app.tasks.transcription_tasks"],
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Task execution settings
    task_track_started=True,
    task_time_limit=300,  # 5 minutes hard limit
    task_soft_time_limit=240,  # 4 minutes soft limit
    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Optional: Configure task routing for different queues in the future
# Currently using default queue for all tasks
# celery_app.conf.task_routes = {
#     "app.tasks.skill_tasks.*": {"queue": "skills"},
#     # Future queues can be added here
#     # "app.tasks.review_tasks.*": {"queue": "reviews"},
# }

# Force task discovery
celery_app.autodiscover_tasks(["app.tasks"])