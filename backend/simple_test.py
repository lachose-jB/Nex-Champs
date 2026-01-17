#!/usr/bin/env python3

"""
Simple test script to verify the backend works without complex imports.
This script tests the core functionality directly.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("🧪 Testing Nex-Champs Backend Components")
print("=" * 50)

# Test 1: Database connection
print("🔧 Test 1: Database connection...")
try:
    from sqlmodel import SQLModel, create_engine, Session
    from sqlalchemy.orm import sessionmaker

    # Create a simple in-memory database for testing
    engine = create_engine("sqlite:///:memory:", echo=False)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Test database connection
    db = SessionLocal()
    from sqlalchemy import text
    db.execute(text("SELECT 1"))
    db.close()

    print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Database connection failed: {e}")

# Test 2: Model imports
print("\n🔧 Test 2: Model imports...")
try:
    from models.meetings import Meeting
    from models.participants import Participant
    from models.tokens import TokenEvent
    from models.phases import Phase
    from models.annotations import Annotation
    from models.decisions import Decision

    print("✅ All models imported successfully")
except Exception as e:
    print(f"❌ Model import failed: {e}")

# Test 3: JWT authentication
print("\n🔧 Test 3: JWT authentication...")
try:
    from utils.auth import create_access_token, get_password_hash

    # Test token creation
    token = create_access_token({"sub": "test_user"})
    if token:
        print("✅ JWT token creation successful")
    else:
        print("❌ JWT token creation failed")

    # Test password hashing
    hashed_password = get_password_hash("test_password")
    if hashed_password:
        print("✅ Password hashing successful")
    else:
        print("❌ Password hashing failed")

except Exception as e:
    print(f"❌ JWT authentication failed: {e}")

# Test 4: WebSocket manager
print("\n🔧 Test 4: WebSocket manager...")
try:
    from websocket import ConnectionManager

    manager = ConnectionManager()
    print("✅ WebSocket manager created successfully")
except Exception as e:
    print(f"❌ WebSocket manager failed: {e}")
    # Try to import WebSocket components directly
    try:
        from fastapi import WebSocket
        print("✅ WebSocket components available")
    except Exception as e2:
        print(f"❌ WebSocket components failed: {e2}")

# Test 5: Role management
print("\n🔧 Test 5: Role management...")
try:
    from utils.roles import RoleManager, Role

    role_manager = RoleManager()
    print("✅ Role manager created successfully")

    # Test role assignment
    role_manager.set_user_role(1, "test_user", Role.PARTICIPANT)
    role = role_manager.get_user_role(1, "test_user")
    if role == Role.PARTICIPANT:
        print("✅ Role assignment successful")
    else:
        print("❌ Role assignment failed")

except Exception as e:
    print(f"❌ Role management failed: {e}")

print("\n" + "=" * 50)
print("🎉 Basic functionality tests completed!")
print("\n📋 Next steps:")
print("1. Run 'uvicorn main:app --reload' to start the server")
print("2. Test API endpoints with curl or Postman")
print("3. Test WebSocket connections with JavaScript")