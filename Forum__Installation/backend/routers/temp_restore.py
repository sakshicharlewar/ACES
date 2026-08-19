from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Event, TeamRegistration, AcademicTopper, EventStatus, RegistrationStatus, PaymentStatus
import datetime

router = APIRouter()

@router.post("/temp_restore")
async def restore_data(req: Request, db: AsyncSession = Depends(get_db)):
    data = await req.json()
    
    # 1. Restore Events
    for e in data.get("events", []):
        ev = Event(**e)
        ev.status = EventStatus(e["status"])
        ev.registration_status = RegistrationStatus(e["registration_status"])
        db.add(ev)
        
    # 2. Restore Registrations
    for r in data.get("registrations", []):
        reg = TeamRegistration(**r)
        reg.payment_status = PaymentStatus(r["payment_status"])
        # parse created_at manually if needed, or leave it
        if "created_at" in r and r["created_at"]:
            reg.created_at = datetime.datetime.fromisoformat(r["created_at"])
        db.add(reg)
        
    # 3. Restore Toppers
    for t in data.get("toppers", []):
        top = AcademicTopper(**t)
        db.add(top)
        
    await db.commit()
    return {"status": "ok"}
