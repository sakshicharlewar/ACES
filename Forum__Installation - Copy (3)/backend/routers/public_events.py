from fastapi import APIRouter, Query, Form, UploadFile, File, HTTPException, BackgroundTasks
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
import random, string
from database import get_db
from models import Event, EventResult, RegistrationStatus, EventStatus, IdeaSubmission, TeamRegistration, PaymentStatus

router = APIRouter(prefix="/api", tags=["Public"])


from datetime import date as date_type


def _public_event(e: Event, actual_regs: int = None, actual_approved: int = None) -> dict:
    registered = actual_regs if actual_regs is not None else getattr(e, "registered_count", 0)
    approved = actual_approved if actual_approved is not None else getattr(e, "approved_count", 0)
    max_cap = getattr(e, "max_participants", 60) or 60
    seats_left = max(0, max_cap - registered)

    reg_status = e.registration_status.value if hasattr(e.registration_status, "value") else str(e.registration_status) if e.registration_status else "closed"
    ev_status = e.event_status.value if hasattr(e.event_status, "value") else str(e.event_status) if e.event_status else "completed"
    res_status = e.result_status.value if hasattr(e.result_status, "value") else str(e.result_status) if e.result_status else "none"

    is_open = reg_status == "open"

    # Auto-close if end date has passed
    end_date_str = getattr(e, "registration_end_date", None)
    if end_date_str and is_open:
        try:
            end_d = date_type.fromisoformat(end_date_str[:10])
            if end_d < date_type.today():
                is_open = False
        except Exception:
            pass

    # Auto-close if no seats left
    if seats_left == 0 and max_cap > 0:
        is_open = False

    gallery_images = []
    if getattr(e, "gallery_albums", None):
        for album in e.gallery_albums:
            if getattr(album, "images", None):
                gallery_images.extend(album.images)

    return {
        "id": e.id,
        "title": e.title,
        "slug": e.slug,
        "subtitle": e.subtitle,
        "banner": e.banner,
        "logo": e.logo,
        "qr_image": e.qr_image,
        "payment_link": e.payment_link,
        "whatsapp_link": e.whatsapp_link,
        "eligibility": e.eligibility,
        "short_description": e.short_description,
        "full_description": e.full_description,
        "date": e.date,
        "time": e.time,
        "venue": e.venue,
        "registration_deadline": e.registration_deadline,
        "registration_start_date": getattr(e, "registration_start_date", None),
        "registration_end_date": getattr(e, "registration_end_date", None),
        "registration_fee": e.registration_fee,
        "fee": e.registration_fee,
        "team_size": e.team_size,
        "max_participants": max_cap,
        "max_teams": max_cap,
        "registered_count": registered,
        "registered_teams_count": registered,
        "approved_count": approved,
        "seats_left": seats_left,
        "remaining_seats": seats_left,
        "contact_name": e.contact_name,
        "contact_phone": e.contact_phone,
        "rules": e.rules,
        "prizes": e.prizes,
        "tags": e.tags,
        "registration_status": reg_status,
        "is_registration_open": is_open,
        "result_status": res_status,
        "event_status": ev_status,
        "is_featured": e.is_featured,
        "announcement_date": e.result.announcement_date if e.result else None,
        "gallery_images": gallery_images,
        "created_at": e.created_at.isoformat() if hasattr(e.created_at, "isoformat") else str(e.created_at) if e.created_at else None,
    }


