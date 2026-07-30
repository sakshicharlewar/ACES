# ═══════════════════════════════════════════════════════════════════════════════
#  ACES Backend v6.0 — Production-Ready Email + PostgreSQL
#  Gmail SMTP (PRIMARY) → Resend HTTP API (FALLBACK)
#  Full logging, 3-attempt retry, no silent failures
#
#  ROOT CAUSE FIX (2026-07-29):
#  Resend with onboarding@resend.dev can ONLY deliver to the Resend account
#  owner's email. It CANNOT deliver to acescomputer0101@gmail.com unless that
#  Gmail is the Resend account email. Gmail SMTP with an App Password has no
#  such restriction and delivers directly to Gmail Primary Inbox.
# ═══════════════════════════════════════════════════════════════════════════════

import os
import time
import logging
import traceback
import requests as http_requests
import csv
import io
import secrets
from jose import JWTError, jwt
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
import uuid
import asyncio
import json
import base64
from utils.sms import send_sms
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

from database import get_db, create_tables, SessionLocal, engine
from models import EmailQueue, InnovationSubmission, TeamRegistration
from sqlalchemy import inspect
import crud
import schemas
import razorpay
import hmac
import hashlib


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

# Admin credentials (from env vars)
ADMIN_USERNAME  = os.getenv("ADMIN_USERNAME", "aces0101").strip()
ADMIN_PASSWORD  = os.getenv("ADMIN_PASSWORD", "aces@2026").strip()
ADMIN_JWT_SECRET = os.getenv("ADMIN_JWT_SECRET", "aces_fallback_secret_change_in_prod").strip()
ADMIN_JWT_ALGO   = "HS256"
ADMIN_JWT_EXPIRE_HOURS = 8

# Razorpay credentials
RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID", "").strip()
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET else None


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
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handler: always return clean JSON, never raw HTML/tracebacks ──
from fastapi import Request as _Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: _Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": str(exc.detail)},
        headers={"Access-Control-Allow-Origin": "*"},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: _Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "Invalid request data. Please check your inputs."},
        headers={"Access-Control-Allow-Origin": "*"},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: _Request, exc: Exception):
    logger.error(f"[Unhandled] {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "An internal server error occurred. Please try again."},
        headers={"Access-Control-Allow-Origin": "*"},
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

def send_via_gmail_smtp(email_id: str, subject: str, html_body: str, attachments_json: str, recipient: str = RECIPIENT) -> bool:
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
    logger.info(f"[SMTP|{email_id}] Recipient: {recipient}")
    logger.info(f"[SMTP|{email_id}] Subject  : {subject}")
    logger.info(f"[SMTP|{email_id}] Server   : {SMTP_SERVER}:{SMTP_PORT}")

    try:
        # Build MIME message
        msg = MIMEMultipart("alternative")
        msg["Subject"]  = subject
        msg["From"]     = f"ACES Innovation Box <{SMTP_USERNAME}>"
        msg["To"]       = recipient
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
            server.sendmail(SMTP_USERNAME, [recipient], msg.as_string())

        logger.info(f"[SMTP|{email_id}] ✅ SUCCESS — Email delivered via Gmail SMTP to {recipient}")
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

def send_via_resend_api(email_id: str, subject: str, html_body: str, attachments_json: str, attempt: int, recipient: str = RECIPIENT) -> bool:
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
    logger.info(f"[Resend|{email_id}] To       : {recipient}")
    logger.info(f"[Resend|{email_id}] Subject  : {subject}")
    logger.info(f"[Resend|{email_id}] Endpoint : {RESEND_URL}")

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
        "Idempotency-Key": f"{email_id}-{attempt}"
    }

    payload: dict = {
        "from": SENDER_EMAIL,
        "to": [recipient],
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
            return send_via_resend_api(email_id, subject, html_body, attachments_json, attempt + 1, recipient)

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
            return send_via_resend_api(email_id, subject, html_body, attachments_json, attempt + 1, recipient)
        return False
    except http_requests.exceptions.ConnectionError as e:
        logger.error(f"[Resend|{email_id}] ❌ Network connection error: {e}")
        if attempt < MAX_RETRIES:
            wait_secs = 2 ** attempt
            logger.info(f"[Resend|{email_id}] Retrying in {wait_secs}s...")
            time.sleep(wait_secs)
            return send_via_resend_api(email_id, subject, html_body, attachments_json, attempt + 1, recipient)
        return False
    except Exception as e:
        logger.error(f"[Resend|{email_id}] ❌ Unexpected exception: {e}")
        logger.error(traceback.format_exc())
        logger.error(f"Error Message: {str(e)}")
        logger.error(f"Stack Trace:\n{traceback.format_exc()}")
        logger.info("EMAIL FAILED")
        return False


# ═══════════════════════════════════════════════════════════════════════════════
#  Master Email Sender — Gmail SMTP PRIMARY → Resend API FALLBACK
# ═══════════════════════════════════════════════════════════════════════════════

def send_email_with_retry(email_id: str, subject: str, html_body: str, attachments_json: str, attempt: int = 1, recipient: str = RECIPIENT) -> bool:
    """
    Master email delivery function.
    ORDER (FIXED 2026-07-29):
    1. Gmail SMTP PRIMARY  — No domain restriction, delivers to any Gmail inbox
    2. Resend API FALLBACK — Only works if sender domain is verified in Resend

    WHY: Resend with onboarding@resend.dev can ONLY send to the Resend account
    owner's email. Gmail SMTP App Password has no such restriction.
    """
    logger.info("EMAIL FUNCTION CALLED")
    logger.info("=" * 60)
    logger.info(f"[Email|{email_id}] ▶ Email Delivery Started")
    logger.info(f"[Email|{email_id}]   To        : {recipient}")
    logger.info(f"[Email|{email_id}]   Subject   : {subject}")
    logger.info(f"[Email|{email_id}]   SMTP set  : {'YES (' + SMTP_USERNAME + ')' if SMTP_USERNAME and SMTP_PASSWORD else 'NO ← THIS IS THE PROBLEM'}")
    logger.info(f"[Email|{email_id}]   Resend set: {'YES' if RESEND_API_KEY else 'NO'}")
    logger.info("=" * 60)

    # ── Step 1: Gmail SMTP (PRIMARY — most reliable for Gmail recipient) ────
    if SMTP_USERNAME and SMTP_PASSWORD:
        logger.info(f"[Email|{email_id}] Step 1: Trying Gmail SMTP (PRIMARY)...")
        smtp_ok = send_via_gmail_smtp(email_id, subject, html_body, attachments_json, recipient)
        if smtp_ok:
            _update_email_status_standalone(email_id, "sent")
            logger.info(f"[Email|{email_id}] ✅ DELIVERED via Gmail SMTP (PRIMARY)")
            logger.info("EMAIL SENT")
            logger.info("=" * 60)
            return True
        logger.warning(f"[Email|{email_id}] Gmail SMTP failed. Trying Resend API as fallback...")
    else:
        logger.error(
            f"[Email|{email_id}] ⚠ Step 1 SKIPPED: Gmail SMTP credentials NOT configured!\n"
            f"  → Set SMTP_USERNAME and SMTP_PASSWORD in Render environment variables.\n"
            f"  → SMTP_USERNAME = acescomputer0101@gmail.com\n"
            f"  → SMTP_PASSWORD = <16-char Gmail App Password from myaccount.google.com/apppasswords>"
        )

    # ── Step 2: Resend HTTP API (FALLBACK) ──────────────────────────────────
    if RESEND_API_KEY:
        logger.info(f"[Email|{email_id}] Step 2: Trying Resend API (FALLBACK)...")
        logger.warning(
            f"[Email|{email_id}] ⚠ NOTE: Resend with 'onboarding@resend.dev' can only deliver "
            f"to the Resend account owner's email. If that is NOT {recipient}, this will fail with 422."
        )
        resend_ok = send_via_resend_api(email_id, subject, html_body, attachments_json, attempt=1, recipient=recipient)
        if resend_ok:
            _update_email_status_standalone(email_id, "sent")
            logger.info(f"[Email|{email_id}] ✅ DELIVERED via Resend API (FALLBACK)")
            logger.info("EMAIL SENT")
            logger.info("=" * 60)
            return True
    else:
        logger.warning(f"[Email|{email_id}] Step 2 SKIPPED: RESEND_API_KEY not configured.")

    # ── Both methods failed ───────────────────────────────────────────────────
    error_msg = (
        "EMAIL DELIVERY FAILED. "
        "Fix: Set SMTP_USERNAME=acescomputer0101@gmail.com and SMTP_PASSWORD=<Gmail App Password> "
        "in Render environment variables. See: https://myaccount.google.com/apppasswords"
    )
    _update_email_status_standalone(email_id, "failed", error_msg)
    logger.error(f"[Email|{email_id}] ❌ ALL DELIVERY METHODS FAILED")
    logger.error(f"[Email|{email_id}] {error_msg}")
    logger.info("EMAIL FAILED")
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
    attachment_data_uri = None

    iterator = form.multi_items() if hasattr(form, "multi_items") else form.items()
    for key, value in iterator:
        if hasattr(value, 'filename') and value.filename:
            file_bytes = await value.read()
            attachment_name = value.filename
            attachment_type = value.content_type
            file_summaries.append({"name": value.filename, "type": value.content_type, "size": format_file_size(len(file_bytes))})
            b64_str = base64.b64encode(file_bytes).decode('utf-8')
            resend_attachments.append({"filename": value.filename, "content": b64_str})
            attachment_data_uri = f"data:{value.content_type};base64,{b64_str}"
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
            full_name        = fields_dict.get("Full Name") or fields_dict.get("fullName") or "",
            email            = fields_dict.get("Email") or fields_dict.get("email") or "",
            mobile           = fields_dict.get("Mobile") or fields_dict.get("mobile") or None,
            department       = fields_dict.get("Department") or fields_dict.get("department") or "",
            year             = fields_dict.get("Year") or fields_dict.get("year") or "",
            category         = fields_dict.get("Idea Category") or fields_dict.get("category") or "",
            idea_title       = fields_dict.get("Idea Title") or fields_dict.get("ideaTitle") or "",
            idea_description = fields_dict.get("Idea Description") or fields_dict.get("ideaDescription") or "",
            problem_statement= fields_dict.get("Problem Statement") or fields_dict.get("problemStatement") or None,
            proposed_solution= fields_dict.get("Proposed Solution") or fields_dict.get("proposedSolution") or None,
            expected_impact  = fields_dict.get("Expected Impact") or fields_dict.get("expectedImpact") or None,
            technology_stack = fields_dict.get("Technology Stack") or fields_dict.get("technologyStack") or None,
            team_members     = fields_dict.get("Team Members") or fields_dict.get("teamMembers") or None,
            expected_outcome = fields_dict.get("Expected Outcome") or fields_dict.get("expectedOutcome") or None,
            # submission_date is a DateTime column — let the server_default handle it
            attachment_name  = attachment_name,
            attachment_type  = attachment_type,
            attachment_url   = attachment_data_uri,
            ip_address       = ip_address,
            user_agent       = user_agent,
            form_data        = json.dumps(fields_dict),
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
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Failed to save submission: {str(e)}"},
            headers={"Access-Control-Allow-Origin": "*"},
        )
    finally:
        db.close()

    if not db_saved:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to save submission to database."},
            headers={"Access-Control-Allow-Origin": "*"},
        )

    # Generate Idea ID using the primary key
    idea_id = f"INN-{saved_record.id:04d}"
    
    # Save the generated idea_id and default status to DB
    db3 = SessionLocal()
    try:
        rec = db3.query(InnovationSubmission).filter(InnovationSubmission.id == saved_record.id).first()
        if rec:
            rec.idea_id = idea_id
            rec.status = "Pending Review"
            db3.commit()
    except Exception as e:
        logger.error(f"[API] Failed to update idea_id: {e}")
    finally:
        db3.close()

    # ── Build email content ───────────────────────────────────────────────────
    logger.info("[API] Step 3: Preparing emails...")
    
    student_name = fields_dict.get("Full Name") or fields_dict.get("fullName") or "Student"
    student_email = fields_dict.get("Email") or fields_dict.get("email") or ""
    idea_title_val = fields_dict.get("Idea Title") or fields_dict.get("ideaTitle") or "New Submission"
    submission_date = datetime.now().strftime("%d %B %Y, %I:%M %p")
    
    student_email_id = uuid.uuid4().hex
    admin_email_id = uuid.uuid4().hex
    attachments_json = json.dumps(resend_attachments)
    
    # Student Email
    student_subject = "Innovation Idea Submitted Successfully | ACES"
    student_html = f"""
    <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
      <h2 style="color:#1e3a8a;">🎉 Idea Submitted Successfully!</h2>
      <p>Dear <b>{student_name}</b>,</p>
      <p>Thank you for submitting your idea to the ACES Innovation Box.</p>
      <p><b>Idea ID:</b> {idea_id}</p>
      <p><b>Idea Title:</b> {idea_title_val}</p>
      <p><b>Submission Date:</b> {submission_date}</p>
      <p><b>Current Status:</b> <span style="color:#d97706;font-weight:bold;">Pending Review</span></p>
      <hr>
      <p>Our team will review your submission and get back to you soon.</p>
      <p>Regards,<br>Association of Computer Engineering Students (ACES)</p>
    </div>
    """
    
    # Admin Email
    admin_subject = "New Innovation Box Submission"
    admin_html = f"""
    <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
      <h2 style="color:#1e3a8a;">💡 New Innovation Box Submission</h2>
      <p>A new idea has been submitted to the Innovation Box.</p>
      <p><b>Idea ID:</b> {idea_id}</p>
      <p><b>Student Name:</b> {student_name}</p>
      <p><b>Idea Title:</b> {idea_title_val}</p>
      <p><b>Submission Time:</b> {submission_date}</p>
      <hr>
      <p><a href="http://localhost:5173/admin/submissions">Click here to review the submission.</a></p>
    </div>
    """

    # ── Queue emails in PostgreSQL (for retry poller) ──────────────────────────
    db2 = SessionLocal()
    try:
        crud.add_email_to_queue(db2, student_email_id, student_subject, student_html, "[]")
        crud.add_email_to_queue(db2, admin_email_id, admin_subject, admin_html, attachments_json)
        logger.info(f"[API] Emails queued in PostgreSQL")
    except Exception as e:
        logger.warning(f"[API] Could not queue email in DB (will still attempt immediate send): {e}")
    finally:
        db2.close()

    # ── Send emails ASYNCHRONOUSLY using FastAPI BackgroundTasks ──
    logger.info("[API] Step 4: Dispatching emails to background task...")
    if student_email:
        background_tasks.add_task(send_email_with_retry, student_email_id, student_subject, student_html, "[]", 1, student_email)
    background_tasks.add_task(send_email_with_retry, admin_email_id, admin_subject, admin_html, attachments_json, 1, RECIPIENT)

    logger.info("END REQUEST")
    logger.info("=" * 60)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "success": True, 
            "message": "Idea submitted successfully.", 
            "idea_id": idea_id
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
#  API ROUTES — Razorpay Payment
# ═══════════════════════════════════════════════════════════════════════════════

