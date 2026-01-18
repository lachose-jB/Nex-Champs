from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Annotated
from pydantic import BaseModel
from backend.utils.auth import (
    create_access_token,
    get_current_active_user,
    Token,
    User,
    hash_password,
    verify_password,
)
from backend.config import settings
from backend.models.users import User as DBUser
from backend.database import get_session
from sqlmodel import select

router = APIRouter()

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

# Mock user database - in production, this would be a real database
fake_users_db = {
    "admin": {
        "username": "admin",
        "full_name": "Admin User",
        "email": "admin@example.com",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # password: "secret"
        "disabled": False,
    }
}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user_dict = fake_users_db.get(form_data.username)
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = User(**user_dict)

    # In a real implementation, you would verify the password
    # if not verify_password(form_data.password, user_dict["hashed_password"]):
    #     raise HTTPException(...)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.post("/signup")
async def signup(user_data: UserCreate):
    session = get_session()

    # Check if user already exists
    statement = select(DBUser).where(DBUser.email == user_data.email)
    existing_user = session.exec(statement).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate password
    try:
        validate_password(user_data.password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Hash the password
    hashed_password = hash_password(user_data.password)

    # Create new user
    new_user = DBUser(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role="participant"
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    # Create JWT token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email, "user_id": str(new_user.id)},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role
        }
    }