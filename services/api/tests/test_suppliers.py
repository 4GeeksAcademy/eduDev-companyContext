from __future__ import annotations

import json
import os
import tempfile
import time
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from services.api.app.main import app
from services.api.database import DB_PATH_ENV, get_supplier, insert_supplier
from services.api.seed import SUPPLIERS_SEED, seed_suppliers


VALID_SUPPLIER = {
    "name": "Test Carrier",
    "country": "USA",
    "categories": ["carrier_last_mile", "reverse_logistics"],
    "rate_per_shipment": 8.25,
    "currency": "USD",
    "status": "active",
    "service_zone": "West Coast",
    "contact_email": "ops@example.test",
    "notes": "Test-only supplier.",
}


class SupplierApiTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.previous_path = os.environ.get(DB_PATH_ENV)
        os.environ[DB_PATH_ENV] = str(Path(self.temporary_directory.name) / "suppliers.json")
        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.client.close()
        if self.previous_path is None:
            os.environ.pop(DB_PATH_ENV, None)
        else:
            os.environ[DB_PATH_ENV] = self.previous_path
        self.temporary_directory.cleanup()

    def create(self, **overrides: object):
        return self.client.post("/suppliers", json={**VALID_SUPPLIER, **overrides})

    def test_post_returns_complete_supplier_with_id_and_server_timestamp(self) -> None:
        response = self.create()
        self.assertEqual(response.status_code, 201)
        supplier = response.json()
        self.assertIsInstance(supplier["id"], int)
        self.assertEqual(supplier["name"], VALID_SUPPLIER["name"])
        self.assertEqual(supplier["service_zone"], VALID_SUPPLIER["service_zone"])
        self.assertEqual(supplier["contact_email"], VALID_SUPPLIER["contact_email"])
        self.assertEqual(supplier["notes"], VALID_SUPPLIER["notes"])
        self.assertIn("updated_at", supplier)

        rejected = self.create(name="Timestamp Injection", updated_at="2020-01-01T00:00:00Z")
        self.assertEqual(rejected.status_code, 422)

    def test_invalid_create_payloads_return_422_without_writes(self) -> None:
        cases = {
            "blank name": {"name": "  "},
            "missing country": {"country": None},
            "invalid country": {"country": "France"},
            "empty categories": {"categories": []},
            "invalid category": {"categories": ["food"]},
            "zero rate": {"rate_per_shipment": 0},
            "negative rate": {"rate_per_shipment": -1},
            "invalid status": {"status": "paused"},
            "currency mismatch": {"country": "Spain", "currency": "USD"},
        }
        for label, overrides in cases.items():
            with self.subTest(label=label):
                response = self.create(**overrides)
                self.assertEqual(response.status_code, 422)
        self.assertEqual(self.client.get("/suppliers").json(), [])

    def test_list_country_category_and_combined_filters(self) -> None:
        self.create(name="USA Carrier")
        self.create(
            name="Spain Carrier",
            country="Spain",
            currency="EUR",
            categories=["carrier_last_mile"],
        )
        self.create(name="USA Returns", categories=["reverse_logistics"])

        self.assertEqual(len(self.client.get("/suppliers").json()), 3)
        self.assertEqual(
            {item["name"] for item in self.client.get("/suppliers?country=Spain").json()},
            {"Spain Carrier"},
        )
        self.assertEqual(
            {item["name"] for item in self.client.get("/suppliers?category=reverse_logistics").json()},
            {"USA Carrier", "USA Returns"},
        )
        combined = self.client.get(
            "/suppliers?country=Spain&category=reverse_logistics"
        )
        self.assertEqual(combined.status_code, 200)
        self.assertEqual(combined.json(), [])

    def test_get_rate_status_and_delete_lifecycle(self) -> None:
        created = self.create().json()
        supplier_id = created["id"]
        self.assertEqual(self.client.get(f"/suppliers/{supplier_id}").status_code, 200)

        time.sleep(0.002)
        rate_response = self.client.patch(
            f"/suppliers/{supplier_id}/rate", json={"rate_per_shipment": 9.75}
        )
        self.assertEqual(rate_response.status_code, 200)
        self.assertEqual(rate_response.json()["rate_per_shipment"], 9.75)
        self.assertNotEqual(rate_response.json()["updated_at"], created["updated_at"])
        self.assertEqual(
            self.client.patch(
                f"/suppliers/{supplier_id}/rate", json={"rate_per_shipment": 0}
            ).status_code,
            422,
        )

        status_response = self.client.patch(
            f"/suppliers/{supplier_id}/status", json={"status": "suspended"}
        )
        self.assertEqual(status_response.status_code, 200)
        self.assertEqual(status_response.json()["status"], "suspended")

        deleted = self.client.delete(f"/suppliers/{supplier_id}")
        self.assertEqual(deleted.status_code, 200)
        self.assertEqual(deleted.json(), {"success": True, "id": supplier_id})

    def test_missing_resources_and_invalid_patch_statuses(self) -> None:
        self.assertEqual(self.client.get("/suppliers/999").status_code, 404)
        self.assertEqual(
            self.client.patch("/suppliers/999/rate", json={"rate_per_shipment": 1}).status_code,
            404,
        )
        self.assertEqual(
            self.client.patch("/suppliers/999/status", json={"status": "active"}).status_code,
            404,
        )
        self.assertEqual(
            self.client.patch("/suppliers/999/status", json={"status": "paused"}).status_code,
            422,
        )
        self.assertEqual(self.client.delete("/suppliers/999").status_code, 404)

    def test_cors_preflight_allows_supplier_mutations_and_json_header(self) -> None:
        for method in ("PATCH", "DELETE"):
            with self.subTest(method=method):
                response = self.client.options(
                    "/suppliers/1/status",
                    headers={
                        "Origin": "http://localhost:3000",
                        "Access-Control-Request-Method": method,
                        "Access-Control-Request-Headers": "content-type",
                    },
                )
                self.assertEqual(response.status_code, 200)
                self.assertIn(method, response.headers["access-control-allow-methods"])
                self.assertIn("content-type", response.headers["access-control-allow-headers"].lower())


class SupplierPersistenceAndSeedTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.previous_path = os.environ.get(DB_PATH_ENV)
        self.database_path = Path(self.temporary_directory.name) / "suppliers.json"
        os.environ[DB_PATH_ENV] = str(self.database_path)

    def tearDown(self) -> None:
        if self.previous_path is None:
            os.environ.pop(DB_PATH_ENV, None)
        else:
            os.environ[DB_PATH_ENV] = self.previous_path
        self.temporary_directory.cleanup()

    def test_data_survives_database_reopen(self) -> None:
        supplier_id = insert_supplier(
            {
                **VALID_SUPPLIER,
                "updated_at": "2026-09-01T00:00:00+00:00",
            }
        )
        self.assertEqual(get_supplier(supplier_id)["name"], "Test Carrier")
        on_disk = json.loads(self.database_path.read_text(encoding="utf-8"))
        self.assertEqual(on_disk["_default"][str(supplier_id)]["name"], "Test Carrier")

    def test_seed_inserts_exact_canonical_set_once(self) -> None:
        self.assertEqual(seed_suppliers(), 15)
        self.assertEqual(seed_suppliers(), 0)
        with TestClient(app) as client:
            suppliers = client.get("/suppliers").json()
        self.assertEqual(len(suppliers), 15)
        self.assertEqual(
            {supplier["name"] for supplier in suppliers},
            {supplier["name"] for supplier in SUPPLIERS_SEED},
        )
        suppliers_by_name = {supplier["name"]: supplier for supplier in suppliers}
        for expected in SUPPLIERS_SEED:
            actual = suppliers_by_name[expected["name"]]
            for field, value in expected.items():
                self.assertEqual(actual[field], value)


if __name__ == "__main__":
    unittest.main()
