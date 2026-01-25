from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from backend.models.meetings import Meeting, MeetingCreate, MeetingRead
from backend.models.participants import Participant, ParticipantRead
from backend.models.users import User
from backend.database import get_db
from backend.utils.auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=MeetingRead)
def create_meeting(
    meeting: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new meeting"""
    # Get the current user from database
    statement = select(User).where(User.id == current_user.id)
    user = db.exec(statement).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_meeting = Meeting(**meeting.dict(exclude_unset=True), creator_id=user.id)
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)

    # Add the current user as facilitator
    facilitator = Participant(
        meeting_id=db_meeting.id,
        user_id=current_user.username,
        name=current_user.username,
        role="facilitator",
        is_active=True
    )
    db.add(facilitator)
    db.commit()
    db.refresh(facilitator)

    return db_meeting

@router.get("/", response_model=List[MeetingRead])
def get_meetings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all meetings"""
    meetings = db.query(Meeting).all()
    return meetings  # renvoie [] si aucun meeting

@router.get("/me/created", response_model=List[MeetingRead])
def get_user_created_meetings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all meetings created by the current user"""
    # Get the current user from database
    statement = select(User).where(User.id == current_user.id)
    user = db.exec(statement).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    statement = select(Meeting).where(Meeting.creator_id == user.id)
    meetings = db.exec(statement).all()
    return meetings

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

@router.post("/{meeting_id}/join", response_model=ParticipantRead)
def join_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Join a meeting as a participant"""
    # Check if meeting exists
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Check if user is already a participant
    existing_participant = db.query(Participant).filter(
        Participant.meeting_id == meeting_id,
        Participant.user_id == current_user.username
    ).first()

    if existing_participant:
        if not existing_participant.is_active:
            existing_participant.is_active = True
            db.commit()
            db.refresh(existing_participant)
        return existing_participant

    # Create new participant
    participant = Participant(
        meeting_id=meeting_id,
        user_id=current_user.username,
        name=current_user.username,
        role="participant",
        is_active=True
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)

    return participant

@router.post("/{meeting_id}/leave")
def leave_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Leave a meeting as a participant"""
    # Check if meeting exists
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Find and deactivate the participant
    participant = db.query(Participant).filter(
        Participant.meeting_id == meeting_id,
        Participant.user_id == current_user.username
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    # Set is_active to False (soft delete)
    participant.is_active = False
    db.commit()
    
    return {
        "message": "Successfully left the meeting",
        "meeting_id": meeting_id
    }

@router.put("/{meeting_id}", response_model=MeetingRead)
def update_meeting(
    meeting_id: int,
    meeting_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Update meeting details (phase, status, etc.)"""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Update allowed fields
    for field, value in meeting_data.items():
        if field in ['name', 'description', 'current_phase', 'is_active']:
            setattr(meeting, field, value)
    
    db.commit()
    db.refresh(meeting)
    return meeting
