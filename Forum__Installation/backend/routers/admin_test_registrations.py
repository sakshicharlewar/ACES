import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, desc
from fastapi.responses import StreamingResponse

from database import get_db
from models import TestRegistration, Admin
from schemas import PaginatedTestRegistrations
from auth import get_current_admin
from routers.admin_events import log_action

router = APIRouter(prefix="/admin/api", tags=["Admin Test Registrations"])

@router.get("/test-registrations", response_model=PaginatedTestRegistrations)
async def get_test_registrations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query("", max_length=100),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    offset = (page - 1) * limit
    query = select(TestRegistration)
    
    if search:
        search_filter = or_(
            TestRegistration.full_name.ilike(f"%{search}%"),
            TestRegistration.email.ilike(f"%{search}%"),
            TestRegistration.mobile.ilike(f"%{search}%"),
            TestRegistration.college_name.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0
    
    # Fetch paginated
    query = query.order_by(desc(TestRegistration.created_at)).offset(offset).limit(limit)
    result = await db.execute(query)
    registrations = result.scalars().all()
    
    return {
        "results": registrations,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.delete("/test-registrations/{reg_id}")
async def delete_test_registration(
    reg_id: int, 
    db: AsyncSession = Depends(get_db), 
    admin: Admin = Depends(get_current_admin)
):
    result = await db.execute(select(TestRegistration).where(TestRegistration.id == reg_id))
    reg = result.scalar_one_or_none()
    if not reg:
        raise HTTPException(status_code=404, detail="Test registration not found")
        
    await db.delete(reg)
    await log_action(db, admin.id, "delete_test_registration", "test_registration", reg_id, {"name": reg.full_name})
    await db.commit()
    
    return {"success": True}

@router.get("/test-registrations/export")
async def export_test_registrations_csv(
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    result = await db.execute(select(TestRegistration).order_by(desc(TestRegistration.created_at)))
    registrations = result.scalars().all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Full Name", "Email", "Mobile", "College Name", "Department", "Year", "Document URL", "Registered At"])
    
    for r in registrations:
        writer.writerow([
            r.id, 
            r.full_name, 
            r.email, 
            r.mobile, 
            r.college_name or "-", 
            r.department or "-", 
            r.year or "-", 
            r.document_url or "-", 
            r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "-"
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]), 
        media_type="text/csv", 
        headers={"Content-Disposition": "attachment; filename=test_registrations.csv"}
    )
