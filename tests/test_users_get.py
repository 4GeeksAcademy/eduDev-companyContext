"""User reads check ownership before disclosing target existence."""
from uuid import uuid4

import pytest
from fastapi import HTTPException

from services.api.auth import create_access_token
from services.api.auth_dependencies import get_current_user
from services.api.auth_models import Role
from services.api.routes.users import read_user


@pytest.mark.parametrize("role", list(Role))
def test_every_role_can_read_self(user_factory, database_paths, role):
    user = user_factory(role=role)
    before = database_paths.users.read_bytes()
    assert read_user(user.id, get_current_user(create_access_token(user.id))) == user
    assert database_paths.users.read_bytes() == before


def test_admin_can_read_other_but_missing_is_404(user_factory, database_paths):
    admin = get_current_user(create_access_token(user_factory(role=Role.admin).id))
    other = user_factory()
    before = database_paths.users.read_bytes()
    assert read_user(other.id, admin) == other
    with pytest.raises(HTTPException) as error:
        read_user(str(uuid4()), admin)
    assert (error.value.status_code, error.value.detail) == (404, "User not found")
    assert database_paths.users.read_bytes() == before


@pytest.mark.parametrize("role", [Role.user, Role.manager])
@pytest.mark.parametrize("exists", [True, False])
def test_nonowner_cannot_discover_target(user_factory, database_paths, role, exists):
    user = get_current_user(create_access_token(user_factory(role=role).id))
    target = user_factory().id if exists else str(uuid4())
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        read_user(target, user)
    assert (error.value.status_code, error.value.detail) == (403, "Forbidden")
    assert database_paths.users.read_bytes() == before
