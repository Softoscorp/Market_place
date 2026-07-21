import os
from sqlalchemy import create_engine, text
from app.config import settings

def run_migration():
    print(f"Connecting to database: {settings.database_url[:30]}...")
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        print("Executing ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;")
        conn.execute(text("ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;"))
        conn.commit()
        print("Migration successful: users.phone column is now nullable.")

if __name__ == "__main__":
    run_migration()
