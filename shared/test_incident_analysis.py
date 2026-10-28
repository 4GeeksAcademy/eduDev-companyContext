from __future__ import annotations

import unittest
import re
import subprocess
import tempfile
from pathlib import Path

from shared.incident_analysis import (
    EmptyCSVError,
    InvalidHeaderError,
    MalformedCSVError,
    REQUIRED_COLUMNS,
    analyze_csv_bytes,
    analyze_csv_text,
    results_to_csv,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
OFFICIAL_CSV = REPOSITORY_ROOT / "scripts" / "incidents-trackflow.csv"
CLI = REPOSITORY_ROOT / "scripts" / "analyze.py"
EMAIL_PATTERN = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.IGNORECASE)


class IncidentAnalysisTest(unittest.TestCase):
    def test_counts_one_invalid_row_once_with_every_reason(self) -> None:
        content = ",".join(REQUIRED_COLUMNS) + "\n" + (
            "TRF-000001,2026-08-01,US,B2C,x,MRW,UNKNOWN,No,CLOSED,invalid,\n"
        )
        summary = analyze_csv_text(content)
        self.assertEqual(summary["total_records"], 1)
        self.assertEqual(summary["invalid_records"], 1)
        self.assertEqual(summary["valid_records"], 0)
        self.assertEqual(summary["invalid_reasons"]["invalid_tracking_number"], 1)
        self.assertEqual(summary["invalid_reasons"]["carrier_country_mismatch"], 1)
        self.assertEqual(summary["invalid_reasons"]["invalid_category"], 1)
        self.assertEqual(summary["invalid_reasons"]["invalid_customer_email"], 1)
        self.assertEqual(summary["invalid_reasons"]["closed_without_score"], 1)

    def test_rejects_invalid_header_and_utf8(self) -> None:
        with self.assertRaises(InvalidHeaderError):
            analyze_csv_text("wrong\nvalue\n")
        with self.assertRaises(UnicodeDecodeError):
            analyze_csv_bytes(b"\xff")

    def test_rejects_empty_and_malformed_csv(self) -> None:
        with self.assertRaises(EmptyCSVError):
            analyze_csv_bytes(b"")
        with self.assertRaises(EmptyCSVError):
            analyze_csv_text(",".join(REQUIRED_COLUMNS) + "\n")
        with self.assertRaises(MalformedCSVError):
            analyze_csv_text(",".join(REQUIRED_COLUMNS) + '\n"unterminated')

    def test_export_contains_only_aggregate_metrics(self) -> None:
        content = ",".join(REQUIRED_COLUMNS) + "\n" + (
            "TRF-000001,2026-08-01,US,B2C,TRACK123,UPS,DAMAGE,"
            "Synthetic fixture,CLOSED,person@example.test,5\n"
        )
        export = results_to_csv(analyze_csv_text(content))
        self.assertIn("categories,DAMAGE,1", export)
        self.assertNotIn("person@example.test", export)

    def test_official_file_matches_expected_aggregates(self) -> None:
        summary = analyze_csv_bytes(OFFICIAL_CSV.read_bytes())
        self.assertEqual(
            (summary["total_records"], summary["valid_records"], summary["invalid_records"]),
            (100, 95, 5),
        )
        self.assertEqual(
            summary["categories"],
            {
                "LOST_PARCEL": 14,
                "DELAYED_DELIVERY": 38,
                "WRONG_ADDRESS": 19,
                "RETURN_REQUEST": 17,
                "DAMAGE": 7,
            },
        )
        self.assertEqual(summary["statuses"], {"OPEN": 29, "CLOSED": 52, "DISCARDED": 14})
        self.assertEqual(summary["countries"], {"US": 50, "ES": 45})
        self.assertEqual(
            {key: count for key, count in summary["invalid_reasons"].items() if count},
            {
                "invalid_tracking_number": 1,
                "carrier_country_mismatch": 1,
                "invalid_category": 1,
                "invalid_customer_email": 1,
                "closed_without_score": 1,
            },
        )
        self.assertEqual(summary["satisfaction"]["scores"], {"1": 6, "2": 11, "3": 15, "4": 14, "5": 6})
        self.assertEqual(summary["satisfaction"]["average"], 3.06)

    def test_cli_n_and_y_are_aggregate_only(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            working_directory = Path(directory)
            no_export = subprocess.run(
                ["python3", str(CLI), str(OFFICIAL_CSV)],
                input="n\n",
                text=True,
                capture_output=True,
                cwd=working_directory,
                check=False,
            )
            self.assertEqual(no_export.returncode, 0)
            self.assertIn("Export results to CSV? [y / n]:", no_export.stdout)
            self.assertIsNone(EMAIL_PATTERN.search(no_export.stdout + no_export.stderr))
            self.assertFalse((working_directory / "results.csv").exists())

            with_export = subprocess.run(
                ["python3", str(CLI), str(OFFICIAL_CSV)],
                input="invalid\ny\n",
                text=True,
                capture_output=True,
                cwd=working_directory,
                check=False,
            )
            self.assertEqual(with_export.returncode, 0)
            self.assertIn("Please enter y or n.", with_export.stdout)
            export_content = (working_directory / "results.csv").read_text(encoding="utf-8")
            self.assertIsNone(EMAIL_PATTERN.search(with_export.stdout + with_export.stderr + export_content))

    def test_cli_sanitizes_parse_read_and_write_failures(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "private-input.csv"
            cases = [
                ("private@example.test\nvalue\n", "Error: Invalid incident CSV; check the header and record structure.\n"),
                (",".join(REQUIRED_COLUMNS) + '\n"unterminated', "Error: Invalid incident CSV; check the header and record structure.\n"),
                (",".join(REQUIRED_COLUMNS) + "\n", "Error: Invalid incident CSV; check the header and record structure.\n"),
            ]
            for content, expected in cases:
                source.write_text(content)
                result = subprocess.run(["python3", str(CLI), str(source)], cwd=root, capture_output=True, text=True)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(result.stderr, expected)
            source.write_bytes(b"\xff")
            result = subprocess.run(["python3", str(CLI), str(source)], cwd=root, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(result.stderr, "Error: The CSV file must use valid UTF-8 encoding.\n")
            missing = root / "private-missing.csv"
            result = subprocess.run(["python3", str(CLI), str(missing)], cwd=root, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertNotIn(str(missing), result.stderr)
            (root / "results.csv").mkdir()
            result = subprocess.run(["python3", str(CLI), str(OFFICIAL_CSV)], input="y\n", cwd=root, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(result.stderr, "Error: Could not write results.csv; check output directory permissions and available space.\n")

    def test_cli_read_io_failure_is_sanitized(self) -> None:
        from contextlib import redirect_stderr
        from io import StringIO
        from unittest.mock import patch
        from scripts import analyze
        stderr = StringIO()
        with patch.object(analyze.sys, "argv", ["analyze.py", str(OFFICIAL_CSV)]), patch.object(analyze, "analyze_csv_file", side_effect=OSError("private/path secret")), redirect_stderr(stderr):
            self.assertNotEqual(analyze.main(), 0)
        self.assertEqual(stderr.getvalue(), "Error: Could not read CSV; check the input path and read permissions.\n")

    def test_cli_fails_clearly_for_missing_argument_and_path(self) -> None:
        for arguments, expected in (([], "Usage:"), (["missing.csv"], "CSV file not found")):
            completed = subprocess.run(
                ["python3", str(CLI), *arguments],
                text=True,
                capture_output=True,
                check=False,
            )
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn(expected, completed.stderr)


if __name__ == "__main__":
    unittest.main()
