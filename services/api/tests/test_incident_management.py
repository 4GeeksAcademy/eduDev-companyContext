"""Manager HTTP contracts, using only isolated temporary stores."""
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from uuid import UUID
from datetime import datetime

from fastapi.testclient import TestClient

from auth_helpers import register_and_login
from services.api.app.main import app
from services.api.incident_store import insert_incident_if_absent, list_incidents
from packages.shared.incidents import (
    IncidentStatus, IncidentCategory, IncidentOrigin, IncidentBranch, STATUS_TRANSITIONS,
)
from scripts.seed_incidents import read_incidents

BASE = "/api/incidents"
PAYLOAD = dict(title="Parcel issue", description="Investigate parcel", category="other",
               origin="internal", branch="central")
GROUPS = dict(by_status=IncidentStatus, by_category=IncidentCategory,
              by_origin=IncidentOrigin, by_branch=IncidentBranch)


class IncidentManagementTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.path = Path(directory.name) / "incidents.json"
        environment = patch.dict(os.environ, {
            "TRACKFLOW_USERS_DB_PATH": str(Path(directory.name) / "users.json"),
            "TRACKFLOW_SUPPLIERS_DB_PATH": str(Path(directory.name) / "suppliers.json"),
            "TRACKFLOW_INCIDENTS_DB_PATH": str(self.path),
            "JWT_SECRET_KEY": "manager-test-only-secret",
            "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
        })
        environment.start()
        self.addCleanup(environment.stop)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        self.user_id, self.headers = register_and_login(self.client)
        self.client.headers.update(self.headers)

    def create(self, **changes):
        response = self.client.post(BASE, json=PAYLOAD | changes)
        self.assertEqual(response.status_code, 201)
        return response.json()

    def assert_safe_error(self, response, code, field=None):
        self.assertEqual(response.status_code, code)
        body = response.json()
        self.assertIsInstance(body["detail"], str)
        if field:
            self.assertIn(field, body["errors"])
        for forbidden in ("Traceback", "secret-marker", "input", "ctx"):
            self.assertNotIn(forbidden, response.text)

    def test_creation_and_lookup(self):
        record = self.create(description="  Literal text  ")
        self.assertEqual(set(record), set(PAYLOAD) | {"status", "id", "created_at", "updated_at"})
        self.assertEqual(UUID(record["id"]).version, 4)
        self.assertEqual(record["status"], "open")
        self.assertEqual(record["description"], "  Literal text  ")
        self.assertIsNotNone(datetime.fromisoformat(record["created_at"]).tzinfo)
        self.assertEqual(record["created_at"], record["updated_at"])
        self.assertEqual(self.client.get(BASE + "/" + record["id"]).json(), record)
        for status in IncidentStatus:
            self.assertEqual(self.create(status=status)["status"], status)

    def test_safe_validation_and_nonmutation(self):
        for field in PAYLOAD:
            for value in (None, 42, "", "  "):
                with self.subTest(field=field, value=value):
                    self.assert_safe_error(self.client.post(BASE, json=PAYLOAD | {field: value}), 400, field)
            missing = PAYLOAD.copy()
            del missing[field]
            self.assert_safe_error(self.client.post(BASE, json=missing), 400, field)
        for field in ("category", "status", "origin", "branch"):
            self.assert_safe_error(self.client.post(BASE, json=PAYLOAD | {field: "secret-marker"}), 400, field)
        for field in ("id", "created_at", "updated_at", "surprise"):
            self.assert_safe_error(self.client.post(BASE, json=PAYLOAD | {field: "secret-marker"}), 400, field)
        for kwargs in ({}, {"content": "{"}, {"json": []}):
            self.assert_safe_error(self.client.post(BASE, **kwargs), 400, "body")
        self.assertEqual(list_incidents(), [])

    def test_filters_and_query_validation(self):
        first = self.create()
        second = self.create(status="resolved", origin="branch", branch="la_office", category="carrier_issue")
        for field in ("status", "origin", "branch", "category"):
            self.assertEqual(self.client.get(BASE, params={field: second[field]}).json(), [second])
            self.assert_safe_error(self.client.get(BASE, params={field: "secret-marker"}), 400, field)
        self.assertEqual(self.client.get(BASE, params={"status": "resolved", "branch": "la_office"}).json(), [second])
        self.assertEqual(self.client.get(BASE, params={"status": "open", "branch": "la_office"}).json(), [])
        self.assert_safe_error(self.client.get(BASE, params={"unknown": "secret-marker"}), 400, "unknown")
        self.assertEqual(self.client.get(BASE).json(), [first, second])

    def test_empty_and_official_summary(self):
        expected = {"total": 0} | {key: {item.value: 0 for item in enum} for key, enum in GROUPS.items()}
        self.assertEqual(self.client.get(BASE).json(), [])
        self.assertEqual(self.client.get(BASE + "/summary").json(), expected)
        records, invalid = read_incidents(Path("scripts/incidents-trackflow.csv"))
        self.assertEqual((len(records), len(invalid)), (95, 5))
        for record in records:
            insert_incident_if_absent(record)
        expected["total"] = 95
        expected["by_status"].update(open=29, resolved=52, discarded=14)
        expected["by_category"].update(lost_parcel=14, carrier_issue=45, delivery_failure=19, returns_issue=17)
        expected["by_origin"].update(customer=95)
        expected["by_branch"].update(la_office=50, zaragoza_office=45)
        self.assertEqual(self.client.get(BASE + "/summary").json(), expected)

    def test_all_lifecycle_edges_and_status_only(self):
        for current in IncidentStatus:
            for target in IncidentStatus:
                with self.subTest(current=current, target=target):
                    original = self.create(status=current)
                    url = BASE + "/" + original["id"] + "/status"
                    response = self.client.patch(url, json={"status": target})
                    if (current, target) in STATUS_TRANSITIONS:
                        self.assertEqual(response.status_code, 200)
                        updated = response.json()
                        self.assertEqual(updated["status"], target)
                        self.assertGreater(datetime.fromisoformat(updated["updated_at"]), datetime.fromisoformat(original["updated_at"]))
                        self.assertEqual({k: v for k, v in updated.items() if k not in ("status", "updated_at")},
                                         {k: v for k, v in original.items() if k not in ("status", "updated_at")})
                    else:
                        self.assert_safe_error(response, 400, "status")
                        self.assertEqual(self.client.get(BASE + "/" + original["id"]).json(), original)
        original = self.create()
        url = BASE + "/" + original["id"] + "/status"
        for body in ({}, {"status": None}, {"status": "bad"}, {"status": "in_progress", "title": "changed"}):
            self.assert_safe_error(self.client.patch(url, json=body), 400)
        self.assertEqual(self.client.get(BASE + "/" + original["id"]).json(), original)
        self.assert_safe_error(self.client.get(BASE + "/absent"), 404)
        self.assert_safe_error(self.client.patch(BASE + "/absent/status", json={"status": "resolved"}), 404)

    def test_auth_all_five_routes_and_roles(self):
        from services.api.auth_database import update_user
        from services.api.auth_models import UserUpdate
        routes = [("post", BASE, {"json": PAYLOAD}), ("get", BASE, {}),
                  ("get", BASE + "/summary", {}), ("get", BASE + "/absent", {}),
                  ("patch", BASE + "/absent/status", {"json": {"status": "resolved"}})]
        for token in (None, "Bearer invalid"):
            self.client.headers.pop("Authorization", None)
            if token:
                self.client.headers["Authorization"] = token
            for method, url, kwargs in routes:
                self.assertEqual(getattr(self.client, method)(url, **kwargs).status_code, 401)
        self.client.headers.update(self.headers)
        for role in ("user", "manager", "admin"):
            update_user(self.user_id, UserUpdate(role=role))
            for method, url, kwargs in routes:
                self.assertIn(getattr(self.client, method)(url, **kwargs).status_code, (200, 201, 404))
        # Revoke directly in the isolated identity store, as operational tests do.
        from tinydb import TinyDB, Query
        with TinyDB(os.environ["TRACKFLOW_USERS_DB_PATH"]) as db:
            db.table("users").update({"is_active": False}, Query().id == self.user_id)
        for method, url, kwargs in routes:
            self.assertEqual(getattr(self.client, method)(url, **kwargs).status_code, 401)

    def test_safe_unexpected_failures(self):
        from services.api.app.routers import incident_management as manager
        for name, method, url, kwargs in (
            ("list_incidents", "get", BASE, {}),
            ("list_incidents", "get", BASE + "/summary", {}),
            ("create_incident", "post", BASE, {"json": PAYLOAD}),
            ("get_incident", "get", BASE + "/absent", {}),
            ("update_incident_status", "patch", BASE + "/absent/status", {"json": {"status": "resolved"}}),
        ):
            for error in (OSError("secret-marker /private/path"), ValueError("secret-marker")):
                with patch.object(manager, name, side_effect=error):
                    self.assertEqual(getattr(self.client, method)(url, **kwargs).json(), {"detail": "Incident service unavailable."})
                    self.assert_safe_error(getattr(self.client, method)(url, **kwargs), 500)
        with patch.object(manager, "create_incident", return_value={"title": "secret-marker"}):
            self.assert_safe_error(self.client.post(BASE, json=PAYLOAD), 500)
        self.path.write_text("{", encoding="utf-8")
        self.assert_safe_error(self.client.get(BASE), 500)
        self.assert_safe_error(self.client.patch(BASE + "/absent/status", json={"status": "resolved"}), 500)

    def test_analyzer_static_routes_preserved(self):
        from services.api.app.routers import incidents
        with patch.object(incidents, "_last_result", None):
            self.assertEqual(self.client.get(BASE + "/results/export").status_code, 404)
            response = self.client.post(BASE + "/analyze", files={"file": ("bad.txt", b"bad", "text/plain")})
            self.assertEqual(response.status_code, 415)
        self.assertEqual(self.client.post("/users", json={}).status_code, 422)


if __name__ == "__main__":
    unittest.main()
