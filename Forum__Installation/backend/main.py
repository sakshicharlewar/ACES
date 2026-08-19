import logging
import re
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config import settings
from database import init_db
from limiter import limiter
from routers import test_endpoint,  admin_auth, admin_dashboard, admin_events, admin_registrations
from routers import test_endpoint,  admin_results, admin_gallery, admin_notices, admin_team, admin_submissions
from routers import test_endpoint,  admin_test_registrations, admin_committee, admin_toppers, admin_faculty, admin_hod, admin_laboratories
from routers import test_endpoint,  public_events, public_notices, public_committee, public_toppers, public_faculty, public_hod, public_laboratories


# ── Secure Logging Filter ─────────────────────────────────────────────────────────
_SENSITIVE_PATTERNS = re.compile(
    r'("?(password|token|secret|authorization|api_key|access_token)"?\s*[:=]\s*)'
    r'("[^"]*"|\'[^\']*\'|\S+)',
    re.IGNORECASE,
)

class SensitiveDataFilter(logging.Filter):
    """Redacts sensitive fields from log messages."""
    def filter(self, record: logging.LogRecord) -> bool:
        record.msg = _SENSITIVE_PATTERNS.sub(r'\1[REDACTED]', str(record.msg))
        return True


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
logger.addFilter(SensitiveDataFilter())

# Apply filter to all handlers globally
for handler in logging.root.handlers:
    handler.addFilter(SensitiveDataFilter())


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ACES API server...")
    try:
        await init_db()
        logger.info("Database tables initialized.")
        await _seed_default_admin()
    except Exception as e:
        logger.error(f"Startup error: {e}")
    yield
    logger.info("ACES API server shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="ACES Event Management System — Production API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(.*\.onrender\.com|.*\.vercel\.app|.*suryodaya\.edu\.in)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── Routers ───────────────────────────────────────────────────────────────────────
app.include_router(admin_auth.router)
app.include_router(admin_dashboard.router)\napp.include_router(test_endpoint.router)
app.include_router(admin_events.router)
app.include_router(admin_registrations.router)
app.include_router(admin_submissions.router)
app.include_router(admin_test_registrations.router)
app.include_router(admin_results.router)
app.include_router(admin_gallery.router)
app.include_router(admin_notices.router)
app.include_router(admin_team.router)
app.include_router(public_events.router)
app.include_router(public_notices.router)
app.include_router(admin_committee.router)
app.include_router(public_committee.router)
app.include_router(admin_toppers.router)
app.include_router(public_toppers.router)
app.include_router(admin_faculty.router)
app.include_router(public_faculty.router)
app.include_router(admin_hod.router)
app.include_router(public_hod.router)
app.include_router(admin_laboratories.router)
app.include_router(public_laboratories.router)


# ── Health Check ─────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "ACES Event Management API", "version": "2.0.0"}


@app.get("/health", tags=["Health"])
async def health():
    from database import AsyncSessionLocal
    from sqlalchemy import text
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(status_code=503, content={"status": "unhealthy", "database": "disconnected"})


# ── Legacy endpoints for backwards compatibility ──────────────────────────────────
@app.get("/admin/api/migrate")
async def migrate_legacy():
    return {"results": ["Database auto-initialized via SQLAlchemy on startup."]}


@app.post("/admin/api/migrate")
async def migrate_legacy_post():
    try:
        await init_db()
        return {"results": ["Migration applied successfully."]}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# ── Global error handler ──────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url}: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


async def _seed_default_admin():
    """Create default super admin if no admins exist."""
    from database import AsyncSessionLocal
    from models import Admin, AdminRole
    from auth import hash_password
    from sqlalchemy import select, func

    async with AsyncSessionLocal() as db:
        count = (await db.execute(select(func.count(Admin.id)))).scalar()
        if count == 0:
            admin = Admin(
                username="aces0101",
                email="admin@aces.com",
                password_hash=hash_password("aces@26"),
                role=AdminRole.super_admin,
            )
            db.add(admin)
            await db.commit()
            logger.info("Default admin created: username=aces0101")
