from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from backend.database import get_session
from backend.models.users import User, UserRead, UserUpdate, UserDelete, UserCreate
from backend.utils.auth import get_current_active_user, get_password_hash, verify_password
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserRead)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get current user profile"""
    # Get fresh data from database
    user = session.get(User, current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/me", response_model=UserRead)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Update current user profile"""
    user = session.get(User, current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    
    if user_update.email is not None:
        # Check if email is already taken
        existing = session.exec(
            select(User).where(User.email == user_update.email)
        ).first()
        if existing and existing.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user.email = user_update.email
    
    if user_update.avatar_url is not None:
        user.avatar_url = user_update.avatar_url
    
    if user_update.language_preference is not None:
        if user_update.language_preference not in ["en", "fr"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid language preference. Use 'en' or 'fr'"
            )
        user.language_preference = user_update.language_preference
    
    if user_update.password is not None:
        user.hashed_password = get_password_hash(user_update.password)
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    logger.info(f"User {user.username} profile updated")
    return user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_account(
    deletion_request: UserDelete,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """
    Delete user account (GDPR compliant).
    Requires password confirmation for security.
    """
    user = session.get(User, current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify password
    if not verify_password(deletion_request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    username = user.username
    
    # Mark user as inactive instead of deleting (data retention)
    user.is_active = False
    session.add(user)
    session.commit()
    
    logger.warning(f"User {username} account deleted (GDPR)")
    return None
