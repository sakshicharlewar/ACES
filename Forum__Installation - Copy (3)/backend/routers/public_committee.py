from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import CommitteeMember

router = APIRouter(prefix="/api", tags=["Public Committee"])


@router.get("/committee")
async def public_list_committee(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CommitteeMember).order_by(CommitteeMember.display_order, CommitteeMember.id))
    members = result.scalars().all()
    return [
        {
            "id": m.id,
            "key": m.key,
            "role": m.role,
            "name": m.name,
            "image": m.image,
            "bio": m.bio,
            "linkedin": m.linkedin,
            "github": m.github,
            "email": m.email,
            "skills": m.skills or [],
            "achievements": m.achievements or [],
            "certificates": m.certificates or [],
            "projects": m.projects or [],
            "experience": m.experience or [],
            "display_order": m.display_order,
        }
        for m in members
    ]
