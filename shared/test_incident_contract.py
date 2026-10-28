"""Deterministic shared-rule and legacy compatibility checks."""
import csv
import io
import unittest

from packages.shared import incident_validation as rules
from packages.shared.incidents import (
    IncidentBranch, IncidentCategory, IncidentOrigin, IncidentStatus,
    validate_status_transition, validate_nonblank,
)
from shared import incident_analysis as legacy


class IncidentContractTest(unittest.TestCase):
    def test_legacy_exports_are_shared_objects(self):
        for name in ("REQUIRED_COLUMNS", "CATEGORIES", "STATUSES", "COUNTRIES",
                     "CUSTOMER_TYPES", "CARRIERS_BY_COUNTRY", "REASON_LABELS",
                     "EmptyCSVError", "InvalidHeaderError", "MalformedCSVError"):
            self.assertIs(getattr(legacy, name), getattr(rules, name))
        self.assertIs(legacy._validate_record, rules.validate_record)
        self.assertIs(legacy._validate_header, rules.validate_header)

    def test_legacy_record_rules_and_duplicate_ownership(self):
        record = dict(zip(rules.REQUIRED_COLUMNS, (
            "TRF-000001", "2024-02-29", "US", "B2C", "TRACK123", "UPS",
            "DAMAGE", "Fixture text", "CLOSED", "person@example.test", "5")))
        seen = set()
        self.assertEqual(rules.validate_record(record, seen), [])
        self.assertEqual(seen, set())
        self.assertEqual(rules.validate_record(record, {record['incident_id']}),
                         ['duplicate_incident_id'])
        for field, value, reason in (
            ('date', '2023-02-29', 'invalid_date'),
            ('satisfaction_score', '05', 'invalid_satisfaction_score'),
            ('satisfaction_score', '', 'closed_without_score'),
            ('status', 'resolved', 'invalid_status'),
            ('description', 'abcd', 'invalid_description'),
        ):
            with self.subTest(field=field, value=value):
                self.assertIn(reason, rules.validate_record({**record, field: value}, set()))

    def test_optional_seed_id_validation_keeps_analyzer_strict(self):
        record = dict(zip(rules.REQUIRED_COLUMNS, (
            "", "2024-02-29", "US", "B2C", "TRACK123", "UPS",
            "DAMAGE", "Fixture text", "OPEN", "person@example.test", "")))
        for absent in (False, True):
            candidate = dict(record)
            if absent:
                candidate.pop("incident_id")
            columns = list(candidate)
            self.assertEqual(rules.validate_record(candidate, set(), allow_missing_incident_id=True), [])
            rules.validate_header(columns, allow_missing_incident_id=True)
            if absent:
                with self.assertRaises(rules.InvalidHeaderError):
                    rules.validate_header(columns)
            self.assertIn("invalid_incident_id", rules.validate_record(candidate, set()))
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=columns)
            writer.writeheader()
            writer.writerow(candidate)
            if absent:
                with self.assertRaises(rules.InvalidHeaderError):
                    legacy.analyze_csv_text(output.getvalue())
            else:
                summary = legacy.analyze_csv_text(output.getvalue())
                self.assertEqual(summary["invalid_records"], 1)
                self.assertEqual(summary["invalid_reasons"]["invalid_incident_id"], 1)
        self.assertIn("invalid_incident_id", rules.validate_record(
            {**record, "incident_id": "bad"}, set(), allow_missing_incident_id=True))
        with self.assertRaises(rules.InvalidHeaderError):
            rules.validate_header([c for c in record if c != "date"], allow_missing_incident_id=True)

    def test_manager_enums_are_exact_and_separate(self):
        self.assertEqual(set(IncidentStatus), {'open', 'in_progress', 'resolved', 'discarded'})
        self.assertEqual(set(IncidentOrigin), {'customer', 'branch', 'internal'})
        self.assertEqual(set(IncidentBranch), {'central', 'la_warehouse', 'la_office',
                                             'zaragoza_warehouse', 'zaragoza_office'})
        self.assertEqual(set(IncidentCategory), {'lost_parcel', 'delivery_failure',
            'inventory_discrepancy', 'carrier_issue', 'returns_issue', 'warehouse_incident',
            'system_failure', 'client_complaint', 'other'})
        self.assertEqual(rules.STATUSES, ('OPEN', 'CLOSED', 'DISCARDED'))

    def test_all_lifecycle_pairs(self):
        allowed = {('open', 'in_progress'), ('open', 'discarded'),
                   ('in_progress', 'resolved'), ('in_progress', 'discarded')}
        for current in IncidentStatus:
            for target in IncidentStatus:
                with self.subTest(current=current, target=target):
                    if (current, target) in allowed:
                        self.assertEqual(validate_status_transition(current, target), target)
                    else:
                        with self.assertRaises(ValueError):
                            validate_status_transition(current, target)
        with self.assertRaises(ValueError):
            validate_status_transition('unknown', 'open')

    def test_nonblank_preserves_literal_text(self):
        self.assertEqual(validate_nonblank('  Historical text\n'), '  Historical text\n')
        for value in ('', ' \t\n'):
            with self.assertRaises(ValueError):
                validate_nonblank(value)