# (Razorpay endpoints removed as part of reverting to manual UPI)


# ═══════════════════════════════════════════════════════════════════════════════
#  API ROUTES — Team Registrations (Bug Hunt)
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/debug/counts")
async def debug_counts(db: Session = Depends(get_db)):
    """Public endpoint to verify raw database counts."""
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    
    try:
        from models import UpcomingEvent as UE, TeamRegistration, EventRegistration, InnovationSubmission
        from sqlalchemy import or_
        bh_event = db.query(UE).filter(
            or_(
                UE.title.ilike("%Bug Hunt%"),
                UE.title.ilike("%bug hunt%"),
            )
        ).first()

        total_team_regs = db.query(TeamRegistration).count()
        bh_event_regs = db.query(TeamRegistration).filter(TeamRegistration.event_id == bh_event.id).count() if bh_event else 0
        total_event_regs = db.query(EventRegistration).count()
        total_innovation_subs = db.query(InnovationSubmission).count()

        return {
            "bug_hunt_event_id": bh_event.id if bh_event else None,
            "bug_hunt_event_max_teams": bh_event.max_teams if bh_event else None,
            "total_team_registrations_in_db": total_team_regs,
            "team_registrations_for_bug_hunt_event": bh_event_regs,
            "total_event_registrations_in_db": total_event_regs,
            "total_innovation_submissions_in_db": total_innovation_subs
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/admin/seed-old-data")
async def seed_old_data(db: Session = Depends(get_db)):
    """Temporarily seed 4 dummy entries so seats left = 26."""
    try:
        from models import UpcomingEvent as UE, TeamRegistration
        from sqlalchemy import or_
        bh_event = db.query(UE).filter(
            or_(UE.title.ilike("%Bug Hunt%"), UE.title.ilike("%bug hunt%"))
        ).first()

        event_id = bh_event.id if bh_event else 1

        # Check if we already seeded
        existing = db.query(TeamRegistration).filter(TeamRegistration.team_name.like("Recovered Team%")).count()
        if existing >= 4:
            return {"message": "Already seeded."}

        for i in range(1, 5):
            dummy = TeamRegistration(
                registration_id=f"REC-{uuid.uuid4().hex[:8].upper()}",
                event_id=event_id,
                team_name=f"Recovered Team {i}",
                leader_name=f"Recovered Leader {i}",
                leader_email=f"recovered{i}@example.com",
                leader_phone=f"000000000{i}",
                leader_year="Unknown",
                leader_branch="Unknown",
                member2_name="None",
                member2_email="none@example.com",
                member2_phone="0000000000",
                member2_year="Unknown",
                transaction_id=f"REC-TXN-{uuid.uuid4().hex[:8].upper()}",
                registration_fee="₹40",
                payment_status="verified"
            )
            db.add(dummy)
        
        db.commit()
        return {"message": "Successfully added 4 recovered entries! Seats should now be 26."}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/admin/remove-dummy-data")
async def remove_dummy_data(db: Session = Depends(get_db)):
    """Temporarily remove dummy entries."""
    try:
        from models import TeamRegistration
        deleted = db.query(TeamRegistration).filter(TeamRegistration.team_name.like("Recovered Team%")).delete(synchronize_session=False)
        db.commit()
        return {"message": f"Successfully removed {deleted} dummy entries. Seats should be reset."}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/events/bug-hunt/stats")
async def bug_hunt_stats(db: Session = Depends(get_db)):
    """Fetch live seat counter for Bug Hunt from PostgreSQL."""
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})

    try:
        from models import UpcomingEvent as UE
        from sqlalchemy import or_
        # Find Bug Hunt event by title
        bh_event = db.query(UE).filter(
            or_(
                UE.title.ilike("%Bug Hunt%"),
                UE.title.ilike("%bug hunt%"),
            )
        ).first()

        if bh_event:
            registered_teams = db.query(TeamRegistration).filter(
                TeamRegistration.event_id == bh_event.id
            ).count()
        else:
            # No specific Bug Hunt event found — count ALL team registrations
            registered_teams = db.query(TeamRegistration).count()

        total_seats = 30
        remaining_seats = max(0, total_seats - registered_teams)

        return {
            "totalSeats": total_seats,
            "registeredTeams": registered_teams,
            "remainingSeats": remaining_seats,
            "registrationOpen": remaining_seats > 0
        }
    except Exception as e:
        logger.error(f"[bug_hunt_stats] Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/events/{event_id}/team-register", status_code=status.HTTP_201_CREATED)
