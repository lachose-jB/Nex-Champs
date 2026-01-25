#!/usr/bin/env python3
"""
Script pour créer un compte administrateur
Usage: python3 create_admin.py
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, create_engine, select, SQLModel
from backend.models.users import User as DBUser
from backend.models.meetings import Meeting
from backend.models.participants import Participant
from backend.models.tokens import TokenEvent
from backend.models.phases import Phase
from backend.models.annotations import Annotation
from backend.models.decisions import Decision
from backend.models.invitations import Invitation
from backend.utils.auth import hash_password
from backend.config import settings
from datetime import datetime

# Database connection
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})

def init_db():
    """Initialize the database"""
    try:
        SQLModel.metadata.create_all(engine)
        print("✓ Database initialized")
        return True
    except Exception as e:
        print(f"✗ Error initializing database: {str(e)}")
        return False

def create_admin():
    """Create an admin user"""
    email = "jadjahouisso@gmail.com"
    password = "!1Ez(ueLUy6g"
    username = "admin"
    full_name = "Administrator"
    
    with Session(engine) as session:
        # Check if user already exists
        statement = select(DBUser).where(DBUser.email == email)
        existing_user = session.exec(statement).first()
        
        if existing_user:
            print(f"✗ User with email {email} already exists!")
            return False
        
        # Check if username already exists
        statement = select(DBUser).where(DBUser.username == username)
        existing_user = session.exec(statement).first()
        
        if existing_user:
            print(f"✗ Username {username} already exists!")
            return False
        
        # Hash the password
        hashed_password = hash_password(password)
        
        # Create new admin user
        admin_user = DBUser(
            username=username,
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            language_preference="en",
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)
        
        print(f"✓ Admin user created successfully!")
        print(f"  Username: {username}")
        print(f"  Email: {email}")
        print(f"  ID: {admin_user.id}")
        return True

if __name__ == "__main__":
    try:
        # First, initialize the database
        if not init_db():
            sys.exit(1)
        
        # Then create the admin user
        success = create_admin()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"✗ Error creating admin user: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
