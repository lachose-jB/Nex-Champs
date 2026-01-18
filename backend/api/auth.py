from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Annotated
from pydantic import BaseModel
from sqlmodel import Session, select
from backend.utils.auth import (
    create_access_token,
    get_current_active_user,
    Token,
    User,
    hash_password,
    verify_password,
    validate_password
)
from backend.config import settings
from backend.models.users import User as DBUser
from backend.database import get_session, get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str = ""

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_session)
):
    """
    Login endpoint that validates credentials against the database
    """
    # Try to find user by email or username
    statement = select(DBUser).where(
        (DBUser.email == form_data.username) | (DBUser.username == form_data.username)
    )
    db_user = db.exec(statement).first()
    
    if not db_user:
        logger.warning(f"Login failed: user {form_data.username} not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not verify_password(form_data.password, db_user.hashed_password):
        logger.warning(f"Login failed: invalid password for user {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not db_user.is_active:
        logger.warning(f"Login failed: user {form_data.username} is inactive")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username, "user_id": db_user.id},
        expires_delta=access_token_expires
    )
    
    logger.info(f"User {db_user.username} logged in successfully")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me/", response_model=dict)
async def read_users_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_session)
):
    """Get current user info"""
    db_user = db.get(DBUser, current_user.id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "full_name": db_user.full_name,
        "is_active": db_user.is_active
    }

@router.post("/signup")
async def signup(user_data: UserCreate, db: Session = Depends(get_session)):
    """
    Register a new user with email validation and password hashing
    """
    # Check if email already exists
    statement = select(DBUser).where(DBUser.email == user_data.email)
    existing_user = db.exec(statement).first()

    if existing_user:
        logger.warning(f"Signup failed: email {user_data.email} already registered")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate password strength
    try:
        validate_password(user_data.password)
    except ValueError as e:
        logger.warning(f"Signup failed: weak password - {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Generate username from email (remove domain)
    username = user_data.email.split('@')[0]
    
    # Ensure username is unique
    counter = 1
    original_username = username
    while db.exec(select(DBUser).where(DBUser.username == username)).first():
        username = f"{original_username}{counter}"
        counter += 1

    # Hash the password
    hashed_password = hash_password(user_data.password)

    # Create new user
    new_user = DBUser(
        username=username,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        language_preference="en",
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create JWT token for auto-login after signup
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.username, "user_id": new_user.id},
        expires_delta=access_token_expires
    )

    logger.info(f"New user registered: {new_user.username} ({new_user.email})")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name
        }
    }