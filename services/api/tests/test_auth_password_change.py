"""Password changes use isolated identity storage and synthetic credentials."""
import os
from pathlib import Path
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

from fastapi.testclient import TestClient
from services.api.app.main import app
from services.api.auth import create_reset_token
from services.api.auth_database import get_user_by_id, set_password_reset


class PasswordChangeTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        environment = patch.dict(os.environ, {
            'TRACKFLOW_USERS_DB_PATH': str(Path(directory.name) / 'users.json'),
            'TRACKFLOW_SUPPLIERS_DB_PATH': str(Path(directory.name) / 'suppliers.json'),
            'JWT_SECRET_KEY': 'synthetic-password-change-test-key',
            'ACCESS_TOKEN_EXPIRE_MINUTES': '30',
            'PASSWORD_RESET_EXPIRE_MINUTES': '30',
        })
        environment.start()
        self.addCleanup(environment.stop)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        self.user_id = self.client.post('/users', json={
            'email': 'person@example.test', 'password': 'old password'}).json()['id']
        token = self.login('old password').json()['access_token']
        self.headers = {'Authorization': f'Bearer {token}'}

    def login(self, password):
        return self.client.post('/auth/login', data={
            'email': 'person@example.test', 'password': password})

    def recovery(self):
        token, reset_id = create_reset_token(self.user_id)
        self.assertTrue(set_password_reset(self.user_id, reset_id))
        return token

    def reset(self, token):
        return self.client.post('/auth/reset-password', json={
            'token': token, 'new_password': 'recovered password'})

    def change(self, **changes):
        return self.client.post('/auth/change-password', headers=self.headers, json={
            'current_password': 'old password', 'new_password': 'new password', **changes})

    def test_success_invalidates_recovery_not_session(self):
        token = self.recovery()
        response = self.change()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'message': 'Password changed successfully.'})
        self.assertEqual(self.login('old password').status_code, 401)
        self.assertEqual(self.login('new password').status_code, 200)
        self.assertEqual(self.reset(token).status_code, 400)
        self.assertIsNone(get_user_by_id(self.user_id).password_reset_id)
        self.assertEqual(self.client.get('/auth/me', headers=self.headers).status_code, 200)

    def test_wrong_current_password_preserves_password_and_recovery(self):
        token = self.recovery()
        before = get_user_by_id(self.user_id)
        response = self.change(current_password='wrong private password')
        self.assertEqual(response.status_code, 400)
        self.assertNotIn('wrong private password', response.text)
        self.assertEqual(get_user_by_id(self.user_id), before)
        self.assertEqual(self.reset(token).status_code, 200)

    def test_requires_access_authentication(self):
        token = self.recovery()
        before = get_user_by_id(self.user_id)
        for headers in [{}, {'Authorization': 'Bearer broken'},
                        {'Authorization': f'Bearer {token}'}]:
            response = self.client.post('/auth/change-password', headers=headers, json={
                'current_password': 'old password', 'new_password': 'new password'})
            self.assertEqual(response.status_code, 401)
        self.assertEqual(get_user_by_id(self.user_id), before)

    def test_malformed_input_does_not_mutate(self):
        self.recovery()
        before = get_user_by_id(self.user_id)
        for payload in [
            {'new_password': ''}, {'new_password': 'é' * 37},
            {'new_password': None}, {'new_password': 123},
            {'current_password': None}, {'extra': 'private-extra'},
        ]:
            response = self.change(**payload)
            self.assertEqual(response.status_code, 422)
            self.assertNotIn('old password', response.text)
            self.assertNotIn('private-extra', response.text)
            self.assertEqual(get_user_by_id(self.user_id), before)

    def test_existing_put_password_update_invalidates_recovery(self):
        token = self.recovery()
        response = self.client.put(f'/users/{self.user_id}', headers=self.headers,
                                   json={'password': 'put password'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.reset(token).status_code, 400)
        self.assertEqual(self.login('put password').status_code, 200)

    def test_non_password_put_preserves_recovery(self):
        token = self.recovery()
        response = self.client.put(f'/users/{self.user_id}', headers=self.headers,
                                   json={'email': 'updated@example.test'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.reset(token).status_code, 200)

    def test_concurrent_changes_verify_latest_hash(self):
        with ThreadPoolExecutor(max_workers=2) as pool:
            statuses = list(pool.map(lambda _: self.change().status_code, range(2)))
        self.assertEqual(sorted(statuses), [200, 400])
