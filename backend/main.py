from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from fastapi import FastAPI

# Use relative imports for proper package structure
from backend.database import init_db
from backend.config import settings
from backend.api import api_router

app = FastAPI(title="Nex-Champs Backend", version="0.1.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup (using lifecycle events)
@app.on_event("startup")
async def on_startup():
    init_db()

# Include API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Nex-Champs Backend - Secure Meeting Token System"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)