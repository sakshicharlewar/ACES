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
    "connect_args": {"timeout": 30},
}

engine = create_async_engine(
    db_url,
    **engine_kwargs
)

@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    try:
        if "sqlite" in str(engine.url):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA busy_timeout=5000")
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
