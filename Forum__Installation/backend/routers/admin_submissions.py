import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from database import get_db
from models import Admin, IdeaSubmission
from auth import get_current_admin

router = APIRouter(prefix="/admin/api", tags=["Admin Submissions"])


def _sub_dict(s: IdeaSubmission) -> dict:
    return {
        "id": s.id,
        "idea_id": s.idea_id,
        "full_name": s.full_name,
        "email": s.email,
        "phone": s.phone,
        "department": s.department,
        "year": s.year,
        "idea_title": s.idea_title,
        "idea_description": s.idea_description,
        "attachment": s.attachment,
        "status": s.status,
        "admin_remarks": s.admin_remarks,
        "email_sent": s.email_sent,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


@router.get("/submissions")
async def list_submissions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    department: str = Query(""),
    date_from: str = Query(""),
    date_to: str = Query(""),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    q = select(IdeaSubmission)
    if search:
        term = f"%{search}%"
        q = q.where(or_(
            IdeaSubmission.full_name.ilike(term),
            IdeaSubmission.email.ilike(term),
            IdeaSubmission.phone.ilike(term),
            IdeaSubmission.department.ilike(term),
            IdeaSubmission.idea_title.ilike(term),
        ))
    if department:
        q = q.where(IdeaSubmission.department == department)
    q = q.order_by(IdeaSubmission.created_at.desc())

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    offset = (page - 1) * limit
    result = await db.execute(q.offset(offset).limit(limit))
    items = [_sub_dict(s) for s in result.scalars().all()]

    return {"items": items, "total": total, "page": page, "limit": limit, "pages": max(1, -(-total // limit))}


@router.get("/submissions/export")
async def export_submissions_csv(
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    result = await db.execute(select(IdeaSubmission).order_by(IdeaSubmission.created_at.desc()))
    subs = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Idea ID", "Name", "Email", "Phone", "Department", "Year", "Idea Title", "Status", "Submitted At"])
    for s in subs:
        writer.writerow([s.id, s.idea_id, s.full_name, s.email, s.phone or "", s.department or "", s.year or "", s.idea_title, s.status, s.created_at])
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=submissions.csv"},
    )


@router.get("/submissions/{submission_id}")
async def get_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    from fastapi import HTTPException
    s = (await db.execute(select(IdeaSubmission).where(IdeaSubmission.id == submission_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Submission not found")
    return _sub_dict(s)


@router.delete("/innovation/{submission_id}")
async def delete_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    from fastapi import HTTPException
    s = (await db.execute(select(IdeaSubmission).where(IdeaSubmission.id == submission_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(s)
    await db.commit()
    return {"success": True, "message": "Submission deleted"}


@router.patch("/innovation/{submission_id}/approve")
async def approve_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    from fastapi import HTTPException
    s = (await db.execute(select(IdeaSubmission).where(IdeaSubmission.id == submission_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    s.status = "Approved"
    await db.commit()
    return {"success": True, "status": "Approved"}


@router.patch("/innovation/{submission_id}/reject")
async def reject_submission(
    submission_id: int,
    body: dict = None,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    from fastapi import HTTPException
    from fastapi import Body
    s = (await db.execute(select(IdeaSubmission).where(IdeaSubmission.id == submission_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    s.status = "Rejected"
    if body and body.get("rejection_reason"):
        s.admin_remarks = body["rejection_reason"]
    await db.commit()
    return {"success": True, "status": "Rejected"}


@router.patch("/innovation/{submission_id}/status")
async def update_submission_status(
    submission_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    from fastapi import HTTPException
    s = (await db.execute(select(IdeaSubmission).where(IdeaSubmission.id == submission_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    if "status" in body:
        s.status = body["status"]
    if "admin_remarks" in body:
        s.admin_remarks = body["admin_remarks"]
    await db.commit()
    return {"success": True, "status": s.status}


@router.post("/innovation/{submission_id}/resend")
async def resend_notification(
    submission_id: int,
    body: dict = None,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    from fastapi import HTTPException
    s = (await db.execute(select(IdeaSubmission).where(IdeaSubmission.id == submission_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    # Email sending would go here in production
    s.email_sent = True
    await db.commit()
    return {"success": True, "message": "Notification queued"}
