import traceback
import datetime
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Event, TeamRegistration, AcademicTopper, EventStatus, RegistrationStatus, PaymentStatus, ResultStatus

router = APIRouter()

def parse_dates(d: dict):
    for k in ["created_at", "updated_at"]:
        if k in d and isinstance(d[k], str):
            try:
                # Handle cases where the string might not have timezone info or might have space instead of T
                val = d[k].replace(' ', 'T')
                d[k] = datetime.datetime.fromisoformat(val)
                # Ensure timezone aware if needed, or leave naive
            except Exception:
                del d[k]

@router.post("/temp_restore")
async def restore_data(req: Request, db: AsyncSession = Depends(get_db)):
    data = await req.json()
    
    try:
        for e in data.get("events", []):
            if "event_status" in e and isinstance(e["event_status"], str): e["event_status"] = EventStatus(e["event_status"])
            if "registration_status" in e and isinstance(e["registration_status"], str): e["registration_status"] = RegistrationStatus(e["registration_status"])
            if "result_status" in e and isinstance(e["result_status"], str): e["result_status"] = ResultStatus(e["result_status"])
            parse_dates(e)
            ev = Event(**e)
            await db.merge(ev)
            
        for r in data.get("registrations", []):
            if "payment_status" in r and isinstance(r["payment_status"], str): r["payment_status"] = PaymentStatus(r["payment_status"])
            parse_dates(r)
            reg = TeamRegistration(**r)
            await db.merge(reg)
            
        for t in data.get("toppers", []):
            parse_dates(t)
            top = AcademicTopper(**t)
            await db.merge(top)
            
        await db.commit()
        return {"status": "ok"}
    except Exception as exc:
        return {"error": str(exc), "traceback": traceback.format_exc()}
