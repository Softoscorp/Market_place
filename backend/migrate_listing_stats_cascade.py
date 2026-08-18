"""Fixes listing_daily_stats FK to cascade on listing delete.

The original migrate_listing_stats.py created the FK without ON DELETE
CASCADE, so deleting a listing with daily rollup rows failed with a
foreign-key violation. This drops and re-adds the FK with CASCADE.

Idempotent — checks the FK before altering.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.database import engine


def upgrade():
    with engine.begin() as conn:
        fk_rows = conn.execute(
            text(
                """
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE table_schema = 'public'
                  AND table_name = 'listing_daily_stats'
                  AND constraint_type = 'FOREIGN KEY'
                """
            )
        ).fetchall()

        if not fk_rows:
            print("No FK found on listing_daily_stats — adding one with CASCADE.")
            conn.execute(
                text(
                    "ALTER TABLE listing_daily_stats "
                    "ADD CONSTRAINT fk_listing_daily_stats_listing "
                    "FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE"
                )
            )
            print("Added FK with CASCADE.")
        else:
            name = fk_rows[0][0]
            conn.execute(
                text(f"ALTER TABLE listing_daily_stats DROP CONSTRAINT {name}")
            )
            conn.execute(
                text(
                    "ALTER TABLE listing_daily_stats "
                    "ADD CONSTRAINT fk_listing_daily_stats_listing "
                    "FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE"
                )
            )
            print(f"Replaced FK {name} with CASCADE.")
            if len(fk_rows) > 1:
                print(f"Warning: found {len(fk_rows)} FKs — expected 1.")


if __name__ == "__main__":
    upgrade()