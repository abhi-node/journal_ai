from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str):
    """Decode JWT token and return payload."""
    try:
        print(f"Attempting to decode token: {token[:20]}..." if len(token) > 20 else token)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        print(f"Token decoded successfully, user_id: {payload.get('sub')}")
        return payload
    except jwt.ExpiredSignatureError:
        print("Token has expired")
        raise Exception("Token has expired")
    except JWTError as e:
        print(f"JWT decode error: {e}")
        raise Exception(f"Could not decode token: {e}")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_refresh_token() -> str:
    """Create a secure random refresh token."""
    return secrets.token_urlsafe(32)


def create_token_response(user_id: str) -> dict:
    """Create both access and refresh tokens for a user."""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user_id)}, 
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # in seconds
    }