from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Invitation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    meeting_id: int = Field(foreign_key="meeting.id")
    email: str
    sender_id: int  # ID de l'utilisateur qui envoie l'invitation
    status: str = Field(default="pending")  # pending, accepted, declined
    role: str = Field(default="participant")  # participant, observer, facilitator
    token: str = Field(default="")  # Token unique pour accepter l'invitation
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def __repr__(self):
        return f"Invitation(id={self.id}, meeting_id={self.meeting_id}, email='{self.email}', status='{self.status}')"