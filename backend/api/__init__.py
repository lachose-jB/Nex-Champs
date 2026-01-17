from fastapi import APIRouter
from .meetings import router as meetings_router
from .tokens import router as tokens_router
from .phases import router as phases_router
from .annotations import router as annotations_router
from .decisions import router as decisions_router
from .auth import router as auth_router
from .stats import router as stats_router
from .websocket import router as websocket_router
from .webrtc import router as webrtc_router

api_router = APIRouter()

# Include all API routers
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(meetings_router, prefix="/meetings", tags=["meetings"])
api_router.include_router(tokens_router, prefix="/tokens", tags=["tokens"])
api_router.include_router(phases_router, prefix="/phases", tags=["phases"])
api_router.include_router(annotations_router, prefix="/annotations", tags=["annotations"])
api_router.include_router(decisions_router, prefix="/decisions", tags=["decisions"])
api_router.include_router(stats_router, prefix="/stats", tags=["stats"])
api_router.include_router(websocket_router, prefix="/ws", tags=["websocket"])
api_router.include_router(webrtc_router, prefix="/webrtc", tags=["webrtc"])