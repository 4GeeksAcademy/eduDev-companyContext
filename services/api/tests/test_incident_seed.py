"""Root-invoked CLI tests use only temporary incident databases."""
import csv
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from collections import Counter
from unittest.mock import patch

from packages.shared.incident_validation import REQUIRED_COLUMNS

ROOT = Path(__file__).resolve().parents[3]


class IncidentSeedTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.db = Path(self.temp.name) / "incidents.json"
        self.env = {**os.environ, "TRACKFLOW_INCIDENTS_DB_PATH": str(self.db)}

    def run_seed(self, source):
        return subprocess.run([sys.executable, "scripts/seed_incidents.py", str(source)], cwd=ROOT, env=self.env, capture_output=True, text=True)

    def records(self):
        return list(json.loads(self.db.read_text())["_default"].values())

    def source(self, rows, include_id=True):
        path = Path(self.temp.name) / "input.csv"
        with path.open("w", newline="") as output:
            columns = REQUIRED_COLUMNS if include_id else [c for c in REQUIRED_COLUMNS if c != "incident_id"]
            writer = csv.DictWriter(output, fieldnames=columns)
            writer.writeheader()
            writer.writerows(rows)
        return path

    def row(self, **changes):
        row = dict(zip(REQUIRED_COLUMNS, ["TRF-999001", "2025-01-02", "US", "B2C", "TRACK1234", "UPS", "LOST_PARCEL", "Literal description", "OPEN", "private@example.test", ""]))
        return {**row, **changes}

    def test_official_totals_rerun_and_status_preservation(self):
        source = ROOT / "scripts/incidents-trackflow.csv"
        first = self.run_seed(source)
        self.assertEqual(first.returncode, 0, first.stderr)
        self.assertIn("inserted=95 existing=0 invalid=5", first.stdout)
        records = self.records()
        for field, expected in {
            "status": {"open": 29, "resolved": 52, "discarded": 14},
            "category": {"lost_parcel": 14, "carrier_issue": 45, "delivery_failure": 19, "returns_issue": 17},
            "origin": {"customer": 95}, "branch": {"la_office": 50, "zaragoza_office": 45},
        }.items():
            self.assertEqual(Counter(r[field] for r in records), expected)
        from services.api.incident_store import update_incident_status, get_incident
        record = next(r for r in records if r["status"] == "open")
        with patch.dict(os.environ, self.env):
            changed = update_incident_status(record["id"], "in_progress")
            second = self.run_seed(source)
            self.assertEqual(get_incident(record["id"]), changed)
        self.assertEqual(second.returncode, 0, second.stderr)
        self.assertIn("inserted=0 existing=95 invalid=5", second.stdout)
        self.assertNotIn("@", first.stdout + first.stderr)

    def test_literal_title_identity_dates_and_no_csv_fields(self):
        description = "  " + "x" * 130 + "\n literal tail  "
        result = self.run_seed(self.source([self.row(description=description), self.row(incident_id=" TRF-999002 ", description=description)]))
        self.assertEqual(result.returncode, 0, result.stderr)
        records = self.records()
        self.assertEqual(len({r["id"] for r in records}), 2)
        for record in records:
            self.assertEqual(record["description"], description)
            self.assertEqual(record["title"], description[:120].strip())
            self.assertEqual(record["created_at"], "2025-01-02T00:00:00Z")
            self.assertEqual(record["updated_at"], record["created_at"])
            self.assertEqual(set(record), {"id", "title", "description", "category", "status", "origin", "branch", "created_at", "updated_at"})

    def test_invalid_duplicate_ownership_and_safe_reasons(self):
        rows = [self.row(category="PRIVATE_UNMAPPABLE"), self.row(), self.row(incident_id="malformed"), self.row(incident_id="TRF-999003", description=" " * 120 + "valid tail")]
        result = self.run_seed(self.source(rows))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("inserted=0 existing=0 invalid=4", result.stdout)
        self.assertIn("duplicate_incident_id", result.stdout)
        self.assertIn("invalid_incident_id", result.stdout)
        self.assertNotIn("PRIVATE_UNMAPPABLE", result.stdout + result.stderr)
        self.assertNotIn("private@example.test", result.stdout + result.stderr)

    def test_structural_and_io_errors_are_safe_and_nonzero(self):
        path = Path(self.temp.name) / "bad.csv"
        for content in ["secret@example.test\nvalue\n", ",".join(REQUIRED_COLUMNS) + '\n"unterminated', ",".join(REQUIRED_COLUMNS) + "\nshort,row\n", "", ",".join(REQUIRED_COLUMNS) + "\n"]:
            path.write_text(content)
            result = self.run_seed(path)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("Error: cannot read", result.stderr)
            self.assertNotIn("Traceback", result.stderr)
            self.assertNotIn("secret@example.test", result.stderr)
            self.assertFalse(self.db.exists())
        result = self.run_seed(Path(self.temp.name) / "absent.csv")
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("Traceback", result.stderr)

    def test_missing_id_fallback_identity_and_nonoverwrite(self):
        from services.api.incident_store import get_incident, update_incident_status
        for include_id, blank in [(False, None), (True, ""), (True, " \t ")]:
            with self.subTest(include_id=include_id, blank=blank):
                row = self.row(incident_id=blank)
                if not include_id:
                    row.pop("incident_id")
                path = self.source([row, row], include_id=include_id)
                result = self.run_seed(path)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(len(self.records()), 1)
                record = self.records()[0]
                from uuid import UUID, uuid5
                identity = json.dumps(["title+created_at", "Literal description", "2025-01-02T00:00:00+00:00"], ensure_ascii=True, separators=(",", ":"))
                self.assertEqual(record["id"], str(uuid5(UUID("a38f716a-d93e-5a2b-9dc9-d81d3b3d6139"), identity)))
                self.assertEqual(set(record), {"id", "title", "description", "category", "status", "origin", "branch", "created_at", "updated_at"})
                with patch.dict(os.environ, self.env):
                    before = get_incident(record["id"])
                    if before.status == "open":
                        before = update_incident_status(record["id"], "in_progress")
                    rerun = self.run_seed(path)
                    self.assertEqual(get_incident(record["id"]), before)
                self.assertIn("inserted=0 existing=2 invalid=0", rerun.stdout)
        result = self.run_seed(self.source([
            self.row(incident_id="", description="Different title"),
            self.row(incident_id="", date="2025-01-03"),
        ]))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len(self.records()), 3)

    def test_fallback_uses_transformed_title_not_full_description(self):
        title = 'quoted "title"| with delimiter ' + 'x' * 120
        result = self.run_seed(self.source([
            self.row(incident_id="", description=title + " first tail"),
            self.row(incident_id="", description=title + " second tail"),
        ]))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("inserted=1 existing=1 invalid=0", result.stdout)
        self.assertEqual(len(self.records()), 1)
        self.assertEqual(self.records()[0]["title"], title[:120].strip())

    def test_fallback_enforces_other_rules_and_valid_id_compatibility(self):
        from uuid import UUID, uuid5
        result = self.run_seed(self.source([
            self.row(incident_id="", category="UNKNOWN"),
            self.row(incident_id="", date="bad"),
            self.row(incident_id="", customer_email="bad"),
            self.row(incident_id="bad"),
            self.row(incident_id=" TRF-999001 "),
        ]))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("inserted=1 existing=0 invalid=4", result.stdout)
        expected = str(uuid5(UUID("a38f716a-d93e-5a2b-9dc9-d81d3b3d6139"), "TRF-999001"))
        self.assertEqual(self.records()[0]["id"], expected)

    def test_database_failure_not_reported_as_existing(self):
        self.db.mkdir()
        result = self.run_seed(self.source([self.row()]))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("failures=1", result.stdout)
        self.assertIn("Error: incident storage failed", result.stderr)
        self.assertNotIn("existing=1", result.stdout)
        self.assertNotIn("Traceback", result.stderr)
