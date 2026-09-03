import asyncio
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import AsyncSessionLocal
from models import Event

async def check():
    async with AsyncSessionLocal() as db:
        q = select(Event).options(selectinload(Event.result)).where(Event.event_status.in_(["upcoming", "ongoing"]))
        events = await db.execute(q)
        for ev in events.scalars().all():
            res_txt = "Yes" if ev.result else "No"
            print(f"Title: {ev.title}, Status: {ev.event_status.value}, ResultStatus: {ev.result_status.value}, HasResult: {res_txt}")

if __name__ == "__main__":
    asyncio.run(check())
