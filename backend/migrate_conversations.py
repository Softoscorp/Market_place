import os
from sqlalchemy import create_engine, text
from app.config import settings

def run_migration():
    print(f"Connecting to database: {settings.database_url[:30]}...")
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        print("Executing ALTER TABLE conversations ALTER COLUMN listing_id DROP NOT NULL;")
        conn.execute(text("ALTER TABLE conversations ALTER COLUMN listing_id DROP NOT NULL;"))
        conn.commit()
        print("Migration successful: conversations.listing_id column is now nullable.")

if __name__ == "__main__":
    run_migration()