async def register_team(event_id: int, data: schemas.TeamRegistrationCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})

    event = crud.get_event(db, event_id)
    if not event:
        return JSONResponse(status_code=404, content={"error": "Event not found."})

    current_teams = db.query(TeamRegistration).filter(TeamRegistration.event_id == event_id).count()
    if current_teams >= 30:
        try:
            event.is_registration_open = False
            db.commit()
        except Exception:
            pass
        return JSONResponse(status_code=400, content={"error": "Registration Closed. Maximum limit of 30 teams has been reached."})

    if not event.is_registration_open:
        return JSONResponse(status_code=400, content={"error": "Registration Closed."})

    if not data.transaction_id or not data.payment_screenshot:
        return JSONResponse(status_code=400, content={"error": "Transaction ID and Payment Screenshot are required."})

    # ── Verify Duplicate Transaction IDs ─────────────────────────────────────────
    existing_txn = db.query(TeamRegistration).filter(TeamRegistration.transaction_id == data.transaction_id.strip()).first()
    if existing_txn:
        return JSONResponse(status_code=400, content={"error": "This Transaction ID has already been used for a registration."})

    registration_id = f"BUG-{current_teams + 1:03d}"
    reg_data = data.dict()
    reg_data["payment_status"] = "pending"
    reg_data["approval_status"] = "pending"
    reg_data["transaction_id"] = data.transaction_id.strip()

    try:
        reg = crud.create_team_registration(db, registration_id=registration_id, **reg_data)
        
        if reg:
            from datetime import datetime as dt
            now_str = dt.now().strftime("%d %B %Y, %I:%M %p")

            # ── Admin notification email ────────────────────────────────────────────
            admin_email_id = uuid.uuid4().hex
            admin_html = f"""
            <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
              <h2 style="color:#1e3a8a;">🚨 New Team Registration (Pending Verification)</h2>
              <p>A new team has registered for <b>{event.title}</b>.</p>
              <p><b>Team Name:</b> {reg.team_name}</p>
              <p><b>Registration ID:</b> {reg.registration_id}</p>
              <p><b>Leader:</b> {reg.leader_name} ({reg.leader_email})</p>
              <p><b>Transaction ID:</b> {reg.transaction_id}</p>
              <p><b>Registered At:</b> {now_str}</p>
              <hr>
              <p><a href="https://aces-backkend.onrender.com/admin">Click here to review and approve the registration.</a></p>
            </div>
            """
            crud.add_email_to_queue(db, admin_email_id, f"Action Required: New Registration {reg.team_name}", admin_html, "[]")
            background_tasks.add_task(send_email_with_retry, admin_email_id, f"Action Required: New Registration {reg.team_name}", admin_html, "[]", 1, RECIPIENT)

            # ── Participant "Pending" email ──────────────────────────────────────
            participant_email_id = uuid.uuid4().hex
            participant_html = f"""
            <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;background:#f9fafb;border-radius:12px;">
              <div style="background:#1e3a8a;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
                <h1 style="color:#fff;margin:0;">⏳ Registration Pending</h1>
              </div>
              <div style="padding:24px;background:#fff;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
                <p style="color:#374151;">Hi <b>{reg.leader_name}</b>,</p>
                <p style="color:#374151;">We have received your registration details for <b>{event.title}</b>.</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                  <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold;">Registration ID</td><td style="padding:8px;">{reg.registration_id}</td></tr>
                  <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold;">Team Name</td><td style="padding:8px;">{reg.team_name}</td></tr>
                  <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold;">Transaction ID</td><td style="padding:8px;">{reg.transaction_id}</td></tr>
                  <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold;">Status</td><td style="padding:8px;color:#d97706;font-weight:bold;">⏳ Pending Payment Verification</td></tr>
                </table>
                <p style="color:#6b7280;font-size:14px;">Our team is verifying your payment screenshot. You will receive a final confirmation email once approved.</p>
                <p style="color:#374151;margin-top:16px;">Thanks! 🚀<br><b>ACES – Association of Computer Engineering Students</b></p>
              </div>
            </div>
            """
            crud.add_email_to_queue(db, participant_email_id, f"Registration Pending Verification – {reg.registration_id}", participant_html, "[]")
            background_tasks.add_task(send_email_with_retry, participant_email_id, f"Registration Pending Verification – {reg.registration_id}", participant_html, "[]", 1, reg.leader_email)

            return {"success": True, "registration_id": reg.registration_id, "payment_status": reg.payment_status}
    except Exception as e:
        logger.error(f"[API] Registration failed: {e}", exc_info=True)
        return JSONResponse(
            status_code=500, 
            content={"error": f"Failed to register. {str(e)}"},
            headers={"Access-Control-Allow-Origin": "*"}
        )
    
    return JSONResponse(status_code=500, content={"error": "Failed to register team (No record created)."})

@app.get("/admin/api/events/{event_id}/team-registrations")
async def list_team_registrations(event_id: int, db: Session = Depends(get_db)):
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    regs = crud.get_team_registrations(db, event_id)
    return [schemas.TeamRegistrationRead.from_orm(r).dict() for r in regs]

