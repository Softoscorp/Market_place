import os
from dotenv import load_dotenv
load_dotenv(".env")

from app.database import engine

def migrate():
    with engine.begin() as conn:
        conn.exec_driver_sql("ALTER TABLE listings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT '£' NOT NULL;")

if __name__ == "__main__":
    migrate()
    print("Migration successful.")
