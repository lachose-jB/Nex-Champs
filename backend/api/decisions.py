from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List
from ..models.decisions import Decision, DecisionCreate, DecisionRead
from ..database import get_db
from ..utils.auth import get_current_active_user

router = APIRouter()

@router.post("/meetings/{meeting_id}", response_model=DecisionRead)
def create_decision(
    meeting_id: int,
    decision: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new decision"""
    db_decision = Decision(
        meeting_id=meeting_id,
        title=decision.title,
        description=decision.description,
        decided_by=decision.decided_by,
        phase=decision.phase
    )
    db.add(db_decision)
    db.commit()
    db.refresh(db_decision)

    return db_decision

@router.get("/meetings/{meeting_id}", response_model=List[DecisionRead])
def get_decisions(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all decisions for a meeting"""
    return db.query(Decision).filter(Decision.meeting_id == meeting_id).all()