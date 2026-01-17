from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List
from backend.models.tokens import TokenEvent, TokenEventCreate, TokenEventRead
from backend.database import get_db
from backend.utils.auth import get_current_active_user

router = APIRouter()

@router.post("/meetings/{meeting_id}/claim", response_model=TokenEventRead)
def claim_token(
    meeting_id: int,
    token_data: TokenEventCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Claim the expression token"""
    # Check if there's already an active token
    active_token = db.query(TokenEvent).filter(
        TokenEvent.meeting_id == meeting_id,
        TokenEvent.is_active == True
    ).first()

    if active_token:
        raise HTTPException(status_code=400, detail="Token is already claimed")

    # Create new token event
    token_event = TokenEvent(
        meeting_id=meeting_id,
        participant_id=token_data.participant_id,
        event_type="claim",
        is_active=True
    )
    db.add(token_event)
    db.commit()
    db.refresh(token_event)

    return token_event

@router.post("/meetings/{meeting_id}/release", response_model=TokenEventRead)
def release_token(
    meeting_id: int,
    token_data: TokenEventCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Release the expression token"""
    # Find the active token
    active_token = db.query(TokenEvent).filter(
        TokenEvent.meeting_id == meeting_id,
        TokenEvent.is_active == True
    ).first()

    if not active_token:
        raise HTTPException(status_code=400, detail="No active token to release")

    # Mark as released
    active_token.is_active = False
    active_token.event_type = "release"
    db.commit()
    db.refresh(active_token)

    return active_token