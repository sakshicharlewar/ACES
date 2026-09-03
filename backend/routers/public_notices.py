from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Notice

router = APIRouter(prefix="/api", tags=["Public Notices"])


@router.get("/notices")
async def public_notices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notice)
        .where(Notice.is_active == True)
        .order_by(Notice.is_pinned.desc(), Notice.created_at.desc())
        .limit(20)
    )
    notices = result.scalars().all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "link": n.link,
            "is_pinned": n.is_pinned,
            "created_at": n.created_at.isoformat(),
        }
        for n in notices
    ]
