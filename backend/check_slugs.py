import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal
from models import Event

async def check_res():
    async with AsyncSessionLocal() as db:
        events = await db.execute(select(Event))
        for ev in events.scalars().all():
            print(f"Title: {ev.title}, Slug: {ev.slug}, Status: {ev.event_status.value}")

if __name__ == "__main__":
    asyncio.run(check_res())
