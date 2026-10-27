"""Password helpers backed by libpass bcrypt (no JWT configuration yet)."""

from passlib.hash import bcrypt


def hash_password(password: str) -> str:
    if not 1 <= len(password.encode("utf-8")) <= 72:
        raise ValueError("Password must contain 1 to 72 UTF-8 bytes")
    return bcrypt.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    if not 1 <= len(password.encode("utf-8")) <= 72:
        return False
    return bcrypt.verify(password, hashed_password)
