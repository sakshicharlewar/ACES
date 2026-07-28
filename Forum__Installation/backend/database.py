import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Render provides postgres:// but SQLAlchemy requires postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    logger.warning("[DB] DATABASE_URL is not set. PostgreSQL features will be unavailable.")
    engine = None
    SessionLocal = None
else:
    try:
        engine = create_engine(
            DATABASE_URL,
            pool_size=5,
            max_overflow=10,
            pool_timeout=30,
            pool_recycle=1800,
            pool_pre_ping=True,
            echo=False,
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        logger.info("[DB] PostgreSQL engine created successfully.")
    except Exception as e:
        logger.error(f"[DB] Failed to create PostgreSQL engine: {e}")
        engine = None
        SessionLocal = None

Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a database session.
    Gracefully returns None if PostgreSQL is unavailable.
    """
    if SessionLocal is None:
        logger.warning("[DB] No database session available — DATABASE_URL not configured.")
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"[DB] Session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_tables():
    """Create all tables if they don't exist. Safe to call repeatedly."""
    if engine is None:
        logger.warning("[DB] Cannot create tables — no engine available.")
        return False
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("[DB] All PostgreSQL tables created/verified.")
        return True
    except Exception as e:
        logger.error(f"[DB] Failed to create tables: {e}")
        return False
