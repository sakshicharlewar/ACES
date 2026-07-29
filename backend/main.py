# ACES Backend v5.0 — PostgreSQL Integration
import os
import time
import logging
import traceback
import requests as http_requests
import uuid
import asyncio
import json
import base64
from datetime import datetime
from fastapi import FastAPI, BackgroundTasks, status, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv

from database import get_db, create_tables, SessionLocal
from models import EmailQueue
import crud
import schemas

# ─── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# ─── Load env ──────────────────────────────────────────────────────────────────
load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
SENDER_EMAIL   = os.getenv("SENDER_EMAIL", "onboarding@resend.dev").strip()
RECIPIENT      = "acescomputer0101@gmail.com"
RESEND_URL     = "https://api.resend.com/emails"
MAX_RETRIES    = 5

# ─── Global HTTP Session ───────────────────────────────────────────────────────
http_session = http_requests.Session()

# ─── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="ACES Backend", version="5.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════════
#  Email Helpers (preserved from previous version)
# ═══════════════════════════════════════════════════════════════════════════════

def build_dynamic_email_html(fields_dict, file_summaries, ip_address, user_agent) -> str:
    html = """
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6;">
    <div style="max-width:600px;margin:30px auto;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">

      <!-- Header -->
      <div style="background:#1e3a8a;padding:28px 24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">New Innovation Box Submission</h1>
        <p style="color:#93c5fd;margin:6px 0 0;font-size:13px;">ACES - Suryodaya College of Engineering and Technology</p>
      </div>

      <!-- Submission Details -->
      <div style="background:#fff;padding:24px;">
        <h2 style="color:#1e3a8a;font-size:16px;border-bottom:2px solid #dbeafe;padding-bottom:8px;">Submission Details</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
    """

    for i, (key, value) in enumerate(fields_dict.items()):
        bg_color = "#f8fafc" if i % 2 == 0 else "#ffffff"
        display_val = str(value).strip()
        if not display_val:
            display_val = "<em>Not Provided</em>"
        else:
            display_val = display_val.replace('\\n', '<br>')

        html += f"""
          <tr style="background:{bg_color};">
            <td style="padding:10px 12px;color:#6b7280;width:38%;font-weight:600;vertical-align:top;">{key}</td>
            <td style="padding:10px 12px;vertical-align:top;">{display_val}</td>
          </tr>
        """

    html += """
        </table>

        <!-- Attachments Summary -->
        <h2 style="color:#1e3a8a;font-size:16px;border-bottom:2px solid #dbeafe;padding-bottom:8px;margin-top:24px;">Attachments</h2>
    """

    if not file_summaries:
        html += '<p style="color:#6b7280;font-size:14px;padding-left:12px;"><em>No Attachment Uploaded</em></p>'
    else:
        html += '<table style="width:100%;border-collapse:collapse;font-size:14px;">'
        for i, file_info in enumerate(file_summaries):
            bg_color = "#f8fafc" if i % 2 == 0 else "#ffffff"
            html += f"""
            <tr style="background:{bg_color};">
              <td style="padding:10px 12px;color:#6b7280;width:38%;font-weight:600;">{file_info['name']}</td>
              <td style="padding:10px 12px;color:#374151;">{file_info['size']} • {file_info['type']}</td>
            </tr>
            """
        html += '</table>'

    html += f"""
        <h2 style="color:#1e3a8a;font-size:16px;border-bottom:2px solid #dbeafe;padding-bottom:8px;margin-top:24px;">System Information</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr style="background:#f8fafc;">
            <td style="padding:10px 12px;color:#6b7280;width:38%;font-weight:600;">IP Address</td>
            <td style="padding:10px 12px;">{ip_address or 'Unknown'}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;color:#6b7280;font-weight:600;">Browser / Device</td>
            <td style="padding:10px 12px;color:#9ca3af;font-size:12px;">{user_agent or 'Unknown'}</td>
          </tr>
        </table>
      </div>

      <!-- Footer -->
      <div style="background:#e5e7eb;padding:14px;text-align:center;font-size:12px;color:#6b7280;">
        Automated notification from ACES Innovation Box | acescomputer0101@gmail.com
      </div>
    </div>
    </body>
    </html>
    """
    return html

