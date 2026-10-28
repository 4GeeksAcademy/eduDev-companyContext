from datetime import datetime, timezone
from uuid import UUID

import pytest
from pydantic import ValidationError

from services.api.app.routers.incident_management import register_incident
from services.api.incident_models import IncidentCreate
from services.api.incident_store import get_incident


def test_create_preserves_literal_text_and_generated_identity(incident_factory):
    before = datetime.now(timezone.utc)
    record = incident_factory(title="x" * 121)
    assert UUID(record.id).version == 4
    assert record.status == "open"
    assert record.title == "x" * 121
    assert record.description == " Literal text\nwith spaces  "
    assert before <= record.created_at <= datetime.now(timezone.utc)
    assert record.updated_at == record.created_at
    assert record.created_at.utcoffset().total_seconds() == 0
    assert get_incident(record.id) == record


@pytest.mark.parametrize("changes", [
    {"title": " \n"}, {"description": ""}, {"category": "unknown"},
    {"origin": "unknown"}, {"branch": "unknown"}, {"status": "unknown"},
    {"id": "injected"}, {"created_at": "2020-01-01T00:00:00Z"},
    {"updated_at": "2020-01-01T00:00:00Z"},
])
def test_invalid_creation_cannot_write(changes, database_paths):
    payload = dict(title="Title", description="Text", category="other",
                   origin="customer", branch="central")
    with pytest.raises(ValidationError):
        register_incident(IncidentCreate(**(payload | changes)))
    assert not database_paths.incidents.exists()


def test_branch_required_even_for_nonbranch_origin(database_paths):
    with pytest.raises(ValidationError):
        IncidentCreate(title="Title", description="Text", category="other", origin="internal")
    assert not database_paths.incidents.exists()


def test_create_storage_corruption_propagates(incident_factory, database_paths):
    database_paths.incidents.write_text("broken JSON")
    with pytest.raises(ValueError):
        incident_factory()
    assert database_paths.incidents.read_text() == "broken JSON"
