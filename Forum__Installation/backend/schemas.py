from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, field_validator
import re


# ─── Auth ────────────────────────────────────────────────────────────────────────
class AdminLoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    token: str
    role: str
    username: str

class AdminCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "admin"

class AdminOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Event ────────────────────────────────────────────────────────────────────────
class EventCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    banner: Optional[str] = None
    logo: Optional[str] = None
    qr_image: Optional[str] = None
    payment_link: Optional[str] = None
    whatsapp_link: Optional[str] = None
    eligibility: Optional[str] = None
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    registration_deadline: Optional[str] = None
    registration_start_date: Optional[str] = None
    registration_end_date: Optional[str] = None
    registration_fee: float = 0.0
    team_size: int = 2
    max_participants: int = 30
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    rules: Optional[str] = None
    prizes: Optional[str] = None
    tags: Optional[list[str]] = None
    registration_status: str = "open"
    event_status: str = "upcoming"
    is_featured: bool = False

class EventUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    banner: Optional[str] = None
    logo: Optional[str] = None
    qr_image: Optional[str] = None
    payment_link: Optional[str] = None
    whatsapp_link: Optional[str] = None
    eligibility: Optional[str] = None
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    registration_deadline: Optional[str] = None
    registration_start_date: Optional[str] = None
    registration_end_date: Optional[str] = None
    registration_fee: Optional[float] = None
    team_size: Optional[int] = None
    max_participants: Optional[int] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    rules: Optional[str] = None
    prizes: Optional[str] = None
    tags: Optional[list[str]] = None
    registration_status: Optional[str] = None
    result_status: Optional[str] = None
    event_status: Optional[str] = None
    is_featured: Optional[bool] = None

class EventOut(BaseModel):
    id: int
    title: str
    slug: str
    subtitle: Optional[str] = None
    banner: Optional[str] = None
    logo: Optional[str] = None
    qr_image: Optional[str] = None
    payment_link: Optional[str] = None
    whatsapp_link: Optional[str] = None
    eligibility: Optional[str] = None
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    registration_deadline: Optional[str] = None
    registration_start_date: Optional[str] = None
    registration_end_date: Optional[str] = None
    registration_fee: float = 0.0
    team_size: int = 2
    max_participants: int = 30
    registered_count: int = 0
    approved_count: int = 0
    seats_left: int = 0
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    rules: Optional[str] = None
    prizes: Optional[str] = None
    tags: Optional[Any] = None
    registration_status: str
    result_status: str
    event_status: str
    is_featured: bool = False
    created_at: datetime
    model_config = {"from_attributes": True}

    # Aliases for frontend compatibility
    @property
    def max_teams(self):
        return self.max_participants

    @property
    def is_registration_open(self):
        return self.registration_status == "open"

    @property
    def registered_teams_count(self):
        return self.registered_count

    @property
    def fee(self):
        return self.registration_fee


# ─── Registration ─────────────────────────────────────────────────────────────────
class TeamRegisterRequest(BaseModel):
    event_id: int
    team_name: str
    leader_name: str
    leader_email: str
    leader_phone: str
    leader_year: Optional[str] = None
    leader_branch: Optional[str] = None
    member2_name: Optional[str] = None
    member2_email: Optional[str] = None
    member2_phone: Optional[str] = None
    member2_year: Optional[str] = None
    extra_members: Optional[list[dict]] = None
    transaction_id: Optional[str] = None
    payment_screenshot: Optional[str] = None

    @field_validator("leader_phone")
    @classmethod
    def validate_phone(cls, v):
        if not re.match(r"^\d{10}$", v):
            raise ValueError("Phone must be 10 digits")
        return v

class TeamRegisterOut(BaseModel):
    registration_id: str
    message: str

