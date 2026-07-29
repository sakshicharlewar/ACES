import logging
from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import (
    InnovationSubmission, UpcomingEvent, EventRegistration, TeamRegistration,
    ContactMessage, EmailQueue
)

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
#  Innovation Box Submissions
# ═══════════════════════════════════════════════════════════════════════════════

def create_innovation(db: Session, **kwargs) -> Optional[InnovationSubmission]:
    try:
        submission = InnovationSubmission(**kwargs)
        db.add(submission)
        db.commit()
        db.refresh(submission)
        logger.info(f"[CRUD] Innovation #{submission.id} saved — {submission.idea_title}")
        return submission
    except Exception as e:
        db.rollback()
        logger.error(f"[CRUD] Failed to save innovation: {e}")
        raise e

def get_innovation(db: Session, submission_id: int) -> Optional[InnovationSubmission]:
    try:
        return db.query(InnovationSubmission).filter(InnovationSubmission.id == submission_id).first()
    except Exception as e:
        logger.error(f"[CRUD] Failed to get innovation #{submission_id}: {e}")
        return None

def get_innovations(db: Session, skip: int = 0, limit: int = 100) -> List[InnovationSubmission]:
    try:
        return db.query(InnovationSubmission).order_by(desc(InnovationSubmission.submitted_at)).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"[CRUD] Failed to list innovations: {e}")
        return []

def delete_innovation(db: Session, submission_id: int) -> bool:
    try:
        row = db.query(InnovationSubmission).filter(InnovationSubmission.id == submission_id).first()
        if row:
            db.delete(row)
            db.commit()
            logger.info(f"[CRUD] Innovation #{submission_id} deleted.")
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"[CRUD] Failed to delete innovation #{submission_id}: {e}")
        return False


# ═══════════════════════════════════════════════════════════════════════════════
#  Upcoming Events
# ═══════════════════════════════════════════════════════════════════════════════

def create_event(db: Session, **kwargs) -> Optional[UpcomingEvent]:
    try:
        event = UpcomingEvent(**kwargs)
        db.add(event)
        db.commit()
        db.refresh(event)
        logger.info(f"[CRUD] Event #{event.id} created — {event.title}")
        return event
    except Exception as e:
        db.rollback()
        logger.error(f"[CRUD] Failed to create event: {e}")
        return None

def get_event(db: Session, event_id: int) -> Optional[UpcomingEvent]:
    try:
        return db.query(UpcomingEvent).filter(UpcomingEvent.id == event_id).first()
    except Exception as e:
        logger.error(f"[CRUD] Failed to get event #{event_id}: {e}")
        return None

def get_events(db: Session, skip: int = 0, limit: int = 50, status: Optional[str] = None) -> List[UpcomingEvent]:
    try:
        query = db.query(UpcomingEvent)
        if status:
            query = query.filter(UpcomingEvent.status == status)
        events = query.order_by(desc(UpcomingEvent.event_date)).offset(skip).limit(limit).all()
        for event in events:
            event.registered_teams_count = db.query(TeamRegistration).filter(TeamRegistration.event_id == event.id).count()
        return events
    except Exception as e:
        logger.error(f"[CRUD] Failed to list events: {e}")
        return []

def update_event(db: Session, event_id: int, **kwargs) -> Optional[UpcomingEvent]:
    try:
        event = db.query(UpcomingEvent).filter(UpcomingEvent.id == event_id).first()
        if not event:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(event, key):
                setattr(event, key, value)
        db.commit()
        db.refresh(event)
        logger.info(f"[CRUD] Event #{event_id} updated.")
        return event
    except Exception as e:
        db.rollback()
        logger.error(f"[CRUD] Failed to update event #{event_id}: {e}")
        return None

def delete_event(db: Session, event_id: int) -> bool:
    try:
        event = db.query(UpcomingEvent).filter(UpcomingEvent.id == event_id).first()
        if event:
            db.delete(event)
            db.commit()
            logger.info(f"[CRUD] Event #{event_id} deleted.")
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"[CRUD] Failed to delete event #{event_id}: {e}")
        return False


# ═══════════════════════════════════════════════════════════════════════════════
#  Event Registrations
# ═══════════════════════════════════════════════════════════════════════════════

def create_registration(db: Session, **kwargs) -> Optional[EventRegistration]:
    try:
        reg = EventRegistration(**kwargs)
        db.add(reg)
        db.commit()
        db.refresh(reg)
        logger.info(f"[CRUD] Registration #{reg.id} created for event #{reg.event_id}")
        return reg
    except Exception as e:
        db.rollback()
        logger.error(f"[CRUD] Failed to create registration: {e}")
        return None

def get_registration(db: Session, reg_id: int) -> Optional[EventRegistration]:
    try:
        return db.query(EventRegistration).filter(EventRegistration.id == reg_id).first()
    except Exception as e:
        logger.error(f"[CRUD] Failed to get registration #{reg_id}: {e}")
        return None

def get_registrations_for_event(db: Session, event_id: int) -> List[EventRegistration]:
    try:
        return db.query(EventRegistration).filter(EventRegistration.event_id == event_id).order_by(desc(EventRegistration.created_at)).all()
    except Exception as e:
        logger.error(f"[CRUD] Failed to list registrations for event #{event_id}: {e}")
        return []

