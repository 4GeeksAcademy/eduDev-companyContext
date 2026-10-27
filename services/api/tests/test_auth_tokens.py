"""JWT contracts using real registration and isolated TinyDB files."""

import os
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from jose import jwt
from tinydb import Query, TinyDB

from services.api.app.main import app


class TokenTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.path = Path(self.directory.name) / "users.json"
        self.environment = patch.dict(os.environ, {
            "TRACKFLOW_USERS_DB_PATH": str(self.path),
            "TRACKFLOW_SUPPLIERS_DB_PATH": str(Path(self.directory.name) / "suppliers.json"),
            "JWT_SECRET_KEY": "test-only-signing-key-not-for-deployment",
            "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
        })
        self.environment.start()
        self.client = TestClient(app)
        response = self.client.post("/users", json={
            "email": "person@example.test", "password": "correct horse",
            "name": "Person", "phone": "123", "address": "Zaragoza",
        })
        self.assertEqual(response.status_code, 201)
        self.user_id = response.json()["id"]

    def tearDown(self):
        self.client.close()
        self.environment.stop()
        self.directory.cleanup()

    def login(self, **fields):
        return self.client.post("/auth/login", data={
            "email": "person@example.test", "password": "correct horse", **fields,
        })

    def token(self, **claims):
        return jwt.encode({"sub": self.user_id, "exp": int(time.time()) + 600, **claims},
                          os.environ["JWT_SECRET_KEY"], algorithm="HS256")

    def me(self, token):
        return self.client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    def assert_unauthorized(self, response):
        self.assertEqual(response.status_code, 401, response.text)
        self.assertEqual(response.headers.get("www-authenticate"), "Bearer")

    def test_login_signed_claims_and_safe_current_user(self):
        start = int(time.time())
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["token_type"], "bearer")
        token = response.json()["access_token"]
        claims = jwt.decode(token, os.environ["JWT_SECRET_KEY"], algorithms=["HS256"])
        self.assertEqual(claims["sub"], self.user_id)
        self.assertGreaterEqual(claims["exp"], start + 1800)
        self.assertLessEqual(claims["exp"], int(time.time()) + 1800)
        result = self.me(token)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["email"], "person@example.test")
        self.assertEqual(result.json()["role"], "user")
        self.assertEqual(result.json()["profile"]["user_id"], self.user_id)
        self.assertEqual(result.json()["profile"]["name"], "Person")
        self.assertEqual(result.json()["profile"]["phone"], "123")
        self.assertEqual(result.json()["profile"]["address"], "Zaragoza")
        for secret in ("password", "hashed_password", "correct horse"):
            self.assertNotIn(secret, result.text)
            self.assertNotIn(secret, response.text)

    def test_swagger_username_and_email_alias(self):
        for fields in ({"username": " PERSON@example.test ", "password": "correct horse"},
                       {"username": "person@example.test", "email": "person@example.test",
                        "password": "correct horse"}):
            self.assertEqual(self.client.post("/auth/login", data=fields).status_code, 200)
        schema = self.client.get("/openapi.json").json()
        self.assertEqual(schema["components"]["securitySchemes"]["OAuth2PasswordBearer"]
                         ["flows"]["password"]["tokenUrl"], "/auth/login")

    def test_invalid_credentials_and_unsupported_passwords(self):
        for fields in ({"password": "wrong"}, {"email": "missing@example.test"},
                       {"password": "a\x00b"}, {"password": "é" * 37}):
            with self.subTest(fields=list(fields)):
                response = self.login(**fields)
                self.assert_unauthorized(response)
                self.assertEqual(response.json()["detail"], "Invalid credentials")
        from services.api.auth import verify_password
        for password in (None, 123, "\ud800", "a\x00b", "a" * 73):
            self.assertFalse(verify_password(password, "not-a-hash"))
        self.assertFalse(verify_password("safe", "not-a-hash"))

    def test_validation_does_not_echo_credentials(self):
        cases = [{"email": "private@example.test"},
                 {"password": "private-password"},
                 {"email": "private@example.test", "username": "other@example.test",
                  "password": "private-password"}]
        for fields in cases:
            response = self.client.post("/auth/login", data=fields)
            self.assertEqual(response.status_code, 422)
            for value in fields.values():
                self.assertNotIn(value, response.text)
        response = self.client.post("/auth/login", json={"password": "private-password"})
        self.assertEqual(response.status_code, 422)
        self.assertNotIn("private-password", response.text)

    def test_invalid_tokens(self):
        self.assert_unauthorized(self.client.get("/auth/me"))
        self.assert_unauthorized(self.client.get("/auth/me", headers={"Authorization": "Basic secret"}))
        tokens = ["broken", self.token(exp=1), self.token(sub="missing"),
                  self.token(sub=str(uuid4())), self.token(sub=123), self.token(sub=""),
                  self.token(exp=None), self.token(exp="not-a-time"), self.token(exp=True),
                  self.token(exp=float("inf")), self.token(exp=float("nan")),
                  jwt.encode({"sub": self.user_id}, os.environ["JWT_SECRET_KEY"], algorithm="HS256"),
                  jwt.encode({"exp": int(time.time()) + 600}, os.environ["JWT_SECRET_KEY"], algorithm="HS256"),
                  jwt.encode({"sub": self.user_id, "exp": int(time.time()) + 600}, "wrong", algorithm="HS256"),
                  jwt.encode({"sub": self.user_id, "exp": int(time.time()) + 600}, os.environ["JWT_SECRET_KEY"], algorithm="HS384")]
        for token in tokens:
            with self.subTest(token=token[:12]):
                self.assert_unauthorized(self.me(token))

    def test_database_controls_role_activity_and_deletion(self):
        token = self.token(role="admin")
        self.assertEqual(self.me(token).json()["role"], "user")
        with TinyDB(self.path) as database:
            database.table("users").update({"role": "manager"}, Query().id == self.user_id)
        self.assertEqual(self.me(token).json()["role"], "manager")
        with TinyDB(self.path) as database:
            database.table("users").update({"is_active": False}, Query().id == self.user_id)
        self.assert_unauthorized(self.me(token))
        self.assert_unauthorized(self.login())
        with TinyDB(self.path) as database:
            database.table("users").remove(Query().id == self.user_id)
        self.assert_unauthorized(self.me(token))

    def test_missing_profile_fails_closed(self):
        with TinyDB(self.path) as database:
            database.table("profiles").remove(Query().user_id == self.user_id)
        self.assertEqual(self.me(self.token()).status_code, 500)

    def test_environment_configuration(self):
        for expiry in ("0", "-1", "nan", "inf", "bad", "1e300", "", "1e-300"):
            with self.subTest(expiry=expiry), patch.dict(os.environ, {"ACCESS_TOKEN_EXPIRE_MINUTES": expiry}):
                response = self.login()
                self.assertEqual(response.status_code, 503)
                self.assertEqual(response.json()["detail"], "Authentication configuration unavailable")
        for secret in ("", "   "):
            with patch.dict(os.environ, {"JWT_SECRET_KEY": secret}):
                self.assertEqual(self.login().status_code, 503)
                self.assertEqual(self.me(self.token()).status_code, 503)
        with patch.dict(os.environ):
            del os.environ["JWT_SECRET_KEY"]
            self.assertEqual(self.login().status_code, 503)
        with patch.dict(os.environ, {"JWT_SECRET_KEY": "alternate-test-key", "ACCESS_TOKEN_EXPIRE_MINUTES": "2.5"}):
            response = self.login()
            self.assertEqual(response.status_code, 200)
            claims = jwt.decode(response.json()["access_token"], "alternate-test-key", algorithms=["HS256"])
            self.assertAlmostEqual(claims["exp"] - time.time(), 150, delta=2)
            self.assertEqual(self.me(response.json()["access_token"]).status_code, 200)
        with patch.dict(os.environ):
            del os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"]
            response = self.login()
            self.assertEqual(response.status_code, 200)
            claims = jwt.decode(response.json()["access_token"], os.environ["JWT_SECRET_KEY"], algorithms=["HS256"])
            self.assertAlmostEqual(claims["exp"] - time.time(), 1800, delta=2)
