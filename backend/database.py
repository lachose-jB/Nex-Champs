from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.orm import sessionmaker

# Import models to ensure they're registered with SQLAlchemy
from .models.meetings import Meeting
from .models.participants import Participant
from .models.tokens import TokenEvent
from .models.phases import Phase
from .models.annotations import Annotation
from .models.decisions import Decision
from .models.users import User
from .models.invitations import Invitation
from backend.config import settings

# Database engine
engine = create_engine(settings.DATABASE_URL, echo=True)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Function to get a database session
def get_session():
    return SessionLocal()

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