from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Admin, AcademicTopper
from auth import get_current_admin
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/admin/api", tags=["Academic Toppers"])

class TopperSchema(BaseModel):
    year_group: str
    rank: int
    name: str
    branch: str
    cgpa: str
    score_label: Optional[str] = "CGPA"
    achievement: Optional[str] = None
    image: Optional[str] = None
    display_order: Optional[int] = 0


@router.get("/toppers")
async def list_toppers(db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(AcademicTopper).order_by(AcademicTopper.year_group, AcademicTopper.rank, AcademicTopper.id))
    toppers = result.scalars().all()
    return [_serialize(t) for t in toppers]


@router.post("/toppers")
async def create_topper(body: TopperSchema, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    topper = AcademicTopper(**body.model_dump())
    db.add(topper)
    await db.commit()
    await db.refresh(topper)
    return _serialize(topper)


@router.put("/toppers/{topper_id}")
async def update_topper(topper_id: int, body: TopperSchema, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(AcademicTopper).where(AcademicTopper.id == topper_id))
    topper = result.scalar_one_or_none()
    if not topper:
        raise HTTPException(status_code=404, detail="Topper not found")
    
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(topper, k, v)
        
    await db.commit()
    await db.refresh(topper)
    return _serialize(topper)


@router.delete("/toppers/{topper_id}")
async def delete_topper(topper_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(AcademicTopper).where(AcademicTopper.id == topper_id))
    topper = result.scalar_one_or_none()
    if not topper:
        raise HTTPException(status_code=404, detail="Topper not found")
    await db.delete(topper)
    await db.commit()
    return {"ok": True}


def _serialize(t: AcademicTopper):
    return {
        "id": t.id,
        "year_group": t.year_group,
        "rank": t.rank,
        "name": t.name,
        "branch": t.branch,
        "cgpa": t.cgpa,
        "score_label": t.score_label,
        "achievement": t.achievement,
        "image": t.image,
        "display_order": t.display_order
    }
