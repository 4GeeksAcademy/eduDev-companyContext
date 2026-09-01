from __future__ import annotations

import csv
import io
import re
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from services.api.app.main import app
from services.api.app.routers import incidents
from shared.incident_analysis import REQUIRED_COLUMNS, analyze_csv_bytes


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
OFFICIAL_CSV = REPOSITORY_ROOT / "scripts" / "incidents-trackflow.csv"
EMAIL_PATTERN = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.IGNORECASE)
EXPECTED_SUMMARY = {
    "total_records": 100,
    "valid_records": 95,
    "invalid_records": 5,
    "invalid_reasons": {
        "invalid_incident_id": 0,
        "duplicate_incident_id": 0,
        "invalid_date": 0,
        "invalid_country": 0,
        "invalid_customer_type": 0,
        "invalid_tracking_number": 1,
        "carrier_country_mismatch": 1,
        "invalid_category": 1,
        "invalid_description": 0,
        "invalid_status": 0,
        "invalid_customer_email": 1,
        "closed_without_score": 1,
        "invalid_satisfaction_score": 0,
    },
    "categories": {
        "LOST_PARCEL": 14,
        "DELAYED_DELIVERY": 38,
        "WRONG_ADDRESS": 19,
        "RETURN_REQUEST": 17,
        "DAMAGE": 7,
    },
    "statuses": {"OPEN": 29, "CLOSED": 52, "DISCARDED": 14},
    "countries": {"US": 50, "ES": 45},
    "satisfaction": {
        "closed_incidents": 52,
        "scored_incidents": 52,
        "average": 3.06,
        "scores": {"1": 6, "2": 11, "3": 15, "4": 14, "5": 6},
    },
}


def upload(client: TestClient, content: bytes, filename: str = "incidents.csv", content_type: str = "text/csv"):
    return client.post(
        "/api/incidents/analyze",
        files={"file": (filename, content, content_type)},
    )


class IncidentEndpointsTest(unittest.TestCase):
    def setUp(self) -> None:
        incidents._last_result = None
        self.client = TestClient(app)

    def tearDown(self) -> None:
        incidents._last_result = None

    def assertAggregateOnly(self, content: str) -> None:
        self.assertFalse(
            bool(EMAIL_PATTERN.search(content)),
            "Aggregate output contained an email-like value.",
        )

    def test_official_upload_matches_context_shared_core_and_export(self) -> None:
        official_content = OFFICIAL_CSV.read_bytes()
        response = upload(self.client, official_content)
        self.assertEqual(response.status_code, 200)
        summary = response.json()
        self.assertEqual(summary, EXPECTED_SUMMARY)
        self.assertEqual(summary, analyze_csv_bytes(official_content))
        self.assertAggregateOnly(response.text)

        export = self.client.get("/api/incidents/results/export")
        self.assertEqual(export.status_code, 200)
        self.assertTrue(export.headers["content-type"].startswith("text/csv"))
        self.assertIn('filename="results.csv"', export.headers["content-disposition"])
        rows = list(csv.reader(io.StringIO(export.text)))
        self.assertEqual(rows[0], ["section", "metric", "value"])
        self.assertEqual(len(rows), 35)
        self.assertAggregateOnly(export.text)

    def test_export_requires_successful_analysis(self) -> None:
        response = self.client.get("/api/incidents/results/export")
        self.assertEqual(response.status_code, 404)
        self.assertIn("No successful incident analysis", response.json()["detail"])

    def test_rejects_missing_file(self) -> None:
        self.assertEqual(self.client.post("/api/incidents/analyze").status_code, 400)

    def test_rejects_wrong_extension_and_content_type(self) -> None:
        wrong_extension = upload(self.client, b"unused", filename="incidents.txt")
        self.assertEqual(wrong_extension.status_code, 415)
        self.assertIn(".csv extension", wrong_extension.json()["detail"])

        wrong_content_type = upload(
            self.client,
            b"unused",
            content_type="application/octet-stream",
        )
        self.assertEqual(wrong_content_type.status_code, 415)
        self.assertIn("CSV content type", wrong_content_type.json()["detail"])

    def test_rejects_empty_csv(self) -> None:
        response = upload(self.client, b"")
        self.assertEqual(response.status_code, 400)
        self.assertIn("empty", response.json()["detail"].lower())

    def test_rejects_invalid_utf8(self) -> None:
        response = upload(self.client, b"\xff")
        self.assertEqual(response.status_code, 422)
        self.assertIn("UTF-8", response.json()["detail"])

    def test_rejects_malformed_csv_and_invalid_headers(self) -> None:
        cases = (
            (
                "malformed",
                (",".join(REQUIRED_COLUMNS) + '\n"unterminated').encode(),
                "malformed",
            ),
            ("missing header", b"incident_id,date\n", "missing columns"),
            (
                "unexpected header",
                (",".join((*REQUIRED_COLUMNS, "unexpected")) + "\n").encode(),
                "unexpected columns",
            ),
        )
        for label, content, expected_detail in cases:
            with self.subTest(label=label):
                response = upload(self.client, content)
                self.assertEqual(response.status_code, 422)
                self.assertIn(expected_detail, response.json()["detail"].lower())

    def test_localhost_cors_preflight_allows_post(self) -> None:
        response = self.client.options(
            "/api/incidents/analyze",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["access-control-allow-origin"], "http://localhost:3000")
        self.assertIn("POST", response.headers["access-control-allow-methods"])
        self.assertIn("content-type", response.headers["access-control-allow-headers"].lower())
        self.assertNotIn("access-control-allow-credentials", response.headers)


if __name__ == "__main__":
    unittest.main()
