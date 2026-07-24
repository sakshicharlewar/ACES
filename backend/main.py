import os
import smtplib
import threading
from email.message import EmailMessage
from fastapi import FastAPI, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# ─── Load env once at startup, not per request ────────────────────────────────
load_dotenv()

SMTP_SERVER   = os.getenv("SMTP_SERVER",  "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", 587))
SMTP_USER     = os.getenv("SMTP_USERNAME")
SMTP_PASS     = os.getenv("SMTP_PASSWORD")
RECIPIENT     = "acescomputer0101@gmail.com"

# ─── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="ACES Backend", version="1.0.0")

# ─── CORS (single middleware, no redundant options) ────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    submittedAt:     str

# ─── Background email task (runs in thread pool, NEVER blocks the response) ───
def send_email_background(data: InnovationSubmission):
    """
    Runs in a background thread.
    Any exception here is logged but NEVER reaches the client.
    """
    try:
        if not SMTP_USER or not SMTP_PASS:
            print("[Email] ⚠️  SMTP credentials missing – skipping send.")
            return

        body = f"""A new Innovation Box submission has been received.

----------------------------------------
Full Name:
{data.fullName}

Email:
{data.email}

Mobile Number:
{data.mobile}

Department:
{data.department}

Year:
{data.year}

Idea Category:
{data.category}

Idea Title:
{data.ideaTitle}

Idea Description:
{data.ideaDescription}

Expected Outcome / Benefit:
{data.expectedOutcome}

Submitted At:
{data.submittedAt}
----------------------------------------"""

        msg = EmailMessage()
        msg.set_content(body)
        msg["Subject"] = "🚀 New Innovation Box Submission"
        msg["From"]    = SMTP_USER
        msg["To"]      = RECIPIENT

        # Use a short timeout so a hung SMTP server never blocks the thread
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)

        print(f"[Email] ✅ Sent successfully to {RECIPIENT}")

    except Exception as exc:
        # Log only – do NOT re-raise, the client already got 201
        print(f"[Email] ❌ Failed to send: {exc}")


# ─── POST /api/submit-innovation ──────────────────────────────────────────────
@app.post("/api/submit-innovation", status_code=status.HTTP_201_CREATED)
async def submit_innovation(data: InnovationSubmission, background_tasks: BackgroundTasks):
    """
    1. Validate payload  (Pydantic handles this automatically → 422 if invalid)
    2. Queue email in background thread  (non-blocking)
    3. Return 201 immediately – client never waits for email delivery
    """
    # Queue the slow email task in the background
    background_tasks.add_task(send_email_background, data)

    # Respond immediately – no await on email
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={"success": True, "message": "Idea submitted successfully"}
    )


# ─── Keep-alive endpoint (reduces Render cold-start effect) ───────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}
