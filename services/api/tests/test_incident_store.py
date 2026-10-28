"""Incident persistence contracts, isolated from runtime data."""
import os
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

from services.api.incident_models import Incident, IncidentCreate
from services.api.incident_store import (
    create_incident, insert_incident_if_absent, list_incidents,
    get_incident, update_incident_status,
)


class IncidentStoreTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.env = patch.dict(os.environ, {"TRACKFLOW_INCIDENTS_DB_PATH": self.temp.name + "/nested/incidents.json"})
        self.env.start()
        self.addCleanup(self.env.stop)

    def payload(self):
        return IncidentCreate(title="Parcel", description="Literal parcel description", category="lost_parcel", origin="customer", branch="la_office")

    def test_empty_create_roundtrip_and_fields(self):
        self.assertEqual(list_incidents(), [])
        self.assertIsNone(get_incident("missing"))
        self.assertIsNone(update_incident_status("missing", "in_progress"))
        record = create_incident(self.payload())
        self.assertEqual(get_incident(record.id), record)
        self.assertEqual(list_incidents(), [record])
        self.assertEqual(set(record.model_dump()), {"id", "title", "description", "category", "status", "origin", "branch", "created_at", "updated_at"})
        self.assertEqual(record.created_at, record.updated_at)

    def test_transition_and_insert_never_overwrite(self):
        record = create_incident(self.payload())
        before = get_incident(record.id)
        with self.assertRaises(ValueError):
            update_incident_status(record.id, "resolved")
        self.assertEqual(get_incident(record.id), before)
        changed = update_incident_status(record.id, "in_progress")
        self.assertEqual(changed.created_at, record.created_at)
        self.assertGreater(changed.updated_at, record.updated_at)
        self.assertFalse(insert_incident_if_absent(record))
        self.assertEqual(get_incident(record.id), changed)
        update_incident_status(record.id, "resolved")
        with self.assertRaises(ValueError):
            update_incident_status(record.id, "open")

    def test_competing_transitions_use_latest_status(self):
        record = create_incident(self.payload())

        def transition(target):
            try:
                return update_incident_status(record.id, target)
            except ValueError:
                return None

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(transition, ["discarded", "in_progress"]))
        stored = get_incident(record.id)
        self.assertEqual(stored.status, "discarded")
        self.assertIn(stored, results)

    def test_threads_keep_distinct_writes_and_deduplicate(self):
        with ThreadPoolExecutor(max_workers=8) as pool:
            records = list(pool.map(lambda _: create_incident(self.payload()), range(24)))
        self.assertEqual(len(list_incidents()), 24)
        fixed = Incident(**self.payload().model_dump())
        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(lambda _: insert_incident_if_absent(fixed), range(16)))
        self.assertEqual(sum(results), 1)
        self.assertEqual(len(list_incidents()), len(records) + 1)
