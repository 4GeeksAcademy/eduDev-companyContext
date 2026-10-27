"""Password helpers and environment-only HS256 token configuration."""

import math
import os
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.hash import bcrypt


def hash_password(password: str) -> str:
    if not 1 <= len(password.encode("utf-8")) <= 72:
        raise ValueError("Password must contain 1 to 72 UTF-8 bytes")
    return bcrypt.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    if not isinstance(password, str) or not isinstance(hashed_password, str):
        return False
    try:
        if "\x00" in password or not 1 <= len(password.encode("utf-8")) <= 72:
            return False
        return bcrypt.verify(password, hashed_password)
    except (ValueError, TypeError, UnicodeError):
        return False


class AuthConfigurationError(ValueError):
    """Authentication cannot operate safely with the current environment."""


def token_configuration() -> tuple[str, datetime]:
    secret = os.environ.get("JWT_SECRET_KEY", "")
    try:
        minutes = float(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        if not secret.strip() or not math.isfinite(minutes) or minutes <= 0:
            raise ValueError
        now = datetime.now(timezone.utc)
        expiry = now + timedelta(minutes=minutes)
        if int(expiry.timestamp()) <= int(now.timestamp()):
            raise ValueError
    except (ValueError, OverflowError):
        raise AuthConfigurationError("Authentication configuration unavailable") from None
    return secret, expiry


def create_access_token(user_id: str) -> str:
    secret, expiry = token_configuration()
    return jwt.encode({"sub": user_id, "exp": expiry}, secret, algorithm="HS256")
