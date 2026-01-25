#!/usr/bin/env python3
"""
Script to clean up database and keep only admin user
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.database import engine
from backend.models.users import User
from backend.models.meetings import Meeting, Participant
from backend.models.tokens import TokenEvent
from backend.models.phases import Phase
from backend.models.annotations import Annotation
from backend.models.decisions import Decision
from backend.models.invitations import Invitation
from backend.utils.auth import hash_password
from sqlmodel import Session, select, delete

def cleanup_database():
    """Clean database and keep only admin user"""
    
    print("🧹 Cleaning database...\n")
    
    with Session(engine) as session:
        # Get admin user first
        print("1️⃣  Getting admin user...")
        statement = select(User).where(User.email == "jadjahouisso@gmail.com")
        admin = session.exec(statement).first()
        
        if not admin:
            print("❌ Admin user not found!")
            return False
        
        admin_id = admin.id
        print(f"   ✓ Admin found: {admin.email} (ID: {admin_id})\n")
        
        # Delete all data related to meetings
        print("2️⃣  Deleting meetings data...")
        
        # Delete invitations
        stmt = delete(Invitation)
        session.exec(stmt)
        print("   ✓ Invitations deleted")
        
        # Delete annotations
        stmt = delete(Annotation)
        session.exec(stmt)
        print("   ✓ Annotations deleted")
        
        # Delete decisions
        stmt = delete(Decision)
        session.exec(stmt)
        print("   ✓ Decisions deleted")
        
        # Delete phases
        stmt = delete(Phase)
        session.exec(stmt)
        print("   ✓ Phases deleted")
        
        # Delete token events
        stmt = delete(TokenEvent)
        session.exec(stmt)
        print("   ✓ Token events deleted")
        
        # Delete participants
        stmt = delete(Participant)
        session.exec(stmt)
        print("   ✓ Participants deleted")
        
        # Delete meetings
        stmt = delete(Meeting)
        session.exec(stmt)
        print("   ✓ Meetings deleted\n")
        
        # Delete all other users except admin
        print("3️⃣  Deleting other users...")
        stmt = delete(User).where(User.id != admin_id)
        result = session.exec(stmt)
        print(f"   ✓ Other users deleted\n")
        
        # Update admin password
        print("4️⃣  Updating admin password...")
        admin.hashed_password = hash_password("TestPassword123!")
        session.add(admin)
        
        session.commit()
        print("   ✓ Admin password updated\n")
        
        # Verify
        print("✅ Database cleaned successfully!\n")
        print("📊 Final state:")
        print(f"   Users: {session.exec(select(User)).all()}")
        print(f"   Meetings: {session.exec(select(Meeting)).all()}")
        print(f"\n🔑 Admin credentials:")
        print(f"   Email: jadjahouisso@gmail.com")
        print(f"   Password: TestPassword123!")
        
        return True

if __name__ == "__main__":
    try:
        success = cleanup_database()
        if success:
            print("\n✅ Cleanup complete!")
        else:
            print("\n❌ Cleanup failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
