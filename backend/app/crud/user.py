from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password


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