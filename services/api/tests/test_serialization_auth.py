"""Identity wire contracts with disposable stores and blocked outbound mail."""
from unittest.mock import Mock

import pytest
from fastapi import Response
from fastapi.testclient import TestClient

from services.api.app.main import app
from services.api import auth_database
from services.api.auth import create_reset_token, verify_password
from services.api.auth_models import Role, UserUpdate
from services.api.routes import users


IDENTITY = {"id", "email", "is_active", "role", "created_at"}
REGISTRATION = IDENTITY - {"email"}
PROFILE = {"id", "user_id", "name", "phone", "address"}


@pytest.fixture
def client(tmp_path, monkeypatch):
    for name in ("USERS", "SUPPLIERS", "INCIDENTS"):
        monkeypatch.setenv(f"TRACKFLOW_{name}_DB_PATH", str(tmp_path / f"{name}.json"))
    for key, value in {
        "DATABASE_URL": "", "JWT_SECRET_KEY": "serialization-test-only-key",
        "ACCESS_TOKEN_EXPIRE_MINUTES": "30", "PASSWORD_RESET_EXPIRE_MINUTES": "30",
        "RESEND_API_KEY": "", "RESEND_FROM_EMAIL": "", "FRONTEND_PUBLIC_URL": "",
    }.items():
        monkeypatch.setenv(key, value)
    monkeypatch.setattr("urllib.request.urlopen", Mock(side_effect=AssertionError("No network")))
    with TestClient(app) as test_client:
        yield test_client


def register(client):
    response = client.post("/users", json={
        "email": " PERSON@EXAMPLE.TEST ", "password": "original-password",
    })
    assert response.status_code == 201
    return response.json()


def login(client):
    response = client.post("/auth/login", data={
        "email": "person@example.test", "password": "original-password",
    })
    assert response.status_code == 200
    assert set(response.json()) == {"access_token", "token_type"}
    assert response.json()["token_type"] == "bearer"
    return {"Authorization": "Bearer " + response.json()["access_token"]}


def test_registration_filters_internal_fields_at_http_boundary(client, monkeypatch):
    create = users.create_user

    def with_internal_fields(data):
        return create(data).model_dump() | {
            "password": "synthetic-private-password", "reset_token": "synthetic-reset-token",
            "password_reset_id": "synthetic-reset-id", "internal_note": "private",
        }

    monkeypatch.setattr(users, "create_user", with_internal_fields)
    result = register(client)
    assert set(result) == REGISTRATION
    stored = auth_database.get_user_by_id(result["id"])
    assert stored.email == "person@example.test"
    assert verify_password("original-password", stored.hashed_password)
    assert auth_database.get_profile_by_user_id(stored.id).user_id == stored.id


def test_authenticated_identity_profile_and_empty_delete_contracts(client):
    result = register(client)
    headers = login(client)
    auth_database.set_password_reset(result["id"], "synthetic-pending-reset")
    auth_database.update_user(result["id"], UserUpdate(role=Role.admin))
    directory = client.get("/users", headers=headers)
    assert directory.status_code == 200
    assert len(directory.json()) == 1
    assert set(directory.json()[0]) == IDENTITY
    target = "/users/" + result["id"]
    for response in (client.get(target, headers=headers),
                     client.put(target, headers=headers, json={})):
        assert response.status_code == 200
        assert set(response.json()) == IDENTITY
        assert response.json()["email"] == "person@example.test"
    current = client.get("/auth/me", headers=headers).json()
    assert set(current) == IDENTITY | {"profile"}
    assert set(current["profile"]) == PROFILE
    for response in (client.get("/profiles/me", headers=headers),
                     client.put("/profiles/me", headers=headers, json={"name": "Person"})):
        assert response.status_code == 200
        assert set(response.json()) == PROFILE
    deleted = client.delete(target, headers=headers)
    assert deleted.status_code == 204
    assert deleted.content == b""
    assert "content-type" not in deleted.headers
    assert auth_database.get_user_by_id(result["id"]) is None
    assert auth_database.get_profile_by_user_id(result["id"]) is None
    assert client.get("/auth/me", headers=headers).status_code == 401


@pytest.mark.parametrize("path,input_model", [
    ("/auth/forgot-password", "ForgotPasswordInput"),
    ("/auth/reset-password", "ResetPasswordInput"),
    ("/auth/change-password", "ChangePasswordInput"),
    ("/users", "RegistrationInput"),
])
def test_openapi_separates_write_inputs_and_explicit_outputs(client, path, input_model):
    schema = client.get("/openapi.json").json()
    operation = schema["paths"][path]["post"]
    output, status, fields = (("RegistrationResponse", "201", REGISTRATION)
                              if path == "/users" else ("MessageResponse", "200", {"message"}))
    assert operation["responses"][status]["content"]["application/json"]["schema"] == {
        "$ref": f"#/components/schemas/{output}"}
    assert set(schema["components"]["schemas"][output]["properties"]) == fields
    assert operation["requestBody"]["content"]["application/json"]["schema"] == {
        "$ref": f"#/components/schemas/{input_model}"}


def test_delete_declares_non_json_response(client):
    route = next(route for route in users.router.routes if "DELETE" in route.methods)
    assert route.response_model is None
    assert route.response_class is Response
    operation = client.get("/openapi.json").json()["paths"]["/users/{user_id}"]["delete"]
    assert "content" not in operation["responses"]["204"]


def test_password_messages_preserve_exact_text_and_persistence(client):
    result = register(client)
    headers = login(client)
    for email in ("person@example.test", "unknown@example.test"):
        response = client.post("/auth/forgot-password", json={"email": email})
        assert response.status_code == 200
        assert response.json() == {"message": "If the account exists, a password reset link will be sent."}
    token, reset_id = create_reset_token(result["id"])
    auth_database.set_password_reset(result["id"], reset_id)
    response = client.post("/auth/reset-password", json={"token": token, "new_password": "reset-password"})
    assert response.status_code == 200
    assert response.json() == {"message": "Password reset successfully."}
    response = client.post("/auth/change-password", headers=headers, json={
        "current_password": "reset-password", "new_password": "changed-password"})
    assert response.status_code == 200
    assert response.json() == {"message": "Password changed successfully."}
    stored = auth_database.get_user_by_id(result["id"])
    assert stored.password_reset_id is None
    assert verify_password("changed-password", stored.hashed_password)
