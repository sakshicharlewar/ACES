import os
import logging
import requests
from datetime import datetime
from fastapi import FastAPI, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# ─── Load env ─────────────────────────────────────────────────────────────────
load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
SENDER_EMAIL   = os.getenv("SENDER_EMAIL", "onboarding@resend.dev")   # your verified sender
RECIPIENT      = "acescomputer0101@gmail.com"

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="ACES Backend", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Startup log ──────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    logger.info("=== ACES Backend v3.0 Starting ===")
    logger.info(f"RESEND_API_KEY set : {'YES ✅' if RESEND_API_KEY else 'NO ⚠️  – emails will NOT send'}")
    logger.info(f"SENDER_EMAIL       : {SENDER_EMAIL}")
    logger.info(f"RECIPIENT          : {RECIPIENT}")

# ─── Schema ───────────────────────────────────────────────────────────────────
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

# ─── Background email via Resend HTTP API (port 443 – never blocked) ──────────
def send_notification_email(data: InnovationSubmission):
    if not RESEND_API_KEY:
        logger.warning("[Email] ⚠️  RESEND_API_KEY not set – skipping email.")
        return

    submitted_at = data.submittedAt or datetime.now().strftime("%d/%m/%Y, %I:%M:%S %p")

    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
      <div style="background:#1e3a8a;padding:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">🚀 New Innovation Box Submission</h1>
        <p style="color:#93c5fd;margin:4px 0 0;">ACES – Suryodaya College of Engineering &amp; Technology</p>
      </div>
      <div style="padding:24px;background:#f9fafb;">

        <h2 style="color:#1e3a8a;border-bottom:2px solid #dbeafe;padding-bottom:8px;">📋 Idea Details</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;color:#6b7280;width:40%;">Category</td><td style="padding:8px;font-weight:bold;">{data.category}</td></tr>
          <tr style="background:#eff6ff;"><td style="padding:8px;color:#6b7280;">Idea Title</td><td style="padding:8px;font-weight:bold;">{data.ideaTitle}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;">Description</td><td style="padding:8px;">{data.ideaDescription}</td></tr>
          <tr style="background:#eff6ff;"><td style="padding:8px;color:#6b7280;">Expected Outcome</td><td style="padding:8px;">{data.expectedOutcome}</td></tr>
        </table>

        <h2 style="color:#1e3a8a;border-bottom:2px solid #dbeafe;padding-bottom:8px;margin-top:24px;">👤 Submitter Details</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;color:#6b7280;width:40%;">Full Name</td><td style="padding:8px;">{data.fullName}</td></tr>
          <tr style="background:#eff6ff;"><td style="padding:8px;color:#6b7280;">Email</td><td style="padding:8px;">{data.email}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;">Mobile</td><td style="padding:8px;">{data.mobile}</td></tr>
          <tr style="background:#eff6ff;"><td style="padding:8px;color:#6b7280;">Department</td><td style="padding:8px;">{data.department}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;">Year</td><td style="padding:8px;">{data.year}</td></tr>
        </table>

        <p style="margin-top:24px;padding:12px;background:#dbeafe;border-radius:6px;color:#1e40af;">
          🕒 <strong>Submitted At:</strong> {submitted_at}
        </p>
      </div>
      <div style="background:#e5e7eb;padding:12px;text-align:center;font-size:12px;color:#6b7280;">
        This is an automated notification from the ACES Innovation Box.
      </div>
    </div>
    """

    logger.info(f"[Email] Sending to {RECIPIENT} via Resend API...")

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "from":    f"ACES Forum <{SENDER_EMAIL}>",
                "to":      [RECIPIENT],
                "subject": "🚀 New Innovation Box Submission",
                "html":    html_body
            },
            timeout=15
        )

        if response.status_code in (200, 201):
            logger.info(f"[Email] ✅ Sent successfully! ID: {response.json().get('id')}")
        else:
            logger.error(f"[Email] ❌ Resend API error {response.status_code}: {response.text}")

    except requests.exceptions.ConnectionError as e:
        logger.error(f"[Email] ❌ Connection error: {e}")
    except requests.exceptions.Timeout:
        logger.error("[Email] ❌ Request timed out after 15s")
    except Exception as e:
        logger.error(f"[Email] ❌ Unexpected error: {e}")


# ─── POST /api/submit-innovation ──────────────────────────────────────────────
@app.post("/api/submit-innovation", status_code=status.HTTP_201_CREATED)
async def submit_innovation(data: InnovationSubmission, background_tasks: BackgroundTasks):
    logger.info(f"[API] Submission from: {data.email} | '{data.ideaTitle}'")

    # Queue email in background — client gets 201 immediately
    background_tasks.add_task(send_notification_email, data)

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={"success": True, "message": "Idea submitted successfully"}
    )

# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status":           "ok",
        "resend_key_set":   bool(RESEND_API_KEY),
        "sender":           SENDER_EMAIL,
        "recipient":        RECIPIENT
    }

@app.get("/")
async def root():
    return {"message": "ACES Backend v3.0 ✅"}
