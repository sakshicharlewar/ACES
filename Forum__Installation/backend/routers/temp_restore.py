import traceback
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db
from models import Event, TeamRegistration, AcademicTopper

router = APIRouter()

def clean_dict(d: dict):
    for k in ["created_at", "updated_at", "announcement_date"]:
        if k in d:
            del d[k]
    for k, v in list(d.items()):
        if v == "":
            d[k] = None

@router.post("/temp_restore")
async def restore_data(req: Request, db: AsyncSession = Depends(get_db)):
    data = await req.json()
    
    try:
        # Just in case team_registrations or academic_toppers is missing updated_at
        try:
            await db.execute(text("ALTER TABLE team_registrations ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE;"))
        except:
            pass
            
        try:
            await db.execute(text("ALTER TABLE academic_toppers ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE;"))
        except:
            pass
            
        # TRUNCATE tables to avoid ID and unique constraint conflicts
        await db.execute(text("TRUNCATE TABLE team_registrations, events, academic_toppers RESTART IDENTITY CASCADE;"))
        
        for e in data.get("events", []):
            clean_dict(e)
            ev = Event(**e)
            db.add(ev)
            
        for r in data.get("registrations", []):
            clean_dict(r)
            reg = TeamRegistration(**r)
            db.add(reg)
            
        for t in data.get("toppers", []):
            clean_dict(t)
            top = AcademicTopper(**t)
            db.add(top)
            
        await db.commit()
        return {"status": "ok"}
    except Exception as exc:
        return {"error": str(exc), "traceback": traceback.format_exc()}
