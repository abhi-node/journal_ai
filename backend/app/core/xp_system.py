import math
from typing import Dict, Tuple, List


class XPLevelingSystem:
    """
    Linear gap XP leveling system for skills and user profile.
    Levels range from 1 to 999 with linearly increasing XP requirements.
    
    The gap between levels increases linearly by a constant amount:
    - Level 1→2: 100 XP
    - Level 2→3: 200 XP (gap increases by 100)
    - Level 3→4: 300 XP (gap increases by 100)
    - And so on...
    
    Formula: Total XP for level n = 50 * n * (n - 1)
    """
    
    BASE_GAP = 100  # Initial gap between level 1 and 2
    GAP_INCREMENT = 100  # How much the gap increases each level
    MAX_LEVEL = 999
    
    @classmethod
    def calculate_xp_for_level(cls, level: int) -> int:
        """
        Calculate total XP required to reach a specific level.
        Uses formula: total_xp = 50 * level * (level - 1)
        
        Args:
            level: Target level (1-999)
            
        Returns:
            Total XP required to reach that level
        """
        if level <= 1:
            return 0
        if level > cls.MAX_LEVEL:
            level = cls.MAX_LEVEL
        
        # Using the quadratic formula for linearly increasing gaps
        # Total XP = sum of arithmetic sequence = n * (first + last) / 2
        # Where n = level - 1, first = BASE_GAP, last = BASE_GAP + (n-1) * GAP_INCREMENT
        # This simplifies to: 50 * level * (level - 1)
        return 50 * level * (level - 1)
    
    @classmethod
    def calculate_xp_for_next_level(cls, current_level: int) -> int:
        """
        Calculate XP required to go from current level to next level.
        
        Args:
            current_level: Current level
            
        Returns:
            XP required for next level
        """
        if current_level >= cls.MAX_LEVEL:
            return 0
        
        # XP needed for next level = current_level * GAP_INCREMENT
        return current_level * cls.GAP_INCREMENT
    
    @classmethod
    def calculate_level_from_xp(cls, total_xp: int) -> Tuple[int, int, int]:
        """
        Calculate current level and progress from total XP.
        Uses inverse of the quadratic formula: level = (1 + sqrt(1 + 8*xp/100)) / 2
        
        Args:
            total_xp: Total XP accumulated
            
        Returns:
            Tuple of (current_level, xp_in_current_level, xp_for_next_level)
        """
        if total_xp <= 0:
            return 1, 0, cls.BASE_GAP
        
        # Using quadratic formula to find level from XP
        # total_xp = 50 * level * (level - 1)
        # Rearranging: level^2 - level - (total_xp/50) = 0
        # Using quadratic formula: level = (1 + sqrt(1 + 4*total_xp/50)) / 2
        level_float = (1 + math.sqrt(1 + 8 * total_xp / 100)) / 2
        current_level = int(level_float)
        
        # Cap at max level
        if current_level > cls.MAX_LEVEL:
            return cls.MAX_LEVEL, 0, 0
        
        # Calculate XP in current level
        xp_for_current_level = cls.calculate_xp_for_level(current_level)
        xp_in_current_level = total_xp - xp_for_current_level
        xp_for_next_level = cls.calculate_xp_for_next_level(current_level)
        
        return current_level, xp_in_current_level, xp_for_next_level
    
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
            xp_for_this_level = cls.calculate_xp_for_next_level(level - 1) if level > 1 else 0
            
            chart.append({
                "level": level,
                "total_xp_required": total_xp,
                "xp_for_this_level": xp_for_this_level,
                "xp_gap": xp_for_this_level  # More explicit about the gap
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
        Adjusted for the new linear progression system.
        
        Args:
            activity_difficulty: 'easy', 'medium', 'hard', 'exceptional'
            skill_level: Current skill level
            time_spent_minutes: Optional time spent on activity
            
        Returns:
            Suggested XP reward
        """
        # Base rewards remain the same
        base_rewards = {
            "easy": 10,
            "medium": 25,
            "hard": 50,
            "exceptional": 100
        }
        
        base_xp = base_rewards.get(activity_difficulty.lower(), 25)
        
        # Adjusted level multiplier for linear system (less aggressive scaling)
        # Since levels go up to 999, we need smaller multipliers
        level_multiplier = 1.0 + (min(skill_level, 100) - 1) * 0.01
        
        # Time bonus (unchanged)
        time_bonus = min(time_spent_minutes // 15, 10) * 5 if time_spent_minutes > 0 else 0
        
        total_xp = int((base_xp * level_multiplier) + time_bonus)
        
        # Keep the same maximum
        return min(total_xp, 500)
    
    @classmethod
    def get_rank_info(cls, level: int) -> Dict[str, any]:
        """
        Get detailed rank information for a given level.
        
        Args:
            level: Current level
            
        Returns:
            Dictionary with rank name, color scheme, level range, and description
        """
        ranks = [
            {
                "name": "Novice",
                "min_level": 1,
                "max_level": 24,
                "color": "#B8B5B2",  # Soft warm gray
                "gradient_start": "#B8B5B2",
                "gradient_end": "#D0CDCA",
                "description": "Just beginning your journey. Every master was once a novice.",
                "icon_placeholder": "novice_icon"
            },
            {
                "name": "Apprentice",
                "min_level": 25,
                "max_level": 49,
                "color": "#A8C4B0",  # Soft sage green
                "gradient_start": "#A8C4B0",
                "gradient_end": "#C2D6C6",
                "description": "Foundations are forming. Your habits are taking root.",
                "icon_placeholder": "apprentice_icon"
            },
            {
                "name": "Practitioner",
                "min_level": 50,
                "max_level": 99,
                "color": "#A3BFD9",  # Soft steel blue
                "gradient_start": "#A3BFD9",
                "gradient_end": "#C0D4E3",
                "description": "Consistency becomes character. Your practice defines you.",
                "icon_placeholder": "practitioner_icon"
            },
            {
                "name": "Adept",
                "min_level": 100,
                "max_level": 174,
                "color": "#C5B9E8",  # Soft lavender
                "gradient_start": "#C5B9E8",
                "gradient_end": "#DDD5F3",
                "description": "Skill meets dedication. You've entered the top half.",
                "icon_placeholder": "adept_icon"
            },
            {
                "name": "Expert",
                "min_level": 175,
                "max_level": 274,
                "color": "#E5C5FF",  # Pastel purple
                "gradient_start": "#E5C5FF",
                "gradient_end": "#F0DCFF",
                "description": "Excellence is your baseline. Others look to you for guidance.",
                "icon_placeholder": "expert_icon"
            },
            {
                "name": "Master",
                "min_level": 275,
                "max_level": 399,
                "color": "#FFB5C5",  # Pastel rose
                "gradient_start": "#FFB5C5",
                "gradient_end": "#FFD0DA",
                "description": "True mastery emerges. You've joined the elite 15%.",
                "icon_placeholder": "master_icon"
            },
            {
                "name": "Grandmaster",
                "min_level": 400,
                "max_level": 499,
                "color": "#FFCAA0",  # Pastel peach
                "gradient_start": "#FFCAA0",
                "gradient_end": "#FFE0C7",
                "description": "Among the greatest. Top 5% of all journalers.",
                "icon_placeholder": "grandmaster_icon"
            },
            {
                "name": "Sage",
                "min_level": 500,
                "max_level": 649,
                "color": "#FFF0A5",  # Pastel yellow
                "gradient_start": "#FFF0A5",
                "gradient_end": "#FFF8D0",
                "description": "Wisdom incarnate. You inspire transformation in others.",
                "icon_placeholder": "sage_icon"
            },
            {
                "name": "Enlightened",
                "min_level": 650,
                "max_level": 799,
                "color": "#B5FFE1",  # Pastel mint
                "gradient_start": "#B5FFE1",
                "gradient_end": "#D0FFF0",
                "description": "Transcendent understanding. A beacon for the community.",
                "icon_placeholder": "enlightened_icon"
            },
            {
                "name": "Ascended",
                "min_level": 800,
                "max_level": 899,
                "color": "#B5E7FF",  # Pastel sky blue
                "gradient_start": "#B5E7FF",
                "gradient_end": "#D0F0FF",
                "description": "Beyond mortal achievement. Legendary status achieved.",
                "icon_placeholder": "ascended_icon"
            },
            {
                "name": "Eternal",
                "min_level": 900,
                "max_level": 999,
                "color": "#FFD0F0",  # Pastel rainbow base
                "gradient_start": "#FFD0F0",
                "gradient_end": "#D0F0FF",
                "description": "Immortalized in the pantheon. The ultimate achievement.",
                "icon_placeholder": "eternal_icon",
                "special_effect": "rainbow"
            }
        ]
        
        for rank in ranks:
            if rank["min_level"] <= level <= rank["max_level"]:
                # Calculate progress within the rank
                total_levels_in_rank = rank["max_level"] - rank["min_level"] + 1
                levels_completed_in_rank = level - rank["min_level"]
                rank_progress = (levels_completed_in_rank / total_levels_in_rank) * 100
                
                return {
                    "name": rank["name"],
                    "level": level,
                    "min_level": rank["min_level"],
                    "max_level": rank["max_level"],
                    "color": rank["color"],
                    "gradient_start": rank["gradient_start"],
                    "gradient_end": rank["gradient_end"],
                    "description": rank["description"],
                    "icon_placeholder": rank["icon_placeholder"],
                    "rank_progress": rank_progress,
                    "special_effect": rank.get("special_effect", None)
                }
        
        # Default return (should never reach here)
        return {
            "name": "Unknown",
            "level": level,
            "color": "#808080",
            "gradient_start": "#808080",
            "gradient_end": "#A0A0A0",
            "description": "Unknown rank",
            "icon_placeholder": "default_icon",
            "rank_progress": 0
        }
    
    @classmethod
    def get_all_ranks(cls) -> List[Dict[str, any]]:
        """
        Get information about all ranks in the system.
        
        Returns:
            List of all rank definitions
        """
        return [
            {
                "name": "Novice",
                "min_level": 1,
                "max_level": 24,
                "color": "#B8B5B2",
                "gradient_start": "#B8B5B2",
                "gradient_end": "#D0CDCA",
                "description": "Just beginning your journey. Every master was once a novice.",
                "icon_placeholder": "novice_icon"
            },
            {
                "name": "Apprentice",
                "min_level": 25,
                "max_level": 49,
                "color": "#A8C4B0",
                "gradient_start": "#A8C4B0",
                "gradient_end": "#C2D6C6",
                "description": "Foundations are forming. Your habits are taking root.",
                "icon_placeholder": "apprentice_icon"
            },
            {
                "name": "Practitioner",
                "min_level": 50,
                "max_level": 99,
                "color": "#A3BFD9",
                "gradient_start": "#A3BFD9",
                "gradient_end": "#C0D4E3",
                "description": "Consistency becomes character. Your practice defines you.",
                "icon_placeholder": "practitioner_icon"
            },
            {
                "name": "Adept",
                "min_level": 100,
                "max_level": 174,
                "color": "#C5B9E8",
                "gradient_start": "#C5B9E8",
                "gradient_end": "#DDD5F3",
                "description": "Skill meets dedication. You've entered the top half.",
                "icon_placeholder": "adept_icon"
            },
            {
                "name": "Expert",
                "min_level": 175,
                "max_level": 274,
                "color": "#E5C5FF",
                "gradient_start": "#E5C5FF",
                "gradient_end": "#F0DCFF",
                "description": "Excellence is your baseline. Others look to you for guidance.",
                "icon_placeholder": "expert_icon"
            },
            {
                "name": "Master",
                "min_level": 275,
                "max_level": 399,
                "color": "#FFB5C5",
                "gradient_start": "#FFB5C5",
                "gradient_end": "#FFD0DA",
                "description": "True mastery emerges. You've joined the elite 15%.",
                "icon_placeholder": "master_icon"
            },
            {
                "name": "Grandmaster",
                "min_level": 400,
                "max_level": 499,
                "color": "#FFCAA0",
                "gradient_start": "#FFCAA0",
                "gradient_end": "#FFE0C7",
                "description": "Among the greatest. Top 5% of all journalers.",
                "icon_placeholder": "grandmaster_icon"
            },
            {
                "name": "Sage",
                "min_level": 500,
                "max_level": 649,
                "color": "#FFF0A5",
                "gradient_start": "#FFF0A5",
                "gradient_end": "#FFF8D0",
                "description": "Wisdom incarnate. You inspire transformation in others.",
                "icon_placeholder": "sage_icon"
            },
            {
                "name": "Enlightened",
                "min_level": 650,
                "max_level": 799,
                "color": "#B5FFE1",
                "gradient_start": "#B5FFE1",
                "gradient_end": "#D0FFF0",
                "description": "Transcendent understanding. A beacon for the community.",
                "icon_placeholder": "enlightened_icon"
            },
            {
                "name": "Ascended",
                "min_level": 800,
                "max_level": 899,
                "color": "#B5E7FF",
                "gradient_start": "#B5E7FF",
                "gradient_end": "#D0F0FF",
                "description": "Beyond mortal achievement. Legendary status achieved.",
                "icon_placeholder": "ascended_icon"
            },
            {
                "name": "Eternal",
                "min_level": 900,
                "max_level": 999,
                "color": "#FFD0F0",
                "gradient_start": "#FFD0F0",
                "gradient_end": "#D0F0FF",
                "description": "Immortalized in the pantheon. The ultimate achievement.",
                "icon_placeholder": "eternal_icon",
                "special_effect": "rainbow"
            }
        ]