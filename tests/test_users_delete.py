"""Deletion removes the linked lifecycle, not unrelated identities."""
from uuid import uuid4

import pytest
from fastapi import HTTPException

from services.api.auth import create_access_token
from services.api.auth_database import get_profile_by_user_id, get_user_by_id
from services.api.auth_dependencies import get_current_user
from services.api.auth_models import Role
from services.api.routes.users import remove_user


@pytest.mark.parametrize("actor", ["owner", "admin"])
def test_delete_removes_linked_records_and_revokes_token(user_factory, database_paths, actor):
    target = user_factory(name="Target")
    token = create_access_token(target.id)
    other = user_factory(role=Role.admin)
    profile = get_profile_by_user_id(other.id)
    resolved = get_current_user(token if actor == "owner" else create_access_token(other.id))
    response = remove_user(target.id, resolved)
    assert response.status_code == 204 and response.body == b""
    assert get_user_by_id(target.id) is None and get_profile_by_user_id(target.id) is None
    assert get_user_by_id(other.id) == other and get_profile_by_user_id(other.id) == profile
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        get_current_user(token)
    assert error.value.status_code == 401
    with pytest.raises(HTTPException) as error:
        remove_user(target.id, get_current_user(create_access_token(other.id)))
    assert error.value.status_code == 404
    assert database_paths.users.read_bytes() == before


@pytest.mark.parametrize("role,exists", [(Role.user, True), (Role.user, False), (Role.manager, True), (Role.manager, False), (Role.admin, False)])
def test_delete_permission_precedes_missing_target(user_factory, database_paths, role, exists):
    actor = get_current_user(create_access_token(user_factory(role=role).id))
    target = user_factory().id if exists else str(uuid4())
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        remove_user(target, actor)
    assert (error.value.status_code, error.value.detail) == ((404, "User not found") if role == Role.admin else (403, "Forbidden"))
    assert database_paths.users.read_bytes() == before
