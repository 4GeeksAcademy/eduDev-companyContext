"""Profiles are selected solely from the resolved owner's identity."""
import pytest
from fastapi import HTTPException
from tinydb import Query

from services.api.auth import create_access_token
from services.api.auth_database import get_profile_by_user_id, open_database
from services.api.auth_dependencies import get_current_user
from services.api.auth_models import Role
from services.api.routes.profiles import read_profile


@pytest.mark.parametrize("role", list(Role))
def test_each_role_reads_only_own_nullable_profile(user_factory, database_paths, role):
    owner = user_factory(role=role, name="Owner", phone=None, address=None)
    other = user_factory(name="Other", phone="123")
    before = database_paths.users.read_bytes()
    result = read_profile(get_current_user(create_access_token(owner.id)))
    assert result == get_profile_by_user_id(owner.id)
    assert result.user_id == owner.id != other.id
    assert (result.name, result.phone, result.address) == ("Owner", None, None)
    assert database_paths.users.read_bytes() == before


def test_missing_linked_profile_fails_closed(user_factory, database_paths):
    owner = user_factory()
    with open_database() as db:
        db.table("profiles").remove(Query().user_id == owner.id)
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        read_profile(get_current_user(create_access_token(owner.id)))
    assert (error.value.status_code, error.value.detail) == (500, "User profile unavailable")
    assert database_paths.users.read_bytes() == before


def test_invalid_bearer_cannot_resolve_profile_owner(user_factory, database_paths):
    user_factory()
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        read_profile(get_current_user("not-a-jwt"))
    assert error.value.status_code == 401
    assert database_paths.users.read_bytes() == before
