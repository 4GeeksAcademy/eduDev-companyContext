"""Shared fixtures for new business-unit tests only; no application startup.

Autouse isolation is local to tests/, not the preserved legacy API suites.
Factories use real models, TinyDB and bcrypt. No accounts exist until requested.
"""

from dataclasses import dataclass
from pathlib import Path
from unittest.mock import Mock

import pytest


@dataclass(frozen=True)
class DatabasePaths:
    users: Path
    suppliers: Path
    incidents: Path


@pytest.fixture
def database_paths(tmp_path, monkeypatch):
    """Per-test paths; monkeypatch restores previous environment on teardown."""
    paths = DatabasePaths(
        users=tmp_path / "users.json",
        suppliers=tmp_path / "suppliers.json",
        incidents=tmp_path / "incidents.json",
    )
    for variable, path in (
        ("TRACKFLOW_USERS_DB_PATH", paths.users),
        ("TRACKFLOW_SUPPLIERS_DB_PATH", paths.suppliers),
        ("TRACKFLOW_INCIDENTS_DB_PATH", paths.incidents),
    ):
        monkeypatch.setenv(variable, str(path))
    return paths


@pytest.fixture
def jwt_config(monkeypatch):
    """Synthetic credentials only; tests may override individual settings."""
    secret = "bullet-proof-tests-only-signing-secret-not-for-deployment"
    monkeypatch.setenv("JWT_SECRET_KEY", secret)
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    monkeypatch.setenv("PASSWORD_RESET_EXPIRE_MINUTES", "30")
    monkeypatch.setenv("RESEND_API_KEY", "bullet-proof-tests-only-provider-key")
    monkeypatch.setenv("RESEND_FROM_EMAIL", "TrackFlow Tests <sender@example.test>")
    monkeypatch.setenv("FRONTEND_PUBLIC_URL", "https://tracker.example.test")
    return secret


@pytest.fixture
def reset_email(monkeypatch):
    """Capture outbound HTTP while retaining real adapter/request construction.

    Inspect call_args on the returned Mock to decode the outgoing reset link.
    Configure side_effect to simulate provider/network failure. Never mock token,
    persistence or password business functions.
    """
    from services.api import email_delivery

    response = Mock()
    response.status = 200
    response.__enter__ = Mock(return_value=response)
    response.__exit__ = Mock(return_value=False)
    transport = Mock(return_value=response)
    monkeypatch.setattr(email_delivery.urllib.request, "urlopen", transport)
    return transport


@pytest.fixture(autouse=True)
def isolated_unit_environment(database_paths, jwt_config, reset_email):
    """Set safe storage/config/transport before each new unit test executes."""


@pytest.fixture
def user_factory(database_paths):
    """create(*, password=..., role=Role.user, **registration) -> real User.

    Roles are assigned through the trusted service, never public registration.
    The default password is synthetic and can be passed to real login helpers.
    """
    from services.api.auth_database import create_user, update_user
    from services.api.auth_models import RegistrationInput, Role, UserUpdate

    sequence = 0

    def create(*, password="unit-test-password", role=Role.user, **registration):
        nonlocal sequence
        sequence += 1
        registration.setdefault("email", f"user-{sequence}@example.test")
        user = create_user(RegistrationInput(password=password, **registration))
        if role != Role.user:
            user = update_user(user.id, UserUpdate(role=role))
        return user

    return create


@pytest.fixture
def incident_factory():
    from services.api.app.routers.incident_management import register_incident
    from services.api.incident_models import IncidentCreate

    def create(**fields):
        payload = dict(title="  Parcel issue  ", description=" Literal text\nwith spaces  ",
                       category="lost_parcel", origin="branch", branch="la_warehouse")
        return register_incident(IncidentCreate(**(payload | fields)))

    return create


@pytest.fixture
def supplier_factory():
    from services.api.models import SupplierCreate
    from services.api.routes.suppliers import create_supplier

    def create(**fields):
        payload = dict(name="  Unit carrier  ", country="USA",
                       categories=["carrier_last_mile"], rate_per_shipment=4.5,
                       currency="USD", status="active")
        return create_supplier(SupplierCreate(**(payload | fields)))

    return create
