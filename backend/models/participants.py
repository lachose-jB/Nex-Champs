from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from .base import BaseModel

class Participant(BaseModel, table=True):
    """Participant model representing meeting attendees"""
    meeting_id: int = Field(foreign_key="meeting.id")
    user_id: str = Field(index=True)  # Could be email or external user ID
    name: str
    role: str = Field(default="participant")  # participant, facilitator, observer
    is_active: bool = Field(default=True)

    # Relationships
    meeting: "Meeting" = Relationship(back_populates="participants")

class ParticipantCreate(SQLModel):
    user_id: str
    name: str
    role: str = "participant"

class ParticipantRead(SQLModel):
    id: int
    user_id: str
    name: str
    role: str
    is_active: bool
    meeting_id: int