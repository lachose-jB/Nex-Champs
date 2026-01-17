from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
from .base import BaseModel

class Decision(BaseModel, table=True):
    """Decision model representing meeting decisions"""
    meeting_id: int = Field(foreign_key="meeting.id")
    title: str
    description: Optional[str] = None
    decided_by: Optional[int] = Field(foreign_key="participant.id")
    phase: str = Field(index=True)  # Which phase this decision was made in

    # Relationships
    meeting: "Meeting" = Relationship(back_populates="decisions")

class DecisionCreate(SQLModel):
    meeting_id: int
    title: str
    description: Optional[str] = None
    decided_by: Optional[int] = None
    phase: str

class DecisionRead(SQLModel):
    id: int
    meeting_id: int
    title: str
    description: Optional[str] = None
    decided_by: Optional[int] = None
    phase: str
    created_at: datetime