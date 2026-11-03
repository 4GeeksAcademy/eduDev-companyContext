"""Real-app caching contracts; synthetic identities and disposable stores only."""
from concurrent.futures import ThreadPoolExecutor
from threading import Event
from unittest.mock import patch

from fastapi.testclient import TestClient
import pytest

from services.api.app.main import app
from services.api.app.routers import incident_management as routes
from services.api.tests.auth_helpers import register_and_login

PAYLOAD = dict(title="Synthetic parcel", description="Synthetic exception",
               category="lost_parcel", origin="branch", branch="central")
PATHS = ("/api/incidents", "/api/incidents?status=open", "/api/incidents/summary")


@pytest.fixture
def clients(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "")
    with TestClient(app) as first, TestClient(app) as second:
        first_id, headers = register_and_login(first, "first@example.test")
        first.headers.update(headers)
        _, headers = register_and_login(second, "second@example.test")
        second.headers.update(headers)
        yield first, second, first_id


def create(client):
    response = client.post("/api/incidents", json=PAYLOAD)
    assert response.status_code == 201
    assert set(response.json()) == set(PAYLOAD) | {"status", "id", "created_at", "updated_at"}
    return response.json()


@pytest.mark.parametrize("path", PATHS)
def test_hit_is_user_scoped_and_expires(clients, path, monkeypatch):
    first, second, _ = clients
    create(first)
    with patch.object(routes, "list_incidents", wraps=routes.list_incidents) as scan:
        before = first.get(path)
        assert before.status_code == 200
        assert first.get(path).json() == before.json()
        assert scan.call_count == 1
        assert second.get(path).json() == before.json()
        assert scan.call_count == 2  # Never share another user's entry.
        from services.api import cache
        now = cache.monotonic()
        monkeypatch.setattr(cache, "monotonic", lambda: now + 31)
        assert first.get(path).json() == before.json()
        assert scan.call_count == 3


def test_canonical_filters_and_capacity(clients, monkeypatch):
    first, _, _ = clients
    from services.api.incident_store import incident_cache
    monkeypatch.setattr(incident_cache, "capacity", 2)
    create(first)
    schema = first.get("/openapi.json").json()
    for path, name in (("/api/incidents", "find_incidents"),
                       ("/api/incidents/summary", "summarize_incidents")):
        operation = schema["paths"][path]["get"]
        assert operation["operationId"] == name + path.replace("/", "_") + "_get"
        assert operation["summary"] == name.replace("_", " ").title()
    with patch.object(routes, "list_incidents", wraps=routes.list_incidents) as scan:
        a = first.get("/api/incidents?branch=central&status=open")
        b = first.get("/api/incidents?status=open&branch=central")
        assert a.status_code == b.status_code == 200 and a.json() == b.json()
        assert scan.call_count == 1
        for path in ("/api/incidents", "/api/incidents/summary",
                     "/api/incidents?branch=central&status=open"):
            assert first.get(path).status_code == 200
        assert scan.call_count == 4  # Oldest entry evicted; bounded cache.


def test_writes_invalidate_all_users_and_filters(clients):
    first, second, _ = clients
    record = create(first)
    for client in (first, second):
        for path in PATHS:
            assert client.get(path).status_code == 200
    create(first)
    for client in (first, second):
        assert len(client.get(PATHS[0]).json()) == 2
        assert len(client.get(PATHS[1]).json()) == 2
        assert client.get(PATHS[2]).json()["total"] == 2
    changed = second.patch(f"/api/incidents/{record['id']}/status", json={"status": "in_progress"})
    assert changed.status_code == 200
    for client in (first, second):
        assert len(client.get(PATHS[1]).json()) == 1
        assert client.get(PATHS[2]).json()["by_status"]["in_progress"] == 1
        assert {r['status'] for r in client.get(PATHS[0]).json()} == {"open", "in_progress"}
        assert client.get(f"/api/incidents/{record['id']}").json() == changed.json()


@pytest.mark.parametrize("operation", ["create", "status"])
def test_partial_write_failure_invalidates_all_users_and_filters(clients, operation):
    first, second, _ = clients
    original = create(first)
    for client in (first, second):
        for path in PATHS:
            assert client.get(path).status_code == 200

    # Exercise real TinyDB serialization/flush: fsync fails after bytes change.
    with patch("tinydb.storages.os.fsync", side_effect=OSError(5, "Synthetic I/O error")):
        if operation == "create":
            response = first.post("/api/incidents", json=PAYLOAD)
        else:
            response = first.patch(f"/api/incidents/{original['id']}/status",
                                   json={"status": "in_progress"})
    assert response.status_code == 500
    assert response.json() == {"detail": "Incident service unavailable."}

    expected_count = 2 if operation == "create" else 1
    for client in (first, second):
        detail = client.get(f"/api/incidents/{original['id']}")
        assert detail.status_code == 200
        assert detail.json()["status"] == ("open" if operation == "create" else "in_progress")
        listing = client.get("/api/incidents")
        assert listing.status_code == 200
        records = listing.json()
        assert len(records) == expected_count
        assert len({record["id"] for record in records}) == expected_count
        assert detail.json() in records
        for record in records:
            persisted = client.get(f"/api/incidents/{record['id']}")
            assert persisted.status_code == 200
            assert persisted.json() == record
            assert {key: record[key] for key in PAYLOAD} == PAYLOAD
        filtered = client.get("/api/incidents?status=open")
        assert filtered.status_code == 200
        assert filtered.json() == [record for record in records if record["status"] == "open"]
        summary = client.get("/api/incidents/summary")
        assert summary.status_code == 200
        counts = summary.json()
        assert counts["total"] == expected_count
        for field in ("status", "category", "origin", "branch"):
            assert counts["by_" + field] == {
                value: sum(record[field] == value for record in records)
                for value in counts["by_" + field]
            }
            assert sum(counts["by_" + field].values()) == expected_count


