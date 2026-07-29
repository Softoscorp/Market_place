import os
from sqlalchemy import create_engine, text
from app.config import settings

engine = create_engine(settings.database_url)
with engine.connect() as conn:
    res = conn.execute(text("SELECT id, name, role FROM users LIMIT 10"))
    for row in res:
        print(row)
