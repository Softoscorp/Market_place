"""Adds the `quality_report` JSON column to `verification_applications`.

Stores the automatic photo quality checks (blur/brightness/white-background)
so admins can see how the uploads scored.

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
                "WHERE table_schema = 'public' AND table_name = 'verification_applications' "
                "AND column_name = 'quality_report'"
            )
        ).first()
        if exists:
            print("Column quality_report already exists.")
            return
        conn.execute(text("ALTER TABLE verification_applications ADD COLUMN quality_report JSON"))
        print("Added quality_report column to verification_applications.")


if __name__ == "__main__":
    upgrade()