from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db

router = APIRouter()

@router.get("/api/fix-db")
async def fix_db(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("ALTER TABLE team_registrations ADD COLUMN extra_members JSON;"))
        await db.commit()
        return {"status": "ok"}
    except Exception as e:
        return {"error": str(e)}
