import traceback
import datetime
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Event, TeamRegistration, AcademicTopper, EventStatus, RegistrationStatus, PaymentStatus, ResultStatus

router = APIRouter()

def clean_dict(d: dict):
    # forcibly remove dates
    for k in ["created_at", "updated_at", "announcement_date"]:
        if k in d:
            del d[k]
    # some fields might be passed as empty string but expect optional int
    for k, v in list(d.items()):
        if v == "":
            d[k] = None

@router.post("/temp_restore")
async def restore_data(req: Request, db: AsyncSession = Depends(get_db)):
    data = await req.json()
    
    try:
        for e in data.get("events", []):
            if "event_status" in e and isinstance(e["event_status"], str): e["event_status"] = EventStatus(e["event_status"])
            if "registration_status" in e and isinstance(e["registration_status"], str): e["registration_status"] = RegistrationStatus(e["registration_status"])
            if "result_status" in e and isinstance(e["result_status"], str): e["result_status"] = ResultStatus(e["result_status"])
            clean_dict(e)
            
            # Since merge can be tricky with uninitialized fields, 
            # let's just do an update if it exists, or add if it doesn't.
            existing = await db.get(Event, e["id"])
            if existing:
                for k, v in e.items():
                    setattr(existing, k, v)
            else:
                ev = Event(**e)
                db.add(ev)
            
        for r in data.get("registrations", []):
            if "payment_status" in r and isinstance(r["payment_status"], str): r["payment_status"] = PaymentStatus(r["payment_status"])
            clean_dict(r)
            existing = await db.get(TeamRegistration, r["id"])
            if existing:
                for k, v in r.items():
                    setattr(existing, k, v)
            else:
                reg = TeamRegistration(**r)
                db.add(reg)
            
        for t in data.get("toppers", []):
            clean_dict(t)
            existing = await db.get(AcademicTopper, t["id"])
            if existing:
                for k, v in t.items():
                    setattr(existing, k, v)
            else:
                top = AcademicTopper(**t)
                db.add(top)
            
        await db.commit()
        return {"status": "ok"}
    except Exception as exc:
        return {"error": str(exc), "traceback": traceback.format_exc()}
