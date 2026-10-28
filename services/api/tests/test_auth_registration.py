"""Registration contract against isolated, real TinyDB storage."""

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import UUID

from fastapi.testclient import TestClient

from services.api.app.main import app


class RegistrationTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.path = Path(self.directory.name) / "users.json"
        self.environment = patch.dict(os.environ, {
            "TRACKFLOW_USERS_DB_PATH": str(self.path),
            "TRACKFLOW_SUPPLIERS_DB_PATH": str(Path(self.directory.name) / "suppliers.json"),
        })
        self.environment.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        self.environment.stop()
        self.directory.cleanup()

    def register(self, **fields):
        return self.client.post("/users", json={
            "email": "person@example.test", "password": "correct horse", **fields,
        })

    def test_registration_persists_split_records_and_safe_response(self):
        response = self.register(name="Person", phone="123", address="Zaragoza")
        self.assertEqual(response.status_code, 201)
        result = response.json()
        self.assertEqual(result["role"], "user")
        self.assertTrue(result["is_active"])
        UUID(result["id"])
        self.assertIn("created_at", result)
        self.assertNotIn("password", response.text)
        from services.api.auth import verify_password
        from services.api.auth_database import get_user_by_id, get_user_by_email, get_profile_by_user_id
        user = get_user_by_id(result["id"])
        self.assertTrue(verify_password("correct horse", user.hashed_password))
        self.assertFalse(verify_password("wrong", user.hashed_password))
        self.assertEqual(get_user_by_email(" PERSON@example.test ").id, user.id)
        profile = get_profile_by_user_id(user.id)
        self.assertEqual(profile.name, "Person")
        self.assertEqual(profile.phone, "123")
        self.assertEqual(profile.address, "Zaragoza")
        UUID(profile.id)
        disk = json.loads(self.path.read_text())
        self.assertEqual(len(disk["users"]), 1)
        self.assertEqual(len(disk["profiles"]), 1)
        self.assertNotIn("name", next(iter(disk["users"].values())))
        self.assertNotIn("correct horse", self.path.read_text())

    def test_empty_profile_and_persistence_after_reopen(self):
        first = self.register()
        self.assertEqual(first.status_code, 201)
        from services.api.auth_database import get_profile_by_user_id, get_user_by_id
        profile = get_profile_by_user_id(first.json()["id"])
        self.assertIsNone(profile.name)
        self.assertIsNone(profile.phone)
        self.assertIsNone(profile.address)
        self.assertEqual(get_user_by_id(first.json()["id"]).email, "person@example.test")
        second = self.register(email="other@example.test")
        self.assertNotEqual(first.json()["id"], second.json()["id"])
        self.assertIsNone(get_user_by_id("missing"))
        self.assertIsNone(get_profile_by_user_id("missing"))

    def test_duplicate_normalized_email_returns_conflict_without_orphans(self):
        self.assertEqual(self.register().status_code, 201)
        self.assertEqual(self.register(email=" PERSON@EXAMPLE.TEST ").status_code, 409)
        disk = json.loads(self.path.read_text())
        self.assertEqual(len(disk["users"]), 1)
        self.assertEqual(len(disk["profiles"]), 1)

    def test_invalid_and_privileged_input_is_rejected_without_writes(self):
        cases = [{"email": "bad"}, {"email": "a@@b.test"}, {"password": ""},
                 {"password": "é" * 37}, {"role": "admin"}, {"role": "manager"},
                 {"role": "unknown"}, {"role": "user"}, {"is_active": False},
                 {"hashed_password": "injected"}, {"id": "injected"},
                 {"created_at": "2020-01-01"}, {"unknown": True}]
        for fields in cases:
            with self.subTest(fields=list(fields)):
                response = self.register(**fields)
                self.assertEqual(response.status_code, 422)
                self.assertNotIn("correct horse", response.text)
                self.assertNotIn("é" * 37, response.text)
        for payload in ({}, {"email": "a@b.test"}, {"password": "secret"}):
            self.assertEqual(self.client.post("/users", json=payload).status_code, 422)
        self.assertFalse(self.path.exists())

    def test_bcrypt_byte_boundary(self):
        self.assertEqual(self.register(password="é" * 36).status_code, 201)

    def test_deleted_document_ids_do_not_recycle_identity(self):
        from tinydb import TinyDB
        first = self.register().json()
        with TinyDB(self.path) as database:
            database.table("users").truncate()
            database.table("profiles").truncate()
        replacement = self.register().json()
        self.assertNotEqual(first["id"], replacement["id"])
        from services.api.auth_database import get_user_by_id
        self.assertIsNone(get_user_by_id(first["id"]))

    def test_hash_failure_preserves_existing_identity_and_profile(self):
        self.assertEqual(self.register().status_code, 201)
        before = self.path.read_text()
        with patch("services.api.auth_database.hash_password", side_effect=ValueError("hash failure")):
            with self.assertRaises(ValueError):
                self.register(email="new@example.test")
        self.assertEqual(self.path.read_text(), before)

    def test_storage_write_failure_leaves_no_orphans(self):
        from tinydb.storages import JSONStorage
        original = JSONStorage.write
        failures = []

        def fail_once(storage, data):
            if not failures:
                failures.append(True)
                raise OSError("simulated write failure")
            return original(storage, data)

        with patch.object(JSONStorage, "write", fail_once):
            response = self.register()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"detail": "Service unavailable."})
        self.assertNotIn("simulated write failure", response.text)
        self.assertNotIn("StorageError", response.text)
        self.assertNotIn("Traceback", response.text)
        self.assertNotIn(str(self.path), response.text)
        content = self.path.read_text() if self.path.exists() else ""
        disk = json.loads(content) if content else {}
        self.assertFalse(disk.get("users"))
        self.assertFalse(disk.get("profiles"))
