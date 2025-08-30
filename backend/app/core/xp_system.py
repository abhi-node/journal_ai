import math
from typing import Dict, Tuple, List


class XPLevelingSystem:
    """
    Exponential XP leveling system for skills and user profile.
    Levels range from 1 to 100 with exponentially increasing XP requirements.
    """
    
    BASE_XP = 100
    GROWTH_FACTOR = 1.15
    MAX_LEVEL = 100
    
    @classmethod
    def calculate_xp_for_level(cls, level: int) -> int:
        """
        Calculate total XP required to reach a specific level.
        
        Args:
            level: Target level (1-100)
            
        Returns:
            Total XP required to reach that level
        """
        if level <= 1:
            return 0
        if level > cls.MAX_LEVEL:
            level = cls.MAX_LEVEL
            
        total_xp = 0
        for lvl in range(2, level + 1):
            level_xp = int(cls.BASE_XP * (cls.GROWTH_FACTOR ** (lvl - 2)))
            total_xp += level_xp
        
        return total_xp
    
    @classmethod
    def calculate_level_from_xp(cls, total_xp: int) -> Tuple[int, int, int]:
        """
        Calculate current level and progress from total XP.
        
        Args:
            total_xp: Total XP accumulated
            
        Returns:
            Tuple of (current_level, xp_in_current_level, xp_for_next_level)
        """
        if total_xp <= 0:
            return 1, 0, cls.BASE_XP
        
        current_level = 1
        accumulated_xp = 0
        
        for level in range(2, cls.MAX_LEVEL + 1):
            xp_for_this_level = int(cls.BASE_XP * (cls.GROWTH_FACTOR ** (level - 2)))
            
            if accumulated_xp + xp_for_this_level > total_xp:
                xp_in_current_level = total_xp - accumulated_xp
                return current_level, xp_in_current_level, xp_for_this_level
            
            accumulated_xp += xp_for_this_level
            current_level = level
        
        return cls.MAX_LEVEL, 0, 0
    
    @classmethod
    def add_xp_to_skill(cls, current_xp: int, xp_to_add: int) -> Dict[str, any]:
        """
        Add XP to a skill and calculate level changes.
        
        Args:
            current_xp: Current total XP for the skill
            xp_to_add: Amount of XP to add
            
        Returns:
            Dictionary with updated stats
        """
        new_total_xp = current_xp + xp_to_add
        
        old_level, _, _ = cls.calculate_level_from_xp(current_xp)
        new_level, xp_in_level, xp_for_next = cls.calculate_level_from_xp(new_total_xp)
        
        return {
            "total_xp": new_total_xp,
            "level": new_level,
            "xp_in_current_level": xp_in_level,
            "xp_for_next_level": xp_for_next,
            "level_up": new_level > old_level,
            "levels_gained": new_level - old_level
        }
    
    @classmethod
    def get_leveling_chart(cls, start_level: int = 1, end_level: int = 10) -> List[Dict[str, int]]:
        """
        Generate a leveling chart showing XP requirements for a range of levels.
        
        Args:
            start_level: Starting level for the chart
            end_level: Ending level for the chart
            
        Returns:
            List of dictionaries with level and XP requirements
        """
        chart = []
        for level in range(start_level, min(end_level + 1, cls.MAX_LEVEL + 1)):
            total_xp = cls.calculate_xp_for_level(level)
            xp_for_this_level = int(cls.BASE_XP * (cls.GROWTH_FACTOR ** (level - 2))) if level > 1 else 0
            
            chart.append({
                "level": level,
                "total_xp_required": total_xp,
                "xp_for_this_level": xp_for_this_level
            })
        
        return chart
    
    @classmethod
    def calculate_xp_percentage(cls, current_xp: int) -> float:
        """
        Calculate progress percentage to next level.
        
        Args:
            current_xp: Current total XP
            
        Returns:
            Percentage progress to next level (0-100)
        """
        _, xp_in_level, xp_for_next = cls.calculate_level_from_xp(current_xp)
        
        if xp_for_next == 0:
            return 100.0
        
        return (xp_in_level / xp_for_next) * 100
    
    @classmethod
    def suggest_xp_reward(cls, 
                         activity_difficulty: str,
                         skill_level: int,
                         time_spent_minutes: int = 0) -> int:
        """
        Suggest appropriate XP reward based on activity and skill level.
        
        Args:
            activity_difficulty: 'easy', 'medium', 'hard', 'exceptional'
            skill_level: Current skill level
            time_spent_minutes: Optional time spent on activity
            
        Returns:
            Suggested XP reward
        """
        base_rewards = {
            "easy": 10,
            "medium": 25,
            "hard": 50,
            "exceptional": 100
        }
        
        base_xp = base_rewards.get(activity_difficulty.lower(), 25)
        
        level_multiplier = 1.0 + (skill_level - 1) * 0.02
        
        time_bonus = min(time_spent_minutes // 15, 10) * 5 if time_spent_minutes > 0 else 0
        
        total_xp = int((base_xp * level_multiplier) + time_bonus)
        
        return min(total_xp, 500)