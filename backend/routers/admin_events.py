import re
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete
from database import get_db
from models import Admin, Event, TeamRegistration, AuditLog, EventStatus, RegistrationStatus
from schemas import EventCreate, EventUpdate, EventOut
from auth import get_current_admin

router = APIRouter(prefix="/admin/api", tags=["Admin Events"])


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text[:100]


async def log_action(db: AsyncSession, admin_id: int, action: str, resource: str, resource_id: int, details: dict = None):
    log = AuditLog(admin_id=admin_id, action=action, resource=resource, resource_id=resource_id, details=details)
    db.add(log)


def event_to_dict(e: Event, actual_regs: int = None, actual_approved: int = None) -> dict:
    registered = actual_regs if actual_regs is not None else getattr(e, "registered_count", 0)
    approved = actual_approved if actual_approved is not None else getattr(e, "approved_count", 0)
    max_cap = getattr(e, "max_participants", 60) or 60
    seats_left = max(0, max_cap - registered)

    reg_status = e.registration_status.value if hasattr(e.registration_status, "value") else str(e.registration_status) if e.registration_status else "closed"
    ev_status = e.event_status.value if hasattr(e.event_status, "value") else str(e.event_status) if e.event_status else "completed"
    res_status = e.result_status.value if hasattr(e.result_status, "value") else str(e.result_status) if e.result_status else "none"
    is_open = reg_status == "open"
    return {
        "id": e.id,
        "title": e.title,
        "slug": e.slug,
        "subtitle": e.subtitle,
        "banner": e.banner,
        "logo": e.logo,
        "qr_image": e.qr_image,
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
        "payment_link": e.payment_link,
        "whatsapp_link": e.whatsapp_link,
        "eligibility": e.eligibility,
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
        "created_at": e.created_at.isoformat() if hasattr(e.created_at, "isoformat") else str(e.created_at) if e.created_at else None,
    }


