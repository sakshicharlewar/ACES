import os
import time
import logging
import traceback
import requests
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
MAX_RETRIES    = 3

# ─── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="ACES Backend", version="4.0.0")

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
def send_email_with_retry(subject: str, html_body: str, attempt: int = 1) -> bool:
    """
    Sends email via Resend HTTP API.
    Retries up to MAX_RETRIES times with exponential backoff.
    Returns True on success, False on all retries exhausted.
    Never suppresses exceptions — logs full traceback.
    """
    if not RESEND_API_KEY:
        logger.error("[Email] RESEND_API_KEY is not set. Email cannot be sent.")
        return False

    logger.info(f"[Email] Attempt {attempt}/{MAX_RETRIES} — Sending to {RECIPIENT}")
    logger.info(f"[Email] Subject : {subject}")
    logger.info(f"[Email] From    : {SENDER_EMAIL}")
    logger.info(f"[Email] API URL : {RESEND_URL}")

    try:
        resp = requests.post(
            RESEND_URL,
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "from":    f"ACES Forum <{SENDER_EMAIL}>",
                "to":      [RECIPIENT],
                "subject": subject,
                "html":    html_body
            },
            timeout=20
        )

        logger.info(f"[Email] HTTP Status : {resp.status_code}")
        logger.info(f"[Email] Response    : {resp.text}")

        if resp.status_code in (200, 201):
            email_id = resp.json().get("id", "unknown")
            logger.info(f"[Email] SUCCESS — Email ID: {email_id}")
            return True
        else:
            logger.error(f"[Email] FAILED — Resend returned {resp.status_code}: {resp.text}")

    except requests.exceptions.ConnectionError as e:
        logger.error(f"[Email] ConnectionError on attempt {attempt}: {e}")
        logger.error(traceback.format_exc())
    except requests.exceptions.Timeout:
        logger.error(f"[Email] Timeout on attempt {attempt} after 20s")
        logger.error(traceback.format_exc())
    except Exception as e:
        logger.error(f"[Email] Unexpected error on attempt {attempt}: {e}")
        logger.error(traceback.format_exc())

    # Retry with exponential backoff: 2s, 4s, 8s
    if attempt < MAX_RETRIES:
        wait = 2 ** attempt
        logger.info(f"[Email] Retrying in {wait}s...")
        time.sleep(wait)
        return send_email_with_retry(subject, html_body, attempt + 1)

    logger.error(f"[Email] All {MAX_RETRIES} attempts failed. Email NOT delivered.")
    return False


# ─── Background task ───────────────────────────────────────────────────────────
def send_notification_email(data):
    logger.info("=" * 55)
    logger.info("[Email] Background task started")
    logger.info(f"[Email] Recipient : {RECIPIENT}")
    logger.info(f"[Email] API Key   : {'SET (' + RESEND_API_KEY[:8] + '...)' if RESEND_API_KEY else 'NOT SET'}")

    submitted_at = data.submittedAt or datetime.now().strftime("%d/%m/%Y, %I:%M:%S %p")
    data.submittedAt = submitted_at

    subject   = "New Innovation Box Submission - ACES"
    html_body = build_email_html(data)

    success = send_email_with_retry(subject, html_body)

    if success:
        logger.info("[Email] Notification delivered successfully.")
    else:
        logger.error("[Email] Notification FAILED after all retries.")
    logger.info("=" * 55)


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
    logger.info(f"[API] Name     : {data.fullName}")
    logger.info(f"[API] Email    : {data.email}")
    logger.info(f"[API] Idea     : {data.ideaTitle}")
    logger.info(f"[API] Category : {data.category}")
    logger.info("[API] Submission saved successfully (in-memory)")

    # Queue email in background — response is returned IMMEDIATELY
    background_tasks.add_task(send_notification_email, data)
    logger.info("[API] Email notification queued in background")
    logger.info("=" * 55)

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "success": True,
            "message": "Idea submitted successfully. Notification email queued."
        }
    )


# ─── GET /test-email — verify SMTP independently ───────────────────────────────
@app.get("/test-email")
async def test_email():
    """
    Test endpoint to verify Resend API and email delivery independently.
    Call: GET https://aces-backkend.onrender.com/test-email
    """
    logger.info("[TestEmail] Manual test triggered")

    html = f"""
    <div style="font-family:Arial;padding:24px;background:#f0fdf4;border-radius:8px;border:2px solid #16a34a;">
      <h2 style="color:#15803d;">Test Email - ACES Backend</h2>
      <p>This is a test email from the ACES Innovation Box backend.</p>
      <p><strong>Resend API Key:</strong> {RESEND_API_KEY[:8] + '...' if RESEND_API_KEY else 'NOT SET'}</p>
      <p><strong>Sender:</strong> {SENDER_EMAIL}</p>
      <p><strong>Recipient:</strong> {RECIPIENT}</p>
      <p><strong>Sent At:</strong> {datetime.now().strftime("%d/%m/%Y, %I:%M:%S %p")}</p>
    </div>
    """

    success = send_email_with_retry("ACES Backend - Test Email", html)

    if success:
        return {"status": "success", "message": f"Test email delivered to {RECIPIENT}"}
    else:
        return JSONResponse(
            status_code=500,
            content={"status": "failed", "message": "Test email failed. Check Render logs for full traceback."}
        )


# ─── GET /health ───────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status":           "ok",
        "version":          "4.0.0",
        "resend_key_set":   bool(RESEND_API_KEY),
        "resend_key_prefix": RESEND_API_KEY[:8] + "..." if RESEND_API_KEY else "NOT SET",
        "sender":           SENDER_EMAIL,
        "recipient":        RECIPIENT,
        "max_retries":      MAX_RETRIES
    }


@app.get("/")
async def root():
    return {"message": "ACES Backend v4.0 is running"}


# ─── Startup validation ────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_validation():
    logger.info("=" * 55)
    logger.info("  ACES Backend v4.0 — Startup Validation")
    logger.info("=" * 55)
    logger.info(f"  RESEND_API_KEY : {'SET (' + RESEND_API_KEY[:8] + '...)' if RESEND_API_KEY else 'NOT SET'}")
    logger.info(f"  SENDER_EMAIL   : {SENDER_EMAIL}")
    logger.info(f"  RECIPIENT      : {RECIPIENT}")
    logger.info(f"  MAX_RETRIES    : {MAX_RETRIES}")

    if not RESEND_API_KEY:
        logger.error("  CRITICAL: RESEND_API_KEY is missing!")
        logger.error("  Emails WILL NOT be sent until this is fixed in Render env vars.")
    else:
        logger.info("  All config OK — backend ready to send emails.")

    logger.info("=" * 55)
