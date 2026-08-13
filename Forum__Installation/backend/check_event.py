import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import AsyncSessionLocal
from models import Event
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Event))
        print([{e.title: e.event_status} for e in res.scalars().all()])

if __name__ == "__main__":
    asyncio.run(check())
