"""Real routing failure-injection checks; no runtime stores or network calls."""

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from starlette.datastructures import UploadFile

from auth_helpers import register_and_login
from services.api.app.main import app
from services.api.app.routers import incidents


HOSTILE = "private@example.test /private/store token=secret traceback submitted input"
SAFE = {"detail": "Service unavailable."}


class ErrorResponsesTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        environment = patch.dict(os.environ, {
            "TRACKFLOW_USERS_DB_PATH": str(Path(directory.name) / "users.json"),
            "TRACKFLOW_SUPPLIERS_DB_PATH": str(Path(directory.name) / "suppliers.json"),
            "TRACKFLOW_INCIDENTS_DB_PATH": str(Path(directory.name) / "incidents.json"),
            "JWT_SECRET_KEY": "error-response-test-only-secret",
            "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
        })
        environment.start()
        self.addCleanup(environment.stop)
        # Starlette sends the last-resort response then re-raises for server tooling.
        self.client = self.enterContext(TestClient(app, raise_server_exceptions=False))
        self.user, headers = register_and_login(self.client)
        self.client.headers.update(headers)
        incidents._last_result = None
        self.addCleanup(setattr, incidents, "_last_result", None)

    def assertSafe(self, response):
        self.assertEqual(response.status_code, 500)
        self.assertTrue(response.headers['content-type'].startswith('application/json'))
        self.assertEqual(response.json(), SAFE)
        self.assertNotIn(HOSTILE, response.text)

    def upload(self):
        return self.client.post('/api/incidents/analyze', files={
            'file': ('incidents.csv', b'content', 'text/csv')})

    def test_unexpected_read_and_processing_errors_are_safe(self):
        with patch('services.api.routes.suppliers.list_suppliers', side_effect=RuntimeError(HOSTILE)):
            self.assertSafe(self.client.get('/suppliers'))
        with patch.object(incidents, 'analyze_csv_bytes', side_effect=RuntimeError(HOSTILE)):
            self.assertSafe(self.upload())

    def test_expected_storage_open_read_write_failures_are_safe(self):
        for operation in ('read', 'write'):
            for error in (OSError(HOSTILE), json.JSONDecodeError(HOSTILE, '', 0)):
                with self.subTest(operation=operation, error=type(error).__name__):
                    with patch('tinydb.storages.JSONStorage.' + operation, side_effect=error):
                        self.assertSafe(self.client.get('/auth/me') if operation == 'read' else
                                        self.client.put('/profiles/me', json={'name': 'Changed'}))
        with patch('services.api.database.TinyDB', side_effect=OSError(HOSTILE)):
            self.assertSafe(self.client.get('/suppliers'))

    def test_reset_storage_corruption_is_not_invalid_user_input(self):
        with patch('services.api.routes.auth.decode_reset_token', return_value={'sub': self.user, 'jti': 'synthetic'}), \
                patch('tinydb.storages.JSONStorage.read', side_effect=json.JSONDecodeError(HOSTILE, '', 0)):
            self.assertSafe(self.client.post('/auth/reset-password', json={
                'token': 'synthetic', 'new_password': 'new-password'}))

    def test_invalid_header_does_not_echo_submitted_columns(self):
        response = self.client.post('/api/incidents/analyze', files={
            'file': ('incidents.csv', (HOSTILE + '\n').encode(), 'text/csv')})
        self.assertEqual(response.status_code, 422)
        self.assertNotIn(HOSTILE, response.text)

    def test_manager_keeps_its_local_failure_contract(self):
        with patch('services.api.app.routers.incident_management.list_incidents', side_effect=RuntimeError(HOSTILE)):
            response = self.client.get('/api/incidents')
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {'detail': 'Incident service unavailable.'})

    def test_upload_read_failure_still_closes_and_preserves_summary(self):
        baseline = {'sentinel': 1}
        incidents._last_result = baseline
        close = AsyncMock()
        with patch.object(UploadFile, 'read', new=AsyncMock(side_effect=OSError(HOSTILE))), \
                patch.object(UploadFile, 'close', new=close):
            self.assertSafe(self.upload())
        self.assertGreaterEqual(close.await_count, 1)
        self.assertIs(incidents._last_result, baseline)

    def test_upload_close_failure_is_safe(self):
        with patch.object(UploadFile, 'close', new=AsyncMock(side_effect=OSError(HOSTILE))):
            self.assertSafe(self.upload())
        self.assertIsNone(incidents._last_result)

    def test_expected_errors_keep_status_and_contract(self):
        cases = (
            (self.client.post('/api/incidents/analyze'), 400),
            (self.client.get('/api/incidents/results/export'), 404),
            (self.client.post('/api/incidents/analyze', files={'file': ('bad.txt', b'', 'text/plain')}), 415),
            (self.client.post('/users', json={'password': 'secret'}), 422),
            (self.client.get('/users'), 403),
            (self.client.get('/suppliers', headers={'Authorization': 'Bearer invalid'}), 401),
            (self.client.post('/api/incidents', json={}), 400),
        )
        for response, status in cases:
            self.assertEqual(response.status_code, status)
            self.assertIn('detail', response.json())
        with patch.dict(os.environ, {'JWT_SECRET_KEY': ''}):
            self.assertEqual(self.client.get('/auth/me').status_code, 503)

    def test_recovery_storage_failure_remains_account_neutral(self):
        with patch('services.api.routes.auth.delivery_configuration', return_value=object()), \
                patch('tinydb.storages.JSONStorage.read', side_effect=json.JSONDecodeError(HOSTILE, '', 0)) as read:
            response = self.client.post('/auth/forgot-password', json={'email': 'unknown@example.test'})
        read.assert_called()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            'message': 'If the account exists, a password reset link will be sent.'})


if __name__ == '__main__':
    unittest.main()
