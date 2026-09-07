from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import HodProfile

router = APIRouter(prefix="/api", tags=["Public HOD Profile"])

@router.get("/hod")
async def get_public_hod(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HodProfile).order_by(HodProfile.id).limit(1))
    hod = result.scalar_one_or_none()
    
    if not hod:
        return {}
        
    return {
        "id": hod.id,
        "name": hod.name,
        "designation": hod.designation,
        "department": hod.department,
        "image": hod.image,
        "professional_summary": hod.professional_summary,
        "academic_qualifications": hod.academic_qualifications or [],
        "professional_highlights": hod.professional_highlights or [],
        "achievement_images": hod.achievement_images or [],
    }
