import os
import time
import logging
import traceback
import requests
import sqlite3
import uuid
import asyncio
from datetime import datetime
from fastapi import FastAPI, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

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
DB_PATH        = "emails.db"

# ─── Global HTTP Session ───────────────────────────────────────────────────────
# Reuse connection for performance
http_session = requests.Session()

# ─── Database Setup ────────────────────────────────────────────────────────────
def init_db():
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS emails (
                    id TEXT PRIMARY KEY,
                    subject TEXT,
                    html_body TEXT,
                    status TEXT, -- pending, sent, failed
                    retry_count INTEGER,
                    created_at TEXT,
                    last_attempt TEXT,
                    error_message TEXT
                )
            ''')
            conn.commit()
            logger.info("[DB] SQLite database initialized.")
    except Exception as e:
        logger.error(f"[DB] Failed to initialize database: {e}")
        logger.error(traceback.format_exc())

def add_email_to_queue(email_id: str, subject: str, html_body: str):
    try:
        now = datetime.now().isoformat()
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO emails (id, subject, html_body, status, retry_count, created_at, last_attempt, error_message)
                VALUES (?, ?, ?, 'pending', 0, ?, '', '')
            ''', (email_id, subject, html_body, now))
            conn.commit()
            logger.info(f"[DB] Email {email_id} added to queue as pending.")
    except Exception as e:
        logger.error(f"[DB] Failed to add email to queue: {e}")

