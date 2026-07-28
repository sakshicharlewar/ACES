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
    expected_outcome: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_type: Optional[str] = None
    attachment_url: Optional[str] = None
    submitted_at: Optional[datetime] = None

class InnovationRead(InnovationCreate):
    id: int
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

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    event_time: Optional[str] = None
    venue: Optional[str] = None
    image_url: Optional[str] = None
    registration_link: Optional[str] = None
    status: Optional[str] = None

class EventRead(EventCreate):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

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
