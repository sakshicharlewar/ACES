from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Event, TeamRegistration, AcademicTopper, EventStatus, RegistrationStatus, PaymentStatus, ResultStatus
import datetime

router = APIRouter()

@router.post("/temp_restore")
async def restore_data(req: Request, db: AsyncSession = Depends(get_db)):
    data = await req.json()
    
    # 1. Restore Events
    for e in data.get("events", []):
        if "event_status" in e and e["event_status"]: e["event_status"] = EventStatus(e["event_status"])
        if "registration_status" in e and e["registration_status"]: e["registration_status"] = RegistrationStatus(e["registration_status"])
        if "result_status" in e and e["result_status"]: e["result_status"] = ResultStatus(e["result_status"])
        ev = Event(**e)
        db.add(ev)
        
    # 2. Restore Registrations
    for r in data.get("registrations", []):
        if "payment_status" in r and r["payment_status"]: r["payment_status"] = PaymentStatus(r["payment_status"])
        if "created_at" in r and r["created_at"]:
            try: r["created_at"] = datetime.datetime.fromisoformat(r["created_at"])
            except: del r["created_at"]
        reg = TeamRegistration(**r)
        db.add(reg)
        
    # 3. Restore Toppers
    for t in data.get("toppers", []):
        top = AcademicTopper(**t)
        db.add(top)
        
    await db.commit()
    return {"status": "ok"}