@app.patch("/admin/api/events/{event_id}/status")
async def toggle_event_status(event_id: int, request: Request, db: Session = Depends(get_db)):
    """Admin: Open or close registration for an event."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    try:
        payload = jwt.decode(auth[7:], ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGO])
        if payload.get("sub") != "admin":
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    except JWTError:
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    body = await request.json()
    is_open = body.get("is_registration_open")
    if is_open is None:
        return JSONResponse(status_code=400, content={"error": "is_registration_open field required"})
    event = crud.get_event(db, event_id)
    if not event:
        return JSONResponse(status_code=404, content={"error": "Event not found."})
    event.is_registration_open = bool(is_open)
    db.commit()
    db.refresh(event)
    current_teams = db.query(TeamRegistration).filter(TeamRegistration.event_id == event_id).count()
    return {
        "success": True,
        "event_id": event_id,
        "is_registration_open": event.is_registration_open,
        "registered_teams_count": current_teams,
        "max_teams": event.max_teams,
    }

@app.delete("/admin/api/team-registrations/{reg_id}")
async def delete_team_registration(reg_id: int, db: Session = Depends(get_db)):
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    if crud.delete_team_registration(db, reg_id):
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Registration not found."})

@app.patch("/admin/api/team-registrations/{reg_id}/payment")
async def verify_team_payment(reg_id: int, request: Request, db: Session = Depends(get_db)):
    """Admin: approve or reject a team payment."""
    # Manual token check (avoid forward-reference to _verify_admin_token)
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    try:
        payload = jwt.decode(auth[7:], ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGO])
        if payload.get("sub") != "admin":
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    except Exception:
        return JSONResponse(status_code=401, content={"error": "Token expired or invalid"})
    if db is None:
        return JSONResponse(status_code=503, content={"error": "Database unavailable"})
    body = await request.json()
    new_status = body.get("payment_status")  # 'approved' or 'rejected'
    if new_status not in ("approved", "rejected", "pending"):
        return JSONResponse(status_code=400, content={"error": "Invalid payment_status. Use approved/rejected/pending."})
    reg = db.query(TeamRegistration).filter(TeamRegistration.id == reg_id).first()
    if not reg:
        return JSONResponse(status_code=404, content={"error": "Registration not found."})
    from datetime import datetime as dt
    reg.payment_status = new_status
    reg.payment_verified_at = dt.utcnow()
    reg.payment_verified_by = "admin"
    db.commit()
    logger.info(f"[Admin] Payment for reg #{reg_id} marked as {new_status}")
    return {"success": True, "payment_status": new_status}

@app.patch("/admin/api/team-registrations/{reg_id}/approve")
async def approve_team_registration(reg_id: int, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Admin: approve a team registration and send confirmation email."""
    # Manual token check
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    try:
        payload = jwt.decode(auth[7:], ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGO])
        if payload.get("sub") != "admin":
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    except Exception:
        return JSONResponse(status_code=401, content={"error": "Token expired or invalid"})
    
    reg = db.query(TeamRegistration).filter(TeamRegistration.id == reg_id).first()
    if not reg:
        return JSONResponse(status_code=404, content={"error": "Registration not found."})
    
    event = crud.get_event(db, reg.event_id)
    
    from datetime import datetime as dt
    reg.approval_status = "approved"
    reg.approval_date = dt.utcnow()
    reg.approved_by = "admin"
    db.commit()
    
    # Send Approval / Seat Confirmed Email
    leader_email_id = uuid.uuid4().hex
    leader_html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f9fafb;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:32px 24px;text-align:center;">
        <div style="font-size:48px;margin-bottom:8px;">🎉</div>
        <h1 style="color:#fff;margin:0;font-size:24px;">Your Seat is Confirmed!</h1>
        <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">ACES Bug Hunt Registration Approved</p>
      </div>
      <div style="padding:28px 24px;background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <p style="color:#374151;margin-top:0;">Hi <b>{reg.leader_name}</b>,</p>
        <p style="color:#374151;">Congratulations! 🎊 Your payment has been verified and your registration for <b>{event.title}</b> is now <span style="color:#16a34a;font-weight:bold;">CONFIRMED</span>.</p>

        <table style="width:100%;border-collapse:collapse;margin:20px 0;border-radius:8px;overflow:hidden;">
          <tr style="background:#f3f4f6;">
            <td style="padding:10px 14px;font-weight:bold;color:#374151;width:40%;">Registration ID</td>
            <td style="padding:10px 14px;color:#1d4ed8;font-weight:bold;font-family:monospace;">{reg.registration_id}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:bold;color:#374151;background:#fafafa;">Team Name</td>
            <td style="padding:10px 14px;color:#374151;">{reg.team_name}</td>
          </tr>
          <tr style="background:#f3f4f6;">
            <td style="padding:10px 14px;font-weight:bold;color:#374151;">Event</td>
            <td style="padding:10px 14px;color:#374151;">{event.title}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:bold;color:#374151;background:#fafafa;">Status</td>
            <td style="padding:10px 14px;"><span style="background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:20px;font-weight:bold;font-size:13px;">✅ Confirmed</span></td>
          </tr>
        </table>

        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;margin:20px 0;">
          <p style="margin:0;color:#1e40af;font-size:13px;">📌 <b>Next Steps:</b> Further event details (venue, time, schedule) will be shared soon. Stay tuned!</p>
        </div>

        <p style="color:#6b7280;font-size:13px;">Please carry your Registration ID <b>{reg.registration_id}</b> on the day of the event.</p>
        <p style="color:#374151;margin-top:20px;">Best of luck! 🚀<br><b>ACES – Association of Computer Engineering Students</b></p>
      </div>
    </div>
    """
    crud.add_email_to_queue(db, leader_email_id, f"🎉 Your Seat is Confirmed – {reg.registration_id}", leader_html, "[]")
    background_tasks.add_task(send_email_with_retry, leader_email_id, f"🎉 Your Seat is Confirmed – {reg.registration_id}", leader_html, "[]", 1, reg.leader_email)
    
    reg.email_sent = True
    
    # Send SMS if leader phone exists
    if reg.leader_phone:
        sms_msg = f"Your ACES {event.title} registration ({reg.registration_id}) has been APPROVED.\n\nPlease check your email for complete event details.\n\nThank you."
        if send_sms(reg.leader_phone, sms_msg):
            reg.sms_sent = True

    reg.notification_timestamp = dt.utcnow()
    db.commit()
    
    logger.info(f"[Admin] Registration #{reg_id} approved. Email/SMS dispatched.")
    return {"success": True, "approval_status": "approved"}

@app.patch("/admin/api/team-registrations/{reg_id}/reject")
async def reject_team_registration(reg_id: int, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Admin: reject a team registration with a reason and send rejection email."""
    # Manual token check
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    try:
        payload = jwt.decode(auth[7:], ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGO])
        if payload.get("sub") != "admin":
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    except Exception:
        return JSONResponse(status_code=401, content={"error": "Token expired or invalid"})
    
    body = await request.json()
    reason = body.get("rejection_reason", "No reason provided.")
    
    reg = db.query(TeamRegistration).filter(TeamRegistration.id == reg_id).first()
    if not reg:
        return JSONResponse(status_code=404, content={"error": "Registration not found."})
        
    event = crud.get_event(db, reg.event_id)
    
    from datetime import datetime as dt
    reg.approval_status = "rejected"
    reg.approval_date = dt.utcnow()
    reg.approved_by = "admin"
    reg.rejection_reason = reason
    db.commit()
    
    # Send Rejection Email
    leader_email_id = uuid.uuid4().hex
    leader_html = f"""
    <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
      <h2 style="color:#dc2626;">Registration Update</h2>
      <p>Dear <b>{reg.leader_name}</b>,</p>
      <p>We regret to inform you that your registration for <b>{event.title}</b> could not be approved.</p>
      <p><b>Reason:</b></p>
      <blockquote style="border-left: 4px solid #dc2626; padding-left: 10px; color: #4b5563;">{reason}</blockquote>
      <hr>
      <p>If you believe this is an error, please contact the event coordinator.</p>
      <p>Regards,<br>ACES</p>
    </div>
    """
    crud.add_email_to_queue(db, leader_email_id, f"ACES Event Registration Update", leader_html, "[]")
    background_tasks.add_task(send_email_with_retry, leader_email_id, f"ACES Event Registration Update", leader_html, "[]", 1, reg.leader_email)
    
    reg.email_sent = True
    
    # Send SMS if leader phone exists
    if reg.leader_phone:
        sms_msg = f"Your ACES {event.title} registration ({reg.registration_id}) has been REJECTED.\nReason: {reason}.\nPlease check email for details."
        if send_sms(reg.leader_phone, sms_msg):
            reg.sms_sent = True

    reg.notification_timestamp = dt.utcnow()
    db.commit()
    
    logger.info(f"[Admin] Registration #{reg_id} rejected. Reason: {reason}")
    return {"success": True, "approval_status": "rejected"}

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
#  API ROUTES — Innovation Box Admin
# ═══════════════════════════════════════════════════════════════════════════════

@app.patch("/admin/api/innovation/{idea_id}/approve")
async def approve_innovation(idea_id: int, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Admin: approve an innovation box submission and send confirmation email/sms."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    try:
        payload = jwt.decode(auth[7:], ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGO])
        if payload.get("sub") != "admin":
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    except Exception:
        return JSONResponse(status_code=401, content={"error": "Token expired or invalid"})
    
    submission = db.query(InnovationSubmission).filter(InnovationSubmission.id == idea_id).first()
    if not submission:
        return JSONResponse(status_code=404, content={"error": "Submission not found."})
    
    from datetime import datetime as dt
    submission.status = "Approved"
    submission.approval_date = dt.utcnow()
    submission.approved_by = "admin"
    db.commit()
    
    # Send Approval Email
    email_id_uuid = uuid.uuid4().hex
    html = f"""
    <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
      <h2 style="color:#1e3a8a;">🎉 Innovation Box Submission Approved!</h2>
      <p>Dear <b>{submission.full_name}</b>,</p>
      <p>Congratulations!</p>
      <p>Your innovation idea has been reviewed and approved.</p>
      <p><b>Idea ID:</b> {submission.idea_id}</p>
      <p><b>Title:</b> {submission.idea_title}</p>
      <p><b>Status:</b> Approved</p>
      <p>Thank you for contributing your innovative idea to ACES.</p>
      <br>
      <p>Regards,<br>Association of Computer Engineering Students (ACES)</p>
    </div>
    """
    crud.add_email_to_queue(db, email_id_uuid, "ACES Innovation Box Submission Approved", html, "[]")
    background_tasks.add_task(send_email_with_retry, email_id_uuid, "ACES Innovation Box Submission Approved", html, "[]", 1, submission.email)
    
    submission.email_sent = True
    
    # Send SMS if mobile exists
    if submission.mobile:
        sms_msg = f"Your Innovation Box submission ({submission.idea_id}) has been APPROVED.\n\nPlease check your email for further details.\n\nThank you."
        if send_sms(submission.mobile, sms_msg):
            submission.sms_sent = True

    submission.notification_timestamp = dt.utcnow()
    db.commit()
    
    logger.info(f"[Admin] Innovation #{idea_id} approved. Email/SMS dispatched.")
    return {"success": True, "status": "Approved"}


