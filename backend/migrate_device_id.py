import os
import sys
import logging
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load DB URL from .env if needed, but it should be available in the environment 
# if we just run it directly or read it manually. Actually, let's load it from .env.
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    logger.error("DATABASE_URL not set")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

def run_migration():
    logger.info("Starting migration to add device_id to users table...")
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' and column_name='device_id';
            """))
            if not result.fetchone():
                logger.info("Adding device_id column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN device_id VARCHAR(255);"))
                conn.commit()
                logger.info("Successfully added device_id column.")
            else:
                logger.info("Column device_id already exists.")
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            conn.rollback()

if __name__ == "__main__":
    run_migration()
