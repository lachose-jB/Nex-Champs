#!/usr/bin/env python3

"""
Test script to verify the backend setup works correctly.
This script tests database initialization and basic API functionality.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db, SessionLocal
from models.meetings import Meeting
from models.participants import Participant

def test_database():
    """Test database initialization and basic operations"""
    print("🔧 Testing database setup...")

    try:
        # Initialize database
        init_db()
        print("✅ Database initialized successfully")

        # Test database connection
        db = SessionLocal()

        # Create a test meeting
        test_meeting = Meeting(name="Test Meeting", description="Testing the backend")
        db.add(test_meeting)
        db.commit()
        db.refresh(test_meeting)
        print(f"✅ Created test meeting: {test_meeting.name} (ID: {test_meeting.id})")

        # Create a test participant
        test_participant = Participant(
            meeting_id=test_meeting.id,
            user_id="test_user",
            name="Test User",
            role="participant"
        )
        db.add(test_participant)
        db.commit()
        db.refresh(test_participant)
        print(f"✅ Created test participant: {test_participant.name}")

        # Query and verify
        retrieved_meeting = db.query(Meeting).filter(Meeting.id == test_meeting.id).first()
        if retrieved_meeting:
            print(f"✅ Successfully retrieved meeting: {retrieved_meeting.name}")

        # Cleanup
        db.delete(test_participant)
        db.delete(test_meeting)
        db.commit()
        print("✅ Cleaned up test data")

        db.close()
        return True

    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def test_imports():
    """Test that all imports work correctly"""
    print("🔧 Testing imports...")

    try:
        # Test individual imports instead of import *
        from models.meetings import Meeting
        from models.participants import Participant
        from utils.auth import create_access_token
        from websocket import ConnectionManager
        from api.meetings import router as meetings_router
        print("✅ All imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Nex-Champs Backend Setup Test")
    print("=" * 50)

    tests_passed = 0
    total_tests = 2

    # Test imports
    if test_imports():
        tests_passed += 1

    # Test database
    if test_database():
        tests_passed += 1

    print("=" * 50)
    print(f"📊 Test Results: {tests_passed}/{total_tests} tests passed")

    if tests_passed == total_tests:
        print("🎉 All tests passed! Backend setup is working correctly.")
        return 0
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())