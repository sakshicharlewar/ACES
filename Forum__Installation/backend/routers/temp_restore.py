import traceback
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db, engine
from models import Event, TeamRegistration, AcademicTopper, EventResult, HodProfile, FacultyMember, Laboratory, CommitteeMember, Base

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
            await conn.execute(text("DROP TABLE IF EXISTS hod_profile CASCADE"))
            await conn.execute(text("DROP TABLE IF EXISTS faculty_members CASCADE"))
            await conn.execute(text("DROP TABLE IF EXISTS laboratories CASCADE"))
            await conn.execute(text("DROP TABLE IF EXISTS committee_members CASCADE"))
            
            await conn.run_sync(Base.metadata.create_all)
            
        for e in data.get("events", []):
            clean_dict(e)
            db.add(Event(**e))
            
        for r in data.get("registrations", []):
            clean_dict(r)
            db.add(TeamRegistration(**r))
            
        for t in data.get("toppers", []):
            clean_dict(t)
            db.add(AcademicTopper(**t))
            
        for er in data.get("results", []):
            clean_dict(er)
            db.add(EventResult(**er))
            
        for hp in data.get("hod", []):
            clean_dict(hp)
            db.add(HodProfile(**hp))
            
        for fm in data.get("faculty", []):
            clean_dict(fm)
            db.add(FacultyMember(**fm))
            
        for lab in data.get("laboratories", []):
            clean_dict(lab)
            db.add(Laboratory(**lab))
            
        for cm in data.get("committee", []):
            clean_dict(cm)
            db.add(CommitteeMember(**cm))
            
        await db.commit()
        return {"status": "ok"}
    except Exception as exc:
        return {"error": str(exc), "traceback": traceback.format_exc()}
