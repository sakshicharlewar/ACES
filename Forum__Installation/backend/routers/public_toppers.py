from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import AcademicTopper

router = APIRouter(prefix="/api", tags=["Public Toppers"])

@router.get("/toppers")
async def public_list_toppers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AcademicTopper).order_by(AcademicTopper.year_group, AcademicTopper.rank, AcademicTopper.id))
    toppers = result.scalars().all()
    return [
        {
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
        for t in toppers
    ]
