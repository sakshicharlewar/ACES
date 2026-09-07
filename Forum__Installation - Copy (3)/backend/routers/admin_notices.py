from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Admin, Notice
from schemas import NoticeCreate, NoticeUpdate, NoticeOut
from auth import get_current_admin

router = APIRouter(prefix="/admin/api/notices", tags=["Notices"])


@router.get("/", response_model=list[NoticeOut])
async def list_notices(
    active_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    q = select(Notice)
    if active_only:
        q = q.where(Notice.is_active == True)
    q = q.order_by(Notice.is_pinned.desc(), Notice.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=NoticeOut, status_code=201)
async def create_notice(body: NoticeCreate, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    notice = Notice(**body.model_dump())
    db.add(notice)
    await db.commit()
    await db.refresh(notice)
    return notice


@router.patch("/{notice_id}", response_model=NoticeOut)
async def update_notice(notice_id: int, body: NoticeUpdate, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(Notice).where(Notice.id == notice_id))
    notice = result.scalar_one_or_none()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(notice, k, v)
    await db.commit()
    await db.refresh(notice)
    return notice


@router.delete("/{notice_id}")
async def delete_notice(notice_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(Notice).where(Notice.id == notice_id))
    notice = result.scalar_one_or_none()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    await db.delete(notice)
    await db.commit()
    return {"success": True}


@router.patch("/{notice_id}/pin")
async def pin_notice(notice_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(Notice).where(Notice.id == notice_id))
    notice = result.scalar_one_or_none()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    notice.is_pinned = not notice.is_pinned
    await db.commit()
    return {"success": True, "is_pinned": notice.is_pinned}
