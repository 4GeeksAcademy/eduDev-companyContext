import pytest
from pydantic import ValidationError

from packages.shared.incidents import IncidentBranch, IncidentCategory, IncidentOrigin, IncidentStatus
from services.api.app.routers.incident_management import summarize_incidents


@pytest.mark.parametrize("populated", [False, True])
def test_summary_counts_every_dimension_and_zero_fills(populated, incident_factory):
    if populated:
        incident_factory()
        incident_factory(status="resolved", category="other", origin="customer", branch="central")
        incident_factory()
    summary = summarize_incidents()
    assert summary["total"] == (3 if populated else 0)
    for field, enum, nonzero in (
        ("status", IncidentStatus, {"open": 2, "resolved": 1}),
        ("category", IncidentCategory, {"lost_parcel": 2, "other": 1}),
        ("origin", IncidentOrigin, {"branch": 2, "customer": 1}),
        ("branch", IncidentBranch, {"la_warehouse": 2, "central": 1}),
    ):
        assert summary["by_" + field] == {
            value.value: nonzero.get(value.value, 0) if populated else 0 for value in enum
        }
        assert sum(summary["by_" + field].values()) == summary["total"]


def test_summary_refuses_malformed_record_not_partial_counts(database_paths, incident_factory):
    incident_factory()
    from tinydb import TinyDB
    with TinyDB(database_paths.incidents) as database:
        database.insert({"status": "open"})
    snapshot = database_paths.incidents.read_bytes()
    with pytest.raises(ValidationError):
        summarize_incidents()
    assert database_paths.incidents.read_bytes() == snapshot
