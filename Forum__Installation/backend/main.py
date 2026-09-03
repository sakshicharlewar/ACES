from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    admin_auth, admin_dashboard, admin_events, admin_notices, admin_results,
    admin_gallery, admin_submissions, admin_team, admin_faculty, admin_hod, 
    admin_laboratories, admin_committee, admin_toppers, admin_registrations, admin_test_registrations,
    public_events, public_notices, public_faculty, public_hod, public_laboratories, public_committee, public_toppers,
    temp_restore, temp_check
)
from database import engine, Base
import traceback
import sys

app = FastAPI(title="ACES Admin API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

app.include_router(public_events.router)
app.include_router(public_notices.router)
app.include_router(public_faculty.router)
app.include_router(public_hod.router)
app.include_router(public_laboratories.router)
app.include_router(public_committee.router)
app.include_router(public_toppers.router)
app.include_router(temp_restore.router)
app.include_router(temp_check.router)

@app.get("/")
def read_root():
    return {"message": "ACES Backend API Running"}
