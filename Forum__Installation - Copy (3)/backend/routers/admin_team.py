from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Admin, TeamMember
from schemas import TeamMemberCreate, TeamMemberUpdate, TeamMemberOut
from auth import get_current_admin

router = APIRouter(prefix="/admin/api/team", tags=["Team"])


@router.get("/", response_model=list[TeamMemberOut])
async def list_members(
    category: str = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    q = select(TeamMember).where(TeamMember.is_active == True)
    if category:
        q = q.where(TeamMember.category == category)
    q = q.order_by(TeamMember.sort_order.asc(), TeamMember.created_at.asc())
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=TeamMemberOut, status_code=201)
async def create_member(body: TeamMemberCreate, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    member = TeamMember(**body.model_dump())
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


@router.patch("/{member_id}", response_model=TeamMemberOut)
async def update_member(member_id: int, body: TeamMemberUpdate, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(TeamMember).where(TeamMember.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(member, k, v)
    await db.commit()
    await db.refresh(member)
    return member


@router.delete("/{member_id}")
async def delete_member(member_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(TeamMember).where(TeamMember.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    await db.delete(member)
    await db.commit()
    return {"success": True}
