from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    Integer, String, Text, Boolean, DateTime, Float,
    ForeignKey, Index, JSON, Enum as SAEnum, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
import enum


class AdminRole(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"


class EventStatus(str, enum.Enum):
    upcoming = "upcoming"
    ongoing = "ongoing"
    completed = "completed"
    archived = "archived"


class RegistrationStatus(str, enum.Enum):
    open = "open"
    closed = "closed"


class ResultStatus(str, enum.Enum):
    pending = "pending"
    announced = "announced"
    none = "none"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ─── Admin ──────────────────────────────────────────────────────────────────────
class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[AdminRole] = mapped_column(SAEnum(AdminRole), default=AdminRole.admin, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="admin")


# ─── Event ──────────────────────────────────────────────────────────────────────
class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    subtitle: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    banner: Mapped[Optional[str]] = mapped_column(Text, nullable=True)   # base64 or URL
    logo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    qr_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payment_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    whatsapp_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    eligibility: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    short_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    full_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    time: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    venue: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    registration_deadline: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    registration_fee: Mapped[float] = mapped_column(Float, default=0.0)
    team_size: Mapped[int] = mapped_column(Integer, default=2)
    max_participants: Mapped[int] = mapped_column(Integer, default=30)
    registered_count: Mapped[int] = mapped_column(Integer, default=0)
    approved_count: Mapped[int] = mapped_column(Integer, default=0)
    registration_start_date: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    registration_end_date: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    rules: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prizes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    registration_status: Mapped[RegistrationStatus] = mapped_column(
        SAEnum(RegistrationStatus), default=RegistrationStatus.open
    )
    result_status: Mapped[ResultStatus] = mapped_column(
        SAEnum(ResultStatus), default=ResultStatus.pending
    )
    event_status: Mapped[EventStatus] = mapped_column(
        SAEnum(EventStatus), default=EventStatus.upcoming
    )
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    registrations: Mapped[list["TeamRegistration"]] = relationship(
        "TeamRegistration", back_populates="event", cascade="all, delete-orphan"
    )
    result: Mapped[Optional["EventResult"]] = relationship(
        "EventResult", back_populates="event", uselist=False, cascade="all, delete-orphan"
    )
    gallery_albums: Mapped[list["GalleryAlbum"]] = relationship(
        "GalleryAlbum", back_populates="event", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_events_status", "event_status"),
        Index("ix_events_reg_status", "registration_status"),
    )


# ─── Team Registration ───────────────────────────────────────────────────────────
class TeamRegistration(Base):
    __tablename__ = "team_registrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    registration_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    team_name: Mapped[str] = mapped_column(String(255), nullable=False)
    leader_name: Mapped[str] = mapped_column(String(255), nullable=False)
    leader_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    leader_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    leader_year: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    leader_branch: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    member2_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    member2_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    member2_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    member2_year: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    extra_members: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    transaction_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)
    payment_screenshot: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus), default=PaymentStatus.pending, index=True
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    sms_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    event: Mapped["Event"] = relationship("Event", back_populates="registrations")

    __table_args__ = (
        Index("ix_reg_event_email", "event_id", "leader_email"),
        Index("ix_reg_event_status", "event_id", "payment_status"),
    )


# ─── Event Result ────────────────────────────────────────────────────────────────
class EventResult(Base):
    __tablename__ = "event_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id", ondelete="CASCADE"), unique=True)
    winner: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    winner_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    runner_up: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    runner_up_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    second_runner_up: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    second_runner_up_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    additional_winners: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    announcement_date: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    certificate_template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    event: Mapped["Event"] = relationship("Event", back_populates="result")


# ─── Gallery Album ────────────────────────────────────────────────────────────────
class GalleryAlbum(Base):
    __tablename__ = "gallery_albums"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    album_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    images: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    videos: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    event: Mapped[Optional["Event"]] = relationship("Event", back_populates="gallery_albums")


# ─── Notice ───────────────────────────────────────────────────────────────────────
class Notice(Base):
    __tablename__ = "notices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    link: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


# ─── Team Member ──────────────────────────────────────────────────────────────────
class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    photo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    linkedin: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # faculty/core/executive
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


# ─── Audit Log ───────────────────────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    admin_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("admins.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    resource_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)

    admin: Mapped[Optional["Admin"]] = relationship("Admin", back_populates="audit_logs")


# ─── Idea Submission ──────────────────────────────────────────────────────────────
class IdeaSubmission(Base):
    __tablename__ = "idea_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    idea_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    year: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    idea_title: Mapped[str] = mapped_column(String(500), nullable=False)
    idea_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    attachment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # base64 or URL
    status: Mapped[str] = mapped_column(String(50), default="Pending", index=True)
    admin_remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

# ── Test Registrations ──
class TestRegistration(Base):
    __tablename__ = "test_registrations"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    mobile: Mapped[str] = mapped_column(String(20), nullable=False)
    college_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    year: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    document_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ── Academic Toppers ─────────────────────────────────────────────────────────────
class AcademicTopper(Base):
    __tablename__ = "academic_toppers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    year_group: Mapped[str] = mapped_column(String(50), nullable=False) # e.g., 'final_year', 'third_year', 'second_year'
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    branch: Mapped[str] = mapped_column(String(255), nullable=False)
    cgpa: Mapped[str] = mapped_column(String(10), nullable=False)
    score_label: Mapped[Optional[str]] = mapped_column(String(50), default="CGPA")
    achievement: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


# ── Faculty Members ──────────────────────────────────────────────────────────────
class FacultyMember(Base):
    __tablename__ = "faculty_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    designation: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(255), nullable=False)
    qualification: Mapped[str] = mapped_column(String(255), nullable=True)
    experience: Mapped[str] = mapped_column(String(255), nullable=True)
    image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    linkedin: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    professional_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    specialization: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Using JSON to store arrays and nested objects for flexibility
    research_interests = mapped_column(JSON, default=list)
    subjects_taught = mapped_column(JSON, default=list)
    academic_qualifications = mapped_column(JSON, default=list)
    publications = mapped_column(JSON, default=list)
    achievement_images = mapped_column(JSON, default=list)
    professional_info = mapped_column(JSON, default=dict)
    gallery = mapped_column(JSON, default=list)
    
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


# ── HOD Profile ──────────────────────────────────────────────────────────────────
class HodProfile(Base):
    __tablename__ = "hod_profile"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    designation: Mapped[str] = mapped_column(String(255), nullable=False, default="Head of Department")
    department: Mapped[str] = mapped_column(String(255), nullable=False, default="Computer Engineering")
    image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    professional_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    academic_qualifications = mapped_column(JSON, default=list)
    professional_highlights = mapped_column(JSON, default=list)
    achievement_images = mapped_column(JSON, default=list)
    
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


# ── Laboratories ─────────────────────────────────────────────────────────────────
class Laboratory(Base):
    __tablename__ = "laboratories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    in_charge: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Store equipment as a JSON object: {"left": ["item 1"], "right": ["item 2"]}
    equipment = mapped_column(JSON, default=dict)
    
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


# ── Committee Members ────────────────────────────────────────────────────────────
class CommitteeMember(Base):
    __tablename__ = "committee_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(150), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    linkedin: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    github: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    skills: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)          # list of strings
    achievements: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)    # list of {title, desc}
    certificates: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)    # list of image URLs
    projects: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)        # list of {title, desc}
    experience: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)      # list of {role, company, duration}
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

