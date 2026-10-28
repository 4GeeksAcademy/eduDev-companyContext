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

from services.api.auth import hash_password, verify_password
from services.api.auth_models import (
    Profile, ProfileUpdate, RegistrationInput, Role, User, UserUpdate, normalize_email,
)


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


def list_users() -> list[User]:
    with open_database() as database:
        return [User.model_validate(record) for record in database.table("users").all()]


def update_user(user_id: str, data: UserUpdate) -> User | None:
    """Validate the complete replacement before one write under the identity lock."""
    with open_database() as database:
        records = database.storage.read() or {}
        users = records.get("users", {})
        for key, record in users.items():
            if record["id"] != user_id:
                continue
            changes = data.model_dump(exclude_unset=True, exclude={"password"}, mode="json")
            email = changes.get("email", record["email"])
            if any(other["id"] != user_id and other["email"] == email for other in users.values()):
                raise DuplicateEmailError("Email already registered")
            if "password" in data.model_fields_set:
                changes["hashed_password"] = hash_password(data.password.get_secret_value())
                changes["password_reset_id"] = None
            user = User.model_validate({**record, **changes})
            users[key] = user.model_dump(mode="json")
            database.storage.write(records)
            return user
        return None


def change_password(user_id: str, current_password: str, new_password: str) -> bool:
    """Verify the latest hash and replace credentials under the same process lock."""
    with open_database() as database:
        table = database.table("users")
        record = table.get(Query().id == user_id)
        if (record is None or not record["is_active"]
                or not verify_password(current_password, record["hashed_password"])):
            return False
        hashed = hash_password(new_password)
        table.update({"hashed_password": hashed, "password_reset_id": None},
                     doc_ids=[record.doc_id])
        return True


def set_password_reset(user_id: str, reset_id: str) -> bool:
    with open_database() as database:
        table = database.table("users")
        record = table.get(Query().id == user_id)
        if record is None or not record["is_active"]:
            return False
        table.update({"password_reset_id": reset_id}, doc_ids=[record.doc_id])
        return True


def consume_password_reset(user_id: str, reset_id: str, password: str) -> bool:
    """Compare, hash and update password + unused state in one locked write."""
    with open_database() as database:
        table = database.table("users")
        record = table.get(Query().id == user_id)
        if (record is None or not record["is_active"]
                or record.get("password_reset_id") != reset_id):
            return False
        hashed = hash_password(password)
        table.update({"hashed_password": hashed, "password_reset_id": None},
                     doc_ids=[record.doc_id])
        return True


def delete_user(user_id: str) -> bool:
    """Remove identity and linked profile together in one storage write."""
    with open_database() as database:
        records = database.storage.read() or {}
        users = records.get("users", {})
        if not any(record["id"] == user_id for record in users.values()):
            return False
        records["users"] = {key: record for key, record in users.items() if record["id"] != user_id}
        records["profiles"] = {
            key: record for key, record in records.get("profiles", {}).items()
            if record["user_id"] != user_id
        }
        database.storage.write(records)
        return True


def update_profile(user_id: str, data: ProfileUpdate) -> Profile | None:
    with open_database() as database:
        records = database.storage.read() or {}
        for key, record in records.get("profiles", {}).items():
            if record["user_id"] == user_id:
                profile = Profile.model_validate({**record, **data.model_dump(exclude_unset=True)})
                records["profiles"][key] = profile.model_dump(mode="json")
                database.storage.write(records)
                return profile
        return None
