"""Incident schemas only: no application startup, storage, or network."""
import unittest
from datetime import datetime, timedelta, timezone
from uuid import UUID

from pydantic import ValidationError
from services.api.incident_models import Incident, IncidentCreate, IncidentStatusUpdate
from packages.shared.incidents import IncidentStatus


class IncidentModelsTest(unittest.TestCase):
    def payload(self, **changes):
        return dict(title='A' * 121, description='  Literal historical text\n',
                    category='other', origin='customer', branch='central', **changes)

    def test_registration_defaults_and_literal_text(self):
        model = IncidentCreate(**self.payload())
        self.assertEqual(model.status, 'open')
        self.assertEqual(len(model.title), 121)
        self.assertEqual(model.description, '  Literal historical text\n')
        for status in IncidentStatus:
            self.assertEqual(IncidentCreate(**self.payload(status=status)).status, status)

    def test_required_fields_and_invalid_enums(self):
        for field in ('title', 'description', 'category', 'origin', 'branch'):
            payload = self.payload()
            del payload[field]
            with self.subTest(missing=field), self.assertRaises(ValidationError):
                IncidentCreate(**payload)
        for field in ('title', 'description'):
            for value in ('', ' \n\t', None, 123):
                payload = self.payload()
                payload[field] = value
                with self.subTest(field=field, value=value), self.assertRaises(ValidationError):
                    IncidentCreate(**payload)
        for field in ('category', 'origin', 'branch', 'status'):
            payload = self.payload()
            payload[field] = 'UNKNOWN'
            with self.subTest(field=field), self.assertRaises(ValidationError):
                IncidentCreate(**payload)

    def test_branch_required_for_every_origin(self):
        for origin in ('customer', 'branch', 'internal'):
            payload = self.payload()
            payload['origin'] = origin
            for branch in (None, '', ' '):
                payload['branch'] = branch
                with self.subTest(origin=origin, branch=branch), self.assertRaises(ValidationError):
                    IncidentCreate(**payload)

    def test_generated_fields_are_not_registration_inputs(self):
        for field in ('id', 'created_at', 'updated_at', 'unexpected'):
            with self.subTest(field=field), self.assertRaises(ValidationError):
                IncidentCreate(**self.payload(**{field: 'anything'}))

    def test_record_identity_and_utc_timestamps(self):
        first, second = Incident(**self.payload()), Incident(**self.payload())
        UUID(first.id)
        self.assertNotEqual(first.id, second.id)
        self.assertEqual(first.created_at.utcoffset(), timedelta(0))
        self.assertEqual(first.updated_at.utcoffset(), timedelta(0))
        source = datetime(2024, 1, 2, 3, tzinfo=timezone(timedelta(hours=3)))
        stored = Incident(**self.payload(created_at=source, updated_at=source))
        self.assertEqual(stored.created_at, datetime(2024, 1, 2, tzinfo=timezone.utc))
        self.assertEqual(stored.created_at.utcoffset(), timedelta(0))
        for field in ('created_at', 'updated_at'):
            with self.subTest(field=field), self.assertRaises(ValidationError):
                Incident(**self.payload(**{field: datetime(2024, 1, 1)}))

    def test_status_update_only_accepts_status(self):
        for status in IncidentStatus:
            self.assertEqual(IncidentStatusUpdate(status=status).status, status)
        for payload in ({}, {'status': 'OPEN'}, {'status': None},
                        {'status': 'resolved', 'title': 'No'},
                        {'status': 'open', 'updated_at': '2024-01-01'}):
            with self.subTest(payload=payload), self.assertRaises(ValidationError):
                IncidentStatusUpdate(**payload)
