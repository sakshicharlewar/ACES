from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Admin, Event, EventResult
from schemas import ResultCreate, ResultOut
from auth import get_current_admin

router = APIRouter(prefix="/admin/api", tags=["Results"])


@router.get("/events/{event_id}/result", response_model=ResultOut)
async def get_result(event_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(EventResult).where(EventResult.event_id == event_id))
    res = result.scalar_one_or_none()
    if not res:
        raise HTTPException(status_code=404, detail="No result found")
    return res


@router.put("/events/{event_id}/result")
async def upsert_result(
    event_id: int,
    body: ResultCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    # Verify event exists
    ev = (await db.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    result = await db.execute(select(EventResult).where(EventResult.event_id == event_id))
    existing = result.scalar_one_or_none()

    if existing:
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(existing, k, v)
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        new_result = EventResult(event_id=event_id, **body.model_dump())
        db.add(new_result)
        await db.commit()
        await db.refresh(new_result)
        return new_result


@router.patch("/events/{event_id}/result-status")
async def update_result_status(
    event_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    ev = (await db.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    ev.result_status = body.get("result_status", "pending")
    await db.commit()
    return {"success": True, "result_status": ev.result_status}
