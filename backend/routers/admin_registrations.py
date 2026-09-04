import asyncio
import random
import string
import re
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
import io
import openpyxl
from database import get_db
from models import Admin, Event, TeamRegistration, RegistrationStatus, PaymentStatus
from schemas import TeamRegisterRequest, TeamRegisterOut, RegistrationOut, RegistrationStatusUpdate
from auth import get_current_admin
from limiter import limiter

router = APIRouter(tags=["Registrations"])


def gen_reg_id_sync(event_id: int) -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"ACES-{event_id}-{suffix}"


# ── Public Registration ──────────────────────────────────────────────────────────
@router.post("/api/events/{event_id}/team-register", response_model=TeamRegisterOut, status_code=201)
async def team_register(
    request: Request,
    event_id: int,
    body: TeamRegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    # 1. Check event exists and is open
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.registration_status != RegistrationStatus.open:
        raise HTTPException(status_code=400, detail="Registration is currently closed for this event.")

    # 2. Check capacity (if max_participants is specified and > 0)
    max_cap = event.max_participants or 60
    if event.registered_count >= max_cap:
        raise HTTPException(status_code=400, detail=f"Registration closed. Maximum limit of {max_cap} teams has been reached.")

    # 3. Quick duplicate checks before attempting insert
    dup_email = await db.execute(
        select(TeamRegistration).where(
            TeamRegistration.event_id == event_id,
            func.lower(TeamRegistration.leader_email) == body.leader_email.strip().lower(),
        )
    )
    if dup_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This email is already registered for this event.")

    clean_txn = (body.transaction_id or "").strip()
    if clean_txn and clean_txn.upper() != "FREE":
        dup_txn = await db.execute(
            select(TeamRegistration).where(TeamRegistration.transaction_id == clean_txn)
        )
        if dup_txn.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="This Transaction ID has already been used.")

    # 4. Determine prefix
    title_upper = (event.title or "").upper()
    slug_lower = (event.slug or "").lower()
    if "BUILDX" in title_upper or "buildx" in slug_lower:
        prefix = "BUILDX"
    elif "BUG" in title_upper or "bug" in slug_lower:
        prefix = "BUG-"
    else:
        clean_words = re.findall(r"[A-Za-z0-9]+", event.title or "")
        prefix = clean_words[0].upper() if clean_words else "EVENT"

    # 5. Retry loop to handle concurrent write collisions & guarantee unique sequential IDs
    max_retries = 10
    committed = False
    assigned_reg_id = None

    for attempt in range(max_retries):
        try:
            # Query all existing registration_ids for this event to pick the exact next sequence
            existing_ids_q = await db.execute(
                select(TeamRegistration.registration_id).where(TeamRegistration.event_id == event_id)
            )
            existing_ids = set(r[0] for r in existing_ids_q.fetchall())

            # Find next free sequential ID starting from 1
            seq = 1
            while True:
                candidate_id = f"{prefix}{seq:03d}"
                if candidate_id not in existing_ids:
                    assigned_reg_id = candidate_id
                    break
                seq += 1

            registration = TeamRegistration(
                registration_id=assigned_reg_id,
                event_id=event_id,
                team_name=body.team_name.strip(),
                leader_name=body.leader_name.strip(),
                leader_email=body.leader_email.strip().lower(),
                leader_phone=body.leader_phone.strip(),
                leader_year=body.leader_year,
                leader_branch=body.leader_branch,
                member2_name=body.member2_name.strip() if body.member2_name else None,
                member2_email=body.member2_email.strip().lower() if body.member2_email else None,
                member2_phone=body.member2_phone.strip() if body.member2_phone else None,
                member2_year=body.member2_year,
                extra_members=body.extra_members,
                transaction_id=clean_txn if clean_txn else None,
                payment_screenshot=body.payment_screenshot,
            )
            db.add(registration)

            # Atomically update registered_count
            await db.execute(
                update(Event).where(Event.id == event_id).values(registered_count=Event.registered_count + 1)
            )
            await db.commit()
            committed = True
            break

        except IntegrityError as ie:
            await db.rollback()
            err_str = str(ie).lower()
            if "leader_email" in err_str or "ix_reg_event_email" in err_str:
                raise HTTPException(status_code=400, detail="This email is already registered for this event.")
            if "transaction_id" in err_str:
                raise HTTPException(status_code=400, detail="This Transaction ID has already been used.")
            # If collision happened on registration_id due to race condition, wait brief jitter and retry
            await asyncio.sleep(0.03 * (attempt + 1) + random.uniform(0.01, 0.04))

        except Exception as e:
            await db.rollback()
            err_str = str(e).lower()
            if "locked" in err_str or "busy" in err_str:
                # SQLite busy/lock backoff retry
                await asyncio.sleep(0.05 * (attempt + 1) + random.uniform(0.02, 0.05))
            else:
                if attempt == max_retries - 1:
                    raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")

    if not committed:
        raise HTTPException(
            status_code=503,
            detail="Server is currently experiencing high registration traffic. Please try submitting again in a moment."
        )

    # 6. Trigger async email notification in background
    try:
        from email_utils import notify_admin_new_registration
        background_tasks.add_task(notify_admin_new_registration, event.title, body.leader_name, body.leader_email)
    except Exception:
        pass

    return TeamRegisterOut(
        registration_id=assigned_reg_id,
        message="Registration successful! Payment will be verified shortly."
    )


