from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models import Event, TeamRegistration, EventStatus, PaymentStatus

router = APIRouter()

@router.get("/api/test-stats")
async def test_stats(db: AsyncSession = Depends(get_db)):
    try:
        import traceback
        total_events = (await db.execute(select(func.count(Event.id)))).scalar() or 0
        upcoming = (await db.execute(select(func.count(Event.id)).where(Event.event_status == EventStatus.upcoming))).scalar() or 0
        
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
                "team_name": r.team_name,
                "payment_status": r.payment_status.value if hasattr(r.payment_status, 'value') else r.payment_status,
                "event_title": row.title,
            })

        return {"status": "ok", "total": total_events, "upcoming": upcoming, "regs": recent_regs}
    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()}