def format_file_size(size_bytes):
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"


# ═══════════════════════════════════════════════════════════════════════════════
#  Email Sender with Retry (now uses PostgreSQL)
# ═══════════════════════════════════════════════════════════════════════════════

def send_email_with_retry(email_id: str, subject: str, html_body: str, attachments_json: str, attempt: int = 1) -> bool:
    key_prefix = RESEND_API_KEY[:8] + "..." if RESEND_API_KEY else "NOT_SET"
    logger.info(f"[Email|{email_id}] Attempt {attempt}/{MAX_RETRIES} — Key: {key_prefix} | From: {SENDER_EMAIL} | To: {RECIPIENT} | Subject: {subject}")

    if not RESEND_API_KEY:
        logger.error(f"[Email|{email_id}] CRITICAL: RESEND_API_KEY is missing/empty.")
        _update_email_status_standalone(email_id, "failed", "RESEND_API_KEY missing/empty")
        return False

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
        "Idempotency-Key": email_id
    }

    payload = {
        "from": f"ACES Forum <{SENDER_EMAIL}>",
        "to": [RECIPIENT],
        "subject": subject,
        "html": html_body
    }

    try:
        attachments_list = json.loads(attachments_json)
        if attachments_list:
            payload["attachments"] = attachments_list
    except json.JSONDecodeError:
        pass

    try:
        logger.info(f"[Email|{email_id}] Sending HTTP POST to {RESEND_URL}...")
        resp = http_session.post(RESEND_URL, headers=headers, json=payload, timeout=15)
        
        logger.info(f"[Email|{email_id}] HTTP Status: {resp.status_code}")
        logger.info(f"[Email|{email_id}] Resend Response Body: {resp.text}")

        if resp.status_code in (200, 201):
            logger.info(f"[Email|{email_id}] SUCCESS: Email delivered via Resend API.")
            _update_email_status_standalone(email_id, "sent")
            return True

        error_text = f"HTTP {resp.status_code}: {resp.text}"
        logger.error(f"[Email|{email_id}] FAILED — {error_text}")

        if resp.status_code in (429, 500, 502, 503, 504) and attempt < MAX_RETRIES:
            wait = 2 ** attempt
            logger.info(f"[Email|{email_id}] Retrying in {wait}s...")
            time.sleep(wait)
            return send_email_with_retry(email_id, subject, html_body, attachments_json, attempt + 1)
        else:
            _update_email_status_standalone(email_id, "failed", error_text)
            return False

    except (http_requests.exceptions.ConnectionError, http_requests.exceptions.Timeout) as e:
        logger.error(f"[Email|{email_id}] Network Exception on attempt {attempt}: {e}")
        logger.error(traceback.format_exc())
        if attempt < MAX_RETRIES:
            wait = 2 ** attempt
            logger.info(f"[Email|{email_id}] Retrying network error in {wait}s...")
            time.sleep(wait)
            return send_email_with_retry(email_id, subject, html_body, attachments_json, attempt + 1)
        _update_email_status_standalone(email_id, "failed", str(e))
        return False
    except Exception as e:
        logger.error(f"[Email|{email_id}] Unexpected Exception: {e}")
        logger.error(traceback.format_exc())
        _update_email_status_standalone(email_id, "failed", str(e))
        return False


def _update_email_status_standalone(email_id: str, new_status: str, error_message: str = ""):
    """Update email status using its own session (for background tasks)."""
    if SessionLocal is None:
        return
    db = SessionLocal()
    try:
        crud.update_email_status(db, email_id, new_status, error_message)
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════════════════════
#  Background Queue Poller
# ═══════════════════════════════════════════════════════════════════════════════

async def process_email_queue():
    logger.info("[Poller] Starting background queue poller (runs every 5 mins)")
    while True:
        try:
            if SessionLocal is not None:
                db = SessionLocal()
                try:
                    pending = crud.get_pending_emails(db)
                    if pending:
                        logger.info(f"[Poller] Found {len(pending)} pending/failed emails.")
                        for email in pending:
                            send_email_with_retry(email.id, email.subject, email.html_body, email.attachments or "[]")
                finally:
                    db.close()
        except Exception as e:
            logger.error(f"[Poller] Error: {e}")
        await asyncio.sleep(300)


