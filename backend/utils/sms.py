import os
import logging
import requests

logger = logging.getLogger(__name__)

# Configurable SMS Provider (default to 'mock')
# Options: 'twilio', 'msg91', 'fast2sms', 'mock'
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "mock").lower()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")

FAST2SMS_AUTH_KEY = os.getenv("FAST2SMS_AUTH_KEY")
MSG91_AUTH_KEY = os.getenv("MSG91_AUTH_KEY")
MSG91_SENDER_ID = os.getenv("MSG91_SENDER_ID", "ACESMSG")

def send_sms(to_number: str, message: str) -> bool:
    """
    General entry point for sending SMS.
    Dispatches to the provider specified in SMS_PROVIDER env variable.
    """
    if not to_number:
        logger.warning("Attempted to send SMS to empty number.")
        return False
        
    # Basic sanitization
    to_number = to_number.strip().replace(" ", "").replace("-", "")
    
    logger.info(f"[{SMS_PROVIDER.upper()}] Sending SMS to {to_number}")
    
    try:
        if SMS_PROVIDER == "twilio":
            return _send_twilio(to_number, message)
        elif SMS_PROVIDER == "fast2sms":
            return _send_fast2sms(to_number, message)
        elif SMS_PROVIDER == "msg91":
            return _send_msg91(to_number, message)
        else:
            return _send_mock(to_number, message)
    except Exception as e:
        logger.error(f"Failed to send SMS via {SMS_PROVIDER}: {e}")
        return False

def _send_mock(to_number: str, message: str) -> bool:
    """Mock implementation for local development without API keys."""
    logger.info(f"--- MOCK SMS ---")
    logger.info(f"To: {to_number}")
    logger.info(f"Message: {message}")
    logger.info(f"----------------")
    return True

def _send_twilio(to_number: str, message: str) -> bool:
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logger.error("Twilio credentials not configured.")
        return False
        
    # Ensure number has + prefix for Twilio (assumes India +91 if length is 10)
    if len(to_number) == 10:
        to_number = f"+91{to_number}"
        
    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    data = {
        "From": TWILIO_FROM_NUMBER,
        "To": to_number,
        "Body": message
    }
    
    response = requests.post(url, data=data, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN))
    if response.status_code in (200, 201):
        return True
    else:
        logger.error(f"Twilio API Error: {response.text}")
        return False

def _send_fast2sms(to_number: str, message: str) -> bool:
    if not FAST2SMS_AUTH_KEY:
        logger.error("Fast2SMS credentials not configured.")
        return False
        
    url = "https://www.fast2sms.com/dev/bulkV2"
    headers = {
        "authorization": FAST2SMS_AUTH_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "route": "q",
        "message": message,
        "language": "english",
        "flash": 0,
        "numbers": to_number,
    }
    
    response = requests.post(url, headers=headers, data=data)
    if response.status_code == 200 and response.json().get("return"):
        return True
    else:
        logger.error(f"Fast2SMS API Error: {response.text}")
        return False

def _send_msg91(to_number: str, message: str) -> bool:
    if not MSG91_AUTH_KEY:
        logger.error("MSG91 credentials not configured.")
        return False
        
    url = "https://api.msg91.com/api/v2/sendsms"
    headers = {
        "authkey": MSG91_AUTH_KEY,
        "content-type": "application/json"
    }
    
    # Needs a registered DLT template ID in production, simplifying here
    payload = {
        "sender": MSG91_SENDER_ID,
        "route": "4",
        "country": "91",
        "sms": [
            {
                "message": message,
                "to": [to_number]
            }
        ]
    }
    
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200 and response.json().get("type") == "success":
        return True
    else:
        logger.error(f"MSG91 API Error: {response.text}")
        return False
