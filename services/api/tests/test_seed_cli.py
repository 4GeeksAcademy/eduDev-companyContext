"""Supplier CLI failures and idempotency use isolated storage only."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from services.api import seed

ROOT = Path(__file__).resolve().parents[3]


class SupplierSeedCLITests(unittest.TestCase):
    def test_success_and_rerun(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "nested" / "suppliers.json"
            first = self.run_seed(path)
            second = self.run_seed(path)
            self.assertEqual(first.returncode, 0, first.stderr)
            self.assertEqual(second.returncode, 0, second.stderr)
            self.assertIn("inserted 15 supplier(s)", first.stdout)
            self.assertIn("inserted 0 supplier(s)", second.stdout)
            self.assertEqual(first.stderr + second.stderr, "")

    def run_seed(self, path):
        return subprocess.run(
            [sys.executable, "-m", "services.api.seed"], cwd=ROOT,
            env={**os.environ, "TRACKFLOW_SUPPLIERS_DB_PATH": str(path)},
            capture_output=True, text=True,
        )

    def test_expected_storage_failures_are_safe(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            corrupt = root / "private-corrupt.json"
            corrupt.write_text("not JSON private@example.test")
            blocked_parent = root / "private-parent"
            blocked_parent.write_text("not a directory")
            for path in (root, corrupt, blocked_parent / "db.json"):
                with self.subTest(path=path):
                    result = self.run_seed(path)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertEqual(result.stdout, "")
                    self.assertEqual(result.stderr, "Error: supplier seed storage unavailable; check TRACKFLOW_SUPPLIERS_DB_PATH, JSON integrity and write permissions before retrying.\n")

    def test_programmer_error_is_not_reclassified(self):
        with patch.object(seed, "seed_suppliers", side_effect=ValueError("bug")):
            with self.assertRaises(ValueError):
                seed.main()
