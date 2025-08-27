from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import User, UserCreate
from app.crud import user as crud_user
from app.core.security import create_access_token, decode_token, create_token_response
from app.core.config import settings
from app.models.user import User as UserModel
from app.models.refresh_token import RefreshToken
from pydantic import BaseModel

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> UserModel:
    """Get the current authenticated user from token."""
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        print(f"Token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int


class LoginResponse(Token):
    user: User


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/signup", response_model=User)
def signup(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Create new user account.
    """
    db_user = crud_user.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    created_user = crud_user.create_user(db=db, user=user)
    return created_user


@router.post("/login", response_model=LoginResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login with refresh token.
    """
    user = crud_user.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Revoke any existing refresh tokens for this user
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked == False
    ).update({"revoked": True})
    
    # Create new tokens
    tokens = create_token_response(user.id)
    
    # Store refresh token in database
    refresh_token = RefreshToken(
        token=tokens["refresh_token"],
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(refresh_token)
    db.commit()
    
    return {
        **tokens,
        "user": user
    }


@router.post("/refresh", response_model=Token)
def refresh_token(
    token_request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    """
    # Find the refresh token in database
    refresh_token = db.query(RefreshToken).filter(
        RefreshToken.token == token_request.refresh_token,
        RefreshToken.revoked == False
    ).first()
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check if refresh token has expired
    if refresh_token.expires_at < datetime.now(timezone.utc):
        refresh_token.revoked = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired"
        )
    
    # Revoke old refresh token (rotation for security)
    refresh_token.revoked = True
    
    # Create new tokens
    tokens = create_token_response(refresh_token.user_id)
    
    # Store new refresh token
    new_refresh_token = RefreshToken(
        token=tokens["refresh_token"],
        user_id=refresh_token.user_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(new_refresh_token)
    db.commit()
    
    return tokens


@router.post("/logout")
def logout(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout user and revoke all refresh tokens.
    """
    # Revoke all refresh tokens for this user
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked == False
    ).update({"revoked": True})
    db.commit()
    
    return {"message": "Successfully logged out"}