# ── Admin: List Registrations ────────────────────────────────────────────────────
@router.get("/admin/api/events/{event_id}/team-registrations")
async def list_event_registrations(
    event_id: int,
    search: str = Query(None),
    status: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=5000),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    q = select(TeamRegistration).where(TeamRegistration.event_id == event_id)
    if search:
        q = q.where(
            TeamRegistration.team_name.ilike(f"%{search}%")
            | TeamRegistration.leader_name.ilike(f"%{search}%")
            | TeamRegistration.leader_email.ilike(f"%{search}%")
            | TeamRegistration.registration_id.ilike(f"%{search}%")
            | TeamRegistration.transaction_id.ilike(f"%{search}%")
        )
    if status:
        q = q.where(TeamRegistration.payment_status == status)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(TeamRegistration.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    registrations = result.scalars().all()

    return {
        "items": [_reg_dict(r) for r in registrations],
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/admin/api/team-registrations/{reg_id}")
async def get_registration(reg_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(TeamRegistration).where(TeamRegistration.id == reg_id))
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    return _reg_dict(reg)


@router.patch("/admin/api/team-registrations/{reg_id}/approve")
async def approve_registration(
    reg_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    result = await db.execute(select(TeamRegistration).where(TeamRegistration.id == reg_id))
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    was_approved = reg.payment_status == PaymentStatus.approved
    reg.payment_status = PaymentStatus.approved
    reg.email_sent = True

    ev_result = await db.execute(select(Event).where(Event.id == reg.event_id))
    ev = ev_result.scalar_one_or_none()
    event_title = ev.title if ev else "Event"

    if not was_approved:
        # Increment approved_count atomically
        await db.execute(
            update(Event).where(Event.id == reg.event_id).values(
                approved_count=func.coalesce(Event.approved_count, 0) + 1
            )
        )
        # Refresh event and auto-close if seats full
        if ev and ev.approved_count >= ev.max_participants:
            ev.registration_status = RegistrationStatus.closed

    await db.commit()

    # Send email to user
    try:
        from email_utils import notify_user_registration_approved
        background_tasks.add_task(notify_user_registration_approved, reg.leader_email, reg.leader_name, event_title)
    except Exception:
        pass

    return {"success": True, "message": "Registration approved"}


@router.patch("/admin/api/team-registrations/{reg_id}/reject")
async def reject_registration(
    reg_id: int, body: dict, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)
):
    result = await db.execute(select(TeamRegistration).where(TeamRegistration.id == reg_id))
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    was_approved = reg.payment_status == PaymentStatus.approved
    reg.payment_status = PaymentStatus.rejected
    reg.rejection_reason = body.get("rejection_reason")

    # If we're un-approving, free up an approved seat
    if was_approved:
        await db.execute(
            update(Event).where(Event.id == reg.event_id).values(
                approved_count=func.max(0, func.coalesce(Event.approved_count, 0) - 1)
            )
        )

    await db.commit()
    return {"success": True, "message": "Registration rejected"}


@router.patch("/admin/api/team-registrations/{reg_id}/resend")
async def resend_notification(reg_id: int, body: dict, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(TeamRegistration).where(TeamRegistration.id == reg_id))
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    notif_type = body.get("type", "email")
    if notif_type == "email":
        reg.email_sent = True
    elif notif_type == "sms":
        reg.sms_sent = True
    await db.commit()
    return {"success": True, "message": f"{notif_type} notification marked as sent"}


@router.delete("/admin/api/team-registrations/{reg_id}")
async def delete_registration(reg_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(TeamRegistration).where(TeamRegistration.id == reg_id))
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    was_approved = reg.payment_status == PaymentStatus.approved

    # Decrement registered_count always; approved_count only if was approved
    update_vals = {"registered_count": func.max(0, Event.registered_count - 1)}
    if was_approved:
        update_vals["approved_count"] = func.max(0, func.coalesce(Event.approved_count, 0) - 1)

    await db.execute(update(Event).where(Event.id == reg.event_id).values(**update_vals))
    await db.delete(reg)
    await db.commit()
    return {"success": True}


@router.get("/admin/api/events/{event_id}/export-excel")
async def export_excel(event_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(
        select(TeamRegistration).where(TeamRegistration.event_id == event_id).order_by(TeamRegistration.created_at.desc())
    )
    registrations = result.scalars().all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Registrations"
    headers = ["Reg ID", "Team Name", "Leader Name", "Leader Email", "Leader Phone", "Leader Year",
               "Member 2 Name", "Member 2 Email", "Member 2 Phone", "Member 2 Year",
               "Transaction ID", "Payment Status", "Created At"]
    ws.append(headers)
    for r in registrations:
        ws.append([
            r.registration_id, r.team_name, r.leader_name, r.leader_email, r.leader_phone,
            r.leader_year or "", r.member2_name or "", r.member2_email or "", r.member2_phone or "",
            r.member2_year or "", r.transaction_id or "", r.payment_status,
            r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "",
        ])

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=event_{event_id}_registrations.xlsx"},
    )


@router.get("/admin/api/registrations")
async def list_all_registrations(
    page: int = Query(1, ge=1),
    limit: int = Query(1000, ge=1, le=5000),
    search: str = Query(None),
    event_id: int = Query(0),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    q = select(TeamRegistration)
    if event_id:
        q = q.where(TeamRegistration.event_id == event_id)
    if search:
        q = q.where(
            TeamRegistration.leader_name.ilike(f"%{search}%")
            | TeamRegistration.leader_email.ilike(f"%{search}%")
        )
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(TeamRegistration.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    items = result.scalars().all()
    return {"items": [_reg_dict(r) for r in items], "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}


def _reg_dict(r: TeamRegistration) -> dict:
    status_val = r.payment_status.value if hasattr(r.payment_status, "value") else str(r.payment_status) if r.payment_status else "pending"
    return {
        "id": r.id,
        "registration_id": r.registration_id,
        "event_id": r.event_id,
        "event_title": "Bug Hunt: Debug the Web" if r.event_id == 1 else f"Event {r.event_id}",
        "team_name": r.team_name,
        "leader_name": r.leader_name,
        "full_name": r.leader_name,
        "leader_email": r.leader_email,
        "email": r.leader_email,
        "leader_phone": r.leader_phone,
        "mobile": r.leader_phone,
        "leader_year": r.leader_year,
        "year": r.leader_year,
        "leader_branch": r.leader_branch,
        "department": r.leader_branch,
        "member2_name": r.member2_name,
        "member2_email": r.member2_email,
        "member2_phone": r.member2_phone,
        "member2_year": r.member2_year,
        "extra_members": r.extra_members or [],
        "transaction_id": r.transaction_id,
        "payment_screenshot": r.payment_screenshot,
        "payment_status": status_val,
        "rejection_reason": r.rejection_reason,
        "email_sent": r.email_sent,
        "sms_sent": r.sms_sent,
        "created_at": r.created_at.isoformat() if hasattr(r.created_at, "isoformat") else str(r.created_at) if r.created_at else None,
    }
