from typing import Dict, List, Optional
import json
import logging
from openai import OpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize OpenAI client
try:
    openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {str(e)}")
    openai_client = None




def generate_initial_skills(goals: Dict[str, str]) -> Dict[str, Dict]:
    """
    Generate initial skills based on user's goals during onboarding.
    Returns a dictionary of skills with xp=0 and level=1.
    """
    if not openai_client:
        logger.error("OpenAI client not initialized")
        # Return default skills if AI is not available
        return {
            "Personal Development": {"xp": 0, "level": 1, "color": "#36D592", "icon": "🌟"},
            "Health & Fitness": {"xp": 0, "level": 1, "color": "#FFD700", "icon": "💪"},
            "Career Growth": {"xp": 0, "level": 1, "color": "#FF7849", "icon": "💼"},
            "Relationships": {"xp": 0, "level": 1, "color": "#B483F0", "icon": "❤️"},
            "Learning": {"xp": 0, "level": 1, "color": "#4ECDC4", "icon": "📚"}
        }
    
    try:
        prompt = f"""
        Based on the following user goals, generate 5-10 relevant skill categories that the user should develop.
        
        Current Goals (3-6 months): {goals.get('current_goals', '')}
        Yearly Goals: {goals.get('yearly_goals', '')}
        10-Year Vision: {goals.get('ten_year_vision', '')}
        
        Return a JSON array of skill objects with name, emoji, and color that are:
        1. Specific and actionable (e.g., "Basketball" not just "Sports")
        2. Relevant to the user's stated goals
        3. Diverse across different life areas
        4. Named as nouns or short noun phrases (max 2-3 words)
        
        Each skill should have:
        - name: The skill name (e.g., "Basketball", "Python Programming")
        - emoji: A single emoji that represents the skill (e.g., "🏀", "💻")
        - color: A hex color code that fits the skill theme (e.g., "#FF6B6B", "#4ECDC4")
        
        Use diverse, vibrant colors from this palette when possible:
        #36D592 (Mint Green), #FFD700 (Gold), #FF7849 (Coral), #B483F0 (Lavender),
        #4ECDC4 (Turquoise), #FF6B6B (Rose), #87CEEB (Sky Blue), #FFB6C1 (Light Pink),
        #98D8C8 (Seafoam), #FFA07A (Light Salmon), #DDA0DD (Plum), #20B2AA (Light Sea Green)
        
        Return ONLY a JSON array, no explanations or additional text.
        Example format: [{{"name": "Basketball", "emoji": "🏀", "color": "#FF7849"}}, ...]
        """
        
        response = openai_client.chat.completions.create(
            model="gpt-5-mini",
            messages=[
                {"role": "system", "content": "You are a life coach AI that helps users identify skills to develop based on their goals. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=1
        )
        
        # Parse the response
        skills_str = response.choices[0].message.content.strip()
        
        # Try to extract JSON from the response
        if skills_str.startswith('['):
            skills_data = json.loads(skills_str)
        else:
            # If response doesn't start with [, try to find JSON in the response
            import re
            json_match = re.search(r'\[.*\]', skills_str, re.DOTALL)
            if json_match:
                skills_data = json.loads(json_match.group())
            else:
                raise ValueError("Could not extract skills from AI response")
        
        # Create skill dictionary with AI-generated colors and emojis
        skills = {}
        for skill_obj in skills_data[:10]:  # Limit to 10 skills
            if isinstance(skill_obj, dict):
                skill_name = skill_obj.get('name', 'Unknown Skill')
                emoji = skill_obj.get('emoji', '🎯')
                color = skill_obj.get('color', '#36D592')
                
                skills[skill_name] = {
                    "xp": 0,
                    "level": 1,
                    "color": color,
                    "icon": emoji
                }
            # If AI doesn't return proper format, skip the skill
        
        logger.info(f"Generated {len(skills)} initial skills for user")
        return skills
        
    except Exception as e:
        logger.error(f"Error generating skills: {str(e)}")
        # Return default skills on error
        return {
            "Personal Development": {"xp": 0, "level": 1, "color": "#36D592", "icon": "🌟"},
            "Health & Fitness": {"xp": 0, "level": 1, "color": "#FFD700", "icon": "💪"},
            "Career Growth": {"xp": 0, "level": 1, "color": "#FF7849", "icon": "💼"},
            "Relationships": {"xp": 0, "level": 1, "color": "#B483F0", "icon": "❤️"},
            "Learning": {"xp": 0, "level": 1, "color": "#4ECDC4", "icon": "📚"}
        }


def generate_additional_skills(
    current_skills: Dict[str, Dict],
    new_goals: Dict[str, str],
    old_goals: Optional[Dict[str, str]] = None
) -> Dict[str, Dict]:
    """
    Generate additional skills based on updated goals.
    Only adds new skills, preserving existing ones with their XP and levels.
    """
    if not openai_client:
        logger.error("OpenAI client not initialized")
        return {}
    
    try:
        # Prepare context about existing skills
        existing_skills_list = list(current_skills.keys())
        
        goals_context = ""
        if old_goals:
            goals_context = f"""
            Previous Goals:
            - Current (3-6 months): {old_goals.get('current_goals', '')}
            - Yearly: {old_goals.get('yearly_goals', '')}
            - 10-Year Vision: {old_goals.get('ten_year_vision', '')}
            
            Updated Goals:
            """
        else:
            goals_context = "New Goals:\n"
        
        goals_context += f"""
        - Current (3-6 months): {new_goals.get('current_goals', '')}
        - Yearly: {new_goals.get('yearly_goals', '')}
        - 10-Year Vision: {new_goals.get('ten_year_vision', '')}
        """
        
        prompt = f"""
        The user has updated their goals and we need to determine if any NEW skills should be added.
        
        Current Skills the user already has:
        {', '.join(existing_skills_list)}
        
        {goals_context}
        
        Based on the updated goals, identify any NEW skill categories that should be added.
        Only suggest new skills if they are:
        1. Not already covered by existing skills
        2. Directly relevant to the new or changed goals
        3. Significant enough to track separately
        
        For example:
        - If the user adds "learn Spanish" to their goals and doesn't have a language skill, add "Spanish"
        - If the user mentions "basketball" specifically and only has generic "Sports", add "Basketball"
        - If the goals mention something already covered by existing skills, don't add duplicates
        
        Return a JSON array of NEW skill objects to add (empty array if no new skills needed).
        Each skill should have:
        - name: The skill name
        - emoji: A single emoji that represents the skill
        - color: A hex color code that fits the skill theme
        
        Use diverse, vibrant colors from this palette when possible:
        #36D592 (Mint Green), #FFD700 (Gold), #FF7849 (Coral), #B483F0 (Lavender),
        #4ECDC4 (Turquoise), #FF6B6B (Rose), #87CEEB (Sky Blue), #FFB6C1 (Light Pink),
        #98D8C8 (Seafoam), #FFA07A (Light Salmon), #DDA0DD (Plum), #20B2AA (Light Sea Green)
        
        Return ONLY the JSON array, no explanations.
        Maximum 5 new skills.
        Example format: [{{"name": "Spanish", "emoji": "🇪🇸", "color": "#FFD700"}}, ...]
        """
        
        response = openai_client.chat.completions.create(
            model="gpt-5-mini",
            messages=[
                {"role": "system", "content": "You are a life coach AI that helps identify new skills based on goal changes. Do not add skills if previous skills cover the current goals. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=1
        )
        
        # Parse the response
        new_skills_str = response.choices[0].message.content.strip()
        print(new_skills_str)
        
        # Try to extract JSON from the response
        if new_skills_str.startswith('['):
            new_skills_data = json.loads(new_skills_str)
        else:
            # If response doesn't start with [, try to find JSON in the response
            import re
            json_match = re.search(r'\[.*\]', new_skills_str, re.DOTALL)
            if json_match:
                new_skills_data = json.loads(json_match.group())
            else:
                logger.warning("No new skills to add")
                return {}
        
        # Create new skills dictionary with AI-generated colors and emojis
        new_skills = {}
        
        for skill_obj in new_skills_data[:5]:  # Limit to 5 new skills
            if isinstance(skill_obj, dict):
                skill_name = skill_obj.get('name', 'Unknown Skill')
                emoji = skill_obj.get('emoji', '🎯')
                color = skill_obj.get('color', '#36D592')
                
                if skill_name not in current_skills:  # Double-check not duplicate
                    new_skills[skill_name] = {
                        "xp": 0,
                        "level": 1,
                        "color": color,
                        "icon": emoji
                    }
            # If AI doesn't return proper format, skip the skill
        
        if new_skills:
            logger.info(f"Generated {len(new_skills)} additional skills for user")
        else:
            logger.info("No new skills needed for updated goals")
        
        return new_skills
        
    except Exception as e:
        logger.error(f"Error generating additional skills: {str(e)}")
        return {}