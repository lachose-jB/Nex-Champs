from typing import Dict, List, Optional
from enum import Enum
from fastapi import HTTPException, status

class Role(str, Enum):
    FACILITATOR = "facilitator"
    PARTICIPANT = "participant"
    OBSERVER = "observer"
    ADMIN = "admin"

# Role permissions matrix
ROLE_PERMISSIONS = {
    Role.ADMIN: {
        "create_meeting": True,
        "delete_meeting": True,
        "manage_phases": True,
        "force_token_release": True,
        "manage_participants": True,
        "create_annotations": True,
        "create_decisions": True,
        "view_stats": True,
        "export_audit": True,
    },
    Role.FACILITATOR: {
        "create_meeting": True,
        "delete_meeting": False,
        "manage_phases": True,
        "force_token_release": True,
        "manage_participants": True,
        "create_annotations": True,
        "create_decisions": True,
        "view_stats": True,
        "export_audit": True,
    },
    Role.PARTICIPANT: {
        "create_meeting": False,
        "delete_meeting": False,
        "manage_phases": False,
        "force_token_release": False,
        "manage_participants": False,
        "create_annotations": True,  # Only when holding token
        "create_decisions": False,
        "view_stats": True,
        "export_audit": False,
    },
    Role.OBSERVER: {
        "create_meeting": False,
        "delete_meeting": False,
        "manage_phases": False,
        "force_token_release": False,
        "manage_participants": False,
        "create_annotations": False,
        "create_decisions": False,
        "view_stats": True,
        "export_audit": False,
    }
}

class RoleManager:
    def __init__(self):
        self.meeting_roles: Dict[int, Dict[str, Role]] = {}  # meeting_id -> {user_id: role}

    def get_user_role(self, meeting_id: int, user_id: str) -> Optional[Role]:
        """Get the role of a user in a meeting"""
        if meeting_id in self.meeting_roles:
            return self.meeting_roles[meeting_id].get(user_id)
        return None

    def set_user_role(self, meeting_id: int, user_id: str, role: Role):
        """Set the role of a user in a meeting"""
        if meeting_id not in self.meeting_roles:
            self.meeting_roles[meeting_id] = {}
        self.meeting_roles[meeting_id][user_id] = role

    def check_permission(self, meeting_id: int, user_id: str, permission: str) -> bool:
        """Check if a user has a specific permission in a meeting"""
        role = self.get_user_role(meeting_id, user_id)
        if not role:
            return False

        return ROLE_PERMISSIONS.get(role, {}).get(permission, False)

    def can_claim_token(self, meeting_id: int, user_id: str, current_token_holder: Optional[str] = None) -> bool:
        """Check if a user can claim the token"""
        role = self.get_user_role(meeting_id, user_id)
        if not role:
            return False

        # Observers cannot claim tokens
        if role == Role.OBSERVER:
            return False

        # If someone else is holding the token, only facilitators/admins can force claim
        if current_token_holder and current_token_holder != user_id:
            return role in [Role.FACILITATOR, Role.ADMIN]

        return True

# Global role manager instance
role_manager = RoleManager()

def check_permission(meeting_id: int, user_id: str, permission: str):
    """Dependency to check permissions"""
    if not role_manager.check_permission(meeting_id, user_id, permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to perform this action"
        )