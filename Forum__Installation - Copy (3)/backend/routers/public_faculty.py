from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import FacultyMember

router = APIRouter(prefix="/api", tags=["Public Faculty Members"])

@router.get("/faculty")
async def public_list_faculty(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FacultyMember).order_by(FacultyMember.display_order, FacultyMember.id))
    faculty = result.scalars().all()
    return [
        {
            "id": f.id,
            "slug": f.slug,
            "name": f.name,
            "designation": f.designation,
            "department": f.department,
            "qualification": f.qualification,
            "experience": f.experience,
            "image": f.image,
            "email": f.email,
            "linkedin": f.linkedin,
            "professional_summary": f.professional_summary,
            "specialization": f.specialization,
            "research_interests": f.research_interests or [],
            "subjects_taught": f.subjects_taught or [],
            "academic_qualifications": f.academic_qualifications or [],
            "publications": f.publications or [],
            "achievement_images": f.achievement_images or [],
            "professional_info": f.professional_info or {},
            "gallery": f.gallery or [],
            "display_order": f.display_order
        }
        for f in faculty
    ]
