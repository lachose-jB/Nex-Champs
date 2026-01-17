from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, Dict, Any
from datetime import datetime
from .base import BaseModel
import json

class Annotation(BaseModel, table=True):
    """Annotation model representing canvas annotations"""
    meeting_id: int = Field(foreign_key="meeting.id")
    participant_id: Optional[int] = Field(foreign_key="participant.id")
    annotation_type: str = Field(index=True)  # text, drawing, shape, etc.
    content: str = Field(default="{}")  # JSON content as string
    timestamp_ms: int = Field(default=0)  # Video timestamp in milliseconds

    # Relationships
    meeting: "Meeting" = Relationship(back_populates="annotations")

class AnnotationCreate(SQLModel):
    meeting_id: int
    participant_id: Optional[int] = None
    annotation_type: str
    content: Dict[str, Any]
    timestamp_ms: int = 0

class AnnotationRead(SQLModel):
    id: int
    meeting_id: int
    participant_id: Optional[int] = None
    annotation_type: str
    content: Dict[str, Any]
    timestamp_ms: int
    created_at: datetime