# ═══════════════════════════════════════════════════════════════════════════════
#  API ROUTES — Innovation Box (existing, now with PostgreSQL)
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/submit-innovation", status_code=status.HTTP_201_CREATED)
async def submit_innovation(request: Request, background_tasks: BackgroundTasks):
    logger.info("=" * 55)
    logger.info("[API] New innovation submission received")

    email_id = uuid.uuid4().hex

    try:
        form = await request.form()
    except Exception:
        form = await request.json()

    fields_dict = {}
    file_summaries = []
    resend_attachments = []
    attachment_name = None
    attachment_type = None

    if hasattr(form, "multi_items"):
        iterator = form.multi_items()
    else:
        iterator = form.items()

    for key, value in iterator:
        if hasattr(value, 'filename') and value.filename:
            file_bytes = await value.read()
            file_size = len(file_bytes)
            attachment_name = value.filename
            attachment_type = value.content_type

            file_summaries.append({
                "name": value.filename,
                "type": value.content_type,
                "size": format_file_size(file_size)
            })

            b64_content = base64.b64encode(file_bytes).decode('utf-8')
            resend_attachments.append({
                "filename": value.filename,
                "content": b64_content
            })
        else:
            fields_dict[key] = value

    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    # ── Save to PostgreSQL ──
    db_saved = False
    if SessionLocal is not None:
        db = SessionLocal()
        try:
            saved_record = crud.create_innovation(
                db,
                full_name=fields_dict.get("Full Name", fields_dict.get("fullName", "")),
                email=fields_dict.get("Email", fields_dict.get("email", "")),
                mobile=fields_dict.get("Mobile", fields_dict.get("mobile")) or None,
                department=fields_dict.get("Department", fields_dict.get("department", "")),
                year=fields_dict.get("Year", fields_dict.get("year", "")),
                category=fields_dict.get("Idea Category", fields_dict.get("category", "")),
                idea_title=fields_dict.get("Idea Title", fields_dict.get("ideaTitle", "")),
                idea_description=fields_dict.get("Idea Description", fields_dict.get("ideaDescription", "")),
                expected_outcome=fields_dict.get("Expected Outcome", fields_dict.get("expectedOutcome")) or None,
                attachment_name=attachment_name,
                attachment_type=attachment_type,
                attachment_url=None,
                ip_address=ip_address,
                user_agent=user_agent,
                form_data=json.dumps(fields_dict),
            )
            if saved_record:
                db_saved = True
        except Exception as e:
            logger.error(f"[API] PostgreSQL save failed: {e}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"success": False, "message": "Failed to save submission to database."}
            )
        finally:
            db.close()
    else:
        logger.error("[API] PostgreSQL database unavailable.")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"success": False, "message": "Database service unavailable."}
        )

    if not db_saved:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Failed to save submission to database."}
        )

    # ── Build & queue email ──
    idea_title_val = fields_dict.get('Idea Title') or fields_dict.get('ideaTitle') or 'Submission'
    subject = f"New Innovation Box Submission: {idea_title_val}"
    html_body = build_dynamic_email_html(fields_dict, file_summaries, ip_address, user_agent)
    attachments_json = json.dumps(resend_attachments)

    if SessionLocal is not None:
        db = SessionLocal()
        try:
            crud.add_email_to_queue(db, email_id, subject, html_body, attachments_json)
        finally:
            db.close()

    background_tasks.add_task(send_email_with_retry, email_id, subject, html_body, attachments_json)

    logger.info("[API] Submission saved to PostgreSQL and email queued.")
    logger.info("=" * 55)

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={"success": True, "message": "Idea submitted successfully."}
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  API ROUTES — Contact Messages
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/contact", status_code=status.HTTP_201_CREATED)
async def submit_contact(data: schemas.ContactCreate, db: Session = Depends(get_db)):
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    result = crud.create_contact(db, name=data.name, email=data.email, subject=data.subject, message=data.message)
    if result:
        return {"success": True, "message": "Contact message saved.", "id": result.id}
    return JSONResponse(status_code=500, content={"error": "Failed to save message."})

@app.get("/api/contacts")
async def list_contacts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    contacts = crud.get_contacts(db, skip=skip, limit=limit)
    return [schemas.ContactRead.from_orm(c).dict() for c in contacts]