@router.get("/events")
async def public_list_events(
    status: str = Query("upcoming"),
    db: AsyncSession = Depends(get_db),
):
    q = select(Event).options(selectinload(Event.result), selectinload(Event.gallery_albums))
    if status == "upcoming":
        q = q.where(Event.event_status.in_(["upcoming", "ongoing"]))
    elif status == "completed":
        q = q.where(Event.event_status == "completed")
    elif status == "all":
        pass
    else:
        q = q.where(Event.event_status == status)
    q = q.order_by(Event.created_at.desc())
    result = await db.execute(q)
    events = result.scalars().all()

    # Get live registration counts by event
    reg_counts = await db.execute(
        select(TeamRegistration.event_id, func.count(TeamRegistration.id)).group_by(TeamRegistration.event_id)
    )
    reg_map = dict(reg_counts.fetchall())

    app_counts = await db.execute(
        select(TeamRegistration.event_id, func.count(TeamRegistration.id)).where(TeamRegistration.payment_status == PaymentStatus.approved).group_by(TeamRegistration.event_id)
    )
    app_map = dict(app_counts.fetchall())

    return [_public_event(e, actual_regs=reg_map.get(e.id, e.registered_count), actual_approved=app_map.get(e.id, e.approved_count)) for e in events]


@router.get("/events/{slug}")
async def public_get_event(slug: str, db: AsyncSession = Depends(get_db)):
    # Try by slug first, then by id
    result = await db.execute(select(Event).options(selectinload(Event.result), selectinload(Event.gallery_albums)).where(Event.slug == slug))
    event = result.scalar_one_or_none()
    if not event and slug.isdigit():
        result = await db.execute(select(Event).options(selectinload(Event.result), selectinload(Event.gallery_albums)).where(Event.id == int(slug)))
        event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    reg_count = (await db.execute(select(func.count(TeamRegistration.id)).where(TeamRegistration.event_id == event.id))).scalar() or 0
    app_count = (await db.execute(select(func.count(TeamRegistration.id)).where(TeamRegistration.event_id == event.id, TeamRegistration.payment_status == PaymentStatus.approved))).scalar() or 0
    return _public_event(event, actual_regs=reg_count, actual_approved=app_count)


@router.get("/events/{event_id}/result")
async def public_event_result(event_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EventResult).where(EventResult.event_id == event_id))
    res = result.scalar_one_or_none()
    if not res:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No result announced yet")
    return {
        "event_id": res.event_id,
        "winner": res.winner,
        "winner_details": res.winner_details,
        "runner_up": res.runner_up,
        "runner_up_details": res.runner_up_details,
        "second_runner_up": res.second_runner_up,
        "second_runner_up_details": res.second_runner_up_details,
        "announcement_date": res.announcement_date,
    }


@router.post("/submit-innovation")
async def submit_innovation(
    full_name: str = Form(..., alias="Full Name"),
    email: str = Form(..., alias="Email"),
    phone: Optional[str] = Form(None, alias="Mobile"),
    department: Optional[str] = Form(None, alias="Department"),
    year: Optional[str] = Form(None, alias="Year"),
    idea_category: Optional[str] = Form(None, alias="Idea Category"),
    idea_title: str = Form(..., alias="Idea Title"),
    idea_description: str = Form(..., alias="Idea Description"),
    expected_outcome: Optional[str] = Form(None, alias="Expected Outcome"),
    attachment: Optional[UploadFile] = File(None),
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db)
):
    import base64
    attachment_data = None
    if attachment:
        content = await attachment.read()
        attachment_data = f"data:{attachment.content_type};base64,{base64.b64encode(content).decode('utf-8')}"
    
    # Generate unique Idea ID (e.g., INN-XXXX)
    def get_random_id():
        return "INN-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    
    idea_id = get_random_id()
    
    full_desc = idea_description
    if idea_category:
        full_desc = f"Category: {idea_category}\n\n{full_desc}"
    if expected_outcome:
        full_desc += f"\n\nExpected Outcome:\n{expected_outcome}"

    new_submission = IdeaSubmission(
        idea_id=idea_id,
        full_name=full_name,
        email=email,
        phone=phone,
        department=department,
        year=year,
        idea_title=idea_title,
        idea_description=full_desc,
        attachment=attachment_data
    )
    
    db.add(new_submission)
    await db.commit()

    if background_tasks:
        try:
            from email_utils import notify_admin_new_idea
            background_tasks.add_task(notify_admin_new_idea, idea_title, full_name)
        except Exception:
            pass

    return {"message": "Idea submitted successfully", "idea_id": idea_id}