@app.patch("/admin/api/innovation/{idea_id}/reject")
async def reject_innovation(idea_id: int, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Admin: reject an innovation box submission and send rejection email/sms."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    try:
        payload = jwt.decode(auth[7:], ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGO])
        if payload.get("sub") != "admin":
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    except Exception:
        return JSONResponse(status_code=401, content={"error": "Token expired or invalid"})
    
    body = await request.json()
    reason = body.get("rejection_reason", "No reason provided.")
    
    submission = db.query(InnovationSubmission).filter(InnovationSubmission.id == idea_id).first()
    if not submission:
        return JSONResponse(status_code=404, content={"error": "Submission not found."})
    
    from datetime import datetime as dt
    submission.status = "Rejected"
    submission.approval_date = dt.utcnow()
    submission.approved_by = "admin"
    submission.rejection_reason = reason
    db.commit()
    
    # Send Rejection Email
    email_id_uuid = uuid.uuid4().hex
    html = f"""
    <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
      <h2 style="color:#dc2626;">Innovation Box Update</h2>
      <p>Dear <b>{submission.full_name}</b>,</p>
      <p>We regret to inform you that your innovation idea submission could not be approved.</p>
      <p><b>Reason:</b></p>
      <blockquote style="border-left: 4px solid #dc2626; padding-left: 10px; color: #4b5563;">{reason}</blockquote>
      <hr>
      <p>If you believe this is an error, please contact the coordinator.</p>
      <p>Regards,<br>ACES</p>
    </div>
    """
    crud.add_email_to_queue(db, email_id_uuid, "ACES Innovation Box Update", html, "[]")
    background_tasks.add_task(send_email_with_retry, email_id_uuid, "ACES Innovation Box Update", html, "[]", 1, submission.email)
    
    submission.email_sent = True
    
    # Send SMS if mobile exists
    if submission.mobile:
        sms_msg = f"Your Innovation Box submission ({submission.idea_id}) has been REJECTED.\nReason: {reason}.\nPlease check email for details."
        if send_sms(submission.mobile, sms_msg):
            submission.sms_sent = True

    submission.notification_timestamp = dt.utcnow()
    db.commit()
    
    logger.info(f"[Admin] Innovation #{idea_id} rejected. Reason: {reason}")
    return {"success": True, "status": "Rejected"}

@app.delete("/admin/api/innovation/{idea_id}")
async def delete_innovation(idea_id: int, request: Request, db: Session = Depends(get_db)):
    """Admin: completely delete an innovation box submission."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    try:
        payload = jwt.decode(auth[7:], ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGO])
        if payload.get("sub") != "admin":
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    except Exception:
        return JSONResponse(status_code=401, content={"error": "Token expired or invalid"})

    submission = db.query(InnovationSubmission).filter(InnovationSubmission.id == idea_id).first()
    if not submission:
        return JSONResponse(status_code=404, content={"error": "Submission not found."})
        
    db.delete(submission)
    db.commit()
    logger.info(f"[Admin] Innovation #{idea_id} deleted.")
    return {"success": True}

@app.post("/admin/api/innovation/{idea_id}/resend")
async def resend_innovation_notification(idea_id: int, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Admin: resend email or sms for innovation box submission."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    try:
        payload = jwt.decode(auth[7:], ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGO])
        if payload.get("sub") != "admin":
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    except Exception:
        return JSONResponse(status_code=401, content={"error": "Token expired or invalid"})
    
    body = await request.json()
    notify_type = body.get("type") # "email" or "sms"
    
    submission = db.query(InnovationSubmission).filter(InnovationSubmission.id == idea_id).first()
    if not submission:
        return JSONResponse(status_code=404, content={"error": "Submission not found."})
        
    if notify_type == "sms":
        if not submission.mobile:
            return JSONResponse(status_code=400, content={"error": "No mobile number available."})
        sms_msg = f"Your Innovation Box submission ({submission.idea_id}) has been {submission.status.upper()}.\nPlease check your email for details."
        if submission.status == "Rejected" and submission.rejection_reason:
            sms_msg = f"Your Innovation Box submission ({submission.idea_id}) has been REJECTED.\nReason: {submission.rejection_reason}.\nPlease check email for details."
        if send_sms(submission.mobile, sms_msg):
            submission.sms_sent = True
            db.commit()
            return {"success": True, "message": "SMS resent successfully."}
        return JSONResponse(status_code=500, content={"error": "Failed to send SMS."})
        
    elif notify_type == "email":
        email_id_uuid = uuid.uuid4().hex
        if submission.status == "Approved":
            html = f"""
            <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
              <h2 style="color:#1e3a8a;">🎉 Innovation Box Submission Approved!</h2>
              <p>Dear <b>{submission.full_name}</b>,</p>
              <p>Congratulations!</p>
              <p>Your innovation idea has been reviewed and approved.</p>
              <p><b>Idea ID:</b> {submission.idea_id}</p>
              <p><b>Title:</b> {submission.idea_title}</p>
              <p><b>Status:</b> Approved</p>
              <p>Thank you for contributing your innovative idea to ACES.</p>
              <br>
              <p>Regards,<br>Association of Computer Engineering Students (ACES)</p>
            </div>
            """
            crud.add_email_to_queue(db, email_id_uuid, "ACES Innovation Box Submission Approved", html, "[]")
            background_tasks.add_task(send_email_with_retry, email_id_uuid, "ACES Innovation Box Submission Approved", html, "[]", 1, submission.email)
        else:
            reason = submission.rejection_reason or "No reason provided."
            html = f"""
            <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
              <h2 style="color:#dc2626;">Innovation Box Update</h2>
              <p>Dear <b>{submission.full_name}</b>,</p>
              <p>We regret to inform you that your innovation idea submission could not be approved.</p>
              <p><b>Reason:</b></p>
              <blockquote style="border-left: 4px solid #dc2626; padding-left: 10px; color: #4b5563;">{reason}</blockquote>
              <hr>
              <p>If you believe this is an error, please contact the coordinator.</p>
              <p>Regards,<br>ACES</p>
            </div>
            """
            crud.add_email_to_queue(db, email_id_uuid, "ACES Innovation Box Update", html, "[]")
            background_tasks.add_task(send_email_with_retry, email_id_uuid, "ACES Innovation Box Update", html, "[]", 1, submission.email)
        
        submission.email_sent = True
        db.commit()
        return {"success": True, "message": "Email resent successfully."}
        
    return JSONResponse(status_code=400, content={"error": "Invalid notification type."})


@app.post("/admin/api/team-registrations/{reg_id}/resend")
async def resend_registration_notification(reg_id: int, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Admin: resend email or sms for team registration."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    try:
        payload = jwt.decode(auth[7:], ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGO])
        if payload.get("sub") != "admin":
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    except Exception:
        return JSONResponse(status_code=401, content={"error": "Token expired or invalid"})
    
    body = await request.json()
    notify_type = body.get("type") # "email" or "sms"
    
    reg = db.query(TeamRegistration).filter(TeamRegistration.id == reg_id).first()
    if not reg:
        return JSONResponse(status_code=404, content={"error": "Registration not found."})
        
    event = crud.get_event(db, reg.event_id)
        
    if notify_type == "sms":
        if not reg.leader_phone:
            return JSONResponse(status_code=400, content={"error": "No mobile number available."})
        sms_msg = f"Your ACES {event.title} registration ({reg.registration_id}) has been {reg.approval_status.upper()}.\nPlease check your email for complete event details.\nThank you."
        if reg.approval_status == "rejected" and reg.rejection_reason:
            sms_msg = f"Your ACES {event.title} registration ({reg.registration_id}) has been REJECTED.\nReason: {reg.rejection_reason}.\nPlease check email for details."
        
        if send_sms(reg.leader_phone, sms_msg):
            reg.sms_sent = True
            db.commit()
            return {"success": True, "message": "SMS resent successfully."}
        return JSONResponse(status_code=500, content={"error": "Failed to send SMS."})
        
    elif notify_type == "email":
        leader_email_id = uuid.uuid4().hex
        if reg.approval_status == "approved":
            leader_html = f"""
            <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
              <h2 style="color:#1e3a8a;">🎉 Registration Approved!</h2>
              <p>Dear <b>{reg.leader_name}</b>,</p>
              <p>Congratulations!</p>
              <p>Your registration has been approved.</p>
              <p><b>Registration ID:</b> {reg.registration_id}</p>
              <p><b>Event:</b> {event.title}</p>
              <p><b>Status:</b> Approved</p>
              <p>Please report to the venue on the scheduled date and time.</p>
              <br>
              <p>Regards,<br>Association of Computer Engineering Students (ACES)</p>
            </div>
            """
            crud.add_email_to_queue(db, leader_email_id, f"ACES Registration Approved – {event.title}", leader_html, "[]")
            background_tasks.add_task(send_email_with_retry, leader_email_id, f"ACES Registration Approved – {event.title}", leader_html, "[]", 1, reg.leader_email)
        else:
            reason = reg.rejection_reason or "No reason provided."
            leader_html = f"""
            <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
              <h2 style="color:#dc2626;">Registration Update</h2>
              <p>Dear <b>{reg.leader_name}</b>,</p>
              <p>We regret to inform you that your registration for <b>{event.title}</b> could not be approved.</p>
              <p><b>Reason:</b></p>
              <blockquote style="border-left: 4px solid #dc2626; padding-left: 10px; color: #4b5563;">{reason}</blockquote>
              <hr>
              <p>If you believe this is an error, please contact the event coordinator.</p>
              <p>Regards,<br>ACES</p>
            </div>
            """
            crud.add_email_to_queue(db, leader_email_id, f"ACES Event Registration Update", leader_html, "[]")
            background_tasks.add_task(send_email_with_retry, leader_email_id, f"ACES Event Registration Update", leader_html, "[]", 1, reg.leader_email)
        
        reg.email_sent = True
        db.commit()
        return {"success": True, "message": "Email resent successfully."}
        
    return JSONResponse(status_code=400, content={"error": "Invalid notification type."})


# ═══════════════════════════════════════════════════════════════════════════════
#  Utility & Diagnostic Routes
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/admin/api/migrate")
async def migrate_db(request: Request, db: Session = Depends(get_db)):
    """Add missing columns to the database if they don't exist."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    try:
        payload = jwt.decode(auth[7:], ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGO])
        if payload.get("sub") != "admin":
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    except Exception:
        return JSONResponse(status_code=401, content={"error": "Token expired or invalid"})
    
    from sqlalchemy import text
    try:
        queries = [
            "ALTER TABLE team_registrations ADD COLUMN email_sent BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE team_registrations ADD COLUMN sms_sent BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE team_registrations ADD COLUMN notification_timestamp TIMESTAMP;",
            "ALTER TABLE team_registrations ADD COLUMN approval_date TIMESTAMP;",
            "ALTER TABLE team_registrations ADD COLUMN approved_by VARCHAR;",
            "ALTER TABLE team_registrations ADD COLUMN rejection_reason VARCHAR;",
            
            "ALTER TABLE innovation_box_submissions ADD COLUMN email_sent BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE innovation_box_submissions ADD COLUMN sms_sent BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE innovation_box_submissions ADD COLUMN notification_timestamp TIMESTAMP;",
            "ALTER TABLE innovation_box_submissions ADD COLUMN approval_date TIMESTAMP;",
            "ALTER TABLE innovation_box_submissions ADD COLUMN approved_by VARCHAR;",
            "ALTER TABLE innovation_box_submissions ADD COLUMN rejection_reason VARCHAR;"
        ]
        
        results = []
        for q in queries:
            try:
                db.execute(text(q))
                db.commit()
                results.append(f"Success: {q}")
            except Exception as e:
                db.rollback()
                results.append(f"Failed (already exists?): {q} - {str(e)}")
                
        return {"success": True, "results": results}
    except Exception as e:
        return {"success": False, "error": str(e)}

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
#  ADMIN PANEL — JWT Auth + Protected Routes
#  All routes prefixed /admin/api/* — zero overlap with existing routes
# ═══════════════════════════════════════════════════════════════════════════════

