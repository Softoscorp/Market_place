from datetime import datetime, date
from typing import Optional
import enum

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

from . import models
from .models import UserRole, AccountStatus, HouseType, ListingStatus, MessageType, ReportTargetType, ReportStatus, KYCStatus, VerificationTier, VerificationStatus


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
    device_id: Optional[str] = None

    @field_validator("role")
    @classmethod
    def reject_admin_registration(cls, value: UserRole) -> UserRole:
        if value in (UserRole.admin, UserRole.customer_care):
            raise ValueError("Admin and customer-care accounts can't be self-registered")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SupabaseAuthRequest(BaseModel):
    access_token: str
    role: Optional[UserRole] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str = Field(min_length=6)


class PublicUserOut(BaseModel):
    """Safe to show to anyone — used for agent profiles, listing 'posted by', etc."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    role: UserRole
    is_verified: bool
    verification_tier: VerificationTier = VerificationTier.none
    avatar_url: Optional[str] = None
    respond_rate: Optional[float] = None
    active_listings: Optional[int] = None
    last_seen_at: Optional[datetime] = None
    created_at: datetime


class MeOut(BaseModel):
    """Only ever returned to the account owner."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: UserRole
    language: str
    is_verified: bool
    verification_tier: VerificationTier = VerificationTier.none
    account_status: AccountStatus
    avatar_url: Optional[str] = None
    respond_rate: Optional[float] = None
    last_seen_at: Optional[datetime] = None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: MeOut


class UpdateMeRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = None


