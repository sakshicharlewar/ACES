# ═══════════════════════════════════════════════════════════════════════════════
#  ACES Backend v6.0 — Production-Ready Email + PostgreSQL
#  Gmail SMTP (Primary) → Resend HTTP API (Fallback)
#  Full logging, 3-attempt retry, no silent failures
# ═══════════════════════════════════════════════════════════════════════════════

import os
import time
import logging
import traceback
import requests as http_requests
import uuid
import asyncio
import json
import base64
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
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


# ═══════════════════════════════════════════════════════════════════════════════
#  Logging — Structured, Timestamped
# ═══════════════════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
#  Environment Variables
# ═══════════════════════════════════════════════════════════════════════════════

load_dotenv()

# Resend HTTP API (Fallback)
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
SENDER_EMAIL   = os.getenv("SENDER_EMAIL", "onboarding@resend.dev").strip()
RESEND_URL     = "https://api.resend.com/emails"

# Gmail SMTP (Primary — delivers directly to Gmail Inbox)
SMTP_SERVER   = os.getenv("SMTP_SERVER", "smtp.gmail.com").strip()
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()

# Fixed recipient — all submissions go here
RECIPIENT   = "acescomputer0101@gmail.com"
MAX_RETRIES = 3


# ═══════════════════════════════════════════════════════════════════════════════
#  Global HTTP Session
# ═══════════════════════════════════════════════════════════════════════════════

http_session = http_requests.Session()


# ═══════════════════════════════════════════════════════════════════════════════
#  FastAPI App + CORS
# ═══════════════════════════════════════════════════════════════════════════════