def _create_admin_token() -> str:
    """Create a signed JWT for the admin session."""
    import time
    payload = {
        "sub": "admin",
        "iat": int(time.time()),
        "exp": int(time.time()) + ADMIN_JWT_EXPIRE_HOURS * 3600,
    }
    return jwt.encode(payload, ADMIN_JWT_SECRET, algorithm=ADMIN_JWT_ALGO)


def _verify_admin_token(request: Request) -> dict:
    """FastAPI dependency — validates the Bearer token on every protected route."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, ADMIN_JWT_SECRET, algorithms=[ADMIN_JWT_ALGO])
        if payload.get("sub") != "admin":
            raise HTTPException(status_code=401, detail="Invalid token subject")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid — please log in again")


# ── Admin Login ───────────────────────────────────────────────────────────────

@app.post("/admin/api/login")
async def admin_login(request: Request):
    """Validate admin credentials and return a JWT token."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    username = str(body.get("username", "")).strip()
    password = str(body.get("password", "")).strip()

    # Constant-time comparison to prevent timing attacks
    username_ok = secrets.compare_digest(username, ADMIN_USERNAME)
    password_ok = secrets.compare_digest(password, ADMIN_PASSWORD)

    if not (username_ok and password_ok):
        logger.warning(f"[Admin] Failed login attempt from {request.client.host if request.client else 'unknown'}")
        raise HTTPException(status_code=401, detail="Invalid Username or Password")

    token = _create_admin_token()
    logger.info(f"[Admin] Successful login from {request.client.host if request.client else 'unknown'}")
    return {"token": token, "expires_in_hours": ADMIN_JWT_EXPIRE_HOURS}


# ── Dashboard Stats ──────────────────────────────────────────────────────────

@app.get("/admin/api/stats")
async def admin_stats(request: Request, _=Depends(_verify_admin_token)):
    """Return dashboard statistics."""
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    from datetime import date
    from sqlalchemy import func as sqlfunc
    from models import InnovationSubmission, TeamRegistration, EventRegistration, UpcomingEvent

    db = SessionLocal()
    try:
        today = date.today()

        try:
            total_submissions = db.query(sqlfunc.count(InnovationSubmission.id)).scalar() or 0
        except Exception as e:
            logger.warning(f"[stats] InnovationSubmission count failed: {e}")
            total_submissions = 0

        try:
            team_regs = db.query(sqlfunc.count(TeamRegistration.id)).scalar() or 0
            event_regs = db.query(sqlfunc.count(EventRegistration.id)).scalar() or 0
            total_registrations = team_regs + event_regs
        except Exception as e:
            logger.warning(f"[stats] Total registrations count failed: {e}")
            total_registrations = 0

        try:
            today_submissions = db.query(sqlfunc.count(InnovationSubmission.id)).filter(
                sqlfunc.date(InnovationSubmission.submitted_at) == today
            ).scalar() or 0
        except Exception as e:
            logger.warning(f"[stats] today_submissions failed: {e}")
            today_submissions = 0

        try:
            today_team_regs = db.query(sqlfunc.count(TeamRegistration.id)).filter(
                sqlfunc.date(TeamRegistration.created_at) == today
            ).scalar() or 0
            today_event_regs = db.query(sqlfunc.count(EventRegistration.id)).filter(
                sqlfunc.date(EventRegistration.created_at) == today
            ).scalar() or 0
            today_registrations = today_team_regs + today_event_regs
        except Exception as e:
            logger.warning(f"[stats] today_registrations failed: {e}")
            today_registrations = 0

        try:
            recent_subs = db.query(InnovationSubmission).order_by(
                InnovationSubmission.submitted_at.desc()
            ).limit(5).all()
        except Exception as e:
            logger.warning(f"[stats] recent_subs failed: {e}")
            recent_subs = []

        try:
            recent_team = db.query(TeamRegistration).order_by(TeamRegistration.created_at.desc()).limit(5).all()
            recent_event = db.query(EventRegistration).order_by(EventRegistration.created_at.desc()).limit(5).all()
            
            combined_regs = []
            for r in recent_team:
                combined_regs.append({
                    "id": f"team-{r.id}",
                    "full_name": r.leader_name or r.team_name,
                    "email": r.leader_email,
                    "event_id": r.event_id,
                    "created_at": r.created_at
                })
            for r in recent_event:
                combined_regs.append({
                    "id": f"event-{r.id}",
                    "full_name": r.full_name,
                    "email": r.email,
                    "event_id": r.event_id,
                    "created_at": r.created_at
                })
            
            # Sort combined array descending by created_at
            combined_regs.sort(key=lambda x: x["created_at"] if x["created_at"] else datetime.min, reverse=True)
            recent_regs = combined_regs[:5]

        except Exception as e:
            logger.warning(f"[stats] recent_regs failed: {e}")
            recent_regs = []

        # Bug Hunt specific stats — find by title, fall back to all team regs
        try:
            from sqlalchemy import or_ as sql_or_
            bh_event = db.query(UpcomingEvent).filter(
                sql_or_(
                    UpcomingEvent.title.ilike("%Bug Hunt%"),
                    UpcomingEvent.title.ilike("%bug hunt%"),
                )
            ).first()
            if bh_event:
                bh_registered = db.query(TeamRegistration).filter(TeamRegistration.event_id == bh_event.id).count()
            else:
                bh_registered = db.query(TeamRegistration).count()
            bh_remaining = max(0, 30 - bh_registered)
        except Exception as e:
            logger.warning(f"[stats] bug hunt stats failed: {e}")
            bh_registered = 0
            bh_remaining = 30

        return {
            "total_submissions"        : total_submissions,
            "total_registrations"      : total_registrations,
            "today_submissions"        : today_submissions,
            "today_registrations"      : today_registrations,
            "bug_hunt_registrations"   : bh_registered,
            "bug_hunt_remaining_seats" : bh_remaining,
            "recent_submissions"  : [
                {
                    "id"         : s.id,
                    "full_name"  : s.full_name,
                    "idea_title" : s.idea_title,
                    "department" : s.department,
                    "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
                }
                for s in recent_subs
            ],
            "recent_registrations": [
                {
                    "id"         : r["id"],
                    "full_name"  : r["full_name"],
                    "email"      : r["email"],
                    "event_id"   : r["event_id"],
                    "created_at" : r["created_at"].isoformat() if r["created_at"] else None,
                }
                for r in recent_regs
            ],
        }
    except Exception as e:
        logger.error(f"[admin_stats] Unexpected error: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": f"Stats query failed: {str(e)}"},
            headers={"Access-Control-Allow-Origin": "*"},
        )
    finally:
        db.close()


