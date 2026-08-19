from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from .. import models


def batch_respond_rates(db: Session, agent_ids) -> dict[int, float]:
    """Respond rate for many agents in 2 queries (conversations + messages)."""
    agent_ids = set(agent_ids)
    if not agent_ids:
        return {}

    cutoff = datetime.utcnow() - timedelta(days=60)
    conversations = (
        db.query(models.Conversation)
        .filter(
            models.Conversation.agent_id.in_(agent_ids),
            models.Conversation.created_at >= cutoff,
        )
        .all()
    )
    conv_ids = [conv.id for conv in conversations]
    messages_by_conv: dict[int, list[models.Message]] = {}
    if conv_ids:
        msgs = (
            db.query(models.Message)
            .filter(models.Message.conversation_id.in_(conv_ids))
            .order_by(models.Message.created_at.asc())
            .all()
        )
        for msg in msgs:
            messages_by_conv.setdefault(msg.conversation_id, []).append(msg)

    responded_by_agent: dict[int, int] = {}
    measurable_by_agent: dict[int, int] = {}
    for conv in conversations:
        agent_id = conv.agent_id
        conv_msgs = messages_by_conv.get(conv.id, [])
        renter_msgs = [m for m in conv_msgs if m.sender_id != agent_id]
        agent_msgs = [m for m in conv_msgs if m.sender_id == agent_id]

        if not renter_msgs:
            continue

        first_renter_msg = renter_msgs[0]
        measurable_by_agent[agent_id] = measurable_by_agent.get(agent_id, 0) + 1
        deadline = first_renter_msg.created_at + timedelta(hours=24)
        if any(m.created_at <= deadline for m in agent_msgs):
            responded_by_agent[agent_id] = responded_by_agent.get(agent_id, 0) + 1

    rates: dict[int, float] = {}
    for agent_id in agent_ids:
        measurable = measurable_by_agent.get(agent_id, 0)
        # No measurable conversations → no rate to report (frontend shows 'New')
        if not measurable:
            continue
        rates[agent_id] = round((responded_by_agent.get(agent_id, 0) / measurable) * 100, 1)
    return rates
