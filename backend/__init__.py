"""
Nex-Champs Backend Package

This file makes the backend directory a proper Python package.
"""

# Package version
__version__ = "0.1.0"
__author__ = "Nex-Champs Team"
__license__ = "MIT"

# Export main components for easy importing
# Import main components
from backend.main import app
from backend.config import settings
from backend.database import init_db, get_session, engine