# ── Innovation Box Submissions ────────────────────────────────────────────────

@app.get("/admin/api/submissions")
async def admin_list_submissions(
    request: Request,
    page: int = 1,
    limit: int = 20,
    search: str = "",
    department: str = "",
    date_from: str = "",
    date_to: str = "",
    _=Depends(_verify_admin_token),
):
    """List all submissions with search, filter, and pagination."""
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    from models import InnovationSubmission
    from sqlalchemy import or_

    db = SessionLocal()
    try:
        q = db.query(InnovationSubmission)

        if search:
            s = f"%{search}%"
            # Exclude nullable mobile column to avoid ilike errors on NULL values
            q = q.filter(or_(
                InnovationSubmission.full_name.ilike(s),
                InnovationSubmission.email.ilike(s),
                InnovationSubmission.idea_title.ilike(s),
                InnovationSubmission.department.ilike(s),
            ))

        if department:
            q = q.filter(InnovationSubmission.department.ilike(f"%{department}%"))

        if date_from:
            try:
                from datetime import datetime as dt
                q = q.filter(InnovationSubmission.submitted_at >= dt.fromisoformat(date_from))
            except ValueError:
                pass

        if date_to:
            try:
                from datetime import datetime as dt
                q = q.filter(InnovationSubmission.submitted_at <= dt.fromisoformat(date_to + "T23:59:59"))
            except ValueError:
                pass

        try:
            total = q.count()
        except Exception as e:
            logger.warning(f"[submissions] count failed: {e}")
            total = 0

        try:
            items = q.order_by(InnovationSubmission.submitted_at.desc()).offset((page - 1) * limit).limit(limit).all()
        except Exception as e:
            logger.warning(f"[submissions] query failed: {e}")
            items = []

        def _ts(s):
            for attr in ('submitted_at', 'created_at', 'submission_date'):
                v = getattr(s, attr, None)
                if v:
                    return v.isoformat()
            return None

        return {
            "total": total,
            "page" : page,
            "limit": limit,
            "pages": (total + limit - 1) // limit if total else 0,
            "items": [
                {
                    "id"              : s.id,
                    "full_name"       : s.full_name,
                    "email"           : s.email,
                    "mobile"          : s.mobile,
                    "department"      : s.department,
                    "year"            : s.year,
                    "category"        : s.category,
                    "idea_title"      : s.idea_title,
                    "idea_description": s.idea_description,
                    "expected_outcome": getattr(s, 'expected_outcome', None),
                    "attachment_name" : s.attachment_name,
                    "attachment_type" : s.attachment_type,
                    "attachment_url"  : s.attachment_url,
                    "ip_address"      : s.ip_address,
                    "idea_id"         : getattr(s, 'idea_id', None) or f"#{s.id}",
                    "status"          : getattr(s, 'status', 'Pending Review') or 'Pending Review',
                    "admin_remarks"   : getattr(s, 'admin_remarks', None),
                    "submitted_at"    : _ts(s),
                }
                for s in items
            ],
        }
    except Exception as e:
        logger.error(f"[admin_list_submissions] Unexpected error: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": f"Submissions query failed: {str(e)}"},
            headers={"Access-Control-Allow-Origin": "*"},
        )
    finally:
        db.close()


