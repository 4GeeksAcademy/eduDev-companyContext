"""Small server-only Resend HTTPS adapter; never log provider bodies or inputs."""
import json
import os
import urllib.request
from urllib.parse import urlencode, urlsplit

from services.api.auth import AuthConfigurationError


def delivery_configuration() -> tuple[str, str, str]:
    key = os.environ.get("RESEND_API_KEY", "").strip()
    sender = os.environ.get("RESEND_FROM_EMAIL", "").strip()
    base = os.environ.get("FRONTEND_PUBLIC_URL", "").strip().rstrip("/")
    parsed = urlsplit(base)
    if (not key or not sender or parsed.scheme not in ("http", "https")
            or not parsed.netloc or parsed.username or parsed.password
            or parsed.query or parsed.fragment):
        raise AuthConfigurationError("Recovery configuration unavailable")
    return key, sender, base


def send_password_reset(email: str, token: str, configuration: tuple[str, str, str]) -> None:
    key, sender, base = configuration
    link = base + "/reset-password?" + urlencode({"token": token})
    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps({"from": sender, "to": [email],
                         "subject": "Reset your TrackFlow password",
                         "text": "Reset your password using this link: " + link}).encode("utf-8"),
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json",
                 "User-Agent": "TrackFlow/1.0"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        if not 200 <= response.status < 300:
            raise OSError("Email delivery unavailable")
