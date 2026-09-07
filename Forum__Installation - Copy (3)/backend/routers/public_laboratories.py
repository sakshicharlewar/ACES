from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Laboratory

router = APIRouter(prefix="/api/laboratories", tags=["Public Laboratories"])

@router.get("")
async def get_public_laboratories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Laboratory).order_by(Laboratory.display_order))
    return [_serialize(lab) for lab in result.scalars()]

def _serialize(lab: Laboratory):
    return {
        "id": lab.id,
        "title": lab.title,
        "location": lab.location,
        "in_charge": lab.in_charge,
        "image": lab.image,
        "equipment": lab.equipment or {"left": [], "right": []},
        "display_order": lab.display_order
    }
