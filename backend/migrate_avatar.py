from sqlalchemy import create_engine, text
from app.config import settings

def run_migration():
    print(f"Connecting to database...")
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        print("Executing ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;")
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;"))
        conn.commit()
        print("Migration successful: users.avatar_url column added.")

if __name__ == "__main__":
    run_migration()
