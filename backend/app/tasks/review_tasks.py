import json
import logging
from typing import Dict, Optional, List
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
    target_date: str = None
) -> Dict[str, any]:
    """
    Generate a daily review for a user using AI.
    
    Args:
        user_id: The user's ID as string
        target_date: The date to generate review for (YYYY-MM-DD format), defaults to today
        
    Returns:
        Dictionary with status and review data
    """
    try:
        user_uuid = UUID(user_id)
        
        if target_date:
            review_date = date.fromisoformat(target_date)
        else:
            review_date = date.today()
        
        user = self.db.query(User).filter(User.id == user_uuid).first()
        if not user:
            logger.error(f"User {user_id} not found")
            return {"status": "error", "message": f"User {user_id} not found"}
        
        logger.info(f"Generating daily review for user {user_id} on {review_date}")
        
        if not openai_client:
            logger.error("OpenAI client not initialized")
            return {
                "status": "error",
                "message": "OpenAI service is not available"
            }
        
        existing_review = self.db.query(Review).filter(
            and_(
                Review.user_id == user_uuid,
                Review.date == review_date,
                Review.type == ReviewType.DAILY
            )
        ).first()
        
        if existing_review:
            logger.info(f"Daily review already exists for user {user_id} on {review_date}")
            return {
                "status": "exists",
                "message": "Daily review already exists for this date",
                "review_id": str(existing_review.id)
            }
        
        notes = self.db.query(Note).filter(
            and_(
                Note.user_id == user_uuid,
                Note.date == review_date
            )
        ).order_by(Note.created_at).all()
        
        if not notes:
            logger.warning(f"No notes found for user {user_id} on {review_date}")
            return {
                "status": "error",
                "message": "No notes found for this date"
            }
        
        combined_notes = "\n\n".join([note.content for note in notes if note.content])
        
        user_goals = user.goals or {}
        user_stats = user.stats or {}
        skill_categories = user_stats.get("skill_categories", {})
        
        leveling_chart = XPLevelingSystem.get_leveling_chart(1, 20)
        
        system_prompt = """You are an AI life coach analyzing a user's daily journal entries to generate a comprehensive daily review.

You must generate a review in the following JSON format:
{
  "score": <0-100 integer based on goal alignment and productivity>,
  "day_overview": "<Detailed narrative summary of the day's activities and experiences>",
  "emotional_color": "<one of: energized, happy, content, calm, focused, anxious, stressed, sad, frustrated, tired>",
  "achievements": ["<specific achievement 1>", "<achievement 2>", ...],
  "areas_for_improvement": ["<area 1>", "<area 2>", ...],
  "goal_progress": {
    "<goal_area>": "<specific progress description>",
    ...
  },
  "tomorrow_recommendations": ["<actionable recommendation 1>", "<recommendation 2>", ...],
  "xp_earned": {
    "<skill_name>": <xp_amount>,
    ...
  }
}

For XP allocation:
- Consider time spent, difficulty, and impact of activities
- Easy tasks: 10-30 XP
- Medium tasks: 25-50 XP  
- Hard tasks: 50-100 XP
- Exceptional achievements: 100-200 XP
- Daily maximum per skill: 200 XP
- Be balanced and fair in XP distribution

Emotional color should reflect the overall tone and energy of the day based on the journal entries."""

        user_prompt = f"""Generate a daily review based on the following information:

JOURNAL ENTRIES FOR {review_date}:
{combined_notes}

USER'S GOALS:
Current Goals: {user_goals.get('current_goals', 'Not specified')}
Yearly Goals: {user_goals.get('yearly_goals', 'Not specified')}
10-Year Vision: {user_goals.get('ten_year_vision', 'Not specified')}

USER'S SKILLS AND CURRENT LEVELS:
{json.dumps(skill_categories, indent=2)}

LEVELING SYSTEM (for reference):
{json.dumps(leveling_chart[:10], indent=2)}

Generate a comprehensive daily review that:
1. Provides an insightful overview of the day
2. Identifies specific achievements and areas for improvement
3. Assesses progress toward stated goals
4. Provides actionable recommendations for tomorrow
5. Awards appropriate XP for each skill based on activities mentioned
6. Assigns an emotional color that best represents the day's tone

Ensure the response is valid JSON matching the specified format."""

        try:
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
            
            if "score" not in review_content:
                review_content["score"] = 70
            review_content["score"] = max(0, min(100, review_content["score"]))
            
            new_review = Review(
                user_id=user_uuid,
                type=ReviewType.DAILY,
                date=review_date,
                score=review_content["score"],
                content=review_content,
                created_at=datetime.now(timezone.utc)
            )
            self.db.add(new_review)
            
            xp_earned = review_content.get("xp_earned", {})
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
                        
                        if xp_update["level_up"]:
                            logger.info(f"User {user_id} leveled up {skill_name} to level {xp_update['level']}")
                
                updated_stats["skill_categories"] = updated_skills
                updated_stats["total_xp"] = updated_stats.get("total_xp", 0) + total_xp_gained
                
                user_total_xp = updated_stats["total_xp"]
                user_level_info = XPLevelingSystem.calculate_level_from_xp(user_total_xp)
                updated_stats["level"] = user_level_info[0]
                
                user.stats = updated_stats
            
            self.db.commit()
            self.db.refresh(new_review)
            
            logger.info(f"Successfully generated daily review for user {user_id}")
            logger.info(f"Review score: {review_content['score']}")
            logger.info(f"XP awarded: {json.dumps(xp_earned)}")
            
            return {
                "status": "success",
                "user_id": user_id,
                "review_id": str(new_review.id),
                "date": review_date.isoformat(),
                "score": review_content["score"],
                "xp_earned": xp_earned,
                "content": review_content
            }
            
        except Exception as api_error:
            logger.error(f"OpenAI API error: {str(api_error)}")
            raise self.retry(exc=api_error, countdown=60 * (2 ** self.request.retries))
            
    except Exception as exc:
        logger.error(f"Error generating daily review for user {user_id}: {str(exc)}")
        self.db.rollback()
        
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))