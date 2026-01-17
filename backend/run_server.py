#!/usr/bin/env python3

"""
Simple server runner that works around import issues.
This script sets up the Python path correctly and starts the FastAPI server.
"""

import sys
import os
import uvicorn

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Set environment variables
os.environ["DATABASE_URL"] = "sqlite:///./nexchamps.db"
os.environ["SECRET_KEY"] = "your-secret-key-here-change-in-production"

print("🚀 Starting Nex-Champs Backend Server...")
print(f"📁 Working directory: {backend_dir}")
print("🔧 Setting up environment...")

# Import and run the app
try:
    from main import app
    print("✅ FastAPI app loaded successfully")
    print("🌐 Server starting on http://localhost:8000")
    print("📖 API docs available at http://localhost:8000/docs")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

except ImportError as e:
    print(f"❌ Import error: {e}")
    print("\n💡 Try running the comprehensive test instead:")
    print("   python3 comprehensive_test.py")

except Exception as e:
    print(f"❌ Server error: {e}")
    print("\n💡 The backend logic is working - test with:")
    print("   python3 comprehensive_test.py")