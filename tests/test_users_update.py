"""Identity updates preserve authorization, uniqueness and recovery invariants."""
from uuid import uuid4

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from services.api.auth import create_access_token, verify_password
from services.api.auth_database import get_profile_by_user_id, get_user_by_id, set_password_reset
from services.api.auth_dependencies import get_current_user
from services.api.auth_models import Role, UserUpdate
from services.api.routes.users import edit_user


def test_owner_email_then_password_update_preserves_identity_and_clears_reset(user_factory):
    original = user_factory(name="Original")
    token = create_access_token(original.id)
    owner = get_current_user(token)
    profile = get_profile_by_user_id(owner.id)
    set_password_reset(owner.id, "pending-test-reset")
    result = edit_user(owner.id, UserUpdate(email=" NEW@Example.TEST "), owner)
    assert result.email == "new@example.test" and result.password_reset_id == "pending-test-reset"
    assert result.hashed_password == original.hashed_password
    result = edit_user(owner.id, UserUpdate(password="new-test-password"), owner)
    assert result == get_user_by_id(owner.id)
    assert verify_password("new-test-password", result.hashed_password)
    assert not verify_password("unit-test-password", result.hashed_password)
    assert result.password_reset_id is None
    assert (result.id, result.created_at, result.role) == (original.id, original.created_at, original.role)
    assert get_profile_by_user_id(owner.id) == profile
    assert get_current_user(token) == result


def test_admin_role_update_and_missing_target(user_factory, database_paths):
    admin = get_current_user(create_access_token(user_factory(role=Role.admin).id))
    target = user_factory()
    result = edit_user(target.id, UserUpdate(role=Role.manager), admin)
    assert result == get_user_by_id(target.id) and result.role == Role.manager
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        edit_user(str(uuid4()), UserUpdate(email="unused@example.test"), admin)
    assert error.value.status_code == 404
    assert database_paths.users.read_bytes() == before


@pytest.mark.parametrize("payload", [{}, {"email": " USER-1@EXAMPLE.TEST "}])
def test_empty_or_same_normalized_email_preserves_all_state(user_factory, database_paths, payload):
    owner = user_factory()
    set_password_reset(owner.id, "pending-test-reset")
    before = database_paths.users.read_bytes()
    assert edit_user(owner.id, UserUpdate(**payload), get_current_user(create_access_token(owner.id))) == get_user_by_id(owner.id)
    assert database_paths.users.read_bytes() == before


def test_duplicate_update_does_not_partially_change_password_or_role(user_factory, database_paths):
    admin = user_factory(role=Role.admin)
    target = user_factory()
    set_password_reset(target.id, "pending-test-reset")
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        edit_user(target.id, UserUpdate(email=f" {admin.email.upper()} ", password="replacement", role=Role.admin), get_current_user(create_access_token(admin.id)))
    assert error.value.status_code == 409
    assert database_paths.users.read_bytes() == before


@pytest.mark.parametrize("role", [Role.user, Role.manager])
@pytest.mark.parametrize("target_kind", ["self-role", "other", "missing"])
def test_nonadmin_forbidden_changes_do_not_disclose_or_mutate(user_factory, database_paths, role, target_kind):
    owner = get_current_user(create_access_token(user_factory(role=role).id))
    target = owner.id if target_kind == "self-role" else user_factory().id if target_kind == "other" else str(uuid4())
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        edit_user(target, UserUpdate(role=role, email="replacement@example.test"), owner)
    assert error.value.status_code == 403
    assert error.value.detail == ("Only admins may set roles" if target_kind == "self-role" else "Forbidden")
    assert database_paths.users.read_bytes() == before


@pytest.mark.parametrize("payload", [{"email": None}, {"password": None}, {"role": None}, {"email": "bad"}, {"password": ""}, {"password": "é" * 37}, {"role": "root"}, {"name": "No"}, {"is_active": False}, {"id": "chosen"}, {"unknown": True}])
def test_invalid_update_preserves_pending_recovery_and_identity(user_factory, database_paths, payload):
    owner = user_factory()
    set_password_reset(owner.id, "pending-test-reset")
    before = database_paths.users.read_bytes()
    with pytest.raises(ValidationError):
        edit_user(owner.id, UserUpdate(**payload), owner)
    assert database_paths.users.read_bytes() == before
