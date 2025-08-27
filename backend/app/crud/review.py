from typing import List, Optional
from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.review import Review, ReviewType
from app.schemas.review import ReviewCreate


def get_review_by_date(
    db: Session, 
    user_id: UUID, 
    target_date: date, 
    review_type: ReviewType
) -> Optional[Review]:
    return db.query(Review).filter(
        and_(
            Review.user_id == user_id,
            Review.date == target_date,
            Review.type == review_type
        )
    ).first()


def get_reviews_by_user(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    review_type: Optional[ReviewType] = None
) -> List[Review]:
    query = db.query(Review).filter(Review.user_id == user_id)
    
    if review_type:
        query = query.filter(Review.type == review_type)
    
    return query.order_by(Review.date.desc()).offset(skip).limit(limit).all()


def get_reviews_by_date_range(
    db: Session,
    user_id: UUID,
    start_date: date,
    end_date: date,
    review_type: Optional[ReviewType] = None
) -> List[Review]:
    query = db.query(Review).filter(
        and_(
            Review.user_id == user_id,
            Review.date >= start_date,
            Review.date <= end_date
        )
    )
    
    if review_type:
        query = query.filter(Review.type == review_type)
    
    return query.order_by(Review.date.desc()).all()


def create_review(db: Session, review: ReviewCreate, user_id: UUID) -> Review:
    db_review = Review(
        user_id=user_id,
        type=review.type,
        date=review.date,
        score=review.score,
        content=review.content
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review


def get_review_by_id(db: Session, review_id: UUID, user_id: UUID) -> Optional[Review]:
    return db.query(Review).filter(
        and_(
            Review.id == review_id,
            Review.user_id == user_id
        )
    ).first()