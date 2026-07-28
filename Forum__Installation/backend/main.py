import os
import time
import logging
import traceback
import requests
import sqlite3
import uuid
import asyncio
import json
import base64
from datetime import datetime
from fastapi import FastAPI, BackgroundTasks, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
                    attachments TEXT DEFAULT '[]',
                    status TEXT,
                    retry_count INTEGER,
                    created_at TEXT,
                    last_attempt TEXT,
                    error_message TEXT
                )
            ''')
            try:
                cursor.execute("ALTER TABLE emails ADD COLUMN attachments TEXT DEFAULT '[]'")
            except sqlite3.OperationalError:
                pass
            conn.commit()
            logger.info("[DB] SQLite database initialized.")
    except Exception as e:
        logger.error(f"[DB] Failed to initialize database: {e}")
        logger.error(traceback.format_exc())

def add_email_to_queue(email_id: str, subject: str, html_body: str, attachments_json: str):
    try:
        now = datetime.now().isoformat()
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO emails (id, subject, html_body, attachments, status, retry_count, created_at, last_attempt, error_message)
                VALUES (?, ?, ?, ?, 'pending', 0, ?, '', '')
            ''', (email_id, subject, html_body, attachments_json, now))
            conn.commit()
            logger.info(f"[DB] Email {email_id} added to queue.")
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
            cursor.execute('''
                SELECT id, subject, html_body, attachments, retry_count FROM emails 
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
app = FastAPI(title="ACES Backend", version="4.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Helper: build HTML email body dynamically ─────────────────────────────────
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

# ─── Core email sender with retry + exponential backoff ────────────────────────
def send_email_with_retry(email_id: str, subject: str, html_body: str, attachments_json: str, attempt: int = 1) -> bool:
    if not RESEND_API_KEY:
        logger.error(f"[Email|{email_id}] RESEND_API_KEY is not set.")
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
    
    attachments_list = json.loads(attachments_json)
    if attachments_list:
        payload["attachments"] = attachments_list

    try:
        resp = http_session.post(RESEND_URL, headers=headers, json=payload, timeout=20)
        
        logger.info(f"[Email|{email_id}] HTTP Status: {resp.status_code}")
        
        if resp.status_code in (200, 201):
            update_email_status(email_id, "sent")
            return True

        error_text = resp.text
        logger.error(f"[Email|{email_id}] FAILED — {resp.status_code}: {error_text}")

        if resp.status_code in (429, 500, 502, 503, 504) and attempt < MAX_RETRIES:
            wait = 2 ** attempt
            time.sleep(wait)
            return send_email_with_retry(email_id, subject, html_body, attachments_json, attempt + 1)
        else:
            update_email_status(email_id, "failed", f"HTTP {resp.status_code}: {error_text}")
            return False

    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
        logger.error(f"[Email|{email_id}] Network error: {e}")
        if attempt < MAX_RETRIES:
            wait = 2 ** attempt
            time.sleep(wait)
            return send_email_with_retry(email_id, subject, html_body, attachments_json, attempt + 1)
        update_email_status(email_id, "failed", str(e))
        return False
    except Exception as e:
        logger.error(f"[Email|{email_id}] Unexpected error: {e}")
        update_email_status(email_id, "failed", str(e))
        return False


# ─── Background queue poller ───────────────────────────────────────────────────
async def process_email_queue():
    logger.info("[Poller] Starting background queue poller (runs every 5 mins)")
    while True:
        try:
            pending_emails = get_pending_emails()
            if pending_emails:
                for row in pending_emails:
                    email_id, subject, html_body, attachments_json, _ = row
                    send_email_with_retry(email_id, subject, html_body, attachments_json)
        except Exception as e:
            logger.error(f"[Poller] Error in processing queue: {e}")
        await asyncio.sleep(300)


# ─── Form Data Helper ──────────────────────────────────────────────────────────
def format_file_size(size_bytes):
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

# ─── POST /api/submit-innovation ───────────────────────────────────────────────
@app.post("/api/submit-innovation", status_code=status.HTTP_201_CREATED)
async def submit_innovation(request: Request, background_tasks: BackgroundTasks):
    logger.info("=" * 55)
    logger.info("[API] New submission received (dynamic parsing)")
    
    email_id = uuid.uuid4().hex
    
    try:
        form = await request.form()
    except Exception as e:
        # Fallback if somehow it's application/json (legacy)
        logger.warning(f"[API] Failed to parse as form, trying JSON: {e}")
        form = await request.json()
    
    fields_dict = {}
    file_summaries = []
    resend_attachments = []
    
    if hasattr(form, "multi_items"):
        iterator = form.multi_items()
    else:
        iterator = form.items()

    for key, value in iterator:
        if hasattr(value, 'filename') and value.filename:
            file_bytes = await value.read()
            file_size = len(file_bytes)
            
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
    
    idea_title_val = fields_dict.get('Idea Title') or fields_dict.get('ideaTitle') or 'Submission'
    subject = f"New Innovation Box Submission: {idea_title_val}"
    
    html_body = build_dynamic_email_html(fields_dict, file_summaries, ip_address, user_agent)
    attachments_json = json.dumps(resend_attachments)
    
    add_email_to_queue(email_id, subject, html_body, attachments_json)
    background_tasks.add_task(send_email_with_retry, email_id, subject, html_body, attachments_json)
    
    logger.info("[API] Submission fully processed and queued.")
    logger.info("=" * 55)

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={"success": True, "message": "Idea submitted successfully."}
    )


# ─── GET /test-email ───────────────────────────────────────────────────────────
@app.get("/test-email")
async def test_email(background_tasks: BackgroundTasks):
    email_id = uuid.uuid4().hex
    html = f"<h2>Test</h2><p>UUID: {email_id}</p>"
    add_email_to_queue(email_id, "ACES Backend - Dynamic Test", html, "[]")
    background_tasks.add_task(send_email_with_retry, email_id, "ACES Backend - Dynamic Test", html, "[]")
    return {"status": "success", "message": f"Queued {email_id}"}


# ─── GET /health ───────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "4.2.0",
        "resend_key_set": bool(RESEND_API_KEY),
        "queue_stats": get_db_stats()
    }

@app.get("/")
async def root():
    return {"message": "ACES Backend v4.2"}


# ─── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_validation():
    init_db()
    asyncio.create_task(process_email_queue())
