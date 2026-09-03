from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Admin, FacultyMember
from auth import get_current_admin
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/admin/api", tags=["Faculty Members"])

class FacultySchema(BaseModel):
    slug: str
    name: str
    designation: str
    department: str
    qualification: Optional[str] = None
    experience: Optional[str] = None
    image: Optional[str] = None
    email: Optional[str] = None
    linkedin: Optional[str] = None
    professional_summary: Optional[str] = None
    specialization: Optional[str] = None
    research_interests: Optional[List[str]] = []
    subjects_taught: Optional[List[str]] = []
    academic_qualifications: Optional[List[Dict[str, Any]]] = []
    publications: Optional[List[Dict[str, Any]]] = []
    achievement_images: Optional[List[Dict[str, Any]]] = []
    professional_info: Optional[Dict[str, Any]] = {}
    gallery: Optional[List[str]] = []
    display_order: Optional[int] = 0

@router.get("/faculty")
async def list_faculty(db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(FacultyMember).order_by(FacultyMember.display_order, FacultyMember.id))
    faculty = result.scalars().all()
    return [_serialize(f) for f in faculty]

@router.post("/faculty")
async def create_faculty(body: FacultySchema, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    existing = await db.execute(select(FacultyMember).where(FacultyMember.slug == body.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A faculty member with this ID/slug already exists.")
        
    faculty = FacultyMember(**body.model_dump())
    db.add(faculty)
    await db.commit()
    await db.refresh(faculty)
    return _serialize(faculty)

@router.put("/faculty/{faculty_id}")
async def update_faculty(faculty_id: int, body: FacultySchema, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(FacultyMember).where(FacultyMember.id == faculty_id))
    faculty = result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")
        
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(faculty, k, v)
        
    await db.commit()
    await db.refresh(faculty)
    return _serialize(faculty)

@router.delete("/faculty/{faculty_id}")
async def delete_faculty(faculty_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(FacultyMember).where(FacultyMember.id == faculty_id))
    faculty = result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")
    await db.delete(faculty)
    await db.commit()
    return {"ok": True}

def _serialize(f: FacultyMember):
    return {
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
