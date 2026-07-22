import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


class UserRole(str, enum.Enum):
    renter = "renter"
    agent = "agent"
    admin = "admin"
    customer_care = "customer_care"


class AccountStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"
    banned = "banned"


class HouseType(str, enum.Enum):
    studio_1_0 = "1+0"
    one_bed = "1+1"
    two_bed = "2+1"
    three_bed = "3+1"
    four_bed = "4+1"


class ListingStatus(str, enum.Enum):
    active = "active"
    rented = "rented"
    inactive = "inactive"


class MessageType(str, enum.Enum):
    text = "text"
    voice = "voice"


class ReportTargetType(str, enum.Enum):
    user = "user"
    listing = "listing"


class ReportStatus(str, enum.Enum):
    pending = "pending"
    reviewed = "reviewed"


class KYCStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)  # never exposed publicly — see schemas.py
    role = Column(Enum(UserRole), nullable=False)
    language = Column(String, nullable=False, default="en")  # ISO-ish code: en, tr, fr, ru...
    account_status = Column(Enum(AccountStatus), nullable=False, default=AccountStatus.active)
    status_reason = Column(String, nullable=True)  # why an admin banned/suspended them

    # Only meaningful for agents; false/ignored for renters and admins.
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    listings = relationship("Listing", back_populates="agent", cascade="all, delete-orphan")

    def agent_rating_summary(self, db) -> tuple[float | None, int]:
        from sqlalchemy import func

        avg, count = (
            db.query(func.avg(AgentRating.stars), func.count(AgentRating.id))
            .filter(AgentRating.agent_id == self.id)
            .first()
        )
        # Postgres's AVG() on an Integer column returns a Decimal, not a
        # float — round() on a Decimal stays a Decimal, which then
        # serializes as a JSON string ("5.00") instead of a number (5.0).
        # SQLite's AVG() returns a plain float, which is why this only
        # shows up against real Postgres. Cast explicitly.
        return (round(float(avg), 2) if avg is not None else None, count or 0)


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=False, default="")
    price = Column(Float, nullable=False)  # monthly rent
    house_type = Column(Enum(HouseType), nullable=False)
    location = Column(String, nullable=False)  # free-text area/neighborhood

    furnished = Column(Boolean, default=False)
    parking = Column(Boolean, default=False)
    pet_friendly = Column(Boolean, default=False)

    status = Column(Enum(ListingStatus), nullable=False, default=ListingStatus.active)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    agent = relationship("User", back_populates="listings")
    photos = relationship(
        "ListingPhoto", back_populates="listing", cascade="all, delete-orphan",
        order_by="ListingPhoto.order",
    )

    def rating_summary(self, db) -> tuple[float | None, int]:
        from sqlalchemy import func

        avg, count = (
            db.query(func.avg(ApartmentRating.stars), func.count(ApartmentRating.id))
            .filter(ApartmentRating.listing_id == self.id)
            .first()
        )
        # Same Decimal-vs-float issue as User.agent_rating_summary above.
        return (round(float(avg), 2) if avg is not None else None, count or 0)


class ListingPhoto(Base):
    __tablename__ = "listing_photos"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    url = Column(String, nullable=False)
    order = Column(Integer, default=0)

    listing = relationship("Listing", back_populates="photos")


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (
        UniqueConstraint("listing_id", "renter_id", name="uq_listing_renter_conversation"),
    )

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    renter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    listing = relationship("Listing")
    renter = relationship("User", foreign_keys=[renter_id])
    agent = relationship("User", foreign_keys=[agent_id])
    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan",
        order_by="Message.created_at",
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message_type = Column(Enum(MessageType), nullable=False, default=MessageType.text)

    # Text messages: original content + the language it was written in
    # (assumed to be the sender's profile language at send time).
    original_text = Column(Text, nullable=True)
    original_language = Column(String, nullable=True)

    # Cache of translations already computed, keyed by target language code,
    # e.g. {"tr": "...", "fr": "..."} — avoids re-calling the translation API
    # every time the same message is displayed again.
    translations = Column(JSON, nullable=True)

    # Voice messages
    audio_url = Column(String, nullable=True)
    audio_duration_seconds = Column(Float, nullable=True)

    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")


class ApartmentRating(Base):
    __tablename__ = "apartment_ratings"
    __table_args__ = (UniqueConstraint("listing_id", "renter_id", name="uq_listing_renter_rating"),)

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    renter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stars = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    listing = relationship("Listing")
    renter = relationship("User")


class AgentRating(Base):
    __tablename__ = "agent_ratings"
    __table_args__ = (UniqueConstraint("agent_id", "renter_id", name="uq_agent_renter_rating"),)

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    renter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stars = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("User", foreign_keys=[agent_id])
    renter = relationship("User", foreign_keys=[renter_id])


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_type = Column(Enum(ReportTargetType), nullable=False)
    target_id = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(ReportStatus), nullable=False, default=ReportStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)

    reporter = relationship("User")


class RoommateProfile(Base):
    __tablename__ = "roommate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    occupation = Column(String, nullable=False)
    university = Column(String, nullable=True)
    profile_type = Column(String, nullable=False, default="roommate") # "roommate" or "housemate"
    house_type = Column(String, nullable=True) # e.g. "2+1", "3+1"
    nationality = Column(String, nullable=True)
    budget = Column(Integer, nullable=False)
    looking_for_city = Column(JSON, nullable=False)  # list of cities
    move_in_date = Column(DateTime, nullable=False)
    duration_months = Column(Integer, nullable=False)
    bio = Column(Text, nullable=False)
    habits = Column(JSON, nullable=False)  # list of habits
    gender_preference = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class SavedProperty(Base):
    __tablename__ = "saved_properties"
    __table_args__ = (UniqueConstraint("user_id", "listing_id", name="uq_user_saved_property"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    listing = relationship("Listing")


class KYCDocument(Base):
    __tablename__ = "kyc_documents"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_url = Column(String, nullable=False)
    status = Column(Enum(KYCStatus), nullable=False, default=KYCStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("User")
