from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import engine, Base, AsyncSessionLocal
from models import Admin, AdminRole
from auth import hash_password, verify_password

from routers import (
    admin_auth, admin_dashboard, admin_events, admin_notices, admin_results,
    admin_gallery, admin_submissions, admin_team, admin_faculty, admin_hod, 
    admin_laboratories, admin_committee, admin_toppers, admin_registrations, admin_test_registrations,
    public_events, public_notices, public_faculty, public_hod, public_laboratories, public_committee, public_toppers
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        # Ensure super admin account exists
        async with AsyncSessionLocal() as db:
            admin_res = await db.execute(select(Admin).where(Admin.username == "aces0101"))
            admin = admin_res.scalar_one_or_none()
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
                print("[ACES] Created default super_admin (aces0101).")
            else:
                if not verify_password("aces@26", admin.password_hash):
                    admin.password_hash = hash_password("aces@26")
                    admin.is_active = True
                    await db.commit()
                    print("[ACES] Verified super_admin password.")
    except Exception as e:
        print(f"[ACES] Startup exception: {e}")

    yield


app = FastAPI(title="ACES Admin API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Admin Routers
app.include_router(admin_auth.router)
app.include_router(admin_dashboard.router)
app.include_router(admin_events.router)
app.include_router(admin_notices.router)
app.include_router(admin_results.router)
app.include_router(admin_gallery.router)
app.include_router(admin_submissions.router)
app.include_router(admin_team.router)
app.include_router(admin_faculty.router)
app.include_router(admin_hod.router)
app.include_router(admin_laboratories.router)
app.include_router(admin_committee.router)
app.include_router(admin_toppers.router)
app.include_router(admin_registrations.router)
app.include_router(admin_test_registrations.router)

# Public Routers
app.include_router(public_events.router)
app.include_router(public_notices.router)
app.include_router(public_faculty.router)
app.include_router(public_hod.router)
app.include_router(public_laboratories.router)
app.include_router(public_committee.router)
app.include_router(public_toppers.router)


@app.get("/")
def read_root():
    return {"message": "ACES Backend API Running", "status": "online"}
