from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
from .base import BaseModel

class TokenEvent(BaseModel, table=True):
    """Token event model representing token claim/release history"""
    meeting_id: int = Field(foreign_key="meeting.id")
    participant_id: Optional[int] = Field(foreign_key="participant.id", nullable=True)
    event_type: str = Field(index=True)  # claim, release, force_release
    is_active: bool = Field(default=False)

    # Relationships
    meeting: "Meeting" = Relationship(back_populates="token_events")
    participant: Optional["Participant"] = Relationship()

class TokenEventCreate(SQLModel):
    meeting_id: int
    participant_id: Optional[int] = None
    event_type: str

class TokenEventRead(SQLModel):
    id: int
    meeting_id: int
    participant_id: Optional[int] = None
    event_type: str
    is_active: bool
    created_at: datetime