def update_email_status(email_id: str, status: str, error_message: str = ""):
    try:
        now = datetime.now().isoformat()
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE emails 
                SET status = ?, last_attempt = ?, error_message = ?, retry_count = retry_count + 1 
                WHERE id = ?
            ''', (status, error_message, now, email_id))
            conn.commit()
    except Exception as e:
        logger.error(f"[DB] Failed to update email status: {e}")

def get_pending_emails():
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            # Retry failed emails indefinitely via the 5-min poller (up to 100 total absolute attempts to prevent infinite loop of totally broken emails)
            cursor.execute('''
                SELECT id, subject, html_body, retry_count FROM emails 
                WHERE status IN ('pending', 'failed') AND retry_count < 100
            ''')
            return cursor.fetchall()
    except Exception as e:
        logger.error(f"[DB] Failed to fetch pending emails: {e}")
        return []

def get_db_stats():
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT status, COUNT(*) FROM emails GROUP BY status")
            return dict(cursor.fetchall())
    except:
        return {}

# ─── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="ACES Backend", version="4.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Helper: build HTML email body ─────────────────────────────────────────────
def build_email_html(data) -> str:
    return f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6;">
<div style="max-width:600px;margin:30px auto;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">

  <!-- Header -->
  <div style="background:#1e3a8a;padding:28px 24px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">New Innovation Box Submission</h1>
    <p style="color:#93c5fd;margin:6px 0 0;font-size:13px;">ACES - Suryodaya College of Engineering and Technology</p>
  </div>

  <!-- Idea Details -->
  <div style="background:#fff;padding:24px;">
    <h2 style="color:#1e3a8a;font-size:16px;border-bottom:2px solid #dbeafe;padding-bottom:8px;">Idea Details</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 12px;color:#6b7280;width:38%;font-weight:600;">Category</td>
        <td style="padding:10px 12px;">{data.category}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;color:#6b7280;font-weight:600;">Idea Title</td>
        <td style="padding:10px 12px;font-weight:bold;color:#1e3a8a;">{data.ideaTitle}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 12px;color:#6b7280;font-weight:600;">Description</td>
        <td style="padding:10px 12px;">{data.ideaDescription}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;color:#6b7280;font-weight:600;">Expected Outcome</td>
        <td style="padding:10px 12px;">{data.expectedOutcome}</td>
      </tr>
    </table>

    <!-- Submitter Details -->
    <h2 style="color:#1e3a8a;font-size:16px;border-bottom:2px solid #dbeafe;padding-bottom:8px;margin-top:24px;">Submitter Details</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr style="background:#f8fafc;">
        <td style="padding:10px 12px;color:#6b7280;width:38%;font-weight:600;">Full Name</td>
        <td style="padding:10px 12px;">{data.fullName}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;color:#6b7280;font-weight:600;">Email</td>
        <td style="padding:10px 12px;">{data.email}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 12px;color:#6b7280;font-weight:600;">Mobile</td>
        <td style="padding:10px 12px;">{data.mobile}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;color:#6b7280;font-weight:600;">Department</td>
        <td style="padding:10px 12px;">{data.department}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:10px 12px;color:#6b7280;font-weight:600;">Year</td>
        <td style="padding:10px 12px;">{data.year}</td>
      </tr>
    </table>

    <!-- Timestamp -->
    <div style="margin-top:24px;padding:14px;background:#eff6ff;border-radius:8px;border-left:4px solid #2563eb;">
      <strong style="color:#1e40af;">Submitted At:</strong>
      <span style="color:#374151;margin-left:8px;">{data.submittedAt}</span>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#e5e7eb;padding:14px;text-align:center;font-size:12px;color:#6b7280;">
    Automated notification from ACES Innovation Box | acescomputer0101@gmail.com
  </div>
</div>
</body>
</html>
"""

# ─── Core email sender with retry + exponential backoff ────────────────────────
def send_email_with_retry(email_id: str, subject: str, html_body: str, attempt: int = 1) -> bool:
    """
    Sends email via Resend HTTP API reusing a global session.
    Retries up to MAX_RETRIES times with exponential backoff for transient errors.
    Uses email_id as Idempotency-Key.
    """
    if not RESEND_API_KEY:
        logger.error(f"[Email|{email_id}] RESEND_API_KEY is not set. Cannot send.")
        update_email_status(email_id, "failed", "RESEND_API_KEY not set")
        return False

    logger.info(f"[Email|{email_id}] Attempt {attempt}/{MAX_RETRIES} — Sending...")

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
        "Idempotency-Key": email_id
    }
    
    payload = {
        "from":    f"ACES Forum <{SENDER_EMAIL}>",
        "to":      [RECIPIENT],
        "subject": subject,
        "html":    html_body
    }

    try:
        resp = http_session.post(RESEND_URL, headers=headers, json=payload, timeout=15)
        
        logger.info(f"[Email|{email_id}] HTTP Status: {resp.status_code}")
        
        if resp.status_code in (200, 201):
            resend_id = resp.json().get("id", "unknown")
            logger.info(f"[Email|{email_id}] SUCCESS — Resend ID: {resend_id}")
            update_email_status(email_id, "sent")
            return True

        error_text = resp.text
        logger.error(f"[Email|{email_id}] FAILED — {resp.status_code}: {error_text}")

        # Retry only on specific transient errors
        if resp.status_code in (429, 500, 502, 503, 504):
            if attempt < MAX_RETRIES:
                wait = 2 ** attempt
                logger.info(f"[Email|{email_id}] Transient error. Retrying in {wait}s...")
                time.sleep(wait)
                return send_email_with_retry(email_id, subject, html_body, attempt + 1)
        else:
            # Client errors (400, 401, 403) should fail fast without retries
            logger.error(f"[Email|{email_id}] Client error. Failing fast.")
            update_email_status(email_id, "failed", f"HTTP {resp.status_code}: {error_text}")
            return False

    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
        logger.error(f"[Email|{email_id}] Network error on attempt {attempt}: {e}")
        error_text = str(e)
        if attempt < MAX_RETRIES:
            wait = 2 ** attempt
            logger.info(f"[Email|{email_id}] Network error. Retrying in {wait}s...")
            time.sleep(wait)
            return send_email_with_retry(email_id, subject, html_body, attempt + 1)
    except Exception as e:
        logger.error(f"[Email|{email_id}] Unexpected error: {e}")
        error_text = str(e)

    # All synchronous immediate retries exhausted
    logger.error(f"[Email|{email_id}] All {MAX_RETRIES} attempts failed. Will be retried by 5-min poller.")
    update_email_status(email_id, "failed", error_text)
    return False


# ─── Background queue poller ───────────────────────────────────────────────────
async def process_email_queue():
    """
    Runs continuously in the background. Every 5 minutes, checks the DB for
    pending or failed emails and attempts to send them.
    """
    logger.info("[Poller] Starting background queue poller (runs every 5 mins)")
    while True:
        try:
            pending_emails = get_pending_emails()
            if pending_emails:
                logger.info(f"[Poller] Found {len(pending_emails)} pending/failed emails to process.")
                for row in pending_emails:
                    email_id, subject, html_body, _ = row
                    logger.info(f"[Poller] Processing email {email_id}...")
                    # We run this synchronously in the async loop for simplicity, 
                    # but could use asyncio.to_thread if we had many emails.
                    send_email_with_retry(email_id, subject, html_body)
        except Exception as e:
            logger.error(f"[Poller] Error in processing queue: {e}")
            logger.error(traceback.format_exc())
            
        await asyncio.sleep(300) # Sleep for 5 minutes


# ─── Schema ────────────────────────────────────────────────────────────────────
class InnovationSubmission(BaseModel):
    fullName:        str
    email:           str
    mobile:          str = "N/A"
    department:      str
    year:            str
    category:        str
    ideaTitle:       str
    ideaDescription: str
    expectedOutcome: str = "None"
    submittedAt:     str = ""


# ─── POST /api/submit-innovation ───────────────────────────────────────────────
@app.post("/api/submit-innovation", status_code=status.HTTP_201_CREATED)
async def submit_innovation(data: InnovationSubmission, background_tasks: BackgroundTasks):
    logger.info("=" * 55)
    logger.info(f"[API] New submission received")
    
    # Generate idempotency key
    email_id = uuid.uuid4().hex
    
    logger.info(f"[API] Name     : {data.fullName}")
    logger.info(f"[API] Email    : {data.email}")
    logger.info(f"[API] Idea     : {data.ideaTitle}")
    logger.info(f"[API] UUID     : {email_id}")
    
    # Save the idea (in-memory simulation)
    logger.info("[API] Submission saved successfully (in-memory)")

    # Prepare email payload
    submitted_at = data.submittedAt or datetime.now().strftime("%d/%m/%Y, %I:%M:%S %p")
    data.submittedAt = submitted_at
    subject = "New Innovation Box Submission - ACES"
    html_body = build_email_html(data)

    # 1. Add to persistent SQLite queue
    add_email_to_queue(email_id, subject, html_body)

    # 2. Fire and forget the first attempt in FastAPI's background tasks
    # This prevents the user from waiting, and if it fails, the 5-min poller catches it.
    background_tasks.add_task(send_email_with_retry, email_id, subject, html_body)
    
    logger.info("[API] Email queued in database and background task started")
    logger.info("=" * 55)

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "success": True,
            "message": "Idea submitted successfully. Notification email queued."
        }
    )


# ─── GET /test-email — verify setup independently ──────────────────────────────
@app.get("/test-email")
async def test_email(background_tasks: BackgroundTasks):
    """
    Test endpoint to verify Resend API and email delivery via persistent queue.
    """
    logger.info("[TestEmail] Manual test triggered")
    email_id = uuid.uuid4().hex

    html = f"""
    <div style="font-family:Arial;padding:24px;background:#f0fdf4;border-radius:8px;border:2px solid #16a34a;">
      <h2 style="color:#15803d;">Test Email - ACES Backend</h2>
      <p>This is a test email from the ACES Innovation Box backend with persistent queuing.</p>
      <p><strong>UUID:</strong> {email_id}</p>
      <p><strong>Sent At:</strong> {datetime.now().strftime("%d/%m/%Y, %I:%M:%S %p")}</p>
    </div>
    """

    add_email_to_queue(email_id, "ACES Backend - Queue Test Email", html)
    background_tasks.add_task(send_email_with_retry, email_id, "ACES Backend - Queue Test Email", html)

    return {"status": "success", "message": f"Test email queued with ID {email_id}"}


# ─── GET /health ───────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status":           "ok",
        "version":          "4.1.0",
        "resend_key_set":   bool(RESEND_API_KEY),
        "sender":           SENDER_EMAIL,
        "recipient":        RECIPIENT,
        "queue_stats":      get_db_stats()
    }


@app.get("/")
async def root():
    return {"message": "ACES Backend v4.1 is running with persistent email queue"}


# ─── Startup validation and background loop ────────────────────────────────────
@app.on_event("startup")
async def startup_validation():
    logger.info("=" * 55)
    logger.info("  ACES Backend v4.1 — Startup")
    logger.info("=" * 55)
    
    # Initialize SQLite Database
    init_db()

    if not RESEND_API_KEY:
        logger.error("  CRITICAL: RESEND_API_KEY is missing!")
    else:
        logger.info("  Resend configuration OK.")
        
    # Start the background poller
    asyncio.create_task(process_email_queue())

    logger.info("=" * 55)
