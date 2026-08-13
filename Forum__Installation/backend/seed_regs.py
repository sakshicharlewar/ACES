import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import AsyncSessionLocal, init_db
from models import Event, TeamRegistration, PaymentStatus
from sqlalchemy import select

async def seed_regs():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Get bug hunt event
        bug_hunt = (await db.execute(select(Event).where(Event.slug == "bug-hunt-debug-the-web"))).scalar_one_or_none()
        if not bug_hunt:
            print("Bug Hunt event not found!")
            return

        # Check if regs already exist
        existing = (await db.execute(select(TeamRegistration).where(TeamRegistration.event_id == bug_hunt.id))).scalars().all()
        if len(existing) > 0:
            print(f"Found {len(existing)} registrations already.")
            return

        mock_regs = [
            TeamRegistration(
                registration_id="BUGHUNT-001",
                event_id=bug_hunt.id,
                team_name="Code Breakers",
                leader_name="Rahul Sharma",
                leader_email="rahul@example.com",
                leader_phone="9876543210",
                leader_year="3rd Year",
                leader_branch="Computer Science",
                member2_name="Aditya Verma",
                member2_email="aditya@example.com",
                member2_phone="9876543211",
                payment_status=PaymentStatus.approved,
                transaction_id="TXN12345678"
            ),
            TeamRegistration(
                registration_id="BUGHUNT-002",
                event_id=bug_hunt.id,
                team_name="Null Pointers",
                leader_name="Priya Patel",
                leader_email="priya@example.com",
                leader_phone="9876543212",
                leader_year="2nd Year",
                leader_branch="Information Technology",
                member2_name="Sneha Gupta",
                member2_email="sneha@example.com",
                member2_phone="9876543213",
                payment_status=PaymentStatus.pending,
                transaction_id="TXN87654321"
            ),
            TeamRegistration(
                registration_id="BUGHUNT-003",
                event_id=bug_hunt.id,
                team_name="Byte Me",
                leader_name="Amit Kumar",
                leader_email="amit@example.com",
                leader_phone="9876543214",
                leader_year="4th Year",
                leader_branch="Computer Science",
                member2_name="Neha Singh",
                member2_email="neha@example.com",
                member2_phone="9876543215",
                payment_status=PaymentStatus.approved,
                transaction_id="TXN11223344"
            )
        ]
        
        db.add_all(mock_regs)
        await db.commit()
        print("[OK] Added 3 mock registrations for Bug Hunt.")

if __name__ == "__main__":
    asyncio.run(seed_regs())
