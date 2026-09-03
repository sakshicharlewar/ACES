from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Admin, Laboratory
from auth import get_current_admin
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/admin/api/laboratories", tags=["Laboratories"])

class LabSchema(BaseModel):
    title: str
    location: str
    in_charge: str
    image: Optional[str] = None
    equipment: Optional[Dict[str, List[str]]] = {"left": [], "right": []}
    display_order: int = 0

@router.get("")
async def get_all_labs(db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(Laboratory).order_by(Laboratory.display_order))
    return [_serialize(lab) for lab in result.scalars()]

@router.post("")
async def create_lab(body: LabSchema, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    lab = Laboratory(**body.model_dump())
    db.add(lab)
    await db.commit()
    await db.refresh(lab)
    return _serialize(lab)

@router.put("/{lab_id}")
async def update_lab(lab_id: int, body: LabSchema, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    lab = await db.get(Laboratory, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
        
    for k, v in body.model_dump().items():
        setattr(lab, k, v)
        
    await db.commit()
    await db.refresh(lab)
    return _serialize(lab)

@router.delete("/{lab_id}")
async def delete_lab(lab_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    lab = await db.get(Laboratory, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
        
    await db.delete(lab)
    await db.commit()
    return {"message": "Lab deleted successfully"}

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
