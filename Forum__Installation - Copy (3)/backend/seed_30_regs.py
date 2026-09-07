import asyncio
import sys
import os
import random
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

        # Check existing count
        existing = (await db.execute(select(TeamRegistration).where(TeamRegistration.event_id == bug_hunt.id))).scalars().all()
        current_count = len(existing)
        target_count = 30
        
        if current_count >= target_count:
            print(f"Already have {current_count} entries.")
            return

        needed = target_count - current_count
        
        mock_regs = []
        for i in range(needed):
            idx = current_count + i + 1
            mock_regs.append(
                TeamRegistration(
                    registration_id=f"BUGHUNT-{str(idx).zfill(3)}",
                    event_id=bug_hunt.id,
                    team_name=f"Team Debugger {idx}",
                    leader_name=f"Participant {idx}",
                    leader_email=f"participant{idx}@example.com",
                    leader_phone=f"9876543{str(idx).zfill(3)}",
                    leader_year="3rd Year",
                    leader_branch="Computer Science",
                    member2_name=f"Member {idx}",
                    member2_email=f"member{idx}@example.com",
                    member2_phone=f"9876544{str(idx).zfill(3)}",
                    payment_status=PaymentStatus.approved,
                    transaction_id=f"TXN{random.randint(10000000, 99999999)}"
                )
            )
            
        db.add_all(mock_regs)
        
        # update the event counts
        bug_hunt.registered_count = target_count
        bug_hunt.approved_count = target_count
        
        await db.commit()
        print(f"[OK] Added {needed} mock registrations to reach {target_count}.")

if __name__ == "__main__":
    asyncio.run(seed_regs())
