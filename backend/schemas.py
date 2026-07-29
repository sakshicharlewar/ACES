from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ─── Innovation Box ────────────────────────────────────────────────────────────
class InnovationCreate(BaseModel):
    full_name: str
    email: str
    mobile: Optional[str] = None
    department: str
    year: str
    category: str
    idea_title: str
    idea_description: str
    problem_statement: Optional[str] = None
    proposed_solution: Optional[str] = None
    expected_impact: Optional[str] = None
    technology_stack: Optional[str] = None
    team_members: Optional[str] = None
    expected_outcome: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_type: Optional[str] = None
    attachment_url: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    form_data: Optional[str] = None
    submission_date: Optional[datetime] = None
    submitted_at: Optional[datetime] = None

class InnovationRead(InnovationCreate):
    id: int
    idea_id: Optional[str] = None
    status: Optional[str] = None
    admin_remarks: Optional[str] = None
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True


# ─── Upcoming Events ──────────────────────────────────────────────────────────
class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    event_time: Optional[str] = None
    venue: Optional[str] = None
    image_url: Optional[str] = None
    registration_link: Optional[str] = None
    status: Optional[str] = "upcoming"
    max_teams: Optional[int] = 0
    team_size: Optional[int] = 1
    is_registration_open: Optional[bool] = True

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    event_time: Optional[str] = None
    venue: Optional[str] = None
    image_url: Optional[str] = None
    registration_link: Optional[str] = None
    status: Optional[str] = None
    max_teams: Optional[int] = None
    team_size: Optional[int] = None
    is_registration_open: Optional[bool] = None

class EventRead(EventCreate):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    registered_teams_count: Optional[int] = 0

    class Config:
        from_attributes = True
        orm_mode = True




# ─── Event Registrations ──────────────────────────────────────────────────────
class RegistrationCreate(BaseModel):
    event_id: int
    full_name: str
    email: str
    mobile: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None

class RegistrationRead(RegistrationCreate):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True

# ─── Team Registrations (for Bug Hunt) ────────────────────────────────────────
class TeamRegistrationCreate(BaseModel):
    event_id: int
    team_name: str
    
    # Leader
    leader_name: str
    leader_email: EmailStr
    leader_phone: str = Field(..., min_length=10, max_length=10)
    leader_year: str
    leader_branch: str
    
    # Member 2
    member2_name: str
    member2_email: EmailStr
    member2_phone: str = Field(..., min_length=10, max_length=10)
    member2_year: str

    # Payment
    transaction_id: Optional[str] = None
    payment_screenshot: Optional[str] = None
    registration_fee: Optional[str] = "₹40"
    payment_status: Optional[str] = "pending"

class TeamRegistrationRead(TeamRegistrationCreate):
    id: int
    registration_id: str
    payment_verified_at: Optional[datetime] = None
    payment_verified_by: Optional[str] = None
    payment_time: Optional[datetime] = None
    approval_status: Optional[str] = None
    approval_date: Optional[datetime] = None
    approved_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True


# ─── Contact Messages ─────────────────────────────────────────────────────────
class ContactCreate(BaseModel):
    name: str
    email: str
    subject: Optional[str] = None
    message: str

class ContactRead(ContactCreate):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True
