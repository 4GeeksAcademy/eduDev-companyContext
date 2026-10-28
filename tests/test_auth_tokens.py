"""Password, JWT configuration and active-identity validation without HTTP."""
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException
from jose import jwt

from services.api import auth
from services.api.auth_dependencies import get_current_user


@pytest.mark.parametrize("password", ["x", "é" * 36])
def test_real_password_hashes_are_salted_and_verify_boundaries(password):
    first = auth.hash_password(password)
    second = auth.hash_password(password)
    assert first != second
    assert auth.verify_password(password, first)
    assert auth.verify_password(password, second)
    assert not auth.verify_password("wrong", first)


@pytest.mark.parametrize("password,hashed", [
    ("", "malformed"), ("a\x00b", "malformed"), (None, "malformed"),
    ("é" * 37, "malformed"), ("valid", None), ("valid", "not-a-hash"),
])
def test_password_verification_fails_safely(password, hashed):
    assert auth.verify_password(password, hashed) is False


@pytest.mark.parametrize("password", ["", "é" * 37])
def test_hash_rejects_unsupported_byte_lengths(password):
    with pytest.raises(ValueError, match="1 to 72 UTF-8 bytes"):
        auth.hash_password(password)


@pytest.mark.parametrize("setting", ["0", "-1", "nan", "inf", "1e300", "0.00000001", "invalid"])
def test_access_configuration_rejects_unsafe_durations(monkeypatch, setting):
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", setting)
    with pytest.raises(auth.AuthConfigurationError, match="^Authentication configuration unavailable$"):
        auth.create_access_token("synthetic-subject")


@pytest.mark.parametrize("secret", [None, "", "   "])
def test_missing_secret_fails_closed_for_issuance_and_dependency(monkeypatch, secret):
    if secret is None:
        monkeypatch.delenv("JWT_SECRET_KEY")
    else:
        monkeypatch.setenv("JWT_SECRET_KEY", secret)
    with pytest.raises(auth.AuthConfigurationError):
        auth.create_access_token("synthetic-subject")
    with pytest.raises(auth.AuthConfigurationError):
        auth.create_reset_token("synthetic-subject")
    with pytest.raises(auth.AuthConfigurationError):
        auth.decode_reset_token("not-a-token")
    with pytest.raises(HTTPException) as error:
        get_current_user("not-a-token")
    assert (error.value.status_code, error.value.detail) == (503, "Authentication configuration unavailable")


@pytest.mark.parametrize("minutes", [None, "45"])
def test_access_default_and_custom_expiry_with_fixed_clock(user_factory, jwt_config, monkeypatch, minutes):
    user = user_factory()
    fixed = datetime(2030, 1, 1, tzinfo=timezone.utc)

    class Clock(datetime):
        @classmethod
        def now(cls, tz=None):
            return fixed

    monkeypatch.setattr(auth, "datetime", Clock)
    if minutes is None:
        monkeypatch.delenv("ACCESS_TOKEN_EXPIRE_MINUTES")
    else:
        monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", minutes)
    token = auth.create_access_token(user.id)
    claims = jwt.decode(token, jwt_config, algorithms=["HS256"], options={"verify_exp": False})
    assert claims == {"sub": user.id, "exp": int(fixed.timestamp()) + 60 * int(minutes or 30)}


@pytest.mark.parametrize("minutes", ["15", "60"])
def test_reset_duration_bounds_and_purpose(user_factory, monkeypatch, minutes):
    user = user_factory()
    monkeypatch.setenv("PASSWORD_RESET_EXPIRE_MINUTES", minutes)
    before = datetime.now(timezone.utc).timestamp()
    token, reset_id = auth.create_reset_token(user.id)
    after = datetime.now(timezone.utc).timestamp()
    claims = auth.decode_reset_token(token)
    assert claims["sub"] == user.id
    assert claims["jti"] == reset_id
    assert claims["purpose"] == "password_reset"
    assert before + 60 * int(minutes) - 1 <= claims["exp"] <= after + 60 * int(minutes)
    with pytest.raises(HTTPException) as error:
        get_current_user(token)
    assert error.value.status_code == 401
    with pytest.raises(ValueError, match="Invalid or expired reset token"):
        auth.decode_reset_token(auth.create_access_token(user.id))


@pytest.mark.parametrize("minutes", ["14.99", "60.01", "nan", "inf", "bad"])
def test_reset_rejects_invalid_duration(monkeypatch, minutes):
    monkeypatch.setenv("PASSWORD_RESET_EXPIRE_MINUTES", minutes)
    with pytest.raises(auth.AuthConfigurationError, match="^Recovery configuration unavailable$"):
        auth.create_reset_token("synthetic-subject")


@pytest.mark.parametrize("case", [
    "expired", "signature", "algorithm", "missing_sub", "missing_exp", "uuid",
    "boolean_exp", "string_exp", "infinite_exp", "purpose",
])
def test_dependency_rejects_invalid_claims_without_mutation(user_factory, jwt_config, database_paths, case):
    user = user_factory()
    claims = {"sub": user.id, "exp": 4102444800}
    secret, algorithm = jwt_config, "HS256"
    if case == "expired":
        claims["exp"] = 1
    elif case == "signature":
        secret = "wrong-test-secret"
    elif case == "algorithm":
        algorithm = "HS384"
    elif case.startswith("missing_"):
        claims.pop(case.removeprefix("missing_"))
    elif case == "uuid":
        claims["sub"] = "not-a-uuid"
    elif case == "boolean_exp":
        claims["exp"] = True
    elif case == "string_exp":
        claims["exp"] = "4102444800"
    elif case == "infinite_exp":
        claims["exp"] = float("inf")
    elif case == "purpose":
        claims["purpose"] = "password_reset"
    token = jwt.encode(claims, secret, algorithm=algorithm)
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        get_current_user(token)
    assert (error.value.status_code, error.value.detail) == (401, "Invalid authentication credentials")
    assert error.value.headers == {"WWW-Authenticate": "Bearer"}
    assert database_paths.users.read_bytes() == before
