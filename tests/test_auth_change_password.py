"""Password changes verify current stored credentials and invalidate recovery."""
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from tinydb import Query

from services.api.auth import create_access_token, create_reset_token, verify_password
from services.api.auth_database import delete_user, get_user_by_id, open_database, set_password_reset
from services.api.auth_dependencies import get_current_user
from services.api.auth_models import ChangePasswordInput, ResetPasswordInput
from services.api.routes.auth import change_own_password, reset_password


def test_change_updates_password_clears_recovery_and_preserves_access(user_factory, database_paths):
    user = user_factory()
    session = create_access_token(user.id)
    reset, reset_id = create_reset_token(user.id)
    set_password_reset(user.id, reset_id)
    result = change_own_password(ChangePasswordInput(current_password="unit-test-password", new_password="é" * 36), get_current_user(session))
    assert result == {"message": "Password changed successfully."}
    stored = get_user_by_id(user.id)
    assert stored.hashed_password != user.hashed_password
    assert verify_password("é" * 36, stored.hashed_password)
    assert not verify_password("unit-test-password", stored.hashed_password)
    assert stored.password_reset_id is None
    assert get_current_user(session).id == user.id
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        reset_password(ResetPasswordInput(token=reset, new_password="another-password"))
    assert error.value.status_code == 400
    assert database_paths.users.read_bytes() == before


@pytest.mark.parametrize("scenario", ["wrong", "inactive", "deleted", "reset_bearer"])
def test_change_rejects_credentials_without_mutation(user_factory, database_paths, scenario):
    user = user_factory()
    reset, reset_id = create_reset_token(user.id)
    set_password_reset(user.id, reset_id)
    session = create_access_token(user.id)
    if scenario == "inactive":
        with open_database() as db:
            db.table("users").update({"is_active": False}, Query().id == user.id)
    elif scenario == "deleted":
        delete_user(user.id)
    elif scenario == "reset_bearer":
        session = reset
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        change_own_password(ChangePasswordInput(current_password="wrong", new_password="new-password"), get_current_user(session))
    assert error.value.status_code == (400 if scenario == "wrong" else 401)
    assert database_paths.users.read_bytes() == before


@pytest.mark.parametrize("password", ["", "é" * 37])
def test_change_invalid_new_password_preserves_state(user_factory, database_paths, password):
    user = user_factory()
    set_password_reset(user.id, "pending-test-reset")
    before = database_paths.users.read_bytes()
    with pytest.raises(ValidationError):
        ChangePasswordInput(current_password="unit-test-password", new_password=password)
    assert database_paths.users.read_bytes() == before


def test_concurrent_changes_check_latest_hash_even_with_stale_identity(user_factory):
    user = user_factory()

    def attempt(password):
        try:
            change_own_password(ChangePasswordInput(current_password="unit-test-password", new_password=password), user)
            return 200, password
        except HTTPException as error:
            return error.status_code, password

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(attempt, ["first-test-password", "second-test-password"]))
    assert sorted(status for status, _ in results) == [200, 400]
    stored = get_user_by_id(user.id)
    for status, password in results:
        assert verify_password(password, stored.hashed_password) == (status == 200)
