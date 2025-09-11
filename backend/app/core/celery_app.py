from celery import Celery
from app.core.config import settings

# Create Celery instance
celery_app = Celery(
    "journalai",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.skill_tasks", "app.tasks.transcription_tasks", "app.tasks.review_tasks"]
)

# Configure Celery
celery_app.conf.update(
    # Task imports
    imports=["app.tasks.skill_tasks", "app.tasks.transcription_tasks", "app.tasks.review_tasks"],
    
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task execution settings
    task_track_started=True,
    task_time_limit=600,  # 10 minutes hard limit for LLM calls
    task_soft_time_limit=540,  # 9 minutes soft limit
    
    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    
    # Redis settings for better task management
    broker_transport_options={
        'visibility_timeout': 3600,  # 1 hour
        'fanout_prefix': True,
        'fanout_patterns': True,
        'priority_steps': list(range(10)),  # Priority queue support
    },
    
    # Task result backend options
    result_backend_transport_options={
        'master_name': 'mymaster',
    },
)

# Force task discovery
celery_app.autodiscover_tasks(["app.tasks"])
