import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal
from models import Event, EventStatus, RegistrationStatus
from routers.admin_events import slugify
from datetime import datetime

async def add_event():
    async with AsyncSessionLocal() as db:
        title = "EduSkills 3-Day Workshop"
        slug = slugify(title) + "-completed"
        
        # Check if exists
        existing = await db.execute(select(Event).where(Event.slug == slug))
        if existing.scalar_one_or_none():
            print("Event already exists.")
            return

        desc = "The Department of Computer Engineering and Department of CSE (Data Science) at Suryodaya College of Engineering and Technology successfully organised a **three-day EduSkills workshop** focused on enhancing students’ industry-oriented technical skills. The workshop provided students with practical learning, expert guidance and hands-on exposure to emerging technologies.\n\n**Venue:** Suryodaya College of Engineering and Technology, Vhirgaon, Nagpur"
        
        new_event = Event(
            title=title,
            slug=slug,
            full_description=desc,
            date="30 July – 1 August 2026",
            banner="/EduSkill.jpeg",
            event_status=EventStatus.completed,
            registration_status=RegistrationStatus.closed
        )
        db.add(new_event)
        await db.commit()
        print("Event added successfully!")

if __name__ == "__main__":
    asyncio.run(add_event())