# ═══════════════════════════════════════════════════════════════════════════════
#  API ROUTES — Events
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/events", status_code=status.HTTP_201_CREATED)
async def create_event(data: schemas.EventCreate, db: Session = Depends(get_db)):
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    event = crud.create_event(db, **data.dict())
    if event:
        return {"success": True, "id": event.id}
    return JSONResponse(status_code=500, content={"error": "Failed to create event."})

@app.get("/api/events")
async def list_events(skip: int = 0, limit: int = 50, status_filter: str = None, db: Session = Depends(get_db)):
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    events = crud.get_events(db, skip=skip, limit=limit, status=status_filter)
    return [schemas.EventRead.from_orm(e).dict() for e in events]

@app.get("/api/events/{event_id}")
async def get_event(event_id: int, db: Session = Depends(get_db)):
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    event = crud.get_event(db, event_id)
    if event:
        return schemas.EventRead.from_orm(event).dict()
    return JSONResponse(status_code=404, content={"error": "Event not found."})

@app.put("/api/events/{event_id}")
async def update_event(event_id: int, data: schemas.EventUpdate, db: Session = Depends(get_db)):
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    event = crud.update_event(db, event_id, **data.dict(exclude_unset=True))
    if event:
        return {"success": True, "id": event.id}
    return JSONResponse(status_code=404, content={"error": "Event not found."})

@app.delete("/api/events/{event_id}")
async def delete_event(event_id: int, db: Session = Depends(get_db)):
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    if crud.delete_event(db, event_id):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Event not found."})


# ═══════════════════════════════════════════════════════════════════════════════
#  API ROUTES — Event Registrations
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/event-registrations", status_code=status.HTTP_201_CREATED)
async def create_registration(data: schemas.RegistrationCreate, db: Session = Depends(get_db)):
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    reg = crud.create_registration(db, **data.dict())
    if reg:
        return {"success": True, "id": reg.id}
    return JSONResponse(status_code=500, content={"error": "Failed to register. You may already be registered."})

@app.get("/api/event-registrations/{event_id}")
async def list_registrations(event_id: int, db: Session = Depends(get_db)):
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    regs = crud.get_registrations_for_event(db, event_id)
    return [schemas.RegistrationRead.from_orm(r).dict() for r in regs]


# ═══════════════════════════════════════════════════════════════════════════════
#  API ROUTES — Innovation Box Read
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/submissions")
@app.get("/api/innovation-box/submissions")
async def list_submissions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    subs = crud.get_innovations(db, skip=skip, limit=limit)
    return [schemas.InnovationRead.from_orm(s).dict() for s in subs]


# ═══════════════════════════════════════════════════════════════════════════════
#  Utility Routes
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/test-email")
async def test_email(background_tasks: BackgroundTasks):
    email_id = uuid.uuid4().hex
    html = f"<h2>Test</h2><p>UUID: {email_id}</p>"
    if SessionLocal is not None:
        db = SessionLocal()
        try:
            crud.add_email_to_queue(db, email_id, "ACES Test", html, "[]")
        finally:
            db.close()
    background_tasks.add_task(send_email_with_retry, email_id, "ACES Test", html, "[]")
    return {"status": "success", "message": f"Queued {email_id}"}


@app.get("/health")
async def health():
    db_ok = False
    queue_stats = {}
    if SessionLocal is not None:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            db_ok = True
            queue_stats = crud.get_email_queue_stats(db)
        except Exception:
            db_ok = False
        finally:
            db.close()

    return {
        "status": "ok",
        "version": "5.0.0",
        "database": "connected" if db_ok else "unavailable",
        "resend_key_set": bool(RESEND_API_KEY),
        "queue_stats": queue_stats
    }


@app.get("/")
async def root():
    return {"message": "ACES Backend v5.0 — PostgreSQL"}


# ═══════════════════════════════════════════════════════════════════════════════
#  Startup
# ═══════════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup_validation():
    logger.info("=" * 55)
    logger.info("  ACES Backend v5.0 — Startup")
    logger.info("=" * 55)

    # Create all PostgreSQL tables
    create_tables()

    # Start background email poller
    asyncio.create_task(process_email_queue())

    logger.info("=" * 55)
