#!/usr/bin/env python3
"""
Migration script to add creator_id and scheduled_at columns to Meeting table
"""
import sys
sys.path.insert(0, '.')

from sqlmodel import Session, select, text
from backend.models.meetings import Meeting
from backend.models.users import User
from backend.config import settings
from backend.database import engine
from datetime import datetime

def migrate_database():
    """Add new columns to Meeting table if they don't exist"""
    
    with Session(engine) as session:
        try:
            # Try to check if creator_id column exists
            result = session.exec(text("PRAGMA table_info(meeting)")).all()
            columns = {row[1] for row in result}
            
            if 'creator_id' not in columns:
                print("✓ Adding creator_id column to Meeting table...")
                session.exec(text("ALTER TABLE meeting ADD COLUMN creator_id INTEGER REFERENCES user(id)"))
                print("✓ creator_id column added")
            else:
                print("✓ creator_id column already exists")
            
            if 'scheduled_at' not in columns:
                print("✓ Adding scheduled_at column to Meeting table...")
                session.exec(text("ALTER TABLE meeting ADD COLUMN scheduled_at DATETIME"))
                print("✓ scheduled_at column added")
            else:
                print("✓ scheduled_at column already exists")
            
            session.commit()
            print("\n✓ Database migration completed successfully!")
            
        except Exception as e:
            print(f"✗ Migration error: {e}")
            session.rollback()
            raise

if __name__ == "__main__":
    print("Starting database migration...")
    migrate_database()
