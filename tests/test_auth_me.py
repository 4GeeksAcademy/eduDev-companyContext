"""Resolve current identity from real signed credentials and stored state."""
import pytest
from fastapi import HTTPException
from tinydb import Query

from services.api.auth import create_access_token, create_reset_token
from services.api.auth_database import delete_user, open_database, update_user
from services.api.auth_dependencies import get_current_user
from services.api.auth_models import Role, UserUpdate
from services.api.routes.auth import current_user


def test_me_returns_own_profile_and_safe_identity(user_factory, database_paths):
    user = user_factory(name="Synthetic Person", phone=None, address="Test address")
    other = user_factory(name="Other Person")
    before = database_paths.users.read_bytes()
    result = current_user(get_current_user(create_access_token(user.id)))
    assert result.id == user.id != other.id
    assert result.email == user.email
    assert result.profile.user_id == user.id
    assert (result.profile.name, result.profile.phone, result.profile.address) == ("Synthetic Person", None, "Test address")
    assert set(result.model_dump()) == {"id", "email", "is_active", "role", "created_at", "profile"}
    assert database_paths.users.read_bytes() == before


def test_me_uses_current_database_role_not_token_role(user_factory):
    user = user_factory()
    token = create_access_token(user.id)
    update_user(user.id, UserUpdate(role=Role.manager))
    assert current_user(get_current_user(token)).role == Role.manager


@pytest.mark.parametrize("revocation", ["inactive", "deleted", "reset", "malformed"])
def test_me_rejects_invalid_identity_without_mutation(user_factory, database_paths, revocation):
    user = user_factory()
    token = create_access_token(user.id)
    if revocation == "inactive":
        with open_database() as db:
            db.table("users").update({"is_active": False}, Query().id == user.id)
    elif revocation == "deleted":
        delete_user(user.id)
    elif revocation == "reset":
        token, _ = create_reset_token(user.id)
    else:
        token = "not-a-jwt"
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        current_user(get_current_user(token))
    assert error.value.status_code == 401
    assert error.value.headers == {"WWW-Authenticate": "Bearer"}
    assert database_paths.users.read_bytes() == before


def test_me_missing_profile_fails_closed(user_factory, database_paths):
    user = user_factory()
    with open_database() as db:
        db.table("profiles").remove(Query().user_id == user.id)
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        current_user(get_current_user(create_access_token(user.id)))
    assert (error.value.status_code, error.value.detail) == (500, "User profile unavailable")
    assert database_paths.users.read_bytes() == before
