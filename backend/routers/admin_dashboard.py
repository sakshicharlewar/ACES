from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models import Admin, Event, TeamRegistration, EventStatus, PaymentStatus
from schemas import DashboardStats
from auth import get_current_admin

router = APIRouter(prefix="/admin/api", tags=["Admin Dashboard"])

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    # Event counts
    total_events = (await db.execute(select(func.count(Event.id)))).scalar() or 0
    upcoming = (await db.execute(select(func.count(Event.id)).where(Event.event_status == EventStatus.upcoming))).scalar() or 0
    ongoing = (await db.execute(select(func.count(Event.id)).where(Event.event_status == EventStatus.ongoing))).scalar() or 0
    completed = (await db.execute(select(func.count(Event.id)).where(Event.event_status == EventStatus.completed))).scalar() or 0

    # Registration counts
    total_regs = (await db.execute(select(func.count(TeamRegistration.id)))).scalar() or 0
    approved = (await db.execute(select(func.count(TeamRegistration.id)).where(TeamRegistration.payment_status == PaymentStatus.approved))).scalar() or 0
    pending = (await db.execute(select(func.count(TeamRegistration.id)).where(TeamRegistration.payment_status == PaymentStatus.pending))).scalar() or 0
    rejected = (await db.execute(select(func.count(TeamRegistration.id)).where(TeamRegistration.payment_status == PaymentStatus.rejected))).scalar() or 0

    # Participants = approved registrations * team_size (approximate)
    total_participants = approved * 2

    # Recent 5 registrations
    recent_regs_result = await db.execute(
        select(TeamRegistration, Event.title)
        .join(Event, TeamRegistration.event_id == Event.id)
        .order_by(TeamRegistration.created_at.desc())
        .limit(5)
    )
    recent_regs = []
    for row in recent_regs_result.all():
        r = row.TeamRegistration
        recent_regs.append({
            "id": r.id,
            "registration_id": r.registration_id,
            "team_name": r.team_name,
            "leader_name": r.leader_name,
            "leader_email": r.leader_email,
            "payment_status": r.payment_status,
            "event_title": row.title,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    # Recent 5 events
    recent_events_result = await db.execute(
        select(Event).order_by(Event.created_at.desc()).limit(5)
    )
    recent_events = [
        {
            "id": e.id,
            "title": e.title,
            "event_status": e.event_status,
            "registration_status": e.registration_status,
            "registered_count": e.registered_count,
            "max_participants": e.max_participants,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in recent_events_result.scalars().all()
    ]

    return DashboardStats(
        total_events=total_events,
        upcoming_events=upcoming,
        ongoing_events=ongoing,
        completed_events=completed,
        total_registrations=total_regs,
        approved_registrations=approved,
        pending_registrations=pending,
        rejected_registrations=rejected,
        total_participants=total_participants,
        recent_registrations=recent_regs,
        recent_events=recent_events,
    )
