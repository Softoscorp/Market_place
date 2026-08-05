from sqlalchemy import text
from app.database import engine
from app.models import Base

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN verification_tier VARCHAR NOT NULL DEFAULT 'none'"))
        conn.commit()
        print("Added verification_tier to users.")
    except Exception as e:
        if "duplicate column" in str(e).lower():
            print("Column verification_tier already exists.")
        else:
            print(f"Alter failed: {e}")

with engine.connect() as conn:
    try:
        conn.execute(text("UPDATE users SET verification_tier = 'local' WHERE is_verified = true"))
        conn.commit()
        print("Migrated existing verified users to local tier.")
    except Exception as e:
        print(f"Update failed: {e}")

Base.metadata.create_all(bind=engine)
print("Created new tables.")
