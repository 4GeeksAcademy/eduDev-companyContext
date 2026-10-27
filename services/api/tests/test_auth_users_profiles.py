"""Protected user and owner-profile contracts with isolated real JWT identities."""

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from tinydb import Query, TinyDB

from services.api.app.main import app
from services.api.auth_database import get_user_by_id
from services.api.auth import verify_password


class UsersProfilesTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.path = Path(self.directory.name) / 'users.json'
        self.environment = patch.dict(os.environ, {
            'TRACKFLOW_USERS_DB_PATH': str(self.path),
            'TRACKFLOW_SUPPLIERS_DB_PATH': str(Path(self.directory.name) / 'suppliers.json'),
            'JWT_SECRET_KEY': 'isolated-test-key',
        })
        self.environment.start()
        self.client = TestClient(app)
        self.ids, self.headers = {}, {}
        for who in ('user', 'other', 'admin', 'manager'):
            response = self.client.post('/users', json={
                'email': f'{who}@example.test', 'password': 'original-password',
                'name': who, 'phone': '123', 'address': 'Original',
            })
            self.assertEqual(response.status_code, 201)
            self.ids[who] = response.json()['id']
            if who in ('admin', 'manager'):
                with TinyDB(self.path) as db:
                    db.table('users').update({'role': who}, Query().id == self.ids[who])
            login = self.client.post('/auth/login', data={
                'email': f'{who}@example.test', 'password': 'original-password',
            })
            self.assertEqual(login.status_code, 200)
            self.headers[who] = {'Authorization': 'Bearer ' + login.json()['access_token']}

    def tearDown(self):
        self.client.close()
        self.environment.stop()
        self.directory.cleanup()

    def request(self, method, path, who='user', **kwargs):
        return self.client.request(method, path, headers=self.headers[who], **kwargs)

    def test_authentication_and_permissions(self):
        target = '/users/' + self.ids['user']
        endpoints = [('GET', '/users'), ('GET', target), ('PUT', target),
                     ('DELETE', target), ('GET', '/profiles/me'), ('PUT', '/profiles/me')]
        for method, path in endpoints:
            for headers in ({}, {'Authorization': 'Bearer invalid'}):
                with self.subTest(method=method, path=path, headers=bool(headers)):
                    response = self.client.request(method, path, headers=headers)
                    self.assertEqual(response.status_code, 401, response.text)
        for who in ('user', 'manager'):
            self.assertEqual(self.request('GET', '/users', who).status_code, 403)
            for method in ('GET', 'PUT', 'DELETE'):
                for identity in (self.ids['other'], 'unknown'):
                    response = self.request(method, '/users/' + identity, who, **(
                        {'json': {'email': 'changed@example.test'}} if method == 'PUT' else {}))
                    self.assertEqual(response.status_code, 403, response.text)
        for method in ('GET', 'PUT', 'DELETE'):
            response = self.request(method, '/users/unknown', 'admin', **(
                {'json': {}} if method == 'PUT' else {}))
            self.assertEqual(response.status_code, 404)
        for who in self.ids:
            response = self.request('GET', '/users/' + self.ids[who], who)
            self.assertEqual(response.status_code, 200)
            self.assertNotIn('password', response.text)
        directory = self.request('GET', '/users', 'admin')
        self.assertEqual(directory.status_code, 200)
        self.assertEqual(len(directory.json()), 4)
        self.assertNotIn('password', directory.text)
        self.assertEqual(get_user_by_id(self.ids['other']).email, 'other@example.test')
        self.assertEqual(self.request('GET', '/users/' + self.ids['other'], 'admin').status_code, 200)
        self.assertEqual(self.request('PUT', '/users/' + self.ids['manager'], 'manager',
                                      json={'role': 'manager'}).status_code, 403)
        self.assertEqual(self.request('PUT', '/users/' + self.ids['other'], 'admin',
                                      json={'email': 'admin-edited@example.test'}).status_code, 200)

    def test_credentials_roles_and_atomic_validation(self):
        target = '/users/' + self.ids['user']
        for role in ('user', 'manager', 'admin'):
            self.assertEqual(self.request('PUT', target, json={'role': role}).status_code, 403)
        for data in ({'role': 'owner'}, {'email': None}, {'password': None},
                     {'role': None}, {'is_active': False}, {'name': 'No'},
                     {'password': ''}, {'password': 'é' * 37}):
            response = self.request('PUT', target, 'admin', json=data)
            self.assertEqual(response.status_code, 422, response.text)
            self.assertNotIn('é', response.text)
        conflict = self.request('PUT', target, json={
            'email': ' OTHER@EXAMPLE.TEST ', 'password': 'must-not-persist'})
        self.assertEqual(conflict.status_code, 409)
        self.assertTrue(verify_password('original-password', get_user_by_id(self.ids['user']).hashed_password))
        response = self.request('PUT', target, json={
            'email': ' NEW@EXAMPLE.TEST ', 'password': 'replacement-password'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['email'], 'new@example.test')
        self.assertEqual(response.json()['id'], self.ids['user'])
        self.assertNotIn('password', response.text)
        stored = get_user_by_id(self.ids['user'])
        self.assertTrue(verify_password('replacement-password', stored.hashed_password))
        self.assertNotEqual(stored.hashed_password, 'replacement-password')
        self.assertEqual(self.client.post('/auth/login', data={
            'email': 'new@example.test', 'password': 'replacement-password'}).status_code, 200)
        self.assertEqual(self.client.post('/auth/login', data={
            'email': 'user@example.test', 'password': 'original-password'}).status_code, 401)
        self.assertEqual(self.request('PUT', target, json={'email': 'NEW@example.test'}).status_code, 200)
        for role in ('manager', 'admin', 'user'):
            response = self.request('PUT', target, 'admin', json={'role': role})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['role'], role)
        for data in ({'email': 'private-invalid', 'password': 'private-secret'},
                     {'password': {'private-secret': 'private-secret'}}):
            response = self.request('PUT', target, json=data)
            self.assertEqual(response.status_code, 422)
            self.assertNotIn('private', response.text)

    def test_profile_owner_filtering_and_preservation(self):
        before = self.request('GET', '/profiles/me', 'other').json()
        response = self.request('GET', '/profiles/me')
        self.assertEqual(response.status_code, 200)
        profile = response.json()
        self.assertEqual(profile['user_id'], self.ids['user'])
        for field in ('id', 'user_id', 'role', 'email', 'is_active'):
            response = self.request('PUT', '/profiles/me', json={field: self.ids['other']})
            self.assertEqual(response.status_code, 422)
        response = self.request('PUT', '/profiles/me', json={'name': 'Updated', 'phone': None})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {**profile, 'name': 'Updated', 'phone': None})
        self.assertEqual(self.request('GET', '/profiles/me', 'other').json(), before)
        self.assertEqual(self.request('GET', '/profiles/' + self.ids['other']).status_code, 404)
        self.assertEqual(self.request('GET', '/auth/me').json()['profile'], response.json())
        cleared = self.request('PUT', '/profiles/me', json={'name': None, 'address': None})
        self.assertEqual(cleared.status_code, 200)
        self.assertIsNone(cleared.json()['name'])
        self.assertIsNone(cleared.json()['address'])
        self.assertEqual(self.request('GET', '/profiles/me', 'other').json(), before)

    def test_delete_cascades_and_revokes_identity(self):
        target = '/users/' + self.ids['user']
        self.assertEqual(self.request('DELETE', target, 'other').status_code, 403)
        self.assertEqual(self.request('DELETE', target).status_code, 204)
        with TinyDB(self.path) as db:
            self.assertIsNone(db.table('users').get(Query().id == self.ids['user']))
            self.assertIsNone(db.table('profiles').get(Query().user_id == self.ids['user']))
            self.assertEqual(len(db.table('users')), 3)
            self.assertEqual(len(db.table('profiles')), 3)
        self.assertEqual(self.request('GET', '/auth/me').status_code, 401)
        self.assertEqual(self.request('GET', '/profiles/me').status_code, 401)
        self.assertEqual(self.request('DELETE', '/users/' + self.ids['manager'], 'admin').status_code, 204)
        self.assertEqual(self.request('GET', '/auth/me', 'manager').status_code, 401)
