import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    print("DATABASE_URL is not set — nothing to test.")
    raise SystemExit(0)

engine = create_engine(DATABASE_URL)
try:
    with engine.connect() as conn:
        conn.execute(text("SELECT * FROM fcm_tokens LIMIT 1"))
        print("fcm_tokens exists")
except Exception as e:
    print(f"Error querying fcm_tokens: {e}")
