"""Creates the `claims` table for the claim/reserve feature.

A claim is a first-come-first-served hold on a listing or roommate profile.
Only one ACTIVE claim may exist per target: enforced by a partial unique
index on (target_type, target_id) WHERE status = 'claimed', so released
claims can be claimed again later.

Safe to run repeatedly — no-op if the table already exists.
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
                "SELECT 1 FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'claims'"
            )
        ).first()
        if not exists:
            conn.execute(
                text(
                    """
                    CREATE TABLE claims (
                        id SERIAL PRIMARY KEY,
                        target_type VARCHAR NOT NULL,
                        target_id INTEGER NOT NULL,
                        claimer_id INTEGER NOT NULL REFERENCES users(id),
                        status VARCHAR NOT NULL DEFAULT 'claimed',
                        created_at TIMESTAMP DEFAULT now(),
                        released_at TIMESTAMP,
                        released_by INTEGER REFERENCES users(id),
                        completed_at TIMESTAMP
                    )
                    """
                )
            )
            conn.execute(
                text(
                    """
                    CREATE UNIQUE INDEX uq_claims_active_target
                    ON claims (target_type, target_id)
                    WHERE status = 'claimed'
                    """
                )
            )
            print("Created claims table + partial unique index.")
        else:
            # Idempotent upgrades for the running table.
            cols = {
                row[0]
                for row in conn.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_name = 'claims'"
                    )
                )
            }
            if "released_by" not in cols:
                conn.execute(
                    text("ALTER TABLE claims ADD COLUMN released_by INTEGER REFERENCES users(id)")
                )
            if "completed_at" not in cols:
                conn.execute(text("ALTER TABLE claims ADD COLUMN completed_at TIMESTAMP"))
            print("claims table already exists — applied column upgrades.")


if __name__ == "__main__":
    upgrade()