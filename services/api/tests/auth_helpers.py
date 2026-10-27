"""Small real-login helpers; callers own isolated database environments."""


def register_and_login(client, email="operations@example.test"):
    password = "test-only-password"
    registered = client.post("/users", json={"email": email, "password": password})
    assert registered.status_code == 201, registered.text
    login = client.post("/auth/login", data={"username": email, "password": password})
    assert login.status_code == 200, login.text
    return registered.json()["id"], {"Authorization": "Bearer " + login.json()["access_token"]}
