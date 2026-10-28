import pytest
from pydantic import ValidationError

from services.api.app.routers.incident_management import IncidentFilters, find_incidents


@pytest.mark.parametrize("filters,expected", [
    ({}, {0, 1, 2}), ({"status": "open"}, {0, 2}),
    ({"origin": "branch"}, {0, 1}), ({"branch": "la_warehouse"}, {0, 2}),
    ({"category": "lost_parcel"}, {0, 1}),
    ({"status": "open", "origin": "branch", "branch": "la_warehouse",
      "category": "lost_parcel"}, {0}),
    ({"status": "resolved"}, set()),
])
def test_filters_select_exact_membership(filters, expected, incident_factory, database_paths):
    records = [incident_factory(), incident_factory(status="in_progress", branch="central"),
               incident_factory(origin="internal", category="other")]
    snapshot = database_paths.incidents.read_bytes()
    result = find_incidents(IncidentFilters(**filters))
    assert {record.id for record in result} == {records[i].id for i in expected}
    assert database_paths.incidents.read_bytes() == snapshot


def test_empty_list():
    assert find_incidents(IncidentFilters()) == []


@pytest.mark.parametrize("filters", [{"status": "bad"}, {"origin": "bad"},
                                     {"branch": "bad"}, {"category": "bad"}, {"unknown": "x"}])
def test_invalid_filters_rejected(filters):
    with pytest.raises(ValidationError):
        IncidentFilters(**filters)


def test_list_corruption_fails_instead_of_partial_result(database_paths, incident_factory):
    incident_factory()
    database_paths.incidents.write_text('{"_default":{"1":{"title":"incomplete"}}}')
    with pytest.raises(ValidationError):
        find_incidents(IncidentFilters())
