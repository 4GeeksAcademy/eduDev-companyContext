import pytest
from fastapi import HTTPException

from services.api.app.routers.incident_management import read_incident


def test_get_preserves_exact_record(incident_factory, database_paths):
    record = incident_factory(status="discarded")
    snapshot = database_paths.incidents.read_bytes()
    assert read_incident(record.id) == record
    assert database_paths.incidents.read_bytes() == snapshot


def test_unknown_id_is_absent_without_mutation(incident_factory, database_paths):
    incident_factory()
    snapshot = database_paths.incidents.read_bytes()
    with pytest.raises(HTTPException) as error:
        read_incident("unknown")
    assert error.value.status_code == 404
    assert database_paths.incidents.read_bytes() == snapshot


def test_get_storage_failure_is_not_absence(database_paths):
    database_paths.incidents.write_text("broken JSON")
    with pytest.raises(ValueError):
        read_incident("unknown")
