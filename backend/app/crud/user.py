from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password
from app.core.xp_system import XPLevelingSystem


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserCreate) -> User:
    db_user = User(
        email=user.email,
        password_hash=get_password_hash(user.password),
        name=user.name,
        goals=user.goals.dict() if user.goals else {},
        stats=user.stats.dict() if user.stats else {
            "level": 1,
            "total_xp": 0,
            "skill_categories": {
                "health": {"xp": 0, "level": 1},
                "career": {"xp": 0, "level": 1},
                "relationships": {"xp": 0, "level": 1}
            },
            "streak_days": 0,
            "total_entries": 0
        }
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def get_user_by_id(db: Session, user_id: UUID) -> Optional[User]:
    """Get a user by their ID."""
    return db.query(User).filter(User.id == user_id).first()


def update_user_skill_xp(db: Session, user_id: UUID, skill_name: str, xp_to_add: int) -> Optional[Dict[str, Any]]:
    """
    Update a user's skill XP and level.
    
    Args:
        db: Database session
        user_id: User's ID
        skill_name: Name of the skill to update
        xp_to_add: Amount of XP to add
        
    Returns:
        Updated skill data or None if user/skill not found
    """
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    stats = user.stats or {}
    skill_categories = stats.get("skill_categories", {})
    
    if skill_name not in skill_categories:
        return None
    
    current_skill = skill_categories[skill_name]
    current_xp = current_skill.get("xp", 0)
    
    xp_update = XPLevelingSystem.add_xp_to_skill(current_xp, xp_to_add)
    
    skill_categories[skill_name]["xp"] = xp_update["total_xp"]
    skill_categories[skill_name]["level"] = xp_update["level"]
    
    stats["skill_categories"] = skill_categories
    stats["total_xp"] = stats.get("total_xp", 0) + xp_to_add
    
    user_total_xp = stats["total_xp"]
    user_level_info = XPLevelingSystem.calculate_level_from_xp(user_total_xp)
    stats["level"] = user_level_info[0]
    
    user.stats = stats
    db.commit()
    db.refresh(user)
    
    return {
        "skill_name": skill_name,
        "new_level": xp_update["level"],
        "total_xp": xp_update["total_xp"],
        "level_up": xp_update["level_up"],
        "user_level": stats["level"]
    }


def bulk_update_user_skills_xp(db: Session, user_id: UUID, xp_updates: Dict[str, int]) -> Dict[str, Any]:
    """
    Update multiple skills' XP for a user at once.
    
    Args:
        db: Database session
        user_id: User's ID
        xp_updates: Dictionary mapping skill names to XP amounts to add
        
    Returns:
        Summary of all updates
    """
    user = get_user_by_id(db, user_id)
    if not user:
        return {"error": "User not found"}
    
    stats = user.stats or {}
    skill_categories = stats.get("skill_categories", {})
    
    results = {}
    total_xp_gained = 0
    level_ups = []
    
    for skill_name, xp_to_add in xp_updates.items():
        if skill_name not in skill_categories:
            results[skill_name] = {"error": "Skill not found"}
            continue
        
        current_skill = skill_categories[skill_name]
        current_xp = current_skill.get("xp", 0)
        
        xp_update = XPLevelingSystem.add_xp_to_skill(current_xp, xp_to_add)
        
        skill_categories[skill_name]["xp"] = xp_update["total_xp"]
        skill_categories[skill_name]["level"] = xp_update["level"]
        
        total_xp_gained += xp_to_add
        
        if xp_update["level_up"]:
            level_ups.append({
                "skill": skill_name,
                "new_level": xp_update["level"],
                "levels_gained": xp_update["levels_gained"]
            })
        
        results[skill_name] = {
            "xp_added": xp_to_add,
            "new_level": xp_update["level"],
            "total_xp": xp_update["total_xp"],
            "level_up": xp_update["level_up"]
        }
    
    stats["skill_categories"] = skill_categories
    stats["total_xp"] = stats.get("total_xp", 0) + total_xp_gained
    
    old_user_level = stats.get("level", 1)
    user_total_xp = stats["total_xp"]
    user_level_info = XPLevelingSystem.calculate_level_from_xp(user_total_xp)
    stats["level"] = user_level_info[0]
    
    user.stats = stats
    db.commit()
    db.refresh(user)
    
    return {
        "skill_updates": results,
        "total_xp_gained": total_xp_gained,
        "level_ups": level_ups,
        "user_level": {
            "old": old_user_level,
            "new": stats["level"],
            "level_up": stats["level"] > old_user_level
        }
    }


def get_user_stats(db: Session, user_id: UUID) -> Optional[Dict[str, Any]]:
    """
    Get detailed user stats including XP progress.
    
    Args:
        db: Database session
        user_id: User's ID
        
    Returns:
        Detailed stats dictionary or None if user not found
    """
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    stats = user.stats or {}
    user_total_xp = stats.get("total_xp", 0)
    
    user_level, xp_in_level, xp_for_next = XPLevelingSystem.calculate_level_from_xp(user_total_xp)
    progress_percentage = XPLevelingSystem.calculate_xp_percentage(user_total_xp)
    
    skill_details = {}
    for skill_name, skill_data in stats.get("skill_categories", {}).items():
        skill_xp = skill_data.get("xp", 0)
        skill_level, skill_xp_in_level, skill_xp_for_next = XPLevelingSystem.calculate_level_from_xp(skill_xp)
        skill_progress = XPLevelingSystem.calculate_xp_percentage(skill_xp)
        
        skill_details[skill_name] = {
            **skill_data,
            "progress": {
                "xp_in_current_level": skill_xp_in_level,
                "xp_for_next_level": skill_xp_for_next,
                "percentage": skill_progress
            }
        }
    
    return {
        "user_level": user_level,
        "total_xp": user_total_xp,
        "progress": {
            "xp_in_current_level": xp_in_level,
            "xp_for_next_level": xp_for_next,
            "percentage": progress_percentage
        },
        "skills": skill_details,
        "streak_days": stats.get("streak_days", 0),
        "total_entries": stats.get("total_entries", 0)
    }