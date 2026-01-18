from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List

# Import from backend package
from backend.models.meetings import Meeting, MeetingCreate, MeetingRead
from backend.models.participants import Participant, ParticipantCreate, ParticipantRead
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
        # Update existing participant if they left and want to rejoin
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