class PushTokenRequest(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


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
    distance_to_university: Optional[float] = 0.0
    upfront_rent_months: int = 1
    deposit_months: int = 1
    commission_months: int = 1
    furnished: bool = False
    parking: bool = False
    pet_friendly: bool = False
    generator: bool = False
    pool: bool = False
    gym: bool = False
    currency: str = "£"


class ListingUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    house_type: Optional[HouseType] = None
    location: Optional[str] = None
    upfront_rent_months: Optional[int] = None
    deposit_months: Optional[int] = None
    commission_months: Optional[int] = None
    furnished: Optional[bool] = None
    parking: Optional[bool] = None
    pet_friendly: Optional[bool] = None
    generator: Optional[bool] = None
    pool: Optional[bool] = None
    gym: Optional[bool] = None
    status: Optional[ListingStatus] = None
    currency: Optional[str] = None


class ListingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    price: float
    house_type: HouseType
    location: str
    distance_to_university: Optional[float] = 0.0
    upfront_rent_months: int
    deposit_months: int
    commission_months: int
    furnished: bool
    parking: bool
    pet_friendly: bool
    generator: bool = False
    pool: bool = False
    gym: bool = False
    status: ListingStatus
    currency: str
    view_count: int = 0
    agent: PublicUserOut
    photos: list[ListingPhotoOut] = []
    agent_average_rating: Optional[float] = None
    agent_rating_count: int = 0
    created_at: datetime
    updated_at: datetime


class ListingTranslationOut(BaseModel):
    """On-demand translation of a listing's title + description."""
    id: int
    title: str
    description: str
    target_lang: str


class PaginatedListings(BaseModel):
    items: list[ListingOut]
    total: int
    page: int
    page_size: int


class LocationCount(BaseModel):
    location: str
    count: int


# ============================================================================
# Claims
# ============================================================================

class ClaimTargetType(str, enum.Enum):
    listing = "listing"
    roommate = "roommate"


class ClaimRequest(BaseModel):
    target_type: ClaimTargetType
    target_id: int


class ClaimOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    target_type: str
    target_id: int
    claimer_id: int
    claimer_name: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class ClaimStatusOut(BaseModel):
    claimed: bool
    by_me: bool = False
    claimer_name: Optional[str] = None
    created_at: Optional[datetime] = None
    can_release: bool = False


class ClaimTrustOut(BaseModel):
    trust: int
    active: int
    max_active: int
    completed: int
    owner_released: int
    self_cancelled: int


# ============================================================================
# Listing analytics (agent dashboard)
# ============================================================================

class DailyStatPoint(BaseModel):
    day: date
    views: int
    clicks: int


class ListingStat(BaseModel):
    id: int
    title: str
    views: int
    clicks: int
    saves: int
    messages: int
    claims: int
    completed: int
    daily: list[DailyStatPoint] = []


class ListingStatsTotals(BaseModel):
    views: int = 0
    clicks: int = 0
    saves: int = 0
    messages: int = 0
    claims: int = 0
    completed: int = 0


class ListingStatsOut(BaseModel):
    listings: list[ListingStat] = []
    totals: ListingStatsTotals = ListingStatsTotals()


# ============================================================================
# Messaging
# ============================================================================

class StartConversationRequest(BaseModel):
    listing_id: Optional[int] = None
    agent_id: Optional[int] = None
    message: Optional[str] = None


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    conversation_id: int
    sender_id: int
    message_type: MessageType
    # `text` is what the READER should see: original if same-language,
    # translated (and cached) otherwise. `original_text` is always the raw
    # text as the sender wrote it, so clients can offer a "show original"
    # toggle. See routers/messaging.py.
    text: Optional[str] = None
    original_text: Optional[str] = None
    original_language: Optional[str] = None
    was_translated: bool = False
    audio_url: Optional[str] = None
    audio_duration_seconds: Optional[float] = None
    image_url: Optional[str] = None
    listing_id: Optional[int] = None
    listing: Optional[ListingOut] = None
    is_read: bool
    created_at: datetime


class SendListingMessageRequest(BaseModel):
    listing_id: int


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    listing: Optional[ListingOut] = None
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


class AdminConversationUserOut(BaseModel):
    """Participant with email — only exposed to admin/customer_care."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr


class AdminConversationOut(BaseModel):
    """Conversation with participant emails — only exposed to admin/customer_care."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    renter: AdminConversationUserOut
    agent: AdminConversationUserOut
    last_message_at: datetime


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
    template_key: Optional[str] = None


class EmailLogOut(BaseModel):
    """Record of an email sent through the admin panel — admin-only audit."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    sender: PublicUserOut
    recipient_email: EmailStr
    subject: str
    template_key: Optional[str] = None
    created_at: datetime


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
    verification_tier: VerificationTier = VerificationTier.none
    account_status: AccountStatus
    status_reason: Optional[str] = None
    last_seen_at: Optional[datetime] = None
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
    photos: Optional[list[str]] = None


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
    photos: Optional[list[str]]
    created_at: datetime
    user: PublicUserOut


class MatchReason(BaseModel):
    key: str
    params: Optional[dict[str, str]] = None


class RoommateMatchOut(BaseModel):
    profile: RoommateProfileOut
    score: int
    reasons: list[MatchReason]


class PhotoUploadOut(BaseModel):
    url: str


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


# ============================================================================
# Verifications
# ============================================================================

class VerificationApplicationCreate(BaseModel):
    proof_urls: list[str] = []
    selfie_url: str
    passport_url: str
    quality_report: Optional[dict] = None
    tier: VerificationTier

    @field_validator("selfie_url", "passport_url")
    @classmethod
    def validate_document_url(cls, value: str) -> str:
        if not value.startswith(("http://", "https://")):
            raise ValueError("Document URL must be a valid http(s) link")
        return value

    @field_validator("proof_urls")
    @classmethod
    def validate_proof_urls(cls, value: list[str]) -> list[str]:
        allowed = ("http://", "https://")
        cleaned = []
        for url in value:
            if not isinstance(url, str) or not url.startswith(allowed):
                raise ValueError("Proof URLs must be valid http(s) links")
            cleaned.append(url)
        return cleaned


class VerificationApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    agent_id: int
    tier: VerificationTier
    status: VerificationStatus
    proof_urls: list[str] = []
    selfie_url: Optional[str] = None
    passport_url: Optional[str] = None
    quality_report: Optional[dict] = None
    reviewer_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

class DeactivateAccountRequest(BaseModel):
    reason: str | None = None

class AdminSetAccountStatusRequest(BaseModel):
    status: models.AccountStatus
    status_reason: str | None = None
