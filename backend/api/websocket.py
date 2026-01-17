from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from ..websocket import manager
from ..utils.auth import get_current_active_user
from typing import Optional
import json

router = APIRouter()

@router.websocket("/ws/meetings/{meeting_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    meeting_id: int,
    token: Optional[str] = None  # In production, you would validate JWT token
):
    """WebSocket endpoint for meeting real-time communication"""
    await manager.connect(websocket, meeting_id)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle different message types
            if message.get("type") == "join":
                # Add participant to meeting room
                participant_id = message.get("participant_id")
                participant_name = message.get("participant_name")

                if meeting_id in manager.meeting_rooms:
                    manager.meeting_rooms[meeting_id]["participants"][participant_id] = {
                        "name": participant_name,
                        "websocket": websocket
                    }

                # Notify others about new participant
                join_message = {
                    "type": "participant_joined",
                    "data": {
                        "participant_id": participant_id,
                        "participant_name": participant_name
                    }
                }
                await manager.broadcast(json.dumps(join_message), meeting_id)

            elif message.get("type") == "leave":
                participant_id = message.get("participant_id")
                if meeting_id in manager.meeting_rooms and participant_id in manager.meeting_rooms[meeting_id]["participants"]:
                    del manager.meeting_rooms[meeting_id]["participants"][participant_id]

                    leave_message = {
                        "type": "participant_left",
                        "data": {"participant_id": participant_id}
                    }
                    await manager.broadcast(json.dumps(leave_message), meeting_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, meeting_id)
        # In a real implementation, you would handle cleanup here