@router.get("/events")
async def list_events(
    status: str = Query(None),
    search: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    q = select(Event)
    if status:
        q = q.where(Event.event_status == status)
    if search:
        q = q.where(Event.title.ilike(f"%{search}%"))
    q = q.order_by(Event.created_at.desc())
    result = await db.execute(q)
    events = result.scalars().all()

    reg_counts = await db.execute(
        select(TeamRegistration.event_id, func.count(TeamRegistration.id)).group_by(TeamRegistration.event_id)
    )
    reg_map = dict(reg_counts.fetchall())

    app_counts = await db.execute(
        select(TeamRegistration.event_id, func.count(TeamRegistration.id)).where(TeamRegistration.status == "approved").group_by(TeamRegistration.event_id)
    )
    app_map = dict(app_counts.fetchall())

    return [event_to_dict(e, actual_regs=reg_map.get(e.id, e.registered_count), actual_approved=app_map.get(e.id, e.approved_count)) for e in events]


@router.get("/events/{event_id}")
async def get_event(event_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    reg_count = (await db.execute(select(func.count(TeamRegistration.id)).where(TeamRegistration.event_id == event.id))).scalar() or 0
    app_count = (await db.execute(select(func.count(TeamRegistration.id)).where(TeamRegistration.event_id == event.id, TeamRegistration.status == "approved"))).scalar() or 0
    return event_to_dict(event, actual_regs=reg_count, actual_approved=app_count)


@router.post("/events", status_code=201)
async def create_event(body: EventCreate, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    slug = slugify(body.title)
    # Ensure unique slug
    count = (await db.execute(select(func.count(Event.id)).where(Event.slug.like(f"{slug}%")))).scalar() or 0
    if count > 0:
        slug = f"{slug}-{count}"

    event = Event(
        title=body.title,
        slug=slug,
        subtitle=body.subtitle,
        banner=body.banner,
        logo=body.logo,
        qr_image=body.qr_image,
        payment_link=body.payment_link,
        whatsapp_link=body.whatsapp_link,
        eligibility=body.eligibility,
        short_description=body.short_description,
        full_description=body.full_description,
        date=body.date,
        time=body.time,
        venue=body.venue,
        registration_deadline=body.registration_deadline,
        registration_start_date=body.registration_start_date,
        registration_end_date=body.registration_end_date,
        registration_fee=body.registration_fee,
        team_size=body.team_size,
        max_participants=body.max_participants,
        contact_name=body.contact_name,
        contact_phone=body.contact_phone,
        rules=body.rules,
        prizes=body.prizes,
        tags=body.tags,
        registration_status=body.registration_status,
        event_status=body.event_status,
        is_featured=body.is_featured,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    await log_action(db, admin.id, "create_event", "event", event.id, {"title": event.title})
    await db.commit()
    return event_to_dict(event)


@router.patch("/events/{event_id}")
@router.put("/events/{event_id}")
async def update_event(event_id: int, body: EventUpdate, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "event_status" and value:
            try:
                setattr(event, key, EventStatus(value))
            except Exception:
                setattr(event, key, value)
        elif key == "registration_status" and value:
            try:
                setattr(event, key, RegistrationStatus(value))
            except Exception:
                setattr(event, key, value)
        elif key == "result_status" and value:
            try:
                setattr(event, key, ResultStatus(value))
            except Exception:
                setattr(event, key, value)
        else:
            setattr(event, key, value)

    await db.commit()
    await db.refresh(event)
    await log_action(db, admin.id, "update_event", "event", event_id, {"fields": list(update_data.keys())})
    await db.commit()
    return event_to_dict(event)


@router.patch("/events/{event_id}/status")
async def toggle_registration_status(
    event_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    is_open = body.get("is_registration_open", True)
    event.registration_status = RegistrationStatus.open if is_open else RegistrationStatus.closed
    await db.commit()
    return {"success": True, "is_registration_open": is_open}


@router.delete("/events/{event_id}")
async def delete_event(event_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await log_action(db, admin.id, "delete_event", "event", event_id, {"title": event.title})
    await db.commit()
    return {"success": True}


@router.post("/events/{event_id}/duplicate")
async def duplicate_event(event_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Event not found")

    new_slug = f"{source.slug}-copy"
    count = (await db.execute(select(func.count(Event.id)).where(Event.slug.like(f"{new_slug}%")))).scalar() or 0
    if count > 0:
        new_slug = f"{new_slug}-{count}"

    new_event = Event(
        title=f"{source.title} (Copy)",
        slug=new_slug,
        subtitle=source.subtitle,
        banner=source.banner,
        logo=source.logo,
        qr_image=source.qr_image,
        short_description=source.short_description,
        full_description=source.full_description,
        date=source.date,
        time=source.time,
        venue=source.venue,
        registration_deadline=source.registration_deadline,
        registration_fee=source.registration_fee,
        team_size=source.team_size,
        max_participants=source.max_participants,
        contact_name=source.contact_name,
        contact_phone=source.contact_phone,
        rules=source.rules,
        prizes=source.prizes,
        tags=source.tags,
        registration_status=RegistrationStatus.closed,
        event_status=EventStatus.upcoming,
        is_featured=False,
    )
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    return event_to_dict(new_event)


@router.get("/events/{event_id}/stats")
async def event_stats(event_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    total = (await db.execute(select(func.count(TeamRegistration.id)).where(TeamRegistration.event_id == event_id))).scalar() or 0
    approved = (await db.execute(select(func.count(TeamRegistration.id)).where(TeamRegistration.event_id == event_id, TeamRegistration.payment_status == "approved"))).scalar() or 0
    pending = (await db.execute(select(func.count(TeamRegistration.id)).where(TeamRegistration.event_id == event_id, TeamRegistration.payment_status == "pending"))).scalar() or 0
    rejected = (await db.execute(select(func.count(TeamRegistration.id)).where(TeamRegistration.event_id == event_id, TeamRegistration.payment_status == "rejected"))).scalar() or 0

    return {
        "event_id": event_id,
        "event_title": event.title,
        "total_registrations": total,
        "approved": approved,
        "pending": pending,
        "rejected": rejected,
        "max_participants": event.max_participants,
        "remaining_seats": max(0, event.max_participants - approved),
        "is_registration_open": event.registration_status == RegistrationStatus.open,
    }
