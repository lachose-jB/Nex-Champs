from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List
from ..models.phases import Phase, PhaseCreate, PhaseRead
from ..models.meetings import Meeting
from ..database import get_db
from ..utils.auth import get_current_active_user

router = APIRouter()

VALID_PHASES = ["ideation", "clarification", "decision", "feedback"]
PHASE_TRANSITIONS = {
    "ideation": ["clarification"],
    "clarification": ["decision"],
    "decision": ["feedback"],
    "feedback": []
}

@router.post("/meetings/{meeting_id}/change", response_model=PhaseRead)
def change_phase(
    meeting_id: int,
    phase_data: PhaseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Change the current phase of a meeting"""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if phase_data.phase_name not in VALID_PHASES:
        raise HTTPException(status_code=400, detail="Invalid phase")

    if meeting.current_phase and meeting.current_phase not in PHASE_TRANSITIONS.get(phase_data.phase_name, []):
        raise HTTPException(status_code=400, detail=f"Cannot transition from {meeting.current_phase} to {phase_data.phase_name}")

    # Mark previous phase as not current
    if meeting.current_phase:
        previous_phase = db.query(Phase).filter(
            Phase.meeting_id == meeting_id,
            Phase.is_current == True
        ).first()
        if previous_phase:
            previous_phase.is_current = False

    # Create new phase
    new_phase = Phase(
        meeting_id=meeting_id,
        phase_name=phase_data.phase_name,
        started_by=phase_data.started_by,
        is_current=True
    )
    db.add(new_phase)

    # Update meeting current phase
    meeting.current_phase = phase_data.phase_name
    db.commit()
    db.refresh(new_phase)

    return new_phase