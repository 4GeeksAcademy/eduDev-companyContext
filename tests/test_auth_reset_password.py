"""Real reset credentials must match persistent, single-use recovery state."""
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi import HTTPException
from jose import jwt
from pydantic import ValidationError
from tinydb import Query

from services.api.auth import create_access_token, create_reset_token, verify_password
from services.api.auth_database import delete_user, get_user_by_id, open_database, set_password_reset
from services.api.auth_dependencies import get_current_user
from services.api.auth_models import ResetPasswordInput
from services.api.routes.auth import reset_password


def test_reset_changes_hash_consumes_token_preserves_session_and_rejects_reuse(user_factory, database_paths):
    user = user_factory()
    session = create_access_token(user.id)
    token, reset_id = create_reset_token(user.id)
    set_password_reset(user.id, reset_id)
    data = ResetPasswordInput(token=token, new_password="new-test-password")
    assert reset_password(data) == {"message": "Password reset successfully."}
    stored = get_user_by_id(user.id)
    assert stored.hashed_password != user.hashed_password
    assert verify_password("new-test-password", stored.hashed_password)
    assert not verify_password("unit-test-password", stored.hashed_password)
    assert stored.password_reset_id is None
    assert get_current_user(session).id == user.id
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        reset_password(data)
    assert (error.value.status_code, error.value.detail) == (400, "Invalid or expired reset token")
    assert database_paths.users.read_bytes() == before


@pytest.mark.parametrize("scenario", [
    "expired", "signature", "access", "missing_sub", "missing_exp", "missing_jti",
    "purpose", "inactive", "deleted", "missing_state", "superseded",
])
def test_reset_invalid_link_or_state_cannot_mutate(user_factory, jwt_config, database_paths, scenario):
    user = user_factory()
    token, reset_id = create_reset_token(user.id)
    set_password_reset(user.id, reset_id)
    claims = jwt.get_unverified_claims(token)
    secret = jwt_config
    if scenario == "expired":
        claims["exp"] = 1
    elif scenario == "signature":
        secret = "different-test-secret"
    elif scenario.startswith("missing_") and scenario != "missing_state":
        claims.pop(scenario.removeprefix("missing_"))
    elif scenario == "purpose":
        claims["purpose"] = "access"
    elif scenario == "inactive":
        with open_database() as db:
            db.table("users").update({"is_active": False}, Query().id == user.id)
    elif scenario == "deleted":
        delete_user(user.id)
    elif scenario == "missing_state":
        with open_database() as db:
            db.table("users").update({"password_reset_id": None}, Query().id == user.id)
    elif scenario == "superseded":
        _, replacement = create_reset_token(user.id)
        set_password_reset(user.id, replacement)
    token = create_access_token(user.id) if scenario == "access" else jwt.encode(claims, secret, algorithm="HS256")
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        reset_password(ResetPasswordInput(token=token, new_password="replacement-password"))
    assert error.value.status_code == 400
    assert database_paths.users.read_bytes() == before


def test_concurrent_reset_has_exactly_one_winner(user_factory):
    user = user_factory()
    token, reset_id = create_reset_token(user.id)
    set_password_reset(user.id, reset_id)

    def attempt(password):
        try:
            reset_password(ResetPasswordInput(token=token, new_password=password))
            return 200, password
        except HTTPException as error:
            return error.status_code, password

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(attempt, ["first-test-password", "second-test-password"]))
    assert sorted(status for status, _ in results) == [200, 400]
    stored = get_user_by_id(user.id)
    assert stored.password_reset_id is None
    for status, password in results:
        assert verify_password(password, stored.hashed_password) == (status == 200)


@pytest.mark.parametrize("password", ["", "é" * 37])
def test_reset_invalid_password_preserves_pending_recovery(user_factory, database_paths, password):
    user = user_factory()
    token, reset_id = create_reset_token(user.id)
    set_password_reset(user.id, reset_id)
    before = database_paths.users.read_bytes()
    with pytest.raises(ValidationError):
        ResetPasswordInput(token=token, new_password=password)
    assert database_paths.users.read_bytes() == before
