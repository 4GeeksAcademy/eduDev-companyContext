"""Recovery issuance keeps account existence and delivery failures private."""
import json
from urllib.parse import parse_qs, urlsplit

import pytest
from pydantic import ValidationError
from tinydb import Query

from services.api.auth import decode_reset_token, verify_password
from services.api.auth_database import get_user_by_id, open_database
from services.api.auth_models import ForgotPasswordInput
from services.api.routes.auth import forgot_password


def test_forgot_normalizes_email_persists_matching_token_and_preserves_password(user_factory, reset_email):
    user = user_factory(email="person@example.test")
    result = forgot_password(ForgotPasswordInput(email=" PERSON@EXAMPLE.TEST "))
    request = reset_email.call_args.args[0]
    payload = json.loads(request.data)
    link = payload["text"].split()[-1]
    token = parse_qs(urlsplit(link).query)["token"][0]
    claims = decode_reset_token(token)
    stored = get_user_by_id(user.id)
    assert claims["sub"] == user.id
    assert stored.password_reset_id == claims["jti"]
    assert stored.hashed_password == user.hashed_password
    assert verify_password("unit-test-password", stored.hashed_password)
    assert payload["to"] == [user.email]
    assert result == {"message": "If the account exists, a password reset link will be sent."}
    assert token not in str(result)


@pytest.mark.parametrize("scenario", ["unknown", "inactive", "provider", "config"])
def test_forgot_generic_result_for_unavailable_accounts_and_delivery(user_factory, reset_email, monkeypatch, database_paths, scenario):
    user = user_factory()
    if scenario == "inactive":
        with open_database() as db:
            db.table("users").update({"is_active": False}, Query().id == user.id)
    if scenario == "provider":
        reset_email.side_effect = OSError("synthetic provider failure")
    if scenario == "config":
        monkeypatch.delenv("RESEND_API_KEY")
    before = database_paths.users.read_bytes()
    email = "unknown@example.test" if scenario == "unknown" else user.email
    assert forgot_password(ForgotPasswordInput(email=email)) == {
        "message": "If the account exists, a password reset link will be sent."
    }
    if scenario == "provider":
        assert get_user_by_id(user.id).password_reset_id
        assert get_user_by_id(user.id).hashed_password == user.hashed_password
    else:
        reset_email.assert_not_called()
        assert database_paths.users.read_bytes() == before


def test_second_issuance_supersedes_first_even_when_delivery_fails(user_factory, reset_email):
    user = user_factory()
    data = ForgotPasswordInput(email=user.email)
    first_result = forgot_password(data)
    first_id = get_user_by_id(user.id).password_reset_id
    reset_email.side_effect = OSError("synthetic transport failure")
    assert forgot_password(data) == first_result
    assert get_user_by_id(user.id).password_reset_id not in (None, first_id)
    assert reset_email.call_count == 2


@pytest.mark.parametrize("payload", [{"email": "invalid"}, {"email": "a@example.test", "role": "admin"}, {}])
def test_forgot_invalid_model_never_sends_or_creates_store(payload, reset_email, database_paths):
    with pytest.raises(ValidationError):
        ForgotPasswordInput(**payload)
    reset_email.assert_not_called()
    assert not database_paths.users.exists()
