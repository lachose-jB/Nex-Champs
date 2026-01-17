from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.meetings import Meeting, MeetingCreate, MeetingRead
from models.participants import Participant, ParticipantCreate
from database import get_db
from utils.auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=MeetingRead)
def create_meeting(
    meeting: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new meeting"""
    db_meeting = Meeting.from_orm(meeting)
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)

    # Add the current user as facilitator
    facilitator = Participant(
        meeting_id=db_meeting.id,
        user_id=current_user.username,
        name=current_user.username,
        role="facilitator"
    )
    db.add(facilitator)
    db.commit()

    return db_meeting

@router.get("/", response_model=List[MeetingRead])
def get_meetings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all meetings"""
    return db.query(Meeting).all()

@router.get("/{meeting_id}", response_model=MeetingRead)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get a specific meeting"""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting