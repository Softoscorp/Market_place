from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

from .models import UserRole, AccountStatus, HouseType, ListingStatus, MessageType, ReportTargetType, ReportStatus, KYCStatus


# ============================================================================
# Auth / Users
#
# IMPORTANT: `phone` is collected at registration (required, per spec) but is
# NEVER included in any schema below that gets returned from a public-facing
# endpoint (listings, agent profiles, etc). It only ever appears in `MeOut`,
# returned from /users/me to the account owner themselves. This is what
# actually enforces "no external contact info displayed anywhere" on the API
# side, not just a UI choice to not render a field.
# ============================================================================

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    phone: Optional[str] = None
    role: UserRole
    language: str = "en"

    @field_validator("role")
    @classmethod
    def reject_admin_registration(cls, value: UserRole) -> UserRole:
        if value == UserRole.admin:
            raise ValueError("Admin accounts can't be self-registered")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PublicUserOut(BaseModel):
    """Safe to show to anyone — used for agent profiles, listing 'posted by', etc."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    role: UserRole
    is_verified: bool
    created_at: datetime


class MeOut(BaseModel):
    """Only ever returned to the account owner."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    name: str
    phone: str
    role: UserRole
    language: str
    is_verified: bool
    account_status: AccountStatus
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: MeOut


class UpdateMeRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = None


class AgentProfileOut(BaseModel):
    agent: PublicUserOut
    average_rating: Optional[float] = None
    rating_count: int
    listings: list["ListingOut"]


# ============================================================================
# Listings
# ============================================================================

class ListingPhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    url: str
    order: int


class ListingCreateRequest(BaseModel):
    title: str
    description: str = ""
    price: float = Field(ge=0)
    house_type: HouseType
    location: str
    furnished: bool = False
    parking: bool = False
    pet_friendly: bool = False


class ListingUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    house_type: Optional[HouseType] = None
    location: Optional[str] = None
    furnished: Optional[bool] = None
    parking: Optional[bool] = None
    pet_friendly: Optional[bool] = None
    status: Optional[ListingStatus] = None


class ListingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    price: float
    house_type: HouseType
    location: str
    furnished: bool
    parking: bool
    pet_friendly: bool
    status: ListingStatus
    agent: PublicUserOut
    photos: list[ListingPhotoOut] = []
    agent_average_rating: Optional[float] = None
    agent_rating_count: int = 0
    created_at: datetime
    updated_at: datetime


class PaginatedListings(BaseModel):
    items: list[ListingOut]
    total: int
    page: int
    page_size: int


# ============================================================================
# Messaging
# ============================================================================

class StartConversationRequest(BaseModel):
    listing_id: int
    message: str


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    conversation_id: int
    sender_id: int
    message_type: MessageType
    # `text` is what the READER should see: original if same-language,
    # translated (and cached) otherwise. See routers/messaging.py.
    text: Optional[str] = None
    original_language: Optional[str] = None
    was_translated: bool = False
    audio_url: Optional[str] = None
    audio_duration_seconds: Optional[float] = None
    is_read: bool
    created_at: datetime


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    listing: ListingOut
    renter: PublicUserOut
    agent: PublicUserOut
    created_at: datetime
    last_message: Optional[MessageOut] = None
    unread_count: int = 0


# ============================================================================
# Ratings
# ============================================================================

class ApartmentRatingCreateRequest(BaseModel):
    stars: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ApartmentRatingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    listing_id: int
    renter: PublicUserOut
    stars: int
    comment: Optional[str] = None
    created_at: datetime


class AgentRatingCreateRequest(BaseModel):
    stars: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class AgentRatingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    agent_id: int
    renter: PublicUserOut
    stars: int
    comment: Optional[str] = None
    created_at: datetime


# ============================================================================
# Reports
# ============================================================================

class ReportCreateRequest(BaseModel):
    target_type: ReportTargetType
    target_id: int
    reason: str


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    reporter: PublicUserOut
    target_type: ReportTargetType
    target_id: int
    reason: str
    status: ReportStatus
    created_at: datetime


class AdminReporterOut(BaseModel):
    """Reporter with email — only exposed to admin/customer_care."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr


class AdminReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    reporter: AdminReporterOut
    target_type: ReportTargetType
    target_id: int
    reason: str
    status: ReportStatus
    created_at: datetime


class SendEmailRequest(BaseModel):
    email: EmailStr
    subject: str
    content: str


# ============================================================================
# Admin
# ============================================================================

class UpdateUserStatusRequest(BaseModel):
    account_status: AccountStatus
    reason: Optional[str] = None


class UpdateUserRoleRequest(BaseModel):
    role: UserRole


class SetVerifiedRequest(BaseModel):
    is_verified: bool


class AdminUserOut(BaseModel):
    """Admin-only view — unlike PublicUserOut, admins DO need to see phone/
    email to investigate reports."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    name: str
    phone: str
    role: UserRole
    is_verified: bool
    account_status: AccountStatus
    status_reason: Optional[str] = None
    created_at: datetime


class ReviewReportRequest(BaseModel):
    status: ReportStatus


AgentProfileOut.model_rebuild()


# ============================================================================
# Roommates, Saved Properties, KYC
# ============================================================================

class RoommateProfileCreateRequest(BaseModel):
    name: str
    age: int
    gender: str
    occupation: str
    university: Optional[str] = None
    profile_type: str = "roommate"
    house_type: Optional[str] = None
    nationality: Optional[str] = None
    budget: int
    listing_id: Optional[int] = None
    looking_for_city: list[str]
    move_in_date: datetime
    duration_months: int
    bio: str
    habits: list[str]
    gender_preference: str
    avatar_url: Optional[str] = None


class RoommateProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    listing_id: Optional[int] = None
    name: str
    age: int
    gender: str
    occupation: str
    university: Optional[str]
    profile_type: str
    house_type: Optional[str]
    nationality: Optional[str]
    budget: int
    looking_for_city: list[str]
    move_in_date: datetime
    duration_months: int
    bio: str
    habits: list[str]
    gender_preference: str
    avatar_url: Optional[str]
    created_at: datetime
    user: PublicUserOut


class SavedPropertyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    listing_id: int
    created_at: datetime
    listing: ListingOut


class KYCDocumentCreateRequest(BaseModel):
    document_url: str


class KYCDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    agent_id: int
    document_url: str
    status: KYCStatus
    created_at: datetime
    agent: PublicUserOut