def delete_registration(db: Session, reg_id: int) -> bool:
    try:
        reg = db.query(EventRegistration).filter(EventRegistration.id == reg_id).first()
        if reg:
            db.delete(reg)
            db.commit()
            logger.info(f"[CRUD] Registration #{reg_id} deleted.")
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"[CRUD] Failed to delete registration #{reg_id}: {e}")
        return False


# ═══════════════════════════════════════════════════════════════════════════════
# ─── Team Registrations ────────────────────────────────────────────────────────
def create_team_registration(db: Session, registration_id: str, **kwargs) -> Optional[TeamRegistration]:
    from sqlalchemy.exc import IntegrityError
    try:
        reg = TeamRegistration(registration_id=registration_id, **kwargs)
        db.add(reg)
        db.commit()
        db.refresh(reg)
        logger.info(f"[CRUD] Team Registration #{reg.id} saved for event #{reg.event_id}")
        return reg
    except IntegrityError as e:
        db.rollback()
        logger.error(f"[CRUD] Integrity error saving team registration: {e}")
        raise ValueError("Transaction ID or duplicate data already exists.")
    except Exception as e:
        db.rollback()
        logger.error(f"[CRUD] Failed to save team registration: {e}")
        raise e

def get_team_registration(db: Session, reg_id: int) -> Optional[TeamRegistration]:
    try:
        return db.query(TeamRegistration).filter(TeamRegistration.id == reg_id).first()
    except Exception as e:
        logger.error(f"[CRUD] Failed to get team registration #{reg_id}: {e}")
        return None

def get_team_registrations(db: Session, event_id: int, skip: int = 0, limit: int = 100) -> List[TeamRegistration]:
    try:
        return db.query(TeamRegistration).filter(TeamRegistration.event_id == event_id).order_by(desc(TeamRegistration.created_at)).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"[CRUD] Failed to get team registrations for event #{event_id}: {e}")
        return []

def delete_team_registration(db: Session, reg_id: int) -> bool:
    try:
        reg = db.query(TeamRegistration).filter(TeamRegistration.id == reg_id).first()
        if reg:
            db.delete(reg)
            db.commit()
            logger.info(f"[CRUD] Team Registration #{reg_id} deleted.")
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"[CRUD] Failed to delete team registration #{reg_id}: {e}")
        return False


# ─── Contact Messages ─────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def create_contact(db: Session, **kwargs) -> Optional[ContactMessage]:
    try:
        msg = ContactMessage(**kwargs)
        db.add(msg)
        db.commit()
        db.refresh(msg)
        logger.info(f"[CRUD] Contact #{msg.id} saved — from {msg.email}")
        return msg
    except Exception as e:
        db.rollback()
        logger.error(f"[CRUD] Failed to save contact message: {e}")
        return None

def get_contact(db: Session, msg_id: int) -> Optional[ContactMessage]:
    try:
        return db.query(ContactMessage).filter(ContactMessage.id == msg_id).first()
    except Exception as e:
        logger.error(f"[CRUD] Failed to get contact #{msg_id}: {e}")
        return None

def get_contacts(db: Session, skip: int = 0, limit: int = 100) -> List[ContactMessage]:
    try:
        return db.query(ContactMessage).order_by(desc(ContactMessage.created_at)).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"[CRUD] Failed to list contacts: {e}")
        return []

def delete_contact(db: Session, msg_id: int) -> bool:
    try:
        msg = db.query(ContactMessage).filter(ContactMessage.id == msg_id).first()
        if msg:
            db.delete(msg)
            db.commit()
            logger.info(f"[CRUD] Contact #{msg_id} deleted.")
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"[CRUD] Failed to delete contact #{msg_id}: {e}")
        return False


# ═══════════════════════════════════════════════════════════════════════════════
#  Email Queue (migrated from SQLite)
# ═══════════════════════════════════════════════════════════════════════════════

def add_email_to_queue(db: Session, email_id: str, subject: str, html_body: str, attachments_json: str) -> bool:
    try:
        email = EmailQueue(
            id=email_id,
            subject=subject,
            html_body=html_body,
            attachments=attachments_json,
            status="pending",
            retry_count=0
        )
        db.add(email)
        db.commit()
        logger.info(f"[CRUD] Email {email_id} queued.")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"[CRUD] Failed to queue email {email_id}: {e}")
        return False

def update_email_status(db: Session, email_id: str, new_status: str, error_message: str = "") -> bool:
    try:
        email = db.query(EmailQueue).filter(EmailQueue.id == email_id).first()
        if email:
            email.status = new_status
            email.last_attempt = datetime.now()
            email.error_message = error_message
            email.retry_count += 1
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"[CRUD] Failed to update email status {email_id}: {e}")
        return False

def get_pending_emails(db: Session) -> List[EmailQueue]:
    try:
        return db.query(EmailQueue).filter(
            EmailQueue.status.in_(["pending", "failed"]),
            EmailQueue.retry_count < 100
        ).all()
    except Exception as e:
        logger.error(f"[CRUD] Failed to fetch pending emails: {e}")
        return []

def get_email_queue_stats(db: Session) -> dict:
    try:
        from sqlalchemy import func as sqlfunc
        results = db.query(EmailQueue.status, sqlfunc.count(EmailQueue.id)).group_by(EmailQueue.status).all()
        return dict(results)
    except Exception as e:
        logger.error(f"[CRUD] Failed to get email stats: {e}")
        return {}
