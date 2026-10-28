"""Login business contract; form transport remains in the legacy suite."""
from uuid import UUID

import pytest
from fastapi import HTTPException
from jose import jwt
from tinydb import Query

from services.api.auth import AuthConfigurationError
from services.api.auth_database import open_database
from services.api.routes.auth import login


@pytest.mark.parametrize("aliases", [
    {"email": "person@example.test"},
    {"username": " PERSON@EXAMPLE.TEST "},
    {"email": "person@example.test", "username": " PERSON@EXAMPLE.TEST "},
])
def test_login_normalized_aliases_issue_identity_token(user_factory, jwt_config, database_paths, aliases):
    user = user_factory(email="person@example.test")
    before = database_paths.users.read_bytes()
    result = login(password="unit-test-password", **aliases)
    claims = jwt.decode(result.access_token, jwt_config, algorithms=["HS256"])
    assert result.token_type == "bearer"
    assert str(UUID(claims["sub"])) == user.id
    assert isinstance(claims["exp"], int)
    assert set(claims) == {"sub", "exp"}
    assert database_paths.users.read_bytes() == before


@pytest.mark.parametrize("aliases", [{}, {"email": "a@example.test", "username": "b@example.test"}])
def test_login_missing_or_conflicting_aliases_fail_without_storage(database_paths, aliases):
    with pytest.raises(HTTPException) as error:
        login(password="unit-test-password", **aliases)
    assert (error.value.status_code, error.value.detail) == (422, "Invalid authentication input")
    assert not database_paths.users.exists()


@pytest.mark.parametrize("scenario", ["wrong", "unknown", "inactive", "nul", "oversized"])
def test_login_generic_credential_failure_does_not_mutate(user_factory, database_paths, scenario):
    user = user_factory()
    if scenario == "inactive":
        with open_database() as db:
            db.table("users").update({"is_active": False}, Query().id == user.id)
    password = {"nul": "a\x00b", "oversized": "é" * 37, "wrong": "wrong"}.get(scenario, "unit-test-password")
    email = "unknown@example.test" if scenario == "unknown" else user.email
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        login(password=password, email=email)
    assert (error.value.status_code, error.value.detail) == (401, "Invalid credentials")
    assert error.value.headers == {"WWW-Authenticate": "Bearer"}
    assert database_paths.users.read_bytes() == before


def test_login_invalid_configuration_raises_safe_domain_error(user_factory, monkeypatch, database_paths):
    user = user_factory()
    before = database_paths.users.read_bytes()
    monkeypatch.delenv("JWT_SECRET_KEY")
    with pytest.raises(AuthConfigurationError, match="^Authentication configuration unavailable$"):
        login(password="unit-test-password", email=user.email)
    assert database_paths.users.read_bytes() == before
