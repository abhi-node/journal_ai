"""
Simplified review task generation with idempotency and proper scheduling.
"""

import json
import logging
from typing import Dict, Optional
from uuid import UUID
from datetime import date, datetime, timezone
from celery import Task
from sqlalchemy.orm import Session
from sqlalchemy import and_
from openai import OpenAI

from app.core.celery_app import celery_app
from app.core.xp_system import XPLevelingSystem
from app.db.session import SessionLocal
from app.models.user import User
from app.models.note import Note
from app.models.review import Review, ReviewType
from app.core.config import settings
from app.services.task_manager import task_manager

logger = logging.getLogger(__name__)

try:
    openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {str(e)}")
    openai_client = None


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
    name="app.tasks.review_tasks.generate_daily_review",
    max_retries=3,
    default_retry_delay=60,
)
def generate_daily_review(
    self,
    user_id: str,
    target_date: str = None,
    user_timezone: str = None
) -> Dict[str, any]:
    """
    Generate a daily review for a user using AI with idempotency guarantees.
    
    This task ensures:
    1. Only one review per user per day (idempotency)
    2. Automatic scheduling of next review after completion
    3. Proper handling of edge cases (no notes, existing reviews)
    
    Args:
        user_id: The user's ID as string
        target_date: The date to generate review for (YYYY-MM-DD format), defaults to today
        user_timezone: The user's timezone string (e.g., "America/New_York")
        
    Returns:
        Dictionary with status and review data
    """
    try:
        from app.core.timezone_utils import get_user_current_date, get_default_timezone
        
        user_uuid = UUID(user_id)
        
        # Determine the review date
        if target_date:
            review_date = date.fromisoformat(target_date)
        else:
            # Use user's timezone to determine the current date
            tz = user_timezone or get_default_timezone()
            review_date = get_user_current_date(tz)
        
        # CRITICAL: Check idempotency - has this review already been generated?
        if task_manager.check_idempotency(user_uuid, review_date):
            logger.info(f"Review already processed for user {user_id} on {review_date} (idempotency check)")
            
            # Still schedule next review to maintain the chain
            task_manager.schedule_next_daily_review(user_uuid, user_timezone)
            
            return {
                "status": "exists",
                "message": "Daily review already exists for this date (idempotency)",
                "date": review_date.isoformat()
            }
        
        # Get the user
        user = self.db.query(User).filter(User.id == user_uuid).first()
        if not user:
            logger.error(f"User {user_id} not found")
            return {"status": "error", "message": f"User {user_id} not found"}
        
        logger.info(f"Generating daily review for user {user_id} on {review_date}")
        
        # Check OpenAI client
        if not openai_client:
            logger.error("OpenAI client not initialized")
            return {
                "status": "error",
                "message": "OpenAI service is not available"
            }
        
        # Double-check if review already exists in database
        existing_review = self.db.query(Review).filter(
            and_(
                Review.user_id == user_uuid,
                Review.date == review_date,
                Review.type == ReviewType.DAILY
            )
        ).first()
        
        if existing_review:
            logger.info(f"Daily review already exists in database for user {user_id} on {review_date}")
            
            # Set idempotency key to prevent future duplicates
            task_manager.set_idempotency_key(user_uuid, review_date)
            
            # Schedule next review
            task_manager.schedule_next_daily_review(user_uuid, user_timezone)
            
            return {
                "status": "exists",
                "message": "Daily review already exists in database",
                "review_id": str(existing_review.id),
                "date": review_date.isoformat()
            }
        
        # Check if notes exist for the day
        notes = self.db.query(Note).filter(
            and_(
                Note.user_id == user_uuid,
                Note.date == review_date
            )
        ).order_by(Note.created_at).all()
        
        if not notes:
            logger.warning(f"No notes found for user {user_id} on {review_date}")
            
            # Schedule for tomorrow since no content to review
            task_manager.schedule_next_daily_review(user_uuid, user_timezone)
            
            return {
                "status": "no_notes",
                "message": "No notes found for this date, scheduled for tomorrow",
                "date": review_date.isoformat()
            }
        
        # Extract and combine notes content
        combined_notes_parts = []
        for note in notes:
            if note.content:
                # Handle new JSON structure with entries
                if isinstance(note.content, dict) and 'entries' in note.content:
                    for entry in note.content['entries']:
                        if 'content' in entry:
                            combined_notes_parts.append(entry['content'])
                # Handle old string format (fallback)
                elif isinstance(note.content, str):
                    combined_notes_parts.append(note.content)
        
        combined_notes = "\n\n".join(combined_notes_parts)
        
        # Get user goals and stats
        user_goals = user.goals or {}
        user_stats = user.stats or {}
        skill_categories = user_stats.get("skill_categories", {})
        
        # Generate the review using AI
        system_prompt = """You are an AI life coach analyzing a user's daily journal entries and goals to generate a visually engaging daily review.

You must generate a review in the following JSON format:
{
  "score": <0-100 integer based on goal alignment and productivity>,
  "emotional_color": "<one of: energized, happy, content, calm, focused, anxious, stressed, sad, frustrated, tired>",
  "day_summary": {
    "headline": "<Brief 5-10 word summary capturing the essence of the day>",
    "key_moments": [
      "<Time period>: <Brief description of what happened>",
      "<Time period>: <Brief description of what happened>",
      "<Time period>: <Brief description of what happened>"
    ]
  },
  "achievements": [
    "<Specific, concise achievement 1>",
    "<Specific, concise achievement 2>",
    "<Specific, concise achievement 3>"
  ],
  "skills_practiced": {
    "<skill_name>": {
      "xp_gained": <xp_amount>,
      "activities": "<Brief description of what was done to practice this skill>",
      "level_progress": {
        "current": <current_level>,
        "progress_percent": <0-100 percent to next level>
      }
    }
  },
  "growth_areas": [
    "<Area for improvement 1> - <Brief explanation>",
    "<Area for improvement 2> - <Brief explanation>",
    "<Area for improvement 3> - <Brief explanation>"
  ],
  "tomorrow_focus": {
    "primary": "<Main focus for tomorrow in 5-10 words>",
    "quick_wins": [
      "<Quick actionable task 1>",
      "<Quick actionable task 2>",
      "<Quick actionable task 3>"
    ]
  },
  "daily_stats": {
    "total_xp": <sum of all xp_gained>,
    "skills_improved": <count of skills practiced>
  }
}

CRITICAL RULES:
1. ONLY include skills in "skills_practiced" that were ACTUALLY practiced today based on journal entries
2. Do NOT mention skills that weren't worked on - no "0 XP" entries
3. Keep all text concise - maximum 10-15 words per item
4. Achievements should be specific and tangible, not vague
5. Key moments should follow chronological order (Morning/Afternoon/Evening or specific times)
6. Growth areas should be constructive and based off of user's goals
7. Tomorrow's focus should be revolved around TODOs left for the day and user's goals
8. Ensure you always generate 3 achievements, 3 growth areas, and 3 quick wins ALWAYS

For XP allocation:
- Easy/routine tasks: 10-30 XP
- Medium effort tasks: 30-60 XP  
- Hard/challenging tasks: 60-100 XP
- Exceptional achievements: 100-150 XP
- Daily maximum per skill: 200 XP
- Only award XP for skills that were clearly practiced

Calculate level_progress using this formula:
- Levels 1-5: 100 XP per level
- Levels 6-10: 200 XP per level  
- Levels 11-15: 400 XP per level
- Levels 16-20: 800 XP per level"""

        user_prompt = f"""Generate a daily review based on the following information:

JOURNAL ENTRIES FOR {review_date}:
{combined_notes}

USER'S GOALS:
Current Goals: {user_goals.get('current_goals', 'Not specified')}
Yearly Goals: {user_goals.get('yearly_goals', 'Not specified')}
10-Year Vision: {user_goals.get('ten_year_vision', 'Not specified')}

USER'S CURRENT SKILL LEVELS:
{json.dumps(skill_categories, indent=2)}

Generate a visually-focused daily review that:
1. Creates a headline and 3 key moments (morning/afternoon/evening or specific times)
2. Lists 3 specific achievements (be concrete, not vague)
3. ONLY includes skills that were actually practiced (no zero XP entries)
4. Provides 3 constructive growth areas with brief explanations
5. Sets a clear primary focus for tomorrow with 3 quick wins
6. Calculates accurate daily statistics

Remember: Keep all text extremely concise (10-15 words max per item).
Only award XP to skills that were clearly practiced based on the journal entries."""

        try:
            # Generate review with AI
            response = openai_client.chat.completions.create(
                model="gpt-5",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=1,
                response_format={"type": "json_object"}
            )
            
            review_content = json.loads(response.choices[0].message.content)
            
            # Ensure score is within bounds
            if "score" not in review_content:
                review_content["score"] = 70
            review_content["score"] = max(0, min(100, review_content["score"]))
            
            # Create the review record
            new_review = Review(
                user_id=user_uuid,
                type=ReviewType.DAILY,
                date=review_date,
                score=review_content["score"],
                content=review_content,
                created_at=datetime.now(timezone.utc)
            )
            self.db.add(new_review)
            
            # Update user stats with XP earned
            skills_practiced = review_content.get("skills_practiced", {})
            xp_earned = {}
            
            if skills_practiced:
                for skill_name, skill_data in skills_practiced.items():
                    xp_earned[skill_name] = skill_data.get("xp_gained", 0)
            
            if xp_earned:
                updated_stats = user_stats.copy()
                updated_skills = skill_categories.copy()
                
                total_xp_gained = 0
                for skill_name, xp_amount in xp_earned.items():
                    if skill_name in updated_skills:
                        current_skill = updated_skills[skill_name]
                        current_xp = current_skill.get("xp", 0)
                        
                        xp_update = XPLevelingSystem.add_xp_to_skill(current_xp, xp_amount)
                        
                        updated_skills[skill_name]["xp"] = xp_update["total_xp"]
                        updated_skills[skill_name]["level"] = xp_update["level"]
                        
                        total_xp_gained += xp_amount
                        
                        # Update level progress in review content
                        if skills_practiced and skill_name in skills_practiced:
                            skills_practiced[skill_name]["level_progress"]["current"] = xp_update["level"]
                            level_xp = xp_update["xp_in_current_level"]
                            xp_for_level = xp_update["xp_for_next_level"]
                            progress_percent = int((level_xp / xp_for_level) * 100) if xp_for_level > 0 else 0
                            skills_practiced[skill_name]["level_progress"]["progress_percent"] = progress_percent
                        
                        if xp_update["level_up"]:
                            logger.info(f"User {user_id} leveled up {skill_name} to level {xp_update['level']}")
                
                updated_stats["skill_categories"] = updated_skills
                updated_stats["total_xp"] = updated_stats.get("total_xp", 0) + total_xp_gained
                
                # Update overall user level
                user_total_xp = updated_stats["total_xp"]
                user_level_info = XPLevelingSystem.calculate_level_from_xp(user_total_xp)
                updated_stats["level"] = user_level_info[0]
                
                user.stats = updated_stats
            
            # Commit the review and stats update
            self.db.commit()
            self.db.refresh(new_review)
            
            # Set idempotency key to prevent future duplicates
            task_manager.set_idempotency_key(user_uuid, review_date)
            
            logger.info(f"Successfully generated daily review for user {user_id}")
            logger.info(f"Review score: {review_content['score']}")
            logger.info(f"XP awarded: {json.dumps(xp_earned)}")
            
            # Schedule next review for tomorrow
            task_id = task_manager.schedule_next_daily_review(user_uuid, user_timezone)
            
            if task_id:
                logger.info(f"Scheduled next review for user {user_id} (task: {task_id})")
            else:
                logger.warning(f"Failed to schedule next review for user {user_id}")
            
            # Include daily stats
            daily_stats = review_content.get("daily_stats", {
                "total_xp": total_xp_gained if 'total_xp_gained' in locals() else 0,
                "skills_improved": len(xp_earned) if xp_earned else 0
            })
            
            return {
                "status": "success",
                "user_id": user_id,
                "review_id": str(new_review.id),
                "date": review_date.isoformat(),
                "score": review_content["score"],
                "xp_earned": xp_earned,
                "daily_stats": daily_stats,
                "content": review_content,
                "next_task_id": task_id
            }
            
        except Exception as api_error:
            logger.error(f"OpenAI API error: {str(api_error)}")
            raise self.retry(exc=api_error, countdown=60 * (2 ** self.request.retries))
            
    except Exception as exc:
        logger.error(f"Error generating daily review for user {user_id}: {str(exc)}")
        self.db.rollback()
        
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))