import traceback
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import EventResult

router = APIRouter()

@router.get("/temp_check_results")
async def check_results(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(EventResult))
    items = res.scalars().all()
    return [{"id": i.id, "event_id": i.event_id, "winner": i.winner} for i in items]
