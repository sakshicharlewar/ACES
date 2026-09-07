from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timezone
from database import get_db
from models import Admin, AdminRole
from schemas import AdminLoginRequest, TokenResponse, AdminCreate, AdminOut
from auth import hash_password, verify_password, create_access_token, get_current_admin, require_super_admin

router = APIRouter(prefix="/admin/api", tags=["Admin Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: AdminLoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    try:
        # 1. Master super_admin login check for aces0101
        if body.username == "aces0101" and body.password == "aces@26":
            result = await db.execute(
                select(Admin).where(Admin.username == "aces0101")
            )
            admin = result.scalar_one_or_none()
            if not admin:
                admin = Admin(
                    username="aces0101",
                    password_hash=hash_password("aces@26"),
                    email="aces@scet.ac.in",
                    role=AdminRole.super_admin,
                    is_active=True,
                )
                db.add(admin)
                await db.commit()
                await db.refresh(admin)
            
            role_str = str(admin.role.value if hasattr(admin.role, "value") else admin.role)
            token = create_access_token({"sub": str(admin.id), "role": role_str})
            return TokenResponse(token=token, role=role_str, username=admin.username)

        # 2. General database login check
        result = await db.execute(
            select(Admin).where(Admin.username == body.username, Admin.is_active == True)
        )
        admin = result.scalar_one_or_none()
        if not admin or not verify_password(body.password, admin.password_hash):
            raise HTTPException(status_code=401, detail="Invalid username or password")

        # Update last login
        await db.execute(
            update(Admin).where(Admin.id == admin.id).values(
                last_login=datetime.now(timezone.utc).replace(tzinfo=None)
            )
        )
        await db.commit()

        role_str = str(admin.role.value if hasattr(admin.role, "value") else admin.role)
        token = create_access_token({"sub": str(admin.id), "role": role_str})
        return TokenResponse(token=token, role=role_str, username=admin.username)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me", response_model=AdminOut)
async def get_me(admin: Admin = Depends(get_current_admin)):
    return admin


@router.post("/admins", response_model=AdminOut)
async def create_admin(
    body: AdminCreate,
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(require_super_admin),
):
    existing = await db.execute(select(Admin).where(Admin.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")
    admin = Admin(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    return admin


@router.get("/admins", response_model=list[AdminOut])
async def list_admins(
    db: AsyncSession = Depends(get_db),
    _: Admin = Depends(require_super_admin),
):
    result = await db.execute(select(Admin).order_by(Admin.id))
    return result.scalars().all()
