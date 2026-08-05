from sqlalchemy import text
from app.database import engine
from app.models import Base

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE listings ADD COLUMN upfront_rent_months INTEGER NOT NULL DEFAULT 1"))
        conn.execute(text("ALTER TABLE listings ADD COLUMN deposit_months INTEGER NOT NULL DEFAULT 1"))
        conn.execute(text("ALTER TABLE listings ADD COLUMN commission_months INTEGER NOT NULL DEFAULT 1"))
        conn.commit()
        print("Added upfront_rent_months, deposit_months, and commission_months to listings.")
    except Exception as e:
        if "duplicate column" in str(e).lower():
            print("Columns already exist.")
        else:
            print(f"Alter failed: {e}")

Base.metadata.create_all(bind=engine)
print("Created new tables/columns.")
