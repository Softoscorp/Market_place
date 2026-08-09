import os
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import models
from app.database import Base
from app.routers import listings


def test_get_agent_metrics_batches_ratings_and_respond_rate():
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

        # Two 4.5-star ratings + one 4-star = average 4.33 (one rating per renter)
        renters = []
        for i, stars in enumerate((5, 4, 4)):
            r = models.User(
                email=f"renter{i}@example.com",
                password_hash="hash",
                name="Renter",
                role=models.UserRole.renter,
                language="en",
            )
            db.add(r)
            db.commit()
            db.refresh(r)
            renters.append(r)
            db.add(models.AgentRating(agent_id=agent.id, renter_id=r.id, stars=stars))
        db.commit()

        # Conversation with a renter message and a prompt agent reply -> respond rate 100%
        conv = models.Conversation(renter_id=renters[0].id, agent_id=agent.id)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        db.add(models.Message(conversation_id=conv.id, sender_id=renters[0].id, message_type=models.MessageType.text))
        db.add(models.Message(conversation_id=conv.id, sender_id=agent.id, message_type=models.MessageType.text))
        db.commit()

        metrics = listings._get_agent_metrics(db, [listing_one, listing_two])
        assert metrics[agent.id]["average_rating"] == 4.33
        assert metrics[agent.id]["rating_count"] == 3
        assert metrics[agent.id]["respond_rate"] == 100.0

        # Cached call returns instantly and identically
        cached = listings._get_agent_metrics(db, [listing_one, listing_two])
        assert cached == metrics
    finally:
        db.close()
