from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import select
from typing import List
import secrets
from datetime import datetime

from backend.models.invitations import Invitation
from backend.models.meetings import Meeting
from backend.models.users import User as DBUser
from backend.models.participants import Participant
from backend.database import get_session
from backend.utils.auth import get_current_active_user

router = APIRouter()

@router.post("/meetings/{meeting_id}/invite")
async def invite_to_meeting(
    meeting_id: int,
    email: str,
    role: str = "participant",
    current_user: DBUser = Depends(get_current_active_user)
):
    session = get_session()

    # Vérifier que la réunion existe
    meeting = session.exec(
        select(Meeting).where(Meeting.id == meeting_id)
    ).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    # Vérifier que l'utilisateur actuel est organisateur ou facilitateur
    # (Dans une implémentation complète, vérifiez les permissions)
    # Pour l'instant, nous permettons à tout utilisateur authentifié d'inviter

    # Générer un token unique pour l'invitation
    invitation_token = secrets.token_urlsafe(32)

    # Créer l'invitation
    invitation = Invitation(
        meeting_id=meeting_id,
        email=email,
        sender_id=current_user.id,
        role=role,
        token=invitation_token
    )

    session.add(invitation)
    session.commit()
    session.refresh(invitation)

    # Dans une implémentation complète, envoyez un email ici
    # Pour l'instant, nous retournons simplement les informations

    return {
        "message": "Invitation created successfully",
        "invitation": {
            "id": invitation.id,
            "email": invitation.email,
            "role": invitation.role,
            "status": invitation.status,
            "invitation_token": invitation_token,
            "invitation_url": f"/accept-invitation/{invitation_token}"
        }
    }

@router.get("/invitations")
async def get_user_invitations(
    current_user: DBUser = Depends(get_current_active_user)
):
    session = get_session()

    # Récupérer toutes les invitations pour cet utilisateur
    invitations = session.exec(
        select(Invitation).where(Invitation.email == current_user.email)
    ).all()

    return {
        "invitations": [
            {
                "id": inv.id,
                "meeting_id": inv.meeting_id,
                "email": inv.email,
                "sender_id": inv.sender_id,
                "role": inv.role,
                "status": inv.status,
                "created_at": inv.created_at.isoformat(),
                "invitation_url": f"/accept-invitation/{inv.token}"
            }
            for inv in invitations
        ]
    }

@router.get("/invitations/{invitation_token}")
async def get_invitation_by_token(invitation_token: str):
    session = get_session()

    invitation = session.exec(
        select(Invitation).where(Invitation.token == invitation_token)
    ).first()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )

    return {
        "invitation": {
            "id": invitation.id,
            "meeting_id": invitation.meeting_id,
            "email": invitation.email,
            "role": invitation.role,
            "status": invitation.status
        }
    }

@router.post("/invitations/{invitation_token}/accept")
async def accept_invitation(
    invitation_token: str,
    current_user: DBUser = Depends(get_current_active_user)
):
    session = get_session()

    invitation = session.exec(
        select(Invitation).where(Invitation.token == invitation_token)
    ).first()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )

    if invitation.email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to accept this invitation"
        )

    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation already {invitation.status}"
        )

    # Mettre à jour le statut de l'invitation
    invitation.status = "accepted"
    invitation.updated_at = datetime.utcnow()

    # Ajouter l'utilisateur comme participant à la réunion
    participant = Participant(
        meeting_id=invitation.meeting_id,
        user_id=str(current_user.id),
        name=current_user.full_name,
        role=invitation.role,
        is_active=True
    )

    session.add(participant)
    session.commit()

    return {
        "message": "Invitation accepted successfully",
        "invitation": {
            "id": invitation.id,
            "status": invitation.status,
            "role": invitation.role
        },
        "participant": {
            "id": participant.id,
            "role": participant.role
        }
    }

@router.post("/invitations/{invitation_token}/decline")
async def decline_invitation(
    invitation_token: str,
    current_user: DBUser = Depends(get_current_active_user)
):
    session = get_session()

    invitation = session.exec(
        select(Invitation).where(Invitation.token == invitation_token)
    ).first()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )

    if invitation.email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to decline this invitation"
        )

    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation already {invitation.status}"
        )

    # Mettre à jour le statut de l'invitation
    invitation.status = "declined"
    invitation.updated_at = datetime.utcnow()

    session.commit()
    session.refresh(invitation)

    return {
        "message": "Invitation declined successfully",
        "invitation": {
            "id": invitation.id,
            "status": invitation.status
        }
    }

@router.get("/meetings/{meeting_id}/invitations")
async def get_meeting_invitations(
    meeting_id: int,
    current_user: DBUser = Depends(get_current_active_user)
):
    session = get_session()

    # Vérifier que la réunion existe
    meeting = session.exec(
        select(Meeting).where(Meeting.id == meeting_id)
    ).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    # Récupérer les invitations pour cette réunion
    invitations = session.exec(
        select(Invitation).where(Invitation.meeting_id == meeting_id)
    ).all()

    return {
        "invitations": [
            {
                "id": inv.id,
                "email": inv.email,
                "sender_id": inv.sender_id,
                "role": inv.role,
                "status": inv.status,
                "created_at": inv.created_at.isoformat()
            }
            for inv in invitations
        ]
    }