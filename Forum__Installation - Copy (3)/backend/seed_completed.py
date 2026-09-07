import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import AsyncSessionLocal
from models import Event, EventStatus, RegistrationStatus
from routers.admin_events import slugify

async def seed_completed_events():
    events_data = [
      {
        "title": "REIMAGINE UI/UX Competition",
        "date": "August 20, 2025",
        "desc": "The Department of Computer Engineering, Suryodaya College of Engineering & Technology, organized the UI/UX Competition \"REIMAGINE\" under the ACES Forum on 20th August 2025 at MCA Seminar Hall for teams of two participants. A total of 40 teams (80participants) competed in preliminary and final rounds.",
        "image": "/Reimagin.jpeg",
      },
      {
        "title": "Debugging Competition",
        "date": "July 15, 2025",
        "desc": "The Department of Computer Engineering under Forum 'ACES' organized a Debugging Competition on 15th July 2025 at Room No. S-24 and S-30. The competition consisted of preliminary and final rounds for teams of three. A total of 60 teams (180 participants) participated.",
        "image": "/Debugging.jpeg",
      },
      {
        "title": "Logo Design Competition",
        "date": "August 13, 2025",
        "desc": "The Department of Computer Engineering, Suryodaya College of Engineering & Technology, organized a Logo Design Competition on 13th August 2025 at Lab-III. A total of 17 students participated and created logo designs for the ACES forum. The most creative and original design was selected as the official ACES logo.",
        "image": "/LogoCompition.jpeg",
      },
      {
        "title": "Face the Panel",
        "date": "Upcoming Event",
        "desc": "Face the Panel was a career-oriented mock interview event organized by the Department of Computer Engineering under the Students Forum. Participants experienced real interview scenarios, where faculty members assessed their communication, technical knowledge, confidence, and problem-solving skills. The event provided valuable feedback, helping students improve their interview performance, boost confidence, and prepare for placements and future professional opportunities.",
        "image": "/FaceThePanel.jpeg",
      },
      {
        "title": "Kite Making",
        "date": "Upcoming Event",
        "desc": "Kite Making and Flying Competition was a fun-filled event organized by the Department of Computer Engineering to encourage creativity, teamwork, and festive spirit. Students showcased their artistic skills by designing colorful kites and participated enthusiastically in the flying competition, making the event a memorable celebration of innovation, collaboration, and healthy competition.",
        "image": "/KiteMaking.jpeg",
      },
      {
        "title": "National Conference 2026",
        "date": "February 3, 2026",
        "desc": "National Conference 2026 was organized on 03 February 2026 to bring together academicians, researchers, industry experts, and students for knowledge sharing and research discussions. The event featured technical paper presentations, keynote sessions, and interactive discussions, promoting innovation, collaboration, and academic excellence across various disciplines.",
        "image": "/NationalConference.jpeg",
      },
      {
        "title": "International Conference 2026",
        "date": "April 13, 2026",
        "desc": "International Conference 2026 was organized on 13 April 2026 to provide a global platform for researchers, academicians, industry professionals, and students to share innovative research and emerging technologies. The conference featured keynote speeches, technical paper presentations, and interactive sessions, fostering international collaboration, knowledge exchange, and research excellence.",
        "image": "/InternationalConference.jpeg",
      }
    ]

    async with AsyncSessionLocal() as db:
        for ed in events_data:
            # Check if event already exists
            slug = slugify(ed["title"]) + "-completed"
            existing = await db.execute(select(Event).where(Event.slug == slug))
            if existing.scalar_one_or_none():
                continue
                
            new_event = Event(
                title=ed["title"],
                slug=slug,
                full_description=ed["desc"],
                date=ed["date"],
                banner=ed["image"],
                event_status=EventStatus.completed,
                registration_status=RegistrationStatus.closed
            )
            db.add(new_event)
        
        await db.commit()
        print("Completed Events seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_completed_events())
