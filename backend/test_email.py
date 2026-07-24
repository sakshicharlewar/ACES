import requests

RESEND_API_KEY = "re_AP39cGrH_DevmdtV3kx5ihPy4uNoaNYxS"
SENDER_EMAIL   = "onboarding@resend.dev"
RECIPIENT      = "acescomputer0101@gmail.com"

html_body = """
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
  <div style="background:#1e3a8a;padding:20px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">New Innovation Box Submission</h1>
    <p style="color:#93c5fd;margin:4px 0 0;">ACES - Suryodaya College of Engineering and Technology</p>
  </div>
  <div style="padding:24px;background:#f9fafb;">
    <h2 style="color:#1e3a8a;">Idea Details</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;color:#6b7280;">Category</td><td style="padding:8px;font-weight:bold;">Event</td></tr>
      <tr style="background:#eff6ff;"><td style="padding:8px;color:#6b7280;">Idea Title</td><td style="padding:8px;font-weight:bold;">Test Submission</td></tr>
      <tr><td style="padding:8px;color:#6b7280;">Description</td><td style="padding:8px;">This is a live test of the ACES Innovation Box email system via Resend API.</td></tr>
      <tr style="background:#eff6ff;"><td style="padding:8px;color:#6b7280;">Expected Outcome</td><td style="padding:8px;">Email arrives at acescomputer0101@gmail.com</td></tr>
    </table>
    <h2 style="color:#1e3a8a;margin-top:24px;">Submitter Details</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;color:#6b7280;">Full Name</td><td style="padding:8px;">Test User</td></tr>
      <tr style="background:#eff6ff;"><td style="padding:8px;color:#6b7280;">Email</td><td style="padding:8px;">test@example.com</td></tr>
      <tr><td style="padding:8px;color:#6b7280;">Department</td><td style="padding:8px;">CSE</td></tr>
      <tr style="background:#eff6ff;"><td style="padding:8px;color:#6b7280;">Year</td><td style="padding:8px;">2nd</td></tr>
    </table>
    <p style="margin-top:24px;padding:12px;background:#dbeafe;border-radius:6px;color:#1e40af;">
      Submitted At: 24/07/2026, 4:07:00 PM
    </p>
  </div>
  <div style="background:#e5e7eb;padding:12px;text-align:center;font-size:12px;color:#6b7280;">
    Automated notification from ACES Innovation Box.
  </div>
</div>
"""

response = requests.post(
    "https://api.resend.com/emails",
    headers={
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "from":    f"ACES Forum <{SENDER_EMAIL}>",
        "to":      [RECIPIENT],
        "subject": "New Innovation Box Submission - TEST",
        "html":    html_body
    },
    timeout=15
)

print("Status:", response.status_code)
print("Response:", response.json())
if response.status_code in (200, 201):
    print("SUCCESS: Email sent to", RECIPIENT)
else:
    print("FAILED:", response.text)
