"""Adds `selfie_url` and `passport_url` columns to `verification_applications`.

Verification now requires two documents — a selfie and a passport — so a
single uploaded passport alone is no longer accepted.

Safe to run repeatedly — no-op if the columns already exist.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.database import engine


def upgrade():
    with engine.begin() as conn:
        for column in ("selfie_url", "passport_url"):
            exists = conn.execute(
                text(
                    "SELECT 1 FROM information_schema.columns "
                    "WHERE table_schema = 'public' AND table_name = 'verification_applications' "
                    "AND column_name = :name"
                ),
                {"name": column},
            ).first()
            if exists:
                print(f"Column {column} already exists.")
                continue
            conn.execute(text(f"ALTER TABLE verification_applications ADD COLUMN {column} TEXT"))
            print(f"Added {column} column to verification_applications.")


if __name__ == "__main__":
    upgrade()