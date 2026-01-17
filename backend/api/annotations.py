from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List
from backend.models.annotations import Annotation, AnnotationCreate, AnnotationRead
from backend.database import get_db
from backend.utils.auth import get_current_active_user

router = APIRouter()

@router.post("/meetings/{meeting_id}", response_model=AnnotationRead)
def create_annotation(
    meeting_id: int,
    annotation: AnnotationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new annotation"""
    # In a real implementation, you would check if the user has the token
    db_annotation = Annotation(
        meeting_id=meeting_id,
        participant_id=annotation.participant_id,
        annotation_type=annotation.annotation_type,
        content=annotation.content,
        timestamp_ms=annotation.timestamp_ms
    )
    db.add(db_annotation)
    db.commit()
    db.refresh(db_annotation)

    return db_annotation

@router.get("/meetings/{meeting_id}", response_model=List[AnnotationRead])
def get_annotations(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get all annotations for a meeting"""
    return db.query(Annotation).filter(Annotation.meeting_id == meeting_id).all()