class RegistrationOut(BaseModel):
    id: int
    registration_id: str
    event_id: int
    team_name: str
    leader_name: str
    leader_email: str
    leader_phone: str
    leader_year: Optional[str] = None
    leader_branch: Optional[str] = None
    member2_name: Optional[str] = None
    member2_email: Optional[str] = None
    member2_phone: Optional[str] = None
    member2_year: Optional[str] = None
    extra_members: Optional[list[dict]] = None
    transaction_id: Optional[str] = None
    payment_screenshot: Optional[str] = None
    payment_status: str
    rejection_reason: Optional[str] = None
    email_sent: bool = False
    sms_sent: bool = False
    created_at: datetime
    model_config = {"from_attributes": True}

class RegistrationStatusUpdate(BaseModel):
    payment_status: str
    rejection_reason: Optional[str] = None


# ─── Result ─────────────────────────────────────────────────────────────────────
class ResultCreate(BaseModel):
    winner: Optional[str] = None
    winner_details: Optional[str] = None
    runner_up: Optional[str] = None
    runner_up_details: Optional[str] = None
    second_runner_up: Optional[str] = None
    second_runner_up_details: Optional[str] = None
    additional_winners: Optional[dict] = None
    announcement_date: Optional[str] = None

class ResultOut(BaseModel):
    id: int
    event_id: int
    winner: Optional[str] = None
    winner_details: Optional[str] = None
    runner_up: Optional[str] = None
    runner_up_details: Optional[str] = None
    second_runner_up: Optional[str] = None
    second_runner_up_details: Optional[str] = None
    additional_winners: Optional[dict] = None
    announcement_date: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Gallery ─────────────────────────────────────────────────────────────────────
class GalleryAlbumCreate(BaseModel):
    event_id: Optional[int] = None
    album_name: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    images: Optional[list[str]] = []
    videos: Optional[list[str]] = []
    is_public: bool = True

class GalleryAlbumUpdate(BaseModel):
    album_name: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    images: Optional[list[str]] = None
    videos: Optional[list[str]] = None
    is_public: Optional[bool] = None

class GalleryAlbumOut(BaseModel):
    id: int
    event_id: Optional[int] = None
    album_name: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    images: Optional[list] = []
    videos: Optional[list] = []
    is_public: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Notice ─────────────────────────────────────────────────────────────────────
class NoticeCreate(BaseModel):
    title: str
    content: Optional[str] = None
    link: Optional[str] = None
    is_pinned: bool = False
    is_active: bool = True

class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    link: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_active: Optional[bool] = None

class NoticeOut(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    link: Optional[str] = None
    is_pinned: bool
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Team Member ─────────────────────────────────────────────────────────────────
class TeamMemberCreate(BaseModel):
    name: str
    role: str
    department: Optional[str] = None
    photo: Optional[str] = None
    linkedin: Optional[str] = None
    email: Optional[str] = None
    category: str  # faculty / core / executive
    sort_order: int = 0

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    photo: Optional[str] = None
    linkedin: Optional[str] = None
    email: Optional[str] = None
    category: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class TeamMemberOut(BaseModel):
    id: int
    name: str
    role: str
    department: Optional[str] = None
    photo: Optional[str] = None
    linkedin: Optional[str] = None
    email: Optional[str] = None
    category: str
    sort_order: int
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Dashboard ───────────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_events: int
    upcoming_events: int
    ongoing_events: int
    completed_events: int
    total_registrations: int
    approved_registrations: int
    pending_registrations: int
    rejected_registrations: int
    total_participants: int
    recent_registrations: list[dict] = []
    recent_events: list[dict] = []


# ─── Pagination ──────────────────────────────────────────────────────────────────
class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    pages: int

# ── Test Registrations ──
class TestRegistrationOut(BaseModel):
    id: int
    full_name: str
    email: str
    mobile: str
    college_name: str | None = None
    department: str | None = None
    year: str | None = None
    document_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class PaginatedTestRegistrations(BaseModel):
    results: list[TestRegistrationOut]
    total: int
    page: int
    limit: int
