"""Exercise real email configuration and Request construction, never network."""
import json
from urllib.parse import parse_qs, urlsplit

import pytest

from services.api.auth import AuthConfigurationError
from services.api.email_delivery import delivery_configuration, send_password_reset


def test_email_request_encodes_link_and_provider_contract(reset_email):
    token = "synthetic+a/b?c=&token"
    send_password_reset("recipient@example.test", token, delivery_configuration())
    request = reset_email.call_args.args[0]
    assert reset_email.call_args.kwargs == {"timeout": 10}
    assert request.full_url == "https://api.resend.com/emails"
    assert request.get_method() == "POST"
    assert request.get_header("Authorization") == "Bearer bullet-proof-tests-only-provider-key"
    assert request.get_header("Content-type") == "application/json"
    assert request.get_header("User-agent") == "TrackFlow/1.0"
    payload = json.loads(request.data)
    assert set(payload) == {"from", "to", "subject", "text"}
    assert payload["from"] == "TrackFlow Tests <sender@example.test>"
    assert payload["to"] == ["recipient@example.test"]
    assert payload["subject"] == "Reset your TrackFlow password"
    link = urlsplit(payload["text"].split()[-1])
    assert (link.scheme, link.netloc, link.path) == ("https", "tracker.example.test", "/reset-password")
    assert parse_qs(link.query) == {"token": [token]}
    reset_email.return_value.__enter__.assert_called_once()
    reset_email.return_value.__exit__.assert_called_once()


def test_email_configuration_strips_trailing_slash(monkeypatch):
    monkeypatch.setenv("FRONTEND_PUBLIC_URL", " https://tracker.example.test/app/ ")
    assert delivery_configuration()[2] == "https://tracker.example.test/app"


@pytest.mark.parametrize("variable,value", [
    ("RESEND_API_KEY", " "), ("RESEND_FROM_EMAIL", ""),
    ("FRONTEND_PUBLIC_URL", "ftp://tracker.example.test"),
    ("FRONTEND_PUBLIC_URL", "https:///missing-host"),
    ("FRONTEND_PUBLIC_URL", "https://user:pass@tracker.example.test"),
    ("FRONTEND_PUBLIC_URL", "https://tracker.example.test?query=value"),
    ("FRONTEND_PUBLIC_URL", "https://tracker.example.test#fragment"),
])
def test_email_invalid_configuration_never_calls_transport(monkeypatch, reset_email, variable, value):
    monkeypatch.setenv(variable, value)
    with pytest.raises(AuthConfigurationError, match="^Recovery configuration unavailable$"):
        delivery_configuration()
    reset_email.assert_not_called()


@pytest.mark.parametrize("status", [199, 300, 403, 500])
def test_email_non_success_status_is_delivery_failure(reset_email, status):
    reset_email.return_value.status = status
    with pytest.raises(OSError, match="^Email delivery unavailable$"):
        send_password_reset("recipient@example.test", "synthetic-token", delivery_configuration())
    reset_email.return_value.__exit__.assert_called_once()


def test_email_network_failure_propagates_to_generic_route_boundary(reset_email):
    reset_email.side_effect = OSError("synthetic network failure")
    with pytest.raises(OSError, match="synthetic network failure"):
        send_password_reset("recipient@example.test", "synthetic-token", delivery_configuration())
    reset_email.assert_called_once()
