from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from .base import BaseModel

class Meeting(BaseModel, table=True):
    """Meeting model representing a secure meeting session"""
    name: str = Field(index=True)
    description: Optional[str] = None
    is_active: bool = Field(default=True)
    current_phase: Optional[str] = Field(default="ideation")

    # Relationships
    participants: List["Participant"] = Relationship(back_populates="meeting")
    token_events: List["TokenEvent"] = Relationship(back_populates="meeting")
    phases: List["Phase"] = Relationship(back_populates="meeting")
    annotations: List["Annotation"] = Relationship(back_populates="meeting")
    decisions: List["Decision"] = Relationship(back_populates="meeting")

class MeetingCreate(SQLModel):
    name: str
    description: Optional[str] = None

class MeetingRead(SQLModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool
    current_phase: str
    created_at: datetime
    updated_at: datetime