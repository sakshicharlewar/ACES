import asyncio
import sys
import os
import httpx
sys.path.insert(0, os.path.dirname(__file__))

from database import AsyncSessionLocal, init_db
from models import Event, TeamRegistration, PaymentStatus
from sqlalchemy import select, delete
from datetime import datetime
from dateutil import parser

async def restore_live_data():
    await init_db()
    
    # Fetch from live API
    url = "https://aces-backkend.onrender.com/admin/api/events/1/team-registrations"
    headers = {"Authorization": "Bearer admin_secret_token"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            response.raise_for_status()
            live_data = response.json()
        except Exception as e:
            print(f"Failed to fetch live data: {e}")
            return
            
    if not live_data:
        print("No live data found to restore.")
        return
        
    print(f"Fetched {len(live_data)} entries from live database.")
    
    async with AsyncSessionLocal() as db:
        # Get local bug hunt event
        bug_hunt = (await db.execute(select(Event).where(Event.slug == "bug-hunt-debug-the-web"))).scalar_one_or_none()
        if not bug_hunt:
            print("Local Bug Hunt event not found!")
            return

        # Delete dummy data
        await db.execute(delete(TeamRegistration).where(TeamRegistration.event_id == bug_hunt.id))
        
        # Insert live data
        restored_regs = []
        for reg in live_data:
            payment_status = PaymentStatus.pending
            if reg.get("payment_status") == "approved":
                payment_status = PaymentStatus.approved
            elif reg.get("payment_status") == "rejected":
                payment_status = PaymentStatus.rejected
                
            new_reg = TeamRegistration(
                id=reg.get("id"),  # Keep original ID if possible, though sqlite might auto-increment differently. Let's omit or keep?
                registration_id=reg.get("registration_id"),
                event_id=bug_hunt.id,
                team_name=reg.get("team_name"),
                leader_name=reg.get("leader_name"),
                leader_email=reg.get("leader_email"),
                leader_phone=reg.get("leader_phone"),
                leader_year=reg.get("leader_year"),
                leader_branch=reg.get("leader_branch"),
                member2_name=reg.get("member2_name"),
                member2_email=reg.get("member2_email"),
                member2_phone=reg.get("member2_phone"),
                transaction_id=reg.get("transaction_id"),
                payment_status=payment_status,
                payment_screenshot=reg.get("payment_screenshot"),
                rejection_reason=reg.get("rejection_reason"),
            )
            
            if reg.get("created_at"):
                try:
                    new_reg.created_at = parser.isoparse(reg.get("created_at")).replace(tzinfo=None)
                except:
                    pass
                    
            restored_regs.append(new_reg)
            
        db.add_all(restored_regs)
        
        # Update event counts
        bug_hunt.registered_count = len(restored_regs)
        bug_hunt.approved_count = sum(1 for r in restored_regs if r.payment_status == PaymentStatus.approved)
        
        await db.commit()
        print(f"[OK] Successfully restored {len(restored_regs)} real registrations to local database.")

if __name__ == "__main__":
    asyncio.run(restore_live_data())
