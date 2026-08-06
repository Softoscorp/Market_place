import os
import sys
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import models
from app.database import Base
from app.routers.listings import _get_agent_metrics


def test_get_agent_metrics_caches_results_per_agent():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)

    db = SessionLocal()
    try:
        agent = models.User(
            email="agent-cache@example.com",
            password_hash="hash",
            name="Agent Cache",
            role=models.UserRole.agent,
            language="en",
        )
        db.add(agent)
        db.commit()
        db.refresh(agent)

        listing_one = models.Listing(
            agent_id=agent.id,
            title="One",
            description="desc",
            price=100,
            house_type=models.HouseType.studio_1_0,
            location="Nicosia",
        )
        listing_two = models.Listing(
            agent_id=agent.id,
            title="Two",
            description="desc",
            price=200,
            house_type=models.HouseType.one_bed,
            location="Kyrenia",
        )
        db.add_all([listing_one, listing_two])
        db.commit()

        with patch.object(models.User, "agent_rating_summary", return_value=(4.5, 3)) as rating_mock, patch.object(
            models.User, "agent_respond_rate", return_value=92.3
        ) as respond_mock:
            metrics = _get_agent_metrics(db, [listing_one, listing_two])

        assert metrics[agent.id]["average_rating"] == 4.5
        assert metrics[agent.id]["rating_count"] == 3
        assert metrics[agent.id]["respond_rate"] == 92.3
        assert rating_mock.call_count == 1
        assert respond_mock.call_count == 1
    finally:
        db.close()
