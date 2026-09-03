import asyncio
import sys
from sqlalchemy import select
from database import AsyncSessionLocal, init_db
from models import HodProfile

async def seed():
    await init_db()
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(HodProfile).limit(1))
        existing = result.scalar_one_or_none()
        
        if existing:
            print("HOD Profile already seeded!")
            return
            
        hod = HodProfile(
            name="Dr. Lowlesh Yadav",
            designation="Head of Department",
            department="Computer Engineering",
            image="/HODSIR1.jpeg",
            professional_summary="Dr. Lowlesh Yadav is the Head of the Department of Computer Engineering at Suryodaya College of Engineering & Technology (SCET). He has over 14 years of experience in teaching, research, academic administration, and student mentoring. His leadership focuses on innovation, practical learning, industry collaboration, research excellence, and preparing students for successful careers in modern technology.",
            academic_qualifications=[
                {"title": "Post Doctoral", "desc": "Lincoln University College, Malaysia – 2026"},
                {"title": "Ph.D.", "desc": "Computer Science & Engineering – 2024"},
                {"title": "M.Tech", "desc": "Computer Science & Engineering"},
                {"title": "B.E.", "desc": "Information Technology"},
                {"title": "Diploma", "desc": "Information Technology"}
            ],
            professional_highlights=[
                {"title": "14+ Years Experience"},
                {"title": "Head of Department"},
                {"title": "Ph.D. Completed"},
                {"title": "Post Doctoral (2026)"},
                {"title": "Student Mentor"},
                {"title": "Research & Innovation"},
                {"title": "Academic Leadership"},
                {"title": "Industry Collaboration"}
            ],
            achievement_images=[
                {"src": "/HOD_Achievements.jpeg", "title": "Achievement Certificate"}
            ]
        )
        
        session.add(hod)
        await session.commit()
        print("HOD Profile seeded successfully!")

if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed())
