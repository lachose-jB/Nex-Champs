from fastapi import WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState
from typing import Dict, List
import json
from .models.tokens import TokenEvent
from .models.phases import Phase
from .models.annotations import Annotation

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}  # meeting_id -> list of websockets
        self.meeting_rooms: Dict[int, Dict] = {}  # meeting_id -> meeting state

    async def connect(self, websocket: WebSocket, meeting_id: int):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
            self.meeting_rooms[meeting_id] = {
                "current_token_holder": None,
                "current_phase": "ideation",
                "participants": {}
            }
        self.active_connections[meeting_id].append(websocket)

    def disconnect(self, websocket: WebSocket, meeting_id: int):
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id].remove(websocket)
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]
                del self.meeting_rooms[meeting_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str, meeting_id: int):
        if meeting_id in self.active_connections:
            for connection in self.active_connections[meeting_id]:
                if connection.client_state == WebSocketState.CONNECTED:
                    await connection.send_text(message)

    async def broadcast_token_change(self, meeting_id: int, token_event: TokenEvent):
        message = {
            "type": "token_changed",
            "data": {
                "event_id": token_event.id,
                "participant_id": token_event.participant_id,
                "event_type": token_event.event_type,
                "is_active": token_event.is_active,
                "timestamp": token_event.created_at.isoformat()
            }
        }
        await self.broadcast(json.dumps(message), meeting_id)

    async def broadcast_phase_change(self, meeting_id: int, phase: Phase):
        message = {
            "type": "phase_changed",
            "data": {
                "phase_id": phase.id,
                "phase_name": phase.phase_name,
                "started_by": phase.started_by,
                "is_current": phase.is_current,
                "timestamp": phase.created_at.isoformat()
            }
        }
        await self.broadcast(json.dumps(message), meeting_id)

    async def broadcast_annotation(self, meeting_id: int, annotation: Annotation):
        message = {
            "type": "annotation_created",
            "data": {
                "annotation_id": annotation.id,
                "participant_id": annotation.participant_id,
                "annotation_type": annotation.annotation_type,
                "content": annotation.content,
                "timestamp_ms": annotation.timestamp_ms,
                "created_at": annotation.created_at.isoformat()
            }
        }
        await self.broadcast(json.dumps(message), meeting_id)

manager = ConnectionManager()