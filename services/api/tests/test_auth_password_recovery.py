"""Recovery contracts: isolated storage, synthetic configuration, no network."""
import json
import os
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch
from urllib.error import URLError
from urllib.parse import parse_qs, urlsplit

from fastapi.testclient import TestClient
from jose import jwt
from services.api.app.main import app


class EmailDeliveryTest(unittest.TestCase):
    def test_resend_request_identifies_application_and_preserves_contract(self):
        from services.api.email_delivery import send_password_reset

        with patch('urllib.request.urlopen') as send:
            send.return_value.__enter__.return_value.status = 200
            send_password_reset('recipient@example.test', 'synthetic-token', (
                'synthetic-api-key', 'TrackFlow <sender@example.test>',
                'https://tracker.example.test',
            ))
            send.assert_called_once()
            request = send.call_args.args[0]
            self.assertEqual(request.get_header('User-agent'), 'TrackFlow/1.0')
            self.assertEqual(request.full_url, 'https://api.resend.com/emails')
            self.assertEqual(request.get_method(), 'POST')
            self.assertEqual(request.get_header('Authorization'), 'Bearer synthetic-api-key')
            self.assertEqual(request.get_header('Content-type'), 'application/json')
            self.assertEqual(send.call_args.kwargs, {'timeout': 10})
            self.assertEqual(json.loads(request.data), {
                'from': 'TrackFlow <sender@example.test>',
                'to': ['recipient@example.test'],
                'subject': 'Reset your TrackFlow password',
                'text': 'Reset your password using this link: '
                        'https://tracker.example.test/reset-password?token=synthetic-token',
            })


class RecoveryTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        environment = patch.dict(os.environ, {
            "TRACKFLOW_USERS_DB_PATH": str(Path(directory.name) / "users.json"),
            "TRACKFLOW_SUPPLIERS_DB_PATH": str(Path(directory.name) / "suppliers.json"),
            "JWT_SECRET_KEY": "synthetic-recovery-test-key",
            "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
            "PASSWORD_RESET_EXPIRE_MINUTES": "30",
            "RESEND_API_KEY": "synthetic-provider-key",
            "RESEND_FROM_EMAIL": "TrackFlow <sender@example.test>",
            "FRONTEND_PUBLIC_URL": "https://tracker.example.test",
        })
        environment.start()
        self.addCleanup(environment.stop)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        self.user_id = self.client.post('/users', json={
            'email': 'person@example.test', 'password': 'old password'
        }).json()['id']

    def forgot(self, email='person@example.test'):
        return self.client.post('/auth/forgot-password', json={'email': email})

    def reset(self, token, password='new password'):
        return self.client.post('/auth/reset-password', json={
            'token': token, 'new_password': password})

    def issue(self):
        with patch('urllib.request.urlopen') as send:
            send.return_value.__enter__.return_value.status = 200
            response = self.forgot()
            self.assertEqual(response.status_code, 200)
            request = send.call_args.args[0]
            payload = json.loads(request.data)
            link = payload['text'].split()[-1]
            self.assertEqual(urlsplit(link).path, '/reset-password')
            self.assertEqual(request.full_url, 'https://api.resend.com/emails')
            self.assertEqual(send.call_args.kwargs['timeout'], 10)
            token = parse_qs(urlsplit(link).query)['token'][0]
            claims = jwt.decode(token, os.environ['JWT_SECRET_KEY'], algorithms=['HS256'])
            from datetime import datetime, timezone
            remaining = claims['exp'] - datetime.now(timezone.utc).timestamp()
            self.assertTrue(1795 <= remaining <= 1800)
            self.assertEqual(claims['purpose'], 'password_reset')
            return token

    def signed(self, token, **changes):
        claims = jwt.get_unverified_claims(token)
        claims.update(changes)
        return jwt.encode(claims, os.environ['JWT_SECRET_KEY'], algorithm='HS256')

    def test_generic_and_delivery(self):
        with patch('urllib.request.urlopen') as send:
            send.return_value.__enter__.return_value.status = 200
            known = self.forgot(' PERSON@example.test ')
            unknown = self.forgot('missing@example.test')
            self.assertEqual(known.status_code, 200)
            self.assertEqual(known.json(), unknown.json())
            self.assertEqual(send.call_count, 1)
            self.assertNotIn('token', known.text)

    def test_success_reuse_and_login(self):
        token = self.issue()
        self.assertEqual(self.reset(token).status_code, 200)
        self.assertEqual(self.reset(token).status_code, 400)
        for password, status in [('old password', 401), ('new password', 200)]:
            self.assertEqual(self.client.post('/auth/login', data={
                'email': 'person@example.test', 'password': password}).status_code, status)

    def test_invalid_expired_purpose_and_missing_user(self):
        token = self.issue()
        for invalid in ['broken', jwt.encode(jwt.get_unverified_claims(token), 'wrong', algorithm='HS256'),
                        self.signed(token, exp=1), self.signed(token, purpose='access'),
                        self.signed(token, sub='missing'), self.signed(token, jti='wrong')]:
            self.assertEqual(self.reset(invalid).status_code, 400)
        self.assertEqual(self.reset(token).status_code, 200)

    def test_token_separation_and_validation_preserves_link(self):
        token = self.issue()
        self.assertEqual(self.client.get('/auth/me', headers={
            'Authorization': f'Bearer {token}'}).status_code, 401)
        access = self.client.post('/auth/login', data={
            'email': 'person@example.test', 'password': 'old password'}).json()['access_token']
        self.assertEqual(self.reset(access).status_code, 400)
        for password in ['', 'é' * 37]:
            response = self.reset(token, password)
            self.assertEqual(response.status_code, 422)
            self.assertNotIn(token, response.text)
        self.assertEqual(self.reset(token).status_code, 200)

    def test_supersession_and_concurrent_consumption(self):
        old = self.issue()
        token = self.issue()
        self.assertEqual(self.reset(old).status_code, 400)
        with ThreadPoolExecutor(max_workers=2) as pool:
            statuses = list(pool.map(lambda _: self.reset(token).status_code, range(2)))
        self.assertEqual(sorted(statuses), [200, 400])

    def test_deleted_identity_and_missing_state_fail_closed(self):
        from tinydb import Query, TinyDB
        token = self.issue()
        with TinyDB(os.environ['TRACKFLOW_USERS_DB_PATH']) as database:
            database.table('users').update({'password_reset_id': None}, Query().id == self.user_id)
        self.assertEqual(self.reset(token).status_code, 400)
        token = self.issue()
        with TinyDB(os.environ['TRACKFLOW_USERS_DB_PATH']) as database:
            database.table('users').remove(Query().id == self.user_id)
        self.assertEqual(self.reset(token).status_code, 400)

    def test_provider_and_configuration_failures_are_generic(self):
        with patch('urllib.request.urlopen', side_effect=URLError('private provider detail')):
            known = self.forgot()
            self.assertEqual(known.status_code, 200)
            self.assertEqual(known.json(), self.forgot('unknown@example.test').json())
        for key, value in [('RESEND_API_KEY', ''), ('RESEND_FROM_EMAIL', ''),
                           ('FRONTEND_PUBLIC_URL', 'bad'), ('JWT_SECRET_KEY', ''),
                           ('PASSWORD_RESET_EXPIRE_MINUTES', '14'),
                           ('PASSWORD_RESET_EXPIRE_MINUTES', '61'),
                           ('PASSWORD_RESET_EXPIRE_MINUTES', 'nan')]:
            with patch.dict(os.environ, {key: value}), patch('urllib.request.urlopen') as send:
                response = self.forgot()
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), self.forgot('unknown@example.test').json())
                send.assert_not_called()
