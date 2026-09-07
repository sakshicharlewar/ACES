from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Admin, HodProfile
from auth import get_current_admin
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/admin/api", tags=["HOD Profile"])

class HodSchema(BaseModel):
    name: str
    designation: str = "Head of Department"
    department: str = "Computer Engineering"
    image: Optional[str] = None
    professional_summary: Optional[str] = None
    academic_qualifications: Optional[List[Dict[str, Any]]] = []
    professional_highlights: Optional[List[Dict[str, Any]]] = []
    achievement_images: Optional[List[Dict[str, Any]]] = []

@router.get("/hod")
async def get_hod(db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(HodProfile).order_by(HodProfile.id).limit(1))
    hod = result.scalar_one_or_none()
    if not hod:
        return {}
    return _serialize(hod)

@router.post("/hod")
async def update_hod(body: HodSchema, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(HodProfile).order_by(HodProfile.id).limit(1))
    hod = result.scalar_one_or_none()
    
    if hod:
        for k, v in body.model_dump().items():
            setattr(hod, k, v)
    else:
        hod = HodProfile(**body.model_dump())
        db.add(hod)
        
    await db.commit()
    await db.refresh(hod)
    return _serialize(hod)

def _serialize(h: HodProfile):
    return {
        "id": h.id,
        "name": h.name,
        "designation": h.designation,
        "department": h.department,
        "image": h.image,
        "professional_summary": h.professional_summary,
        "academic_qualifications": h.academic_qualifications or [],
        "professional_highlights": h.professional_highlights or [],
        "achievement_images": h.achievement_images or [],
    }
