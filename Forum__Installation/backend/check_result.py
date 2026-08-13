import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal
from models import Event, EventResult

async def check_res():
    async with AsyncSessionLocal() as db:
        events = await db.execute(select(Event).where(Event.slug == "bug-hunt-2026"))
        ev = events.scalar_one_or_none()
        if not ev:
            print("Bug hunt not found!")
            return
        
        print(f"Bug hunt status: {ev.event_status.value}, result_status: {ev.result_status.value}")
        
        res = await db.execute(select(EventResult).where(EventResult.event_id == ev.id))
        result = res.scalar_one_or_none()
        if result:
            print(f"Result exists: winner={result.winner}")
        else:
            print("No result found!")

if __name__ == "__main__":
    asyncio.run(check_res())
