"""Public registration creates linked, unprivileged identities."""
from datetime import datetime, timezone
from uuid import UUID

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from services.api.auth import verify_password
from services.api.auth_database import get_profile_by_user_id, get_user_by_id, list_users
from services.api.auth_models import RegistrationInput, Role, UserResponse
from services.api.routes.users import register


@pytest.mark.parametrize("password,contacts", [("x", {}), ("é" * 36, {"name": None, "phone": None, "address": None}), ("a" * 72, {"name": "Person", "phone": "123", "address": "Test street"})])
def test_registration_persists_linked_identity_with_password_boundaries(password, contacts):
    before = datetime.now(timezone.utc)
    result = register(RegistrationInput(email="  Person@Example.TEST ", password=password, **contacts))
    stored = get_user_by_id(result.id)
    profile = get_profile_by_user_id(result.id)
    assert UUID(result.id).version == UUID(profile.id).version == 4
    assert profile.id != result.id and profile.user_id == result.id
    assert result.email == "person@example.test"
    assert stored == result and stored.role == Role.user and stored.is_active
    assert before <= stored.created_at <= datetime.now(timezone.utc)
    assert stored.hashed_password != password and verify_password(password, stored.hashed_password)
    assert {key: getattr(profile, key) for key in ("name", "phone", "address")} == {key: contacts.get(key) for key in ("name", "phone", "address")}
    assert set(UserResponse.model_validate(result.model_dump()).model_dump()) == {"id", "email", "role", "is_active", "created_at"}


def test_normalized_duplicate_cannot_create_orphan(user_factory, database_paths):
    original = user_factory(email="person@example.test", name="Original")
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        register(RegistrationInput(email=" PERSON@EXAMPLE.TEST ", password="different", name="Duplicate"))
    assert error.value.status_code == 409
    assert database_paths.users.read_bytes() == before
    assert [user.id for user in list_users()] == [original.id]


@pytest.mark.parametrize("changes", [{"email": "invalid"}, {"password": ""}, {"password": "é" * 37}, {"password": None}, {"role": "admin"}, {"is_active": False}, {"id": "chosen"}, {"user_id": "chosen"}, {"unknown": True}])
def test_invalid_registration_never_creates_store(changes, database_paths):
    with pytest.raises(ValidationError):
        register(RegistrationInput(**({"email": "valid@example.test", "password": "synthetic"} | changes)))
    assert not database_paths.users.exists()
