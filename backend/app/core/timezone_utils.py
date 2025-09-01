"""
Timezone utilities for handling UTC conversions and user timezone operations.
All timestamps are stored in UTC in the database, but converted to user's timezone for display and date boundaries.
"""

from datetime import datetime, date, time, timezone
from typing import Optional, Union
import pytz
from zoneinfo import ZoneInfo


def get_user_current_date(user_timezone: str) -> date:
    """
    Get the current date in the user's timezone.
    
    Args:
        user_timezone: Timezone string (e.g., "America/New_York", "Europe/London")
    
    Returns:
        Current date in user's timezone
    """
    try:
        tz = ZoneInfo(user_timezone)
        user_now = datetime.now(tz)
        return user_now.date()
    except Exception:
        # Fallback to UTC if timezone is invalid
        return datetime.now(timezone.utc).date()


def get_user_current_datetime(user_timezone: str) -> datetime:
    """
    Get the current datetime in the user's timezone.
    
    Args:
        user_timezone: Timezone string (e.g., "America/New_York")
    
    Returns:
        Current datetime in user's timezone
    """
    try:
        tz = ZoneInfo(user_timezone)
        return datetime.now(tz)
    except Exception:
        # Fallback to UTC if timezone is invalid
        return datetime.now(timezone.utc)


def utc_to_user_timezone(utc_dt: datetime, user_timezone: str) -> datetime:
    """
    Convert a UTC datetime to user's timezone.
    
    Args:
        utc_dt: Datetime in UTC
        user_timezone: Target timezone string
    
    Returns:
        Datetime in user's timezone
    """
    try:
        # Ensure the datetime is timezone-aware (UTC)
        if utc_dt.tzinfo is None:
            utc_dt = utc_dt.replace(tzinfo=timezone.utc)
        elif utc_dt.tzinfo != timezone.utc:
            # Convert to UTC first if it has a different timezone
            utc_dt = utc_dt.astimezone(timezone.utc)
        
        # Convert to user's timezone
        tz = ZoneInfo(user_timezone)
        return utc_dt.astimezone(tz)
    except Exception:
        # Return original if conversion fails
        return utc_dt


def user_timezone_to_utc(dt: datetime, user_timezone: str) -> datetime:
    """
    Convert a datetime from user's timezone to UTC.
    
    Args:
        dt: Datetime in user's timezone (can be naive or aware)
        user_timezone: Source timezone string
    
    Returns:
        Datetime in UTC
    """
    try:
        tz = ZoneInfo(user_timezone)
        
        # If datetime is naive, assume it's in user's timezone
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=tz)
        
        # Convert to UTC
        return dt.astimezone(timezone.utc)
    except Exception:
        # If conversion fails, assume it's already UTC
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt


def get_date_in_user_timezone(utc_dt: datetime, user_timezone: str) -> date:
    """
    Get the date component of a UTC datetime in user's timezone.
    
    Args:
        utc_dt: Datetime in UTC
        user_timezone: Target timezone string
    
    Returns:
        Date in user's timezone
    """
    user_dt = utc_to_user_timezone(utc_dt, user_timezone)
    return user_dt.date()


def get_day_boundaries_in_utc(user_date: date, user_timezone: str) -> tuple[datetime, datetime]:
    """
    Get the start and end of a day in user's timezone, converted to UTC.
    This is useful for querying notes/reviews for a specific day.
    
    Args:
        user_date: Date in user's timezone
        user_timezone: User's timezone string
    
    Returns:
        Tuple of (start_of_day_utc, end_of_day_utc)
    """
    try:
        tz = ZoneInfo(user_timezone)
        
        # Create start of day in user's timezone
        start_of_day = datetime.combine(user_date, time.min).replace(tzinfo=tz)
        
        # Create end of day in user's timezone (23:59:59.999999)
        end_of_day = datetime.combine(user_date, time.max).replace(tzinfo=tz)
        
        # Convert both to UTC
        start_utc = start_of_day.astimezone(timezone.utc)
        end_utc = end_of_day.astimezone(timezone.utc)
        
        return start_utc, end_utc
    except Exception:
        # Fallback to simple date boundaries in UTC
        start = datetime.combine(user_date, time.min).replace(tzinfo=timezone.utc)
        end = datetime.combine(user_date, time.max).replace(tzinfo=timezone.utc)
        return start, end


def is_same_day_in_user_timezone(utc_dt1: datetime, utc_dt2: datetime, user_timezone: str) -> bool:
    """
    Check if two UTC datetimes fall on the same day in user's timezone.
    
    Args:
        utc_dt1: First datetime in UTC
        utc_dt2: Second datetime in UTC
        user_timezone: User's timezone string
    
    Returns:
        True if both datetimes are on the same day in user's timezone
    """
    date1 = get_date_in_user_timezone(utc_dt1, user_timezone)
    date2 = get_date_in_user_timezone(utc_dt2, user_timezone)
    return date1 == date2


def validate_timezone(timezone_str: str) -> bool:
    """
    Validate if a timezone string is valid.
    
    Args:
        timezone_str: Timezone string to validate
    
    Returns:
        True if valid, False otherwise
    """
    try:
        ZoneInfo(timezone_str)
        return True
    except Exception:
        return False


def get_default_timezone() -> str:
    """
    Get the default timezone to use as fallback.
    
    Returns:
        Default timezone string (UTC)
    """
    return "UTC"