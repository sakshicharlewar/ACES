import os
import smtplib
import logging
from datetime import datetime
from email.message import EmailMessage
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

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT   = int(os.getenv("SMTP_PORT", 587))
SMTP_USER   = os.getenv("SMTP_USERNAME", "")
SMTP_PASS   = os.getenv("SMTP_PASSWORD", "").replace(" ", "")  # strip spaces
RECIPIENT   = "acescomputer0101@gmail.com"

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="ACES Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Startup: verify SMTP credentials ─────────────────────────────────────────
@app.on_event("startup")
async def verify_smtp():
    logger.info("=== ACES Backend Starting ===")
    logger.info(f"SMTP_SERVER   : {SMTP_SERVER}")
    logger.info(f"SMTP_PORT     : {SMTP_PORT}")
    logger.info(f"SMTP_USER     : {SMTP_USER}")
    logger.info(f"SMTP_PASS set : {'YES' if SMTP_PASS else 'NO ⚠️'}")
    logger.info(f"RECIPIENT     : {RECIPIENT}")

    if not SMTP_USER or not SMTP_PASS:
        logger.warning("⚠️  SMTP credentials not set. Emails will NOT be sent.")
        return

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
        logger.info("✅ SMTP login verified at startup.")
    except Exception as e:
        logger.error(f"❌ SMTP startup check FAILED: {e}")

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

# ─── Background email sender ───────────────────────────────────────────────────
def send_notification_email(data: InnovationSubmission):
    submitted_at = data.submittedAt or datetime.now().strftime("%d/%m/%Y, %I:%M:%S %p")

    body = f"""A new Innovation Box submission has been received.

════════════════════════════════════════════
       🚀 ACES INNOVATION BOX SUBMISSION
════════════════════════════════════════════

📋 IDEA DETAILS
────────────────────────────────────────────
Idea Category    : {data.category}
Idea Title       : {data.ideaTitle}

Idea Description :
{data.ideaDescription}

Expected Outcome :
{data.expectedOutcome}

════════════════════════════════════════════
👤 SUBMITTER DETAILS
────────────────────────────────────────────
Full Name        : {data.fullName}
Email            : {data.email}
Mobile           : {data.mobile}
Department       : {data.department}
Year             : {data.year}

════════════════════════════════════════════
🕒 Submitted At  : {submitted_at}
════════════════════════════════════════════

This is an automated notification from the ACES website.
"""

    logger.info(f"[Email] Preparing to send to {RECIPIENT}...")

    if not SMTP_USER or not SMTP_PASS:
        logger.warning("[Email] ⚠️  SMTP credentials missing – email NOT sent.")
        return

    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg["Subject"] = "🚀 New Innovation Box Submission"
        msg["From"]    = f"ACES Forum <{SMTP_USER}>"
        msg["To"]      = RECIPIENT

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)

        logger.info(f"[Email] ✅ Successfully sent to {RECIPIENT}")

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"[Email] ❌ Authentication failed – check SMTP_USERNAME/SMTP_PASSWORD: {e}")
    except smtplib.SMTPConnectError as e:
        logger.error(f"[Email] ❌ Could not connect to SMTP server: {e}")
    except smtplib.SMTPException as e:
        logger.error(f"[Email] ❌ SMTP error: {e}")
    except Exception as e:
        logger.error(f"[Email] ❌ Unexpected error: {e}")

# ─── POST /api/submit-innovation ──────────────────────────────────────────────
@app.post("/api/submit-innovation", status_code=status.HTTP_201_CREATED)
async def submit_innovation(data: InnovationSubmission, background_tasks: BackgroundTasks):
    """
    Receives idea submission, queues email in background,
    returns 201 immediately without waiting for email delivery.
    """
    logger.info(f"[API] New submission received from: {data.email} | Idea: {data.ideaTitle}")

    # Queue email – runs AFTER response is sent, never blocks the client
    background_tasks.add_task(send_notification_email, data)

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={"success": True, "message": "Idea submitted successfully"}
    )

# ─── Health check (keep-alive / Render warm-up) ───────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "smtp_user": SMTP_USER,
        "smtp_pass_set": bool(SMTP_PASS),
        "recipient": RECIPIENT
    }

# ─── Root ─────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "ACES Backend is running ✅"}
