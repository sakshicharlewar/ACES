import traceback
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db, engine
from models import Event, TeamRegistration, AcademicTopper, EventResult, Base

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
        # DROP and RECREATE the tables
        async with engine.begin() as conn:
            await conn.execute(text("DROP TABLE IF EXISTS team_registrations CASCADE"))
            await conn.execute(text("DROP TABLE IF EXISTS academic_toppers CASCADE"))
            await conn.execute(text("DROP TABLE IF EXISTS event_results CASCADE"))
            await conn.execute(text("DROP TABLE IF EXISTS events CASCADE"))
            
            # Explicitly drop lingering indexes if they exist
            await conn.execute(text("DROP INDEX IF EXISTS ix_reg_event_email CASCADE"))
            await conn.execute(text("DROP INDEX IF EXISTS ix_events_slug CASCADE"))
            await conn.execute(text("DROP INDEX IF EXISTS ix_events_created_at CASCADE"))
            await conn.execute(text("DROP INDEX IF EXISTS ix_team_registrations_created_at CASCADE"))
            await conn.execute(text("DROP INDEX IF EXISTS ix_academic_toppers_created_at CASCADE"))
            
            await conn.run_sync(Base.metadata.create_all)
            
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
            
        for er in data.get("results", []):
            clean_dict(er)
            result_obj = EventResult(**er)
            db.add(result_obj)
            
        await db.commit()
        return {"status": "ok"}
    except Exception as exc:
        return {"error": str(exc), "traceback": traceback.format_exc()}
