from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
from .base import BaseModel

class Phase(BaseModel, table=True):
    """Phase model representing meeting phases"""
    meeting_id: int = Field(foreign_key="meeting.id")
    phase_name: str = Field(index=True)  # ideation, clarification, decision, feedback
    started_by: Optional[int] = Field(foreign_key="participant.id")
    is_current: bool = Field(default=False)

    # Relationships
    meeting: "Meeting" = Relationship(back_populates="phases")

class PhaseCreate(SQLModel):
    meeting_id: int
    phase_name: str
    started_by: Optional[int] = None

class PhaseRead(SQLModel):
    id: int
    meeting_id: int
    phase_name: str
    started_by: Optional[int] = None
    is_current: bool
    created_at: datetime