def test_warmed_reads_still_authenticate_and_errors_preserve_data(clients):
    first, second, first_id = clients
    record = create(first)
    before = {path: first.get(path).json() for path in PATHS}
    detail = first.get(f"/api/incidents/{record['id']}").json()
    invalid = first.get("/api/incidents?status=invalid")
    assert invalid.status_code == 400
    assert invalid.json() == {"detail": "Invalid incident request.",
                              "errors": {"status": "Choose a supported value."}}
    for method, path, payload, code, body in (
        ("post", "/api/incidents", {}, 400, {"detail": "Invalid incident request.",
         "errors": {key: "This field is required." for key in PAYLOAD}}),
        ("patch", f"/api/incidents/{record['id']}/status", {"status": "open"}, 400,
         {"detail": "Invalid incident request.", "errors": {"status": "This status transition is not allowed."}}),
        ("patch", "/api/incidents/missing/status", {"status": "resolved"}, 404,
         {"detail": "Incident not found."}),
    ):
        response = getattr(first, method)(path, json=payload)
        assert response.status_code == code and response.json() == body
    assert first.get(f"/api/incidents/{record['id']}").json() == detail
    assert {path: second.get(path).json() for path in PATHS} == before
    assert first.delete(f"/users/{first_id}").status_code == 204
    for path in PATHS:
        response = first.get(path)
        assert response.status_code == 401
        assert response.json() == {"detail": "Invalid authentication credentials"}
        assert response.headers["www-authenticate"] == "Bearer"
    assert {path: second.get(path).json() for path in PATHS} == before


def test_concurrent_read_cannot_repopulate_stale_data(clients):
    first, second, _ = clients
    scanned, release, writing = Event(), Event(), Event()
    original = routes.list_incidents
    from services.api import incident_store
    original_lock = incident_store._LOCK
    contention = []

    class ObservedLock:
        def __enter__(self):
            if scanned.is_set() and not release.is_set():
                acquired = original_lock.acquire(blocking=False)
                contention.append(not acquired)
                if acquired:
                    original_lock.release()
                writing.set()  # Writer reached the persistence lock, not just its thread.
            return original_lock.__enter__()

        def __exit__(self, *args):
            return original_lock.__exit__(*args)

    def paused_scan():
        result = original()
        scanned.set()
        assert release.wait(5), "Read barrier not released"
        return result

    def write():
        return create(second)

    with patch.object(routes, "list_incidents", side_effect=paused_scan), patch.object(
        incident_store, "_LOCK", ObservedLock()
    ):
        with ThreadPoolExecutor(max_workers=2) as pool:
            read = pool.submit(first.get, "/api/incidents/summary")
            try:
                assert scanned.wait(5)
                written = pool.submit(write)
                assert writing.wait(5)
            finally:
                release.set()
            assert read.result(timeout=5).status_code == 200
            written.result(timeout=5)
    assert contention == [True]
    assert first.get("/api/incidents/summary").json()["total"] == 1


def test_store_namespace_and_load_failure_are_isolated(clients, monkeypatch, tmp_path):
    first, _, _ = clients
    create(first)
    assert first.get("/api/incidents/summary").json()["total"] == 1
    monkeypatch.setenv("TRACKFLOW_INCIDENTS_DB_PATH", str(tmp_path / "another.json"))
    with patch.object(routes, "list_incidents", side_effect=OSError("private storage detail")):
        response = first.get("/api/incidents/summary")
        assert response.status_code == 500
        assert response.json() == {"detail": "Incident service unavailable."}
    assert first.get("/api/incidents/summary").json()["total"] == 0
    assert first.get("/api/incidents").json() == []


def test_timing_logs_only_safe_metadata(clients, caplog):
    first, _, _ = clients
    with caplog.at_level("INFO", logger="trackflow.timing"):
        response = first.get("/api/incidents?private_query_marker=hidden")
    assert response.status_code == 400
    records = [r for r in caplog.records if r.name == "trackflow.timing"]
    assert len(records) == 1
    message = records[0].getMessage()
    assert message.startswith("GET /api/incidents 400 ") and message.endswith("ms")
    assert "hidden" not in message and "private_query_marker" not in message
    assert "Bearer" not in message
