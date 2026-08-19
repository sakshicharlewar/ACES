import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
from config import settings
import logging

logger = logging.getLogger(__name__)

def _send_email_sync(to_email: str, subject: str, html_body: str):
    if not settings.SMTP_SERVER or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. Skipping email.")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(html_body, 'html'))
        
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

async def send_email_async(to_email: str, subject: str, html_body: str):
    return await asyncio.to_thread(_send_email_sync, to_email, subject, html_body)

async def notify_admin_new_registration(event_title: str, leader_name: str, leader_email: str):
    subject = f"New Registration for {event_title}"
    body = f"<p>A new registration has been received.</p><p><strong>Event:</strong> {event_title}</p><p><strong>Leader Name:</strong> {leader_name}</p><p><strong>Email:</strong> {leader_email}</p><p>Please check the admin panel for more details.</p>"
    await send_email_async(settings.ACES_OFFICIAL_EMAIL, subject, body)

async def notify_admin_new_idea(idea_title: str, student_name: str):
    subject = f"New Idea Submission: {idea_title}"
    body = f"<p>A new idea has been submitted.</p><p><strong>Title:</strong> {idea_title}</p><p><strong>Submitted by:</strong> {student_name}</p><p>Please check the admin panel for details.</p>"
    await send_email_async(settings.ACES_OFFICIAL_EMAIL, subject, body)

async def notify_user_registration_approved(to_email: str, leader_name: str, event_title: str):
    subject = f"Registration Approved: {event_title}"
    body = f"<p>Dear {leader_name},</p><p>Your registration for <strong>{event_title}</strong> has been successfully approved by the ACES Committee.</p><p>Best Regards,<br>ACES Team</p>"
    await send_email_async(to_email, subject, body)
