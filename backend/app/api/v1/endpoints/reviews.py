from typing import List, Optional, Dict
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.schemas import Review, ReviewCreate, ReviewType
from app.schemas.user import User
from app.crud import review as crud_review
from app.tasks.review_tasks import generate_daily_review

router = APIRouter()


@router.get("/daily/{target_date}", response_model=Optional[Review])
def get_daily_review(
    target_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get daily review for a specific date for the current user.
    """
    review = crud_review.get_review_by_date(
        db=db,
        user_id=current_user.id,
        target_date=target_date,
        review_type=ReviewType.daily
    )
    return review


@router.get("/weekly/{target_date}", response_model=Optional[Review])
def get_weekly_review(
    target_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get weekly review for a specific week start date for the current user.
    """
    review = crud_review.get_review_by_date(
        db=db,
        user_id=current_user.id,
        target_date=target_date,
        review_type=ReviewType.weekly
    )
    return review


@router.get("/history", response_model=List[Review])
def get_review_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    review_type: Optional[ReviewType] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get paginated review history for the current user.
    Optionally filter by review type.
    """
    reviews = crud_review.get_reviews_by_user(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        review_type=review_type
    )
    return reviews


@router.get("/range", response_model=List[Review])
def get_reviews_range(
    start_date: date,
    end_date: date,
    review_type: Optional[ReviewType] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get reviews between a date range for the current user.
    """
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    reviews = crud_review.get_reviews_by_date_range(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        review_type=review_type
    )
    return reviews


@router.get("/{review_id}", response_model=Review)
def get_review(
    review_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific review by ID for the current user.
    """
    review = crud_review.get_review_by_id(
        db=db,
        review_id=review_id,
        user_id=current_user.id
    )
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return review


from pydantic import BaseModel

class GenerateReviewRequest(BaseModel):
    target_date: Optional[date] = None
    timezone: Optional[str] = None

@router.post("/generate/daily", response_model=Dict[str, str])
def trigger_daily_review_generation(
    request: GenerateReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Trigger generation of a daily review for the current user.
    This will queue a Celery task to generate the review asynchronously.
    
    Args:
        target_date: Optional date to generate review for (defaults to today)
    
    Returns:
        Task information including task_id for tracking
    """
    from sqlalchemy import and_
    from app.models.review import Review as ReviewModel
    from app.core.timezone_utils import get_user_current_date, get_default_timezone
    
    # Use user's timezone to determine the current date
    user_timezone = request.timezone or get_default_timezone()
    review_date = request.target_date or get_user_current_date(user_timezone)
    
    existing_review = db.query(ReviewModel).filter(
        and_(
            ReviewModel.user_id == current_user.id,
            ReviewModel.date == review_date,
            ReviewModel.type == ReviewType.daily
        )
    ).first()
    
    if existing_review:
        raise HTTPException(
            status_code=409,
            detail=f"Daily review already exists for {review_date}"
        )
    
    from app.models.note import Note
    notes = db.query(Note).filter(
        and_(
            Note.user_id == current_user.id,
            Note.date == review_date
        )
    ).first()
    
    if not notes:
        raise HTTPException(
            status_code=400,
            detail=f"No notes found for {review_date}. Please add some notes before generating a review."
        )
    
    task = generate_daily_review.delay(
        user_id=str(current_user.id),
        target_date=review_date.isoformat(),
        user_timezone=user_timezone
    )
    
    return {
        "message": "Daily review generation started",
        "task_id": task.id,
        "date": review_date.isoformat(),
        "status": "processing"
    }