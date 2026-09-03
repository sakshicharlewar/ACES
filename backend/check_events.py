import asyncio, sys
sys.path.insert(0, '.')

async def check():
    from database import AsyncSessionLocal
    from sqlalchemy import text
    async with AsyncSessionLocal() as db:
        # Get column names first
        cols = await db.execute(text("PRAGMA table_info(events)"))
        print("=== EVENTS COLUMNS ===")
        for c in cols.fetchall():
            print(dict(c._mapping))

        print("\n=== ALL EVENTS ===")
        result = await db.execute(text("SELECT * FROM events"))
        rows = result.fetchall()
        for r in rows:
            print(dict(r._mapping))

        print("\n=== EVENT RESULTS TABLE ===")
        try:
            cols2 = await db.execute(text("PRAGMA table_info(event_results)"))
            for c in cols2.fetchall():
                print(dict(c._mapping))
            r2 = await db.execute(text("SELECT * FROM event_results"))
            for r in r2.fetchall():
                print(dict(r._mapping))
        except Exception as e:
            print("Error:", e)

if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
asyncio.run(check())
