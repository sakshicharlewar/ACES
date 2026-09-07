import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal
from models import Event, EventResult, EventStatus, ResultStatus

async def update():
    async with AsyncSessionLocal() as db:
        ev = (await db.execute(select(Event).where(Event.slug == "bug-hunt-debug-the-web"))).scalar_one_or_none()
        if ev:
            ev.event_status = EventStatus.upcoming
            ev.result_status = ResultStatus.announced
            
            res = (await db.execute(select(EventResult).where(EventResult.event_id == ev.id))).scalar_one_or_none()
            if not res:
                new_res = EventResult(
                    event_id=ev.id,
                    winner="Team Alpha",
                    winner_details="Registration ID: ACES-101\nYear: 3rd Year\nMembers:\n- Alice\n- Bob\nCongratulations for securing the 1st position!",
                    runner_up="Team Beta",
                    runner_up_details="Registration ID: ACES-102\nYear: 2nd Year\nMembers:\n- Charlie\n- Dave\nCongratulations for securing the 2nd position!",
                    announcement_date="2025-08-25"
                )
                db.add(new_res)
                print("Added dummy result for Bug Hunt")
            else:
                print("Result already exists for Bug Hunt")
            
            await db.commit()
            print("Bug hunt status updated to upcoming and result announced!")

if __name__ == "__main__":
    asyncio.run(update())
