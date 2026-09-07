from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import settings

from sqlalchemy import event

BACKEND_DIR = Path(__file__).resolve().parent

db_file = (BACKEND_DIR / "aces_db.sqlite").as_posix()
db_url = f"sqlite+aiosqlite:///{db_file}"

engine_kwargs = {
    "pool_pre_ping": True,
    "echo": False,
    "connect_args": {"timeout": 60, "check_same_thread": False},
}

engine = create_async_engine(
    db_url,
    **engine_kwargs
)

@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA busy_timeout=60000;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA cache_size=-64000;")
        cursor.execute("PRAGMA temp_store=MEMORY;")
        cursor.execute("PRAGMA mmap_size=268435456;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()
    except Exception:
        pass

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
