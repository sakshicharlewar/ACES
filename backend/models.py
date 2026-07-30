from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Index, Boolean
)
from sqlalchemy.sql import func
from database import Base


# ─── Innovation Box Submissions ────────────────────────────────────────────────
class InnovationSubmission(Base):
    __tablename__ = "innovation_box_submissions"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    full_name       = Column(String(255), nullable=False)
    email           = Column(String(255), nullable=False, index=True)
    mobile          = Column(String(20), nullable=True)
    department      = Column(String(100), nullable=False, index=True)
    year            = Column(String(20), nullable=False)
    category        = Column(String(100), nullable=False, index=True)
    idea_title      = Column(String(500), nullable=False)
    idea_description = Column(Text, nullable=False)
    problem_statement = Column(Text, nullable=True)
    proposed_solution = Column(Text, nullable=True)
    expected_impact = Column(Text, nullable=True)
    technology_stack = Column(Text, nullable=True)
    team_members    = Column(Text, nullable=True)
    expected_outcome = Column(Text, nullable=True)
    attachment_name = Column(String(500), nullable=True)
    attachment_type = Column(String(100), nullable=True)
    attachment_url  = Column(Text, nullable=True)
    ip_address      = Column(String(100), nullable=True)
    user_agent      = Column(Text, nullable=True)
    form_data       = Column(Text, nullable=True)
    idea_id         = Column(String(50), unique=True, index=True, nullable=True)
    status          = Column(String(50), default="Pending", index=True)
    admin_remarks   = Column(Text, nullable=True)
    # Admin Approval Workflow (Database schema not migrated yet)
    # approval_date   = Column(DateTime(timezone=True), nullable=True)
    # approved_by     = Column(String(255), nullable=True)
    # rejection_reason= Column(Text, nullable=True)
    
    # Notification Status (Database schema not migrated yet)
    # email_sent      = Column(Boolean, default=False)
    # sms_sent        = Column(Boolean, default=False)
    # notification_timestamp = Column(DateTime(timezone=True), nullable=True)

    submission_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at    = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_innovation_dept_cat", "department", "category"),
    )


# ─── Upcoming Events ──────────────────────────────────────────────────────────
class UpcomingEvent(Base):
    __tablename__ = "upcoming_events"

    id                = Column(Integer, primary_key=True, autoincrement=True)
    title             = Column(String(500), nullable=False)
    description       = Column(Text, nullable=True)
    event_date        = Column(DateTime(timezone=True), nullable=False, index=True)
    event_time        = Column(String(50), nullable=True)
    venue             = Column(String(500), nullable=True)
    image_url         = Column(Text, nullable=True)
    registration_link = Column(Text, nullable=True)
    status            = Column(String(50), default="upcoming", index=True)
    max_teams         = Column(Integer, nullable=True, default=0)
    team_size         = Column(Integer, nullable=True, default=1)
    is_registration_open = Column(Boolean, default=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())
    updated_at        = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_events_date_status", "event_date", "status"),
    )


# ─── Event Registrations ──────────────────────────────────────────────────────
class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    event_id   = Column(Integer, ForeignKey("upcoming_events.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name  = Column(String(255), nullable=False)
    email      = Column(String(255), nullable=False, index=True)
    mobile     = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True, index=True)
    year       = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_reg_event_email", "event_id", "email", unique=True),
    )


# ─── Team Registrations (for Bug Hunt & Dynamic Events) ───────────────────────
class TeamRegistration(Base):
    __tablename__ = "team_registrations"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    registration_id = Column(String(50), unique=True, index=True, nullable=False)
    event_id        = Column(Integer, ForeignKey("upcoming_events.id", ondelete="CASCADE"), nullable=False, index=True)
    
    team_name       = Column(String(255), nullable=False, index=True)
    
    # Leader details
    leader_name     = Column(String(255), nullable=False)
    leader_email    = Column(String(255), nullable=False, index=True)
    leader_phone    = Column(String(20), nullable=False)
    leader_year     = Column(String(50), nullable=False)
    leader_branch   = Column(String(100), nullable=False)
    
    # Member 2 details
    member2_name    = Column(String(255), nullable=False)
    member2_email   = Column(String(255), nullable=False)
    member2_phone   = Column(String(20), nullable=False)
    member2_year    = Column(String(50), nullable=False)
    
    # Payment details
    registration_fee       = Column(String(20), default="₹40")
    payment_status         = Column(String(50), default="pending", index=True)  # pending / approved / rejected
    transaction_id         = Column(String(255), nullable=True, unique=True, index=True)
    payment_screenshot     = Column(Text, nullable=True)
    # Razorpay integration (Database schema not migrated yet)
    # razorpay_order_id      = Column(String(255), nullable=True, unique=True, index=True)
    # razorpay_payment_id    = Column(String(255), nullable=True, unique=True, index=True)
    # razorpay_signature     = Column(String(255), nullable=True)
    payment_time           = Column(DateTime(timezone=True), nullable=True)
    payment_verified_at    = Column(DateTime(timezone=True), nullable=True)
    payment_verified_by    = Column(String(255), nullable=True)
    
    rejection_reason= Column(Text, nullable=True)

    # Notification Status
    email_sent      = Column(Boolean, default=False)
    sms_sent        = Column(Boolean, default=False)
    notification_timestamp = Column(DateTime(timezone=True), nullable=True)
    
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_team_event_leader_email", "event_id", "leader_email", unique=True),
    )



# ─── Contact Messages ─────────────────────────────────────────────────────────
class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String(255), nullable=False)
    email      = Column(String(255), nullable=False, index=True)
    subject    = Column(String(500), nullable=True)
    message    = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ─── Email Queue (migrated from SQLite) ────────────────────────────────────────
class EmailQueue(Base):
    __tablename__ = "email_queue"

    id            = Column(String(64), primary_key=True)
    subject       = Column(Text, nullable=False)
    html_body     = Column(Text, nullable=False)
    attachments   = Column(Text, default="[]")
    status        = Column(String(20), default="pending", index=True)
    retry_count   = Column(Integer, default=0)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    last_attempt  = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
