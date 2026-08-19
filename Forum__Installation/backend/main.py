from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from config import settings
from database import init_db
from limiter import limiter
from routers import admin_auth, admin_dashboard, admin_events, admin_registrations
from routers import admin_results, admin_gallery, admin_notices, admin_team, admin_submissions
from routers import admin_test_registrations, admin_committee, admin_toppers, admin_faculty, admin_hod, admin_laboratories
from routers import public_events, public_notices, public_committee, public_toppers, public_faculty, public_hod, public_laboratories

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

from routers import temp_restore`napp = FastAPI(title="ACES Admin Panel API", version="2.0", lifespan=lifespan)
app.state.limiter = limiter

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(.*\.onrender\.com|.*\.vercel\.app|.*suryodaya\.edu\.in)",
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_auth.router)
app.include_router(admin_dashboard.router)

app.include_router(admin_events.router)
app.include_router(admin_registrations.router)
app.include_router(admin_submissions.router)
app.include_router(admin_results.router)
app.include_router(admin_gallery.router)
app.include_router(admin_notices.router)
app.include_router(admin_team.router)
app.include_router(admin_test_registrations.router)
app.include_router(admin_committee.router)
app.include_router(admin_toppers.router)
app.include_router(admin_faculty.router)
app.include_router(admin_hod.router)
app.include_router(admin_laboratories.router)
app.include_router(public_events.router)
app.include_router(public_notices.router)
app.include_router(public_committee.router)
app.include_router(public_toppers.router)
app.include_router(public_faculty.router)
app.include_router(public_hod.router)
app.include_router(public_laboratories.router)`napp.include_router(temp_restore.router)
