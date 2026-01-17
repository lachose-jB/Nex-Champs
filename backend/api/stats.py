from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, func
from typing import Dict, Any
from datetime import datetime
from backend.models.tokens import TokenEvent
from backend.models.annotations import Annotation
from backend.models.participants import Participant
from backend.database import get_db
from backend.utils.auth import get_current_active_user

router = APIRouter()

@router.get("/meetings/{meeting_id}/stats", response_model=Dict[str, Any])
def get_meeting_stats(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get statistics for a meeting"""

    # Get all participants
    participants = db.query(Participant).filter(Participant.meeting_id == meeting_id).all()

    stats = {
        "meeting_id": meeting_id,
        "participant_count": len(participants),
        "token_stats": {},
        "annotation_stats": {},
        "generated_at": datetime.utcnow().isoformat()
    }

    # Calculate token statistics
    token_events = db.query(TokenEvent).filter(TokenEvent.meeting_id == meeting_id).all()

    for participant in participants:
        participant_id = participant.id
        participant_stats = {
            "claim_count": 0,
            "total_hold_time_seconds": 0,
            "last_hold_timestamp": None
        }

        # Filter token events for this participant
        participant_tokens = [t for t in token_events if t.participant_id == participant_id]

        if participant_tokens:
            participant_stats["claim_count"] = len(participant_tokens)

            # Calculate total hold time (simplified - in real implementation would track actual durations)
            for token in participant_tokens:
                if token.event_type == "claim":
                    participant_stats["total_hold_time_seconds"] += 60  # Assume 60 seconds per claim for demo
                    participant_stats["last_hold_timestamp"] = token.created_at.isoformat()

        stats["token_stats"][participant.name] = participant_stats

    # Calculate annotation statistics
    annotations = db.query(Annotation).filter(Annotation.meeting_id == meeting_id).all()

    for participant in participants:
        participant_id = participant.id
        participant_annotations = [a for a in annotations if a.participant_id == participant_id]

        stats["annotation_stats"][participant.name] = {
            "annotation_count": len(participant_annotations),
            "annotation_types": {}
        }

        # Count annotation types
        for annotation in participant_annotations:
            annotation_type = annotation.annotation_type
            if annotation_type not in stats["annotation_stats"][participant.name]["annotation_types"]:
                stats["annotation_stats"][participant.name]["annotation_types"][annotation_type] = 0
            stats["annotation_stats"][participant.name]["annotation_types"][annotation_type] += 1

    return stats

@router.get("/meetings/{meeting_id}/audit", response_model=Dict[str, Any])
def get_meeting_audit(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get audit data for a meeting"""

    audit_data = {
        "meeting_id": meeting_id,
        "events": [],
        "generated_at": datetime.utcnow().isoformat()
    }

    # Get all token events
    token_events = db.query(TokenEvent).filter(TokenEvent.meeting_id == meeting_id).all()

    for event in token_events:
        audit_data["events"].append({
            "type": "token_event",
            "event_id": event.id,
            "participant_id": event.participant_id,
            "event_type": event.event_type,
            "is_active": event.is_active,
            "timestamp": event.created_at.isoformat()
        })

    # Get all annotations
    annotations = db.query(Annotation).filter(Annotation.meeting_id == meeting_id).all()

    for annotation in annotations:
        audit_data["events"].append({
            "type": "annotation",
            "annotation_id": annotation.id,
            "participant_id": annotation.participant_id,
            "annotation_type": annotation.annotation_type,
            "timestamp_ms": annotation.timestamp_ms,
            "timestamp": annotation.created_at.isoformat()
        })

    # Sort events by timestamp
    audit_data["events"].sort(key=lambda x: x["timestamp"])

    return audit_data