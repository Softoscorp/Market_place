"""Adds listing analytics: click_count column + listing_daily_stats table.

- click_count: one integer column on listings (same pattern as view_count).
- listing_daily_stats: bounded rollup (one row per listing per day) with a
  unique constraint on (listing_id, day). Used for the agent dashboard's
  per-day view/click trends without storing unbounded event rows.

Safe to run repeatedly — no-op when already applied.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from app.database import engine


def upgrade():
    with engine.begin() as conn:
        # 1) click_count column
        cols = {
            row[0]
            for row in conn.execute(
                text("SELECT column_name FROM information_schema.columns WHERE table_name = 'listings'")
            )
        }
        if "click_count" not in cols:
            conn.execute(
                text("ALTER TABLE listings ADD COLUMN click_count INTEGER NOT NULL DEFAULT 0")
            )
            print("Added listings.click_count")
        else:
            print("listings.click_count already exists.")

        # 2) listing_daily_stats table
        exists = conn.execute(
            text(
                "SELECT 1 FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'listing_daily_stats'"
            )
        ).first()
        if not exists:
            conn.execute(
                text(
                    """
                    CREATE TABLE listing_daily_stats (
                        id SERIAL PRIMARY KEY,
                        listing_id INTEGER NOT NULL REFERENCES listings(id),
                        day DATE NOT NULL,
                        views INTEGER NOT NULL DEFAULT 0,
                        clicks INTEGER NOT NULL DEFAULT 0,
                        CONSTRAINT uq_listing_daily_stat UNIQUE (listing_id, day)
                    )
                    """
                )
            )
            conn.execute(
                text("CREATE INDEX ix_listing_daily_stats_listing_id ON listing_daily_stats (listing_id)")
            )
            print("Created listing_daily_stats table.")
        else:
            print("listing_daily_stats already exists.")


if __name__ == "__main__":
    upgrade()