@app.get("/admin/api/submissions/export")
async def admin_export_submissions(request: Request, _=Depends(_verify_admin_token)):
    """Export all submissions as CSV."""
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    from models import InnovationSubmission
    db = SessionLocal()
    try:
        items = db.query(InnovationSubmission).order_by(InnovationSubmission.submitted_at.desc()).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Full Name", "Email", "Mobile", "Department", "Year",
                         "Category", "Idea Title", "Idea Description", "Expected Outcome",
                         "Attachment", "IP Address", "Submitted At"])
        for s in items:
            writer.writerow([
                s.id, s.full_name, s.email, s.mobile or "",
                s.department, s.year, s.category, s.idea_title,
                s.idea_description, s.expected_outcome or "",
                s.attachment_name or "", s.ip_address or "",
                s.submitted_at.isoformat() if s.submitted_at else "",
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=submissions.csv"},
        )
    finally:
        db.close()


@app.get("/admin/api/submissions/{submission_id}")
async def admin_get_submission(submission_id: int, request: Request, _=Depends(_verify_admin_token)):
    """Get a single submission by ID."""
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    from models import InnovationSubmission
    db = SessionLocal()
    try:
        s = db.query(InnovationSubmission).filter(InnovationSubmission.id == submission_id).first()
        if not s:
            raise HTTPException(status_code=404, detail="Submission not found")
        return {
            "id"              : s.id,
            "full_name"       : s.full_name,
            "email"           : s.email,
            "mobile"          : s.mobile,
            "department"      : s.department,
            "year"            : s.year,
            "category"        : s.category,
            "idea_title"      : s.idea_title,
            "idea_description": s.idea_description,
            "expected_outcome": s.expected_outcome,
            "attachment_name" : s.attachment_name,
            "attachment_type" : s.attachment_type,
            "attachment_url"  : s.attachment_url,
            "ip_address"      : s.ip_address,
            "user_agent"      : s.user_agent,
            "form_data"       : s.form_data,
            "idea_id"         : getattr(s, 'idea_id', f"#{s.id}"),
            "status"          : getattr(s, 'status', "Pending Review"),
            "admin_remarks"   : getattr(s, 'admin_remarks', None),
            "submitted_at"    : s.submitted_at.isoformat() if s.submitted_at else None,
        }
    finally:
        db.close()


@app.delete("/admin/api/submissions/{submission_id}")
async def admin_delete_submission(submission_id: int, request: Request, _=Depends(_verify_admin_token)):
    """Delete a submission by ID."""
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    db = SessionLocal()
    try:
        deleted = crud.delete_innovation(db, submission_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Submission not found")
        logger.info(f"[Admin] Submission #{submission_id} deleted")
        return {"success": True, "message": f"Submission #{submission_id} deleted."}
    finally:
        db.close()


@app.patch("/admin/api/submissions/{submission_id}")
async def admin_update_submission(submission_id: int, request: Request, _=Depends(_verify_admin_token)):
    """Update a submission's status and remarks."""
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    body = await request.json()
    new_status = body.get("status")
    remarks = body.get("admin_remarks")

    from models import InnovationSubmission
    db = SessionLocal()
    try:
        s = db.query(InnovationSubmission).filter(InnovationSubmission.id == submission_id).first()
        if not s:
            raise HTTPException(status_code=404, detail="Submission not found")
            
        if new_status is not None:
            s.status = new_status
        if remarks is not None:
            s.admin_remarks = remarks
            
        db.commit()
        return {"success": True, "status": s.status, "admin_remarks": s.admin_remarks}
    finally:
        db.close()


# ── Event Registrations ───────────────────────────────────────────────────────

@app.get("/admin/api/registrations")
async def admin_list_registrations(
    request: Request,
    page: int = 1,
    limit: int = 20,
    search: str = "",
    event_id: int = 0,
    _=Depends(_verify_admin_token),
):
    """List all registrations with search, filter, and pagination."""
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    from models import EventRegistration, UpcomingEvent
    from sqlalchemy import or_

    db = SessionLocal()
    try:
        q = db.query(EventRegistration)

        if search:
            s = f"%{search}%"
            q = q.filter(or_(
                EventRegistration.full_name.ilike(s),
                EventRegistration.email.ilike(s),
                EventRegistration.mobile.ilike(s),
                EventRegistration.department.ilike(s),
            ))

        if event_id:
            q = q.filter(EventRegistration.event_id == event_id)

        total = q.count()
        items = q.order_by(EventRegistration.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

        # Get event titles
        event_ids = list({r.event_id for r in items})
        events_map = {}
        if event_ids:
            events = db.query(UpcomingEvent).filter(UpcomingEvent.id.in_(event_ids)).all()
            events_map = {e.id: e.title for e in events}

        return {
            "total": total,
            "page" : page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
            "items": [
                {
                    "id"         : r.id,
                    "event_id"   : r.event_id,
                    "event_title": events_map.get(r.event_id, f"Event #{r.event_id}"),
                    "full_name"  : r.full_name,
                    "email"      : r.email,
                    "mobile"     : r.mobile,
                    "department" : r.department,
                    "year"       : r.year,
                    "created_at" : r.created_at.isoformat() if r.created_at else None,
                }
                for r in items
            ],
        }
    finally:
        db.close()


@app.get("/admin/api/registrations/export")
async def admin_export_registrations(request: Request, _=Depends(_verify_admin_token)):
    """Export all registrations as CSV."""
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    from models import EventRegistration
    db = SessionLocal()
    try:
        items = db.query(EventRegistration).order_by(EventRegistration.created_at.desc()).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Event ID", "Full Name", "Email", "Mobile", "Department", "Year", "Registered At"])
        for r in items:
            writer.writerow([
                r.id, r.event_id, r.full_name, r.email,
                r.mobile or "", r.department or "", r.year or "",
                r.created_at.isoformat() if r.created_at else "",
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=registrations.csv"},
        )
    finally:
        db.close()


@app.get("/admin/api/registrations/{registration_id}")
async def admin_get_registration(registration_id: int, request: Request, _=Depends(_verify_admin_token)):
    """Get a single registration by ID."""
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    from models import EventRegistration, UpcomingEvent
    db = SessionLocal()
    try:
        r = db.query(EventRegistration).filter(EventRegistration.id == registration_id).first()
        if not r:
            raise HTTPException(status_code=404, detail="Registration not found")
        event = db.query(UpcomingEvent).filter(UpcomingEvent.id == r.event_id).first()
        return {
            "id"          : r.id,
            "event_id"    : r.event_id,
            "event_title" : event.title if event else f"Event #{r.event_id}",
            "full_name"   : r.full_name,
            "email"       : r.email,
            "mobile"      : r.mobile,
            "department"  : r.department,
            "year"        : r.year,
            "created_at"  : r.created_at.isoformat() if r.created_at else None,
        }
    finally:
        db.close()


@app.delete("/admin/api/registrations/{registration_id}")
async def admin_delete_registration(registration_id: int, request: Request, _=Depends(_verify_admin_token)):
    """Delete a registration by ID."""
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    db = SessionLocal()
    try:
        deleted = crud.delete_registration(db, registration_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Registration not found")
        logger.info(f"[Admin] Registration #{registration_id} deleted")
        return {"success": True, "message": f"Registration #{registration_id} deleted."}
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════════════════════
#  Startup Event
# ═══════════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup_validation():
    logger.info("=" * 60)
    logger.info("  ACES Backend v6.0 — Startup")
    logger.info("=" * 60)

    # Explicitly check for innovation_box_submissions and create if missing
    if engine:
        inspector = inspect(engine)
        if not inspector.has_table("innovation_box_submissions"):
            logger.info("[DB] Table 'innovation_box_submissions' missing. Creating it now...")
            InnovationSubmission.__table__.create(bind=engine)
            logger.info("[DB] Table 'innovation_box_submissions' created successfully.")
        else:
            logger.info("[DB] Table 'innovation_box_submissions' exists. Checking columns...")
            columns = [col["name"] for col in inspector.get_columns("innovation_box_submissions")]
            if "submitted_at" not in columns:
                logger.info("[DB] 'submitted_at' column is missing. Adding it...")
                try:
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE innovation_box_submissions ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"))
                    logger.info("[DB] 'submitted_at' column added successfully.")
                except Exception as e:
                    logger.error(f"[DB] Failed to add 'submitted_at' column: {e}")
            if "created_at" not in columns:
                logger.info("[DB] 'created_at' column is missing. Adding it...")
                try:
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE innovation_box_submissions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"))
                    logger.info("[DB] 'created_at' column added successfully.")
                except Exception as e:
                    logger.error(f"[DB] Failed to add 'created_at' column: {e}")
            
            # Innovation Box Optimization Columns
            inn_migrations = [
                ("idea_id",       "VARCHAR(50) UNIQUE"),
                ("status",        "VARCHAR(50) DEFAULT 'Pending Review'"),
                ("admin_remarks", "TEXT"),
            ]
            try:
                with engine.begin() as conn:
                    for col_name, col_def in inn_migrations:
                        if col_name not in columns:
                            logger.info(f"[DB] Adding column '{col_name}' to innovation_box_submissions...")
                            conn.execute(text(f"ALTER TABLE innovation_box_submissions ADD COLUMN {col_name} {col_def}"))
            except Exception as e:
                logger.error(f"[DB] Failed to migrate 'innovation_box_submissions' columns: {e}")

        # Ensure upcoming_events has the new dynamic configuration columns
        if inspector.has_table("upcoming_events"):
            logger.info("[DB] Table 'upcoming_events' exists. Checking columns for dynamic configuration...")
            columns = [col["name"] for col in inspector.get_columns("upcoming_events")]
            try:
                with engine.begin() as conn:
                    if "max_teams" not in columns:
                        logger.info("[DB] 'max_teams' column missing. Adding it...")
                        conn.execute(text("ALTER TABLE upcoming_events ADD COLUMN max_teams INTEGER DEFAULT 0"))
                    if "team_size" not in columns:
                        logger.info("[DB] 'team_size' column missing. Adding it...")
                        conn.execute(text("ALTER TABLE upcoming_events ADD COLUMN team_size INTEGER DEFAULT 1"))
                    if "is_registration_open" not in columns:
                        logger.info("[DB] 'is_registration_open' column missing. Adding it...")
                        conn.execute(text("ALTER TABLE upcoming_events ADD COLUMN is_registration_open BOOLEAN DEFAULT TRUE"))
            except Exception as e:
                logger.error(f"[DB] Failed to migrate 'upcoming_events': {e}")

        # Migrate payment columns in team_registrations
        if inspector.has_table("team_registrations"):
            team_cols = [col["name"] for col in inspector.get_columns("team_registrations")]
            payment_migrations = [
                ("registration_fee",    "VARCHAR(20) DEFAULT '\u20b940'"),
                ("payment_status",      "VARCHAR(50) DEFAULT 'pending'"),
                ("transaction_id",      "VARCHAR(255)"),
                ("payment_screenshot",  "TEXT"),
                ("payment_time",        "TIMESTAMP WITH TIME ZONE"),
                ("payment_verified_at", "TIMESTAMP WITH TIME ZONE"),
                ("payment_verified_by", "VARCHAR(255)"),
                ("approval_status",     "VARCHAR(50) DEFAULT 'pending'"),
                ("approval_date",       "TIMESTAMP WITH TIME ZONE"),
                ("approved_by",         "VARCHAR(255)"),
                ("rejection_reason",    "TEXT"),
            ]
            try:
                with engine.begin() as conn:
                    for col_name, col_def in payment_migrations:
                        if col_name not in team_cols:
                            logger.info(f"[DB] Adding column '{col_name}' to team_registrations...")
                            conn.execute(text(f"ALTER TABLE team_registrations ADD COLUMN {col_name} {col_def}"))
            except Exception as e:
                logger.error(f"[DB] Failed to migrate 'team_registrations' payment columns: {e}")

    # Create other tables (including team_registrations)
    create_tables()

    # Migrate existing max_teams for Bug Hunt
    try:
        with engine.begin() as conn:
            conn.execute(text("UPDATE upcoming_events SET max_teams = 31 WHERE title LIKE '%Bug Hunt%'"))
            logger.info("[DB] Ensured Bug Hunt max_teams is 31")
    except Exception as e:
        logger.error(f"[DB] Failed to update max_teams: {e}")

    # ── Auto-seed Bug Hunt event if the upcoming_events table is empty ──
    try:
        seed_db = SessionLocal()
        if seed_db:
            existing_count = seed_db.query(__import__('models').UpcomingEvent).count()
            if existing_count == 0:
                logger.info("[DB] No events found. Seeding Bug Hunt event...")
                from datetime import datetime
                bug_hunt = __import__('models').UpcomingEvent(
                    title="🐞 Bug Hunt: Debug the Web",
                    description="Participants receive a website containing HTML, CSS, and JavaScript bugs. They must fix broken layouts, resolve JavaScript errors, improve responsiveness, and optimize performance. Winner = Maximum bugs fixed in the least amount of time.",
                    event_date=datetime.now(),
                    event_time="TBD",
                    venue="TBD",
                    is_registration_open=True,
                    max_teams=31,
                    team_size=2,
                    status="upcoming",
                )
                seed_db.add(bug_hunt)
                seed_db.commit()
                logger.info(f"[DB] Bug Hunt event seeded successfully with id={bug_hunt.id}")
            else:
                logger.info(f"[DB] {existing_count} event(s) already exist. Skipping seed.")
            seed_db.close()
    except Exception as e:
        logger.error(f"[DB] Failed to seed Bug Hunt event: {e}")

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
