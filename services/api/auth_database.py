"""Small identity services; one file, separate users and profiles tables.

A process-local lock serializes reads and registrations. Run a single API worker:
TinyDB is not a multi-process database or a crash-safe transactional store.
"""

import os
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from uuid import uuid4

from tinydb import Query, TinyDB

from services.api.auth import hash_password
from services.api.auth_models import Profile, RegistrationInput, Role, User, normalize_email


DEFAULT_DB_PATH = Path(__file__).resolve().parent / "data" / "users.json"
DB_PATH_ENV = "TRACKFLOW_USERS_DB_PATH"
_lock = RLock()


class DuplicateEmailError(ValueError):
    """The normalized email already belongs to an identity."""


@contextmanager
def open_database():
    configured = os.getenv(DB_PATH_ENV)
    path = Path(configured).expanduser() if configured else DEFAULT_DB_PATH
    with _lock:
        path.parent.mkdir(parents=True, exist_ok=True)
        with TinyDB(path) as database:
            yield database


def create_user(data: RegistrationInput) -> User:
    """Create both linked records in one storage write, never two table writes."""
    with open_database() as database:
        email = normalize_email(data.email)
        if database.table("users").get(Query().email == email) is not None:
            raise DuplicateEmailError("Email already registered")
        user = User(
            id=str(uuid4()), email=email,
            hashed_password=hash_password(data.password.get_secret_value()),
            is_active=True, role=Role.user, created_at=datetime.now(timezone.utc),
        )
        profile = Profile(
            id=str(uuid4()), user_id=user.id,
            name=data.name, phone=data.phone, address=data.address,
        )
        # Build both named tables before writing, so validation/hash failures cannot
        # leave half a registration. No table cache is reused after this write.
        records = database.storage.read() or {}
        for table_name, model in (("users", user), ("profiles", profile)):
            table = records.setdefault(table_name, {})
            next_id = str(max((int(key) for key in table), default=0) + 1)
            table[next_id] = model.model_dump(mode="json")
        database.storage.write(records)
        return user


def get_user_by_id(user_id: str) -> User | None:
    with open_database() as database:
        record = database.table("users").get(Query().id == user_id)
        return User.model_validate(record) if record is not None else None


def get_user_by_email(email: str) -> User | None:
    with open_database() as database:
        record = database.table("users").get(Query().email == normalize_email(email))
        return User.model_validate(record) if record is not None else None


def get_profile_by_user_id(user_id: str) -> Profile | None:
    with open_database() as database:
        record = database.table("profiles").get(Query().user_id == user_id)
        return Profile.model_validate(record) if record is not None else None
