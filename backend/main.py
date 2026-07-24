import os
import smtplib
from email.message import EmailMessage
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow requests from the local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InnovationSubmission(BaseModel):
    fullName: str
    email: str
    mobile: str = ""
    department: str
    year: str
    category: str
    ideaTitle: str
    ideaDescription: str
    expectedOutcome: str = ""
    submittedAt: str

@app.post("/api/submit-innovation")
async def submit_innovation(data: InnovationSubmission):
    try:
        # SMTP Configuration
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_user = os.getenv("SMTP_USERNAME")
        smtp_pass = os.getenv("SMTP_PASSWORD")

        # The recipient
        recipient_email = "acescomputer0101@gmail.com"

        # Construct Email Body matching the exact requested format
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
        msg['Subject'] = "🚀 New Innovation Box Submission"
        msg['From'] = smtp_user
        msg['To'] = recipient_email

        if not smtp_user or not smtp_pass:
            print("Warning: SMTP credentials not set. Email not actually sent.")
            return {"status": "success", "message": "Simulated email send (no credentials)"}

        # Send the email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            
        print(f"Successfully sent email to {recipient_email}")
        
    except Exception as e:
        # "If the email fails to send... Log the email error. Still return a successful response."
        print(f"Error sending email: {e}")
        
    return {"status": "success", "message": "Submission processed"}
