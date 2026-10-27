"""Operational policy exercised with real JWTs and isolated stores."""

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from jose import jwt
from tinydb import Query, TinyDB

from services.api.app.main import app
from services.api.app.routers import incidents
from auth_helpers import register_and_login
from test_incidents import OFFICIAL_CSV
from test_suppliers import VALID_SUPPLIER


ROUTES = (
    ("POST", "/api/incidents/analyze", {}, 400),
    ("GET", "/api/incidents/results/export", {}, 404),
    ("POST", "/suppliers", {"json": VALID_SUPPLIER}, 201),
    ("GET", "/suppliers", {}, 200),
    ("GET", "/suppliers/999", {}, 404),
    ("DELETE", "/suppliers/999", {}, 404),
    ("PATCH", "/suppliers/999/rate", {"json": {"rate_per_shipment": 1}}, 404),
    ("PATCH", "/suppliers/999/status", {"json": {"status": "active"}}, 404),
)


class OperationalAuthTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.identity_path = Path(directory.name) / "users.json"
        environment = patch.dict(os.environ, {
            "TRACKFLOW_USERS_DB_PATH": str(self.identity_path),
            "TRACKFLOW_SUPPLIERS_DB_PATH": str(Path(directory.name) / "suppliers.json"),
            "JWT_SECRET_KEY": "operational-test-only-secret",
            "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
        })
        environment.start()
        self.addCleanup(environment.stop)
        incidents._last_result = None
        self.addCleanup(setattr, incidents, "_last_result", None)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        self.user_id, self.headers = register_and_login(self.client)

    def assertRejected(self, headers):
        for method, path, kwargs, _ in ROUTES:
            with self.subTest(method=method, path=path):
                response = self.client.request(method, path, headers=headers, **kwargs)
                self.assertEqual(response.status_code, 401, response.text)
                self.assertEqual(response.headers.get("www-authenticate"), "Bearer")

    def test_missing_malformed_and_expired_tokens_all_routes(self):
        expired = jwt.encode({"sub": self.user_id, "exp": 1},
                             os.environ["JWT_SECRET_KEY"], algorithm="HS256")
        for headers in ({}, {"Authorization": "Bearer invalid"},
                        {"Authorization": "Basic invalid"},
                        {"Authorization": "Bearer " + expired}):
            with self.subTest(headers=headers):
                self.assertRejected(headers)
        self.assertIsNone(incidents._last_result)

    def test_all_active_roles_keep_existing_behavior(self):
        for role in ("user", "manager", "admin"):
            with TinyDB(self.identity_path) as db:
                db.table("users").update({"role": role}, Query().id == self.user_id)
            for method, path, kwargs, expected in ROUTES:
                with self.subTest(role=role, method=method, path=path):
                    response = self.client.request(method, path, headers=self.headers, **kwargs)
                    self.assertEqual(response.status_code, expected, response.text)

    def test_database_inactivation_and_deletion_revoke_all_routes(self):
        with TinyDB(self.identity_path) as db:
            db.table("users").update({"is_active": False}, Query().id == self.user_id)
        self.assertRejected(self.headers)
        with TinyDB(self.identity_path) as db:
            db.table("users").remove(Query().id == self.user_id)
        self.assertRejected(self.headers)

    def test_shared_aggregate_between_authenticated_users(self):
        response = self.client.post("/api/incidents/analyze", headers=self.headers,
                                    files={"file": ("incidents.csv", OFFICIAL_CSV.read_bytes(), "text/csv")})
        self.assertEqual(response.status_code, 200)
        _, other = register_and_login(self.client, "other@example.test")
        export = self.client.get("/api/incidents/results/export", headers=other)
        self.assertEqual(export.status_code, 200)
        self.assertNotIn("@", export.text)
        rejected = self.client.post("/api/incidents/analyze", headers=other)
        self.assertEqual(rejected.status_code, 400)
        self.assertEqual(self.client.get("/api/incidents/results/export", headers=other).text, export.text)

    def test_public_cors_preflight_allows_put_authorization_not_other_origin(self):
        self.assertEqual(self.client.get("/docs").status_code, 200)
        schema = self.client.get("/openapi.json")
        self.assertEqual(schema.status_code, 200)
        for method, path, _, _ in ROUTES:
            documented_path = path.replace("/999", "/{supplier_id}")
            self.assertTrue(schema.json()["paths"][documented_path][method.lower()]["security"])
        for origin, expected in (("http://localhost:3000", 200),
                                 ("http://127.0.0.1:3000", 200),
                                 ("https://unrelated.example.test", 400)):
            response = self.client.options("/profiles/me", headers={
                "Origin": origin, "Access-Control-Request-Method": "PUT",
                "Access-Control-Request-Headers": "authorization,content-type",
            })
            self.assertEqual(response.status_code, expected, response.text)
            self.assertNotIn("access-control-allow-credentials", response.headers)
            if expected == 200:
                self.assertEqual(response.headers["access-control-allow-origin"], origin)
                self.assertIn("PUT", response.headers["access-control-allow-methods"])
                self.assertIn("authorization", response.headers["access-control-allow-headers"].lower())
            else:
                self.assertNotIn("access-control-allow-origin", response.headers)
