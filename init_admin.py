#!/usr/bin/env python3
"""
Script to initialize the database and create admin user
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.database import engine, init_db
from backend.models.users import User
from backend.utils.auth import hash_password
from sqlmodel import Session, select

def init_database_and_admin():
    """Initialize database and create admin user"""
    
    # Initialize database (create tables)
    print("📊 Initializing database...")
    init_db()
    print("✓ Database initialized")
    
    # Create admin user
    print("\n👤 Creating admin user...")
    
    with Session(engine) as session:
        # Check if admin already exists
        statement = select(User).where(User.email == "jadjahouisso@gmail.com")
        existing_user = session.exec(statement).first()
        
        if existing_user:
            print(f"⚠️  Admin user already exists: {existing_user.email}")
            return
        
        # Create new admin user
        admin_user = User(
            email="jadjahouisso@gmail.com",
            username="admin",
            full_name="Admin User",
            hashed_password=hash_password("TestPassword123!"),
            is_active=True
        )
        
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)
        
        print(f"✓ Admin user created successfully")
        print(f"  Email: {admin_user.email}")
        print(f"  Username: {admin_user.username}")
        print(f"  ID: {admin_user.id}")
        print(f"\n🔑 Credentials:")
        print(f"  Email: jadjahouisso@gmail.com")
        print(f"  Password: TestPassword123!")

if __name__ == "__main__":
    try:
        init_database_and_admin()
        print("\n✅ Setup complete!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
