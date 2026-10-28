from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from packages.shared.incidents import IncidentStatus
from services.api import incident_store
from services.api.app.routers.incident_management import change_status, read_incident
from services.api.incident_models import IncidentStatusUpdate


@pytest.mark.parametrize("current", list(IncidentStatus))
@pytest.mark.parametrize("target", list(IncidentStatus))
def test_every_lifecycle_pair_preserves_identity_or_rejects_without_write(
    current, target, incident_factory, database_paths, monkeypatch
):
    record = incident_factory(status=current)
    snapshot = database_paths.incidents.read_bytes()
    later = datetime(2040, 1, 1, tzinfo=timezone.utc)
    monkeypatch.setattr(incident_store, "utc_now", lambda: later)
    result = change_status(record.id, IncidentStatusUpdate(status=target))
    allowed = {("open", "in_progress"), ("open", "discarded"),
               ("in_progress", "resolved"), ("in_progress", "discarded")}
    if (current, target) in allowed:
        assert result.model_dump() == record.model_dump() | {"status": target, "updated_at": later}
        assert read_incident(record.id) == result
    else:
        assert result.status_code == 400
        assert read_incident(record.id) == record
        assert database_paths.incidents.read_bytes() == snapshot


def test_missing_status_target_is_404():
    with pytest.raises(HTTPException) as error:
        change_status("unknown", IncidentStatusUpdate(status="resolved"))
    assert error.value.status_code == 404


@pytest.mark.parametrize("payload", [{"status": "bad"}, {}, {"status": "open", "title": "new"}])
def test_invalid_status_model_cannot_mutate(payload, incident_factory, database_paths):
    incident_factory()
    snapshot = database_paths.incidents.read_bytes()
    with pytest.raises(ValidationError):
        IncidentStatusUpdate(**payload)
    assert database_paths.incidents.read_bytes() == snapshot


def test_competing_identical_transitions_have_one_winner(incident_factory):
    record = incident_factory()
    def attempt(_):
        return change_status(record.id, IncidentStatusUpdate(status="in_progress"))
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(attempt, range(2)))
    assert sum(isinstance(result, type(record)) for result in results) == 1
    assert [result.status_code for result in results if not isinstance(result, type(record))] == [400]
    assert read_incident(record.id).status == "in_progress"


def test_status_storage_failure_propagates(database_paths):
    database_paths.incidents.write_text("broken JSON")
    with pytest.raises(ValueError):
        change_status("unknown", IncidentStatusUpdate(status="in_progress"))
