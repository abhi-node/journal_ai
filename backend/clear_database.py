#!/usr/bin/env python3
"""
Script to clear all data from the database while keeping the schema intact.
This will delete all users, notes, reviews, and refresh tokens.
"""

import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.user import User
from app.models.note import Note
from app.models.review import Review
from app.models.refresh_token import RefreshToken

def clear_database():
    """Clear all data from the database."""
    
    # Create database engine
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    try:
        db = SessionLocal()
        
        print("Starting database clearing process...")
        print("-" * 50)
        
        # Count existing records
        user_count = db.query(User).count()
        note_count = db.query(Note).count()
        review_count = db.query(Review).count()
        token_count = db.query(RefreshToken).count()
        
        print(f"Current database status:")
        print(f"  Users: {user_count}")
        print(f"  Notes: {note_count}")
        print(f"  Reviews: {review_count}")
        print(f"  Refresh Tokens: {token_count}")
        print("-" * 50)
        
        if user_count == 0 and note_count == 0 and review_count == 0 and token_count == 0:
            print("Database is already empty. Nothing to clear.")
            return
        
        # Confirm with user
        response = input("\n⚠️  WARNING: This will delete ALL data from the database!\n" + 
                        "Are you sure you want to continue? (yes/no): ")
        
        if response.lower() != 'yes':
            print("Operation cancelled.")
            return
        
        print("\nClearing database...")
        
        # Delete all records (cascade will handle related records)
        # Delete in order to respect foreign key constraints
        deleted_tokens = db.query(RefreshToken).delete()
        print(f"  ✓ Deleted {deleted_tokens} refresh tokens")
        
        deleted_reviews = db.query(Review).delete()
        print(f"  ✓ Deleted {deleted_reviews} reviews")
        
        deleted_notes = db.query(Note).delete()
        print(f"  ✓ Deleted {deleted_notes} notes")
        
        deleted_users = db.query(User).delete()
        print(f"  ✓ Deleted {deleted_users} users")
        
        # Commit the changes
        db.commit()
        
        print("-" * 50)
        print("✅ Database cleared successfully!")
        
        # Verify clearing
        final_user_count = db.query(User).count()
        final_note_count = db.query(Note).count()
        final_review_count = db.query(Review).count()
        final_token_count = db.query(RefreshToken).count()
        
        print(f"\nFinal database status:")
        print(f"  Users: {final_user_count}")
        print(f"  Notes: {final_note_count}")
        print(f"  Reviews: {final_review_count}")
        print(f"  Refresh Tokens: {final_token_count}")
        
    except Exception as e:
        print(f"\n❌ Error clearing database: {str(e)}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 50)
    print("DATABASE CLEARING UTILITY")
    print("=" * 50)
    clear_database()