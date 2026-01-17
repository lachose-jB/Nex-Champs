from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter()

class WebRTCManager:
    def __init__(self):
        self.meeting_rooms: Dict[int, Dict[str, WebSocket]] = {}  # meeting_id -> {user_id: websocket}

    async def connect(self, websocket: WebSocket, meeting_id: int, user_id: str):
        await websocket.accept()
        if meeting_id not in self.meeting_rooms:
            self.meeting_rooms[meeting_id] = {}
        self.meeting_rooms[meeting_id][user_id] = websocket

    def disconnect(self, meeting_id: int, user_id: str):
        if meeting_id in self.meeting_rooms and user_id in self.meeting_rooms[meeting_id]:
            del self.meeting_rooms[meeting_id][user_id]
            if not self.meeting_rooms[meeting_id]:
                del self.meeting_rooms[meeting_id]

    async def send_to_user(self, meeting_id: int, user_id: str, message: str):
        if meeting_id in self.meeting_rooms and user_id in self.meeting_rooms[meeting_id]:
            websocket = self.meeting_rooms[meeting_id][user_id]
            await websocket.send_text(message)

    async def broadcast_sdp(self, meeting_id: int, sender_id: str, sdp: dict):
        message = {
            "type": "sdp",
            "sender": sender_id,
            "sdp": sdp
        }
        if meeting_id in self.meeting_rooms:
            for user_id, websocket in self.meeting_rooms[meeting_id].items():
                if user_id != sender_id:
                    await websocket.send_text(json.dumps(message))

    async def broadcast_ice_candidate(self, meeting_id: int, sender_id: str, candidate: dict):
        message = {
            "type": "ice_candidate",
            "sender": sender_id,
            "candidate": candidate
        }
        if meeting_id in self.meeting_rooms:
            for user_id, websocket in self.meeting_rooms[meeting_id].items():
                if user_id != sender_id:
                    await websocket.send_text(json.dumps(message))

webrtc_manager = WebRTCManager()

@router.websocket("/meetings/{meeting_id}/webrtc/{user_id}")
async def webrtc_signaling(
    websocket: WebSocket,
    meeting_id: int,
    user_id: str
):
    """WebRTC signaling endpoint for video/audio communication"""
    await webrtc_manager.connect(websocket, meeting_id, user_id)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "sdp":
                await webrtc_manager.broadcast_sdp(meeting_id, user_id, message["sdp"])

            elif message.get("type") == "ice_candidate":
                await webrtc_manager.broadcast_ice_candidate(meeting_id, user_id, message["candidate"])

    except WebSocketDisconnect:
        webrtc_manager.disconnect(meeting_id, user_id)