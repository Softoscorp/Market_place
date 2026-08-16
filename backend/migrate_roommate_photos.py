"""Adds the `photos` JSON column to `roommate_profiles`.

Roommate profiles now carry a list of apartment/room photo URLs so the
roommates section can show a photo slider of the actual place before
someone decides to message the person.

Safe to run repeatedly — no-op if the column already exists.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.database import engine


def upgrade():
    with engine.begin() as conn:
        exists = conn.execute(
            text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name = 'roommate_profiles' "
                "AND column_name = 'photos'"
            )
        ).first()
        if exists:
            print("Column photos already exists.")
            return
        conn.execute(text("ALTER TABLE roommate_profiles ADD COLUMN photos JSON"))
        print("Added photos column to roommate_profiles.")


if __name__ == "__main__":
    upgrade()