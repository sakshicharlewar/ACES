import traceback
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Event, TeamRegistration, AcademicTopper, EventStatus, RegistrationStatus, PaymentStatus, ResultStatus

router = APIRouter()

@router.post("/temp_restore")
async def restore_data(req: Request, db: AsyncSession = Depends(get_db)):
    data = await req.json()
    
    try:
        for e in data.get("events", []):
            if "event_status" in e and e["event_status"]: e["event_status"] = EventStatus(e["event_status"])
            if "registration_status" in e and e["registration_status"]: e["registration_status"] = RegistrationStatus(e["registration_status"])
            if "result_status" in e and e["result_status"]: e["result_status"] = ResultStatus(e["result_status"])
            ev = Event(**e)
            await db.merge(ev)
            
        for r in data.get("registrations", []):
            if "payment_status" in r and r["payment_status"]: r["payment_status"] = PaymentStatus(r["payment_status"])
            reg = TeamRegistration(**r)
            await db.merge(reg)
            
        for t in data.get("toppers", []):
            top = AcademicTopper(**t)
            await db.merge(top)
            
        await db.commit()
        return {"status": "ok"}
    except Exception as exc:
        return {"error": str(exc), "traceback": traceback.format_exc()}
