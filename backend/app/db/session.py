from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import Generator, Optional
from app.core.config import settings

_engine = None
_SessionLocal: Optional[sessionmaker] = None


def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=3600,
            pool_size=10,
            max_overflow=20,
        )
    return _engine


def _get_sessionmaker() -> sessionmaker:
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_get_engine())
    return _SessionLocal


def get_db() -> Generator:
    Session = _get_sessionmaker()
    db = Session()
    try:
        yield db
    finally:
        db.close()


def SessionLocal():
    """
    Backwards-compatible helper returning a new DB session.
    Existing code that did `db = SessionLocal()` will continue to work
    without creating engine/sessionmaker at import-time.
    """
    return _get_sessionmaker()()
