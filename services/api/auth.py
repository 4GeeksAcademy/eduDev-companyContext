"""Password helpers and environment-only HS256 token configuration."""

import math
import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from uuid import uuid4
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


def create_reset_token(user_id: str) -> tuple[str, str]:
    try:
        minutes = float(os.environ.get("PASSWORD_RESET_EXPIRE_MINUTES", "30"))
        secret = os.environ.get("JWT_SECRET_KEY", "")
        if not secret.strip() or not math.isfinite(minutes) or not 15 <= minutes <= 60:
            raise ValueError
    except ValueError:
        raise AuthConfigurationError("Recovery configuration unavailable") from None
    reset_id = str(uuid4())
    token = jwt.encode({"sub": user_id, "purpose": "password_reset", "jti": reset_id,
                        "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes)},
                       secret, algorithm="HS256")
    return token, reset_id


def decode_reset_token(token: str) -> dict:
    secret = os.environ.get("JWT_SECRET_KEY", "")
    if not secret.strip():
        raise AuthConfigurationError("Recovery configuration unavailable")
    try:
        claims = jwt.decode(token, secret, algorithms=["HS256"],
                            options={"require_sub": True, "require_exp": True})
        expiry = claims["exp"]
        if (claims.get("purpose") != "password_reset"
                or not isinstance(claims.get("jti"), str) or not claims["jti"]
                or isinstance(expiry, bool) or not isinstance(expiry, (int, float))
                or not math.isfinite(expiry) or expiry <= datetime.now(timezone.utc).timestamp()):
            raise ValueError
        return claims
    except (JWTError, ValueError, TypeError, OverflowError):
        raise ValueError("Invalid or expired reset token") from None


def create_access_token(user_id: str) -> str:
    secret, expiry = token_configuration()
    return jwt.encode({"sub": user_id, "exp": expiry}, secret, algorithm="HS256")
