from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import models directly
from models.meetings import Meeting
from models.participants import Participant
from models.tokens import TokenEvent
from models.phases import Phase
from models.annotations import Annotation
from models.decisions import Decision
from config import settings

# Database engine
engine = create_engine(settings.DATABASE_URL, echo=True)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database
def init_db():
    SQLModel.metadata.create_all(engine)
    print("Database initialized successfully")