app = FastAPI(title="ACES Backend", version="6.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════════
#  Utility Helpers
# ═══════════════════════════════════════════════════════════════════════════════

def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    return f"{size_bytes / (1024 * 1024):.2f} MB"


def _update_email_status_standalone(email_id: str, new_status: str, error_message: str = ""):
    """Update email queue status using a dedicated DB session (safe for background tasks)."""
    if SessionLocal is None:
        return
    db = SessionLocal()
    try:
        crud.update_email_status(db, email_id, new_status, error_message)
        logger.info(f"[Queue|{email_id}] Status updated → {new_status}")
    except Exception as e:
        logger.error(f"[Queue|{email_id}] Failed to update status: {e}")
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════════════════════
#  Email HTML Builder
# ═══════════════════════════════════════════════════════════════════════════════

def build_dynamic_email_html(fields_dict: dict, file_summaries: list, ip_address: str, user_agent: str) -> str:
    now_str = datetime.now().strftime("%d %B %Y, %I:%M %p")

    rows_html = ""
    for i, (key, value) in enumerate(fields_dict.items()):
        bg_color = "#f8fafc" if i % 2 == 0 else "#ffffff"
        display_val = str(value).strip() if value else "<em style='color:#9ca3af'>Not Provided</em>"
        display_val = display_val.replace('\n', '<br>')
        rows_html += f"""
          <tr style="background:{bg_color};">
            <td style="padding:10px 14px;color:#374151;width:38%;font-weight:600;vertical-align:top;border-bottom:1px solid #e5e7eb;">{key}</td>
            <td style="padding:10px 14px;vertical-align:top;border-bottom:1px solid #e5e7eb;">{display_val}</td>
          </tr>"""

    attachments_html = ""
    if file_summaries:
        attachments_html = "<h3 style='color:#1e3a8a;font-size:14px;margin-top:20px;'>📎 Attachments</h3><ul style='margin:0;padding-left:20px;font-size:13px;'>"
        for f in file_summaries:
            attachments_html += f"<li>{f['name']} ({f['type']}, {f['size']})</li>"
        attachments_html += "</ul>"

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6;">
<div style="max-width:640px;margin:30px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.12);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 100%);padding:32px 28px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">🚀 New Innovation Box Submission</h1>
    <p style="color:#93c5fd;margin:8px 0 0;font-size:13px;">ACES — Suryodaya College of Engineering and Technology</p>
    <p style="color:#bfdbfe;margin:4px 0 0;font-size:12px;">{now_str}</p>
  </div>

  <!-- Body -->
  <div style="background:#ffffff;padding:28px;">
    <h2 style="color:#1e3a8a;font-size:16px;margin:0 0 16px;border-bottom:2px solid #dbeafe;padding-bottom:10px;">📋 Submission Details</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      {rows_html}
    </table>

    {attachments_html}
  </div>

  <!-- System Info Footer -->
  <div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">
      <strong>Submitted:</strong> {now_str} &nbsp;|&nbsp;
      <strong>IP:</strong> {ip_address or 'Unknown'} &nbsp;|&nbsp;
      <strong>Agent:</strong> {(user_agent or 'Unknown')[:60]}
    </p>
  </div>

  <!-- Footer Banner -->
  <div style="background:#1e3a8a;padding:16px;text-align:center;">
    <p style="color:#93c5fd;margin:0;font-size:12px;">ACES Innovation Box — Automated Notification</p>
  </div>

</div>
</body>
</html>"""


# ═══════════════════════════════════════════════════════════════════════════════
#  Gmail SMTP Sender — PRIMARY (Delivers directly to Gmail Primary Inbox)
# ═══════════════════════════════════════════════════════════════════════════════

def send_via_gmail_smtp(email_id: str, subject: str, html_body: str, attachments_json: str) -> bool:
    """
    Send email via Gmail SMTP using App Password credentials.
    This is the PRIMARY delivery method — emails land in Gmail Primary Inbox.
    """
    logger.info(f"[SMTP|{email_id}] ─── Gmail SMTP Attempt ───────────────────────────")

    # Validate credentials
    if not SMTP_USERNAME:
        logger.error(f"[SMTP|{email_id}] FAIL: SMTP_USERNAME is not set in environment variables.")
        return False
    if not SMTP_PASSWORD:
        logger.error(f"[SMTP|{email_id}] FAIL: SMTP_PASSWORD is not set. Must be a Gmail App Password.")
        return False

    logger.info(f"[SMTP|{email_id}] Sender   : {SMTP_USERNAME}")
    logger.info(f"[SMTP|{email_id}] Recipient: {RECIPIENT}")
    logger.info(f"[SMTP|{email_id}] Subject  : {subject}")
    logger.info(f"[SMTP|{email_id}] Server   : {SMTP_SERVER}:{SMTP_PORT}")

    try:
        # Build MIME message
        msg = MIMEMultipart("alternative")
        msg["Subject"]  = subject
        msg["From"]     = f"ACES Innovation Box <{SMTP_USERNAME}>"
        msg["To"]       = RECIPIENT
        msg["Reply-To"] = SMTP_USERNAME
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        # Add attachments if any
        try:
            attachments_list = json.loads(attachments_json or "[]")
            for att in attachments_list:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(base64.b64decode(att["content"]))
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", f"attachment; filename=\"{att['filename']}\"")
                msg.attach(part)
                logger.info(f"[SMTP|{email_id}] Attached file: {att['filename']}")
        except Exception as att_err:
            logger.warning(f"[SMTP|{email_id}] Could not attach file: {att_err} (continuing without attachments)")

        # Connect and send
        logger.info(f"[SMTP|{email_id}] Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=20) as server:
            server.ehlo()
            logger.info(f"[SMTP|{email_id}] STARTTLS handshake...")
            server.starttls()
            server.ehlo()
            logger.info(f"[SMTP|{email_id}] Logging in as {SMTP_USERNAME}...")
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            logger.info(f"[SMTP|{email_id}] Sending message...")
            server.sendmail(SMTP_USERNAME, [RECIPIENT], msg.as_string())

        logger.info(f"[SMTP|{email_id}] ✅ SUCCESS — Email delivered via Gmail SMTP to {RECIPIENT}")
        return True

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"[SMTP|{email_id}] ❌ AUTH FAILED: {e}")
        logger.error(f"[SMTP|{email_id}] FIX: Go to https://myaccount.google.com/apppasswords and generate a new App Password.")
        logger.error(f"[SMTP|{email_id}] Make sure 2-Step Verification is enabled on acescomputer0101@gmail.com")
        return False
    except smtplib.SMTPRecipientsRefused as e:
        logger.error(f"[SMTP|{email_id}] ❌ Recipient refused: {e}")
        return False
    except smtplib.SMTPException as e:
        logger.error(f"[SMTP|{email_id}] ❌ SMTP error: {e}")
        logger.error(traceback.format_exc())
        return False
    except Exception as e:
        logger.error(f"[SMTP|{email_id}] ❌ Unexpected error: {e}")
        logger.error(traceback.format_exc())
        return False


# ═══════════════════════════════════════════════════════════════════════════════
#  Resend HTTP API Sender — FALLBACK
# ═══════════════════════════════════════════════════════════════════════════════

def send_via_resend_api(email_id: str, subject: str, html_body: str, attachments_json: str, attempt: int) -> bool:
    """
    Send email via Resend HTTP API.
    This is the FALLBACK method if Gmail SMTP fails.
    Includes 3-attempt retry with exponential backoff.
    """
    logger.info(f"[Resend|{email_id}] ─── Resend API Attempt {attempt}/{MAX_RETRIES} ───────────────")

    # Validate API key
    if not RESEND_API_KEY:
        logger.error(f"[Resend|{email_id}] ❌ RESEND_API_KEY is not set in environment variables.")
        return False
    if not RESEND_API_KEY.startswith("re_"):
        logger.error(f"[Resend|{email_id}] ❌ RESEND_API_KEY looks invalid — must start with 're_'.")
        return False

    key_preview = RESEND_API_KEY[:8] + "..." + RESEND_API_KEY[-4:]
    logger.info(f"[Resend|{email_id}] API Key  : {key_preview}")
    logger.info(f"[Resend|{email_id}] From     : {SENDER_EMAIL}")
    logger.info(f"[Resend|{email_id}] To       : {RECIPIENT}")
    logger.info(f"[Resend|{email_id}] Subject  : {subject}")
    logger.info(f"[Resend|{email_id}] Endpoint : {RESEND_URL}")

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
        "Idempotency-Key": f"{email_id}-{attempt}"
    }

    payload: dict = {
        "from": SENDER_EMAIL,
        "to": [RECIPIENT],
        "subject": subject,
        "html": html_body,
    }

    # Add attachments if any
    try:
        attachments_list = json.loads(attachments_json or "[]")
        if attachments_list:
            payload["attachments"] = attachments_list
            logger.info(f"[Resend|{email_id}] Attachments: {len(attachments_list)} file(s)")
    except json.JSONDecodeError:
        logger.warning(f"[Resend|{email_id}] Could not parse attachments JSON — skipping.")

    try:
        logger.info(f"[Resend|{email_id}] Sending HTTP POST...")
        resp = http_session.post(RESEND_URL, headers=headers, json=payload, timeout=15)

        logger.info(f"[Resend|{email_id}] HTTP Status  : {resp.status_code}")
        logger.info(f"[Resend|{email_id}] HTTP Response: {resp.text}")

        if resp.status_code in (200, 201):
            logger.info(f"[Resend|{email_id}] ✅ SUCCESS — Email delivered via Resend API.")
            return True

        # Retryable errors (rate limit / server error)
        if resp.status_code in (429, 500, 502, 503, 504) and attempt < MAX_RETRIES:
            wait_secs = 2 ** attempt
            logger.warning(f"[Resend|{email_id}] ⚠ Retryable error {resp.status_code}. Waiting {wait_secs}s before retry...")
            time.sleep(wait_secs)
            return send_via_resend_api(email_id, subject, html_body, attachments_json, attempt + 1)

        # Non-retryable errors
        if resp.status_code == 401:
            logger.error(f"[Resend|{email_id}] ❌ 401 Unauthorized — RESEND_API_KEY is invalid or expired.")
        elif resp.status_code == 422:
            logger.error(f"[Resend|{email_id}] ❌ 422 Unprocessable — Sender domain not verified in Resend dashboard.")
            logger.error(f"[Resend|{email_id}] Visit https://resend.com/domains to verify your sending domain.")
        else:
            logger.error(f"[Resend|{email_id}] ❌ Delivery failed with HTTP {resp.status_code}: {resp.text}")

        return False

    except http_requests.exceptions.Timeout:
        logger.error(f"[Resend|{email_id}] ❌ Request timed out after 15s.")
        if attempt < MAX_RETRIES:
            wait_secs = 2 ** attempt
            logger.info(f"[Resend|{email_id}] Retrying in {wait_secs}s...")
            time.sleep(wait_secs)
            return send_via_resend_api(email_id, subject, html_body, attachments_json, attempt + 1)
        return False
    except http_requests.exceptions.ConnectionError as e:
        logger.error(f"[Resend|{email_id}] ❌ Network connection error: {e}")
        if attempt < MAX_RETRIES:
            wait_secs = 2 ** attempt
            logger.info(f"[Resend|{email_id}] Retrying in {wait_secs}s...")
            time.sleep(wait_secs)
            return send_via_resend_api(email_id, subject, html_body, attachments_json, attempt + 1)
        return False
    except Exception as e:
        logger.error(f"[Resend|{email_id}] ❌ Unexpected exception: {e}")
        logger.error(traceback.format_exc())
        logger.error(f"Error Message: {str(e)}")
        logger.error(f"Stack Trace:\n{traceback.format_exc()}")
        logger.info("EMAIL FAILED")
        return False


# ═══════════════════════════════════════════════════════════════════════════════
#  Master Email Sender — Resend API Primary → Gmail SMTP Fallback
# ═══════════════════════════════════════════════════════════════════════════════

def send_email_with_retry(email_id: str, subject: str, html_body: str, attachments_json: str, attempt: int = 1) -> bool:
    """
    Master email delivery function.
    1. Try Resend HTTP API first (Primary)
    2. If Resend fails, fall back to Gmail SMTP
    3. Log every step, every success, every failure — no silent errors
    4. Update email queue status in PostgreSQL
    """
    logger.info("EMAIL FUNCTION CALLED")
    logger.info("=" * 60)
    logger.info(f"[Email|{email_id}] ▶ Email Delivery Started")
    logger.info(f"[Email|{email_id}]   To      : {RECIPIENT}")
    logger.info(f"[Email|{email_id}]   Subject : {subject}")
    logger.info(f"[Email|{email_id}]   Resend  : {'YES' if RESEND_API_KEY else 'NO'}")
    logger.info(f"[Email|{email_id}]   SMTP set: {'YES' if SMTP_USERNAME and SMTP_PASSWORD else 'NO'}")
    logger.info("=" * 60)

    # ── Step 1: Resend HTTP API (Primary) ───────────────────────────────────
    logger.info(f"[Email|{email_id}] Step 1: Trying Resend HTTP API (Primary)...")
    resend_ok = send_via_resend_api(email_id, subject, html_body, attachments_json, attempt=1)
    if resend_ok:
        _update_email_status_standalone(email_id, "sent")
        logger.info(f"[Email|{email_id}] ✅ DELIVERED via Resend API")
        logger.info("=" * 60)
        return True

    logger.warning(f"[Email|{email_id}] Resend API failed. Falling back to Gmail SMTP...")

    # ── Step 2: Gmail SMTP (Fallback) ─────────────────────────────────────────
    if SMTP_USERNAME and SMTP_PASSWORD:
        logger.info(f"[Email|{email_id}] Step 2: Trying Gmail SMTP (Fallback)...")
        smtp_ok = send_via_gmail_smtp(email_id, subject, html_body, attachments_json)
        if smtp_ok:
            _update_email_status_standalone(email_id, "sent")
            logger.info(f"[Email|{email_id}] ✅ DELIVERED via Gmail SMTP")
            logger.info("=" * 60)
            return True
    else:
        logger.warning(f"[Email|{email_id}] Step 2 SKIPPED: Gmail SMTP credentials not configured.")

    # ── Both methods failed ───────────────────────────────────────────────────
    error_msg = "Both Resend API and Gmail SMTP failed. Check SMTP_PASSWORD and RESEND_API_KEY."
    _update_email_status_standalone(email_id, "failed", error_msg)
    logger.error(f"[Email|{email_id}] ❌ ALL DELIVERY METHODS FAILED")
    logger.error(f"[Email|{email_id}] Request Payload Saved in Logs: Subject: {subject}, Body length: {len(html_body)}, Attachments length: {len(attachments_json)}")
    logger.info("=" * 60)
    return False


# ═══════════════════════════════════════════════════════════════════════════════
#  Background Email Queue Poller (runs every 5 minutes)
# ═══════════════════════════════════════════════════════════════════════════════

async def process_email_queue():
    logger.info("[Poller] Background email queue poller started (interval: 5 min)")
    while True:
        try:
            if SessionLocal is not None:
                db = SessionLocal()
                try:
                    pending = crud.get_pending_emails(db)
                    if pending:
                        logger.info(f"[Poller] Found {len(pending)} pending/failed email(s). Retrying...")
                        for email in pending:
                            send_email_with_retry(email.id, email.subject, email.html_body, email.attachments or "[]")
                    else:
                        logger.info("[Poller] No pending emails. Queue is clear.")
                finally:
                    db.close()
        except Exception as e:
            logger.error(f"[Poller] Error during queue processing: {e}")
            logger.error(traceback.format_exc())
        await asyncio.sleep(300)


# ═══════════════════════════════════════════════════════════════════════════════
#  API ROUTE — Innovation Box Submission (POST)
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/submit-innovation", status_code=status.HTTP_201_CREATED)
async def submit_innovation(request: Request, background_tasks: BackgroundTasks):  # noqa
    logger.info("START REQUEST")
    logger.info("=" * 60)
    logger.info("[API] ▶ New innovation submission received")

    email_id = uuid.uuid4().hex

    # ── Parse form data ───────────────────────────────────────────────────────
    logger.info("[API] Step 1: Parsing form data...")
    try:
        form = await request.form()
    except Exception:
        try:
            form = await request.json()
        except Exception as e:
            logger.error(f"[API] Failed to parse request body: {e}")
            logger.error(f"Stack Trace:\n{traceback.format_exc()}")
            logger.info("END REQUEST")
            return JSONResponse(status_code=400, content={"success": False, "message": "Invalid request body."})

    fields_dict      = {}
    file_summaries   = []
    resend_attachments = []
    attachment_name  = None
    attachment_type  = None

    iterator = form.multi_items() if hasattr(form, "multi_items") else form.items()
    for key, value in iterator:
        if hasattr(value, 'filename') and value.filename:
            file_bytes = await value.read()
            attachment_name = value.filename
            attachment_type = value.content_type
            file_summaries.append({"name": value.filename, "type": value.content_type, "size": format_file_size(len(file_bytes))})
            resend_attachments.append({"filename": value.filename, "content": base64.b64encode(file_bytes).decode('utf-8')})
        else:
            fields_dict[key] = value

    logger.info(f"[API] Form fields received: {list(fields_dict.keys())}")
    logger.info(f"[API] Attachments received: {len(file_summaries)} file(s)")

    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent", "")

    # ── Save to PostgreSQL ────────────────────────────────────────────────────
    logger.info("[API] Step 2: Saving to PostgreSQL...")
    if SessionLocal is None:
        logger.error("[API] PostgreSQL database unavailable — SessionLocal is None.")
        return JSONResponse(status_code=503, content={"success": False, "message": "Database service unavailable."})

    db = SessionLocal()
    db_saved = False
    try:
        saved_record = crud.create_innovation(
            db,
            full_name       = fields_dict.get("Full Name") or fields_dict.get("fullName") or "",
            email           = fields_dict.get("Email") or fields_dict.get("email") or "",
            mobile          = fields_dict.get("Mobile") or fields_dict.get("mobile") or None,
            department      = fields_dict.get("Department") or fields_dict.get("department") or "",
            year            = fields_dict.get("Year") or fields_dict.get("year") or "",
            category        = fields_dict.get("Idea Category") or fields_dict.get("category") or "",
            idea_title      = fields_dict.get("Idea Title") or fields_dict.get("ideaTitle") or "",
            idea_description= fields_dict.get("Idea Description") or fields_dict.get("ideaDescription") or "",
            expected_outcome= fields_dict.get("Expected Outcome") or fields_dict.get("expectedOutcome") or None,
            attachment_name = attachment_name,
            attachment_type = attachment_type,
            attachment_url  = None,
            ip_address      = ip_address,
            user_agent      = user_agent,
            form_data       = json.dumps(fields_dict),
        )
        if saved_record:
            db_saved = True
            logger.info(f"[API] ✅ PostgreSQL save success — Record #{saved_record.id}")
        else:
            logger.error("[API] PostgreSQL save returned None (no record created).")
    except Exception as e:
        db.rollback()
        logger.error(f"[API] ❌ PostgreSQL save EXCEPTION: {e}")
        logger.error(traceback.format_exc())
        return JSONResponse(status_code=500, content={"success": False, "message": "Failed to save submission to database."})
    finally:
        db.close()

    if not db_saved:
        return JSONResponse(status_code=500, content={"success": False, "message": "Failed to save submission to database."})

    # ── Build email content ───────────────────────────────────────────────────
    logger.info("[API] Step 3: Preparing email...")
    idea_title_val  = fields_dict.get("Idea Title") or fields_dict.get("ideaTitle") or "New Submission"
    subject         = f"🚀 New Innovation Box Submission: {idea_title_val}"
    html_body       = build_dynamic_email_html(fields_dict, file_summaries, ip_address, user_agent)
    attachments_json = json.dumps(resend_attachments)

    # ── Queue email in PostgreSQL (for retry poller) ──────────────────────────
    db2 = SessionLocal()
    try:
        crud.add_email_to_queue(db2, email_id, subject, html_body, attachments_json)
        logger.info(f"[API] Email queued in PostgreSQL — ID: {email_id}")
    except Exception as e:
        logger.warning(f"[API] Could not queue email in DB (will still attempt immediate send): {e}")
    finally:
        db2.close()

    # ── Send email SYNCHRONOUSLY to prevent background execution cutoff ──
    logger.info("[API] Step 4: Sending email synchronously (to prevent background execution cutoff)...")
    email_delivered = send_email_with_retry(email_id, subject, html_body, attachments_json)
    
    if email_delivered:
        logger.info(f"[API] Email delivered synchronously — ID: {email_id}")
    else:
        logger.error(f"[API] Synchronous email delivery failed — ID: {email_id}")

    logger.info("END REQUEST")
    logger.info("=" * 60)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "success": True, 
            "message": "Idea submitted successfully.", 
            "email_id": email_id,
            "email_status": "sent" if email_delivered else "failed"
        }
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  API ROUTE — Contact Messages
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
#  Utility & Diagnostic Routes
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/test-email")
async def test_email(background_tasks: BackgroundTasks):
    """Send a test email to verify delivery is working. Hit /test-email to trigger."""
    email_id = uuid.uuid4().hex
    now_str  = datetime.now().strftime("%d %B %Y, %I:%M %p")
    html = f"""
    <div style="font-family:Arial;max-width:500px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
      <h2 style="color:#1e3a8a;">✅ ACES Backend — Test Email</h2>
      <p>This test email confirms that the email delivery system is working correctly.</p>
      <hr>
      <p><strong>Email ID:</strong> {email_id}</p>
      <p><strong>Timestamp:</strong> {now_str}</p>
      <p><strong>SMTP User:</strong> {SMTP_USERNAME or 'NOT SET'}</p>
      <p><strong>Resend Key:</strong> {'SET (' + RESEND_API_KEY[:8] + '...)' if RESEND_API_KEY else 'NOT SET'}</p>
      <hr>
      <p style="color:#6b7280;font-size:12px;">Sent by ACES Backend v6.0</p>
    </div>
    """

    if SessionLocal is not None:
        db = SessionLocal()
        try:
            crud.add_email_to_queue(db, email_id, "ACES Test Email", html, "[]")
        finally:
            db.close()

    # Send synchronously
    email_delivered = send_email_with_retry(email_id, "ACES Test Email", html, "[]")
    return {
        "status": "success" if email_delivered else "failed",
        "message": f"Test email sent — ID: {email_id}. Check logs.",
        "check_inbox": RECIPIENT
    }


@app.get("/health")
async def health():
    """System health check — confirms DB, SMTP, and Resend configuration."""
    db_ok       = False
    queue_stats = {}

    if SessionLocal is not None:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            db_ok       = True
            queue_stats = crud.get_email_queue_stats(db)
        except Exception as e:
            logger.error(f"[Health] DB check failed: {e}")
        finally:
            db.close()

    smtp_configured  = bool(SMTP_USERNAME and SMTP_PASSWORD)
    resend_configured = bool(RESEND_API_KEY and RESEND_API_KEY.startswith("re_"))

    return {
        "status"           : "ok",
        "version"          : "6.0.0",
        "database"         : "connected" if db_ok else "unavailable",
        "smtp_configured"  : smtp_configured,
        "smtp_user"        : SMTP_USERNAME if smtp_configured else "NOT SET",
        "resend_configured": resend_configured,
        "resend_key_prefix": RESEND_API_KEY[:8] + "..." if resend_configured else "NOT SET",
        "recipient"        : RECIPIENT,
        "queue_stats"      : queue_stats
    }


@app.get("/")
async def root():
    return {"message": "ACES Backend v6.0 — PostgreSQL + Gmail SMTP"}


# ═══════════════════════════════════════════════════════════════════════════════
#  Startup Event
# ═══════════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup_validation():
    logger.info("=" * 60)
    logger.info("  ACES Backend v6.0 — Startup")
    logger.info("=" * 60)

    # Create all PostgreSQL tables
    create_tables()

    # Log configuration status
    logger.info(f"  SMTP configured : {'YES (' + SMTP_USERNAME + ')' if SMTP_USERNAME else 'NO — set SMTP_USERNAME and SMTP_PASSWORD'}")
    logger.info(f"  Resend configured: {'YES (' + RESEND_API_KEY[:8] + '...)' if RESEND_API_KEY else 'NO — set RESEND_API_KEY'}")
    logger.info(f"  Recipient       : {RECIPIENT}")

    if not SMTP_USERNAME and not RESEND_API_KEY:
        logger.error("  ❌ CRITICAL: No email delivery method configured! Set SMTP_PASSWORD or RESEND_API_KEY.")
    elif SMTP_USERNAME and not SMTP_PASSWORD:
        logger.error("  ❌ CRITICAL: SMTP_USERNAME is set but SMTP_PASSWORD is missing!")
    else:
        logger.info("  ✅ Email delivery ready.")

    # Start background email queue poller
    asyncio.create_task(process_email_queue())

    logger.info("=" * 60)
