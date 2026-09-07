from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Admin, CommitteeMember
from auth import get_current_admin
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/admin/api", tags=["Committee"])


class CommitteeMemberSchema(BaseModel):
    key: str
    role: str
    name: str
    image: Optional[str] = None
    bio: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    email: Optional[str] = None
    skills: Optional[list] = None
    achievements: Optional[list] = None
    certificates: Optional[list] = None
    projects: Optional[list] = None
    experience: Optional[list] = None
    display_order: Optional[int] = 0


@router.get("/committee")
async def list_committee(db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(CommitteeMember).order_by(CommitteeMember.display_order, CommitteeMember.id))
    members = result.scalars().all()
    return [_serialize(m) for m in members]


@router.post("/committee")
async def create_member(body: CommitteeMemberSchema, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    existing = await db.execute(select(CommitteeMember).where(CommitteeMember.key == body.key))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A member with this key already exists")
    member = CommitteeMember(**body.model_dump())
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return _serialize(member)


@router.put("/committee/{member_id}")
async def update_member(member_id: int, body: CommitteeMemberSchema, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(CommitteeMember).where(CommitteeMember.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(member, k, v)
    await db.commit()
    await db.refresh(member)
    return _serialize(member)


@router.delete("/committee/{member_id}")
async def delete_member(member_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(CommitteeMember).where(CommitteeMember.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    await db.delete(member)
    await db.commit()
    return {"ok": True}


def _serialize(m: CommitteeMember):
    return {
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
