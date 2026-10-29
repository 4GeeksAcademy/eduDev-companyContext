"""Inventory HTTP contracts; all SQL storage is dependency-overridden SQLite."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from services.api.app.main import app
from services.api.inventory_database import get_inventory_session


@pytest.fixture
def inventory_client(monkeypatch, user_factory):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine)
    def session():
        with Session(engine) as value:
            yield value
    app.dependency_overrides[get_inventory_session] = session
    user = user_factory()
    with TestClient(app) as client:
        token = client.post("/auth/login", data={"username": user.email, "password": "unit-test-password"}).json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"
        yield client, engine, user
    app.dependency_overrides.clear()
    engine.dispose()


def product(client, **overrides):
    data = dict(name="Sneaker", sku="TEST-LA", client_name="PureStep", category="fashion", warehouse="LA")
    response = client.post("/inventory/products", json=data | overrides)
    assert response.status_code == 201, response.text
    return response.json()


def test_stock_history_and_errors(inventory_client):
    client, _, user = inventory_client
    row = product(client)
    assert row["current_stock"] == 0
    inbound = dict(sku_id=row["id"], quantity=10, reference="PO-1", warehouse="LA")
    assert client.post("/inventory/orders/inbound", json=inbound).status_code == 201
    assert client.post("/inventory/orders/inbound", json=inbound | {"quantity": 2}).status_code == 201
    outbound = dict(sku_id=row["id"], quantity=3, exit_type="dispatch", tracking_number="SHIP-1", warehouse="LA")
    assert client.post("/inventory/orders/outbound", json=outbound).status_code == 201
    assert client.post("/inventory/orders/outbound", json=outbound | {"exit_type": "loss", "tracking_number": None, "quantity": 1}).status_code == 201
    rejected = client.post("/inventory/orders/outbound", json=outbound | {"quantity": 9})
    assert rejected.status_code == 400
    assert rejected.json()["detail"] == "Insufficient stock for SKU 'TEST-LA'. Available: 8, requested: 9."
    assert client.get(f"/inventory/products/{row['id']}").json()["current_stock"] == 8
    assert client.get("/inventory/products").json()[0]["current_stock"] == 8
    history = client.get("/inventory/orders").json()
    assert len(history) == 4
    assert {item["order_type"] for item in history} == {"inbound", "outbound"}
    for item in history:
        assert item["user_uuid"] == user.id
        assert item["name"] == "Sneaker" and item["sku_id"] == row["id"]
        assert item["created_at"].endswith(("Z", "+00:00"))
    assert client.get("/inventory/products/9999").status_code == 404
    assert client.post("/inventory/orders/inbound", json=inbound | {"sku_id": 9999}).status_code == 404
    assert client.post("/inventory/orders/outbound", json=outbound | {"sku_id": 9999}).status_code == 404


@pytest.mark.parametrize("quantity", [True, False, 0, -1, 1.5, "2"])
def test_strict_quantity_nonmutation(inventory_client, quantity):
    client, _, _ = inventory_client
    row = product(client)
    for route, extra in [("inbound", {"reference": "PO"}), ("outbound", {"exit_type": "loss", "tracking_number": None})]:
        assert client.post(f"/inventory/orders/{route}", json=dict(sku_id=row["id"], warehouse="LA", quantity=quantity) | extra).status_code == 422
    assert client.get("/inventory/orders").json() == []


def test_validation_auth_and_warehouse_isolation(inventory_client):
    client, _, _ = inventory_client
    la = product(client)
    zgz = product(client, sku="TEST-ZGZ", warehouse="ZGZ")
    entry = dict(sku_id=la["id"], quantity=5, reference="PO", warehouse="LA")
    assert client.post("/inventory/orders/inbound", json=entry | {"reference": "  "}).status_code == 422
    assert client.post("/inventory/orders/inbound", json=entry | {"warehouse": "ZGZ"}).status_code == 400
    assert client.post("/inventory/orders/inbound", json=entry).status_code == 201
    for kind, tracking in [("dispatch", None), ("dispatch", "  "), ("loss", "X")]:
        assert client.post("/inventory/orders/outbound", json=dict(sku_id=la["id"], quantity=1, warehouse="LA", exit_type=kind, tracking_number=tracking)).status_code == 422
    assert client.get(f"/inventory/products/{zgz['id']}").json()["current_stock"] == 0
    assert len(client.get("/inventory/orders").json()) == 1
    client.headers.pop("Authorization")
    for method, path in [("get", "/inventory/products"), ("post", "/inventory/products"), ("get", f"/inventory/products/{la['id']}"), ("post", "/inventory/orders/inbound"), ("post", "/inventory/orders/outbound"), ("get", "/inventory/orders")]:
        assert getattr(client, method)(path).status_code == 401


def test_missing_configuration_preserves_service(inventory_client, monkeypatch):
    client, _, _ = inventory_client
    app.dependency_overrides.clear()
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert client.get("/inventory/products").status_code == 503
    assert client.get("/inventory/products").json() == {"detail": "Inventory service unavailable."}
    assert client.get("/auth/me").status_code == 200
    monkeypatch.setenv("DATABASE_URL", "sqlite:///not-allowed")
    assert client.get("/inventory/products").status_code == 503


def test_listing_query_count_is_bounded(inventory_client):
    client, engine, _ = inventory_client
    for i in range(5):
        row = product(client, sku=f"SKU-{i}")
        client.post("/inventory/orders/inbound", json=dict(sku_id=row["id"], quantity=2, reference="PO", warehouse="LA"))
    statements = []
    def capture(*args):
        statements.append(args[2])
    event.listen(engine, "before_cursor_execute", capture)
    try:
        assert len(client.get("/inventory/products").json()) == 5
        assert len(client.get("/inventory/orders").json()) == 5
    finally:
        event.remove(engine, "before_cursor_execute", capture)
    assert len(statements) <= 4


def test_outbound_uses_postgres_row_lock(inventory_client):
    from sqlalchemy.dialects import postgresql
    from sqlalchemy.orm import Session as SASession

    client, _, _ = inventory_client
    row = product(client)
    client.post("/inventory/orders/inbound", json=dict(sku_id=row["id"], quantity=2, reference="PO", warehouse="LA"))
    statements = []
    def capture(state):
        statements.append(str(state.statement.compile(dialect=postgresql.dialect())))
    event.listen(SASession, "do_orm_execute", capture)
    try:
        response = client.post("/inventory/orders/outbound", json=dict(sku_id=row["id"], quantity=2, warehouse="LA", exit_type="loss", tracking_number=None))
    finally:
        event.remove(SASession, "do_orm_execute", capture)
    assert response.status_code == 201
    assert "FOR UPDATE" in statements[0]
    assert client.get(f"/inventory/products/{row['id']}").json()["current_stock"] == 0


def test_connection_failure_is_sanitized(inventory_client, monkeypatch):
    from sqlalchemy.exc import OperationalError
    from services.api import inventory_database

    client, _, _ = inventory_client
    app.dependency_overrides.clear()
    def fail():
        raise OperationalError("private-driver-details", {}, Exception("private-url"))
    monkeypatch.setattr(inventory_database, "configured_engine", fail)
    assert client.get("/inventory/products").json() == {"detail": "Inventory service unavailable."}
    assert client.get("/inventory/products").status_code == 503
    inventory_database.initialize_inventory()
    assert client.get("/auth/me").status_code == 200
