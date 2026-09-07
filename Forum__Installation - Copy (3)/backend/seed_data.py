"""Seed script - restores Bug Hunt event and idea submission data"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import AsyncSessionLocal, init_db
from models import Event, IdeaSubmission, RegistrationStatus, EventStatus, ResultStatus
from sqlalchemy import select

async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        # ── Check if Bug Hunt already exists ──
        existing = (await db.execute(select(Event).where(Event.slug == "bug-hunt-debug-the-web"))).scalar_one_or_none()
        if not existing:
            bug_hunt = Event(
                title="Bug Hunt: Debug the Web",
                slug="bug-hunt-debug-the-web",
                subtitle="Find & Fix the Bugs",
                short_description="Challenges teams to identify and fix real HTML, CSS, and JavaScript issues in a web application. Winners are decided by accuracy and completion time.",
                full_description="Bug Hunt: Debug the Web is a technical event organized by ACES Forum where teams compete to identify and fix bugs in a given web application. The event tests your debugging skills, attention to detail, and teamwork under time pressure.",
                date="2026-02-15",
                time="10:00 AM – 1:00 PM",
                venue="Computer Lab, SCET Nagpur",
                registration_fee=40.0,
                team_size=2,
                max_participants=30,
                registered_count=30,
                approved_count=30,
                registration_status=RegistrationStatus.closed,
                event_status=EventStatus.completed,
                result_status=ResultStatus.announced,
                is_featured=True,
                eligibility="All years",
                whatsapp_link=None,
                payment_link=None,
            )
            db.add(bug_hunt)
            print("[OK] Bug Hunt event added.")
        else:
            print("[INFO] Bug Hunt event already exists.")

        # -- Check if idea submission already exists --
        existing_sub = (await db.execute(select(IdeaSubmission))).scalars().first()
        if not existing_sub:
            sub = IdeaSubmission(
                idea_id="IDEA-001",
                full_name="Sakshi Charlewar",
                email="sakshi@aces.com",
                phone="9876543210",
                department="Computer Engineering",
                year="3rd Year",
                idea_title="Smart Attendance System using Face Recognition",
                idea_description="A web-based attendance system that uses face recognition to automatically mark student attendance, reducing manual effort and proxy attendance.",
                status="Pending",
                email_sent=False,
            )
            db.add(sub)
            print("[OK] Sample idea submission added.")
        else:
            print("[INFO] Idea submission already exists.")

        await db.commit()
        print("[DONE] Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed())
