"""T3 HTTP allowlists; reuse isolated auth stores/mail and disposable SQL only."""
import ast
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.responses import StreamingResponse
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from services.api.app.main import app
from services.api.app.routers import incident_management as manager, incidents
from services.api.inventory_database import get_inventory_session
from services.api.routes import inventory, suppliers
from services.api.tests.test_serialization_auth import client, register, login
from packages.shared.incident_validation import (
    REQUIRED_COLUMNS, REASON_LABELS, CATEGORIES, STATUSES, COUNTRIES,
)
from shared.incident_analysis import analyze_csv_bytes, results_to_csv

SUPPLIER_LIST = {"id", "name", "country", "categories", "rate_per_shipment", "currency", "status"}
SUPPLIER = SUPPLIER_LIST | {"service_zone", "contact_email", "notes", "updated_at"}
INCIDENT = {"id", "title", "description", "category", "status", "origin", "branch", "created_at", "updated_at"}
PRODUCT = {"id", "name", "sku", "client_name", "category", "warehouse", "current_stock"}
MOVEMENT = {"id", "name", "sku", "warehouse", "quantity", "created_at", "user_uuid", "order_type"}
JOIN_FIELDS = {"sku_id", "client_name", "category"}


@pytest.fixture
def api(client, monkeypatch):
    identity = register(client)
    client.headers.update(login(client))
    monkeypatch.setattr(incidents, "_last_result", None)
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine)

    def session():
        with Session(engine) as value:
            yield value

    monkeypatch.setitem(app.dependency_overrides, get_inventory_session, session)
    try:
        yield client, identity["id"]
    finally:
        engine.dispose()


def test_all_31_decorators_declare_response_models(client):
    root = Path(__file__).resolve().parents[1]
    declarations = []
    for folder in (root / "routes", root / "app" / "routers"):
        for path in folder.glob("*.py"):
            for node in ast.walk(ast.parse(path.read_text())):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    for decorator in node.decorator_list:
                        if (isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Attribute)
                                and decorator.func.attr in {"get", "post", "put", "patch", "delete"}):
                            options = {option.arg: option.value for option in decorator.keywords}
                            assert "response_model" in options, f"{path.name}:{node.name} missing response_model"
                            declarations.append(options["response_model"])
    assert len(declarations) == 31
    assert sum(isinstance(value, ast.Constant) and value.value is None for value in declarations) == 2
    schema = client.get("/openapi.json").json()
    operations = [operation for path in schema["paths"].values() for operation in path.values()]
    assert len(operations) == 31
    json_responses = [response for operation in operations for code, response in operation["responses"].items()
                      if code.startswith("2") and "application/json" in response.get("content", {})]
    assert len(json_responses) == 29
    for response in json_responses:
        output = response["content"]["application/json"]["schema"]
        assert "$ref" in output or (output.get("type") == "array" and "items" in output)


def test_supplier_http_projection_and_internal_filtering(api, monkeypatch):
    http, _ = api
    payload = dict(name="Synthetic carrier", country="USA", categories=["carrier_last_mile"],
                   rate_per_shipment=2.5, currency="USD", status="active", notes="Kept on detail")
    created = http.post("/suppliers", json=payload)
    assert created.status_code == 201
    row = created.json()
    assert set(row) == SUPPLIER
    target = f"/suppliers/{row['id']}"
    internal = suppliers.get_supplier(row["id"]) | {"internal_token": "private"}
    monkeypatch.setattr(suppliers, "get_supplier", lambda _: internal)
    monkeypatch.setattr(suppliers, "list_suppliers", lambda **_: [internal])
    assert suppliers.read_suppliers()[0]["internal_token"] == "private"  # direct call is not the wire
    assert set(http.get(target).json()) == SUPPLIER
    listing = http.get("/suppliers")
    assert listing.status_code == 200
    assert listing.json() == [{key: row[key] for key in SUPPLIER_LIST}]
    for suffix, body in (("rate", {"rate_per_shipment": 3}), ("status", {"status": "suspended"})):
        response = http.patch(target + "/" + suffix, json=body)
        assert response.status_code == 200
        assert set(response.json()) == SUPPLIER
    deleted = http.delete(target)
    assert deleted.status_code == 200
    assert deleted.json() == {"success": True, "id": row["id"]}
    monkeypatch.setattr(suppliers, "list_suppliers", lambda **_: [])
    assert http.get("/suppliers").json() == []


def test_incident_output_preserves_ui_fields_and_filters_internal(api, monkeypatch):
    http, _ = api
    payload = dict(title="Parcel", description="  Literal description  ", category="other",
                   origin="internal", branch="central")
    create = manager.create_incident
    monkeypatch.setattr(manager, "create_incident", lambda data: create(data).model_dump() | {"internal_token": "private"})
    created = http.post("/api/incidents", json=payload)
    assert created.status_code == 201
    row = created.json()
    assert set(row) == INCIDENT
    assert row["description"] == payload["description"]
    target = "/api/incidents/" + row["id"]
    internal = SimpleNamespace(**row, internal_token="private")
    monkeypatch.setattr(manager, "get_incident", lambda _: internal)
    monkeypatch.setattr(manager, "list_incidents", lambda: [internal])
    assert http.get(target).json() == row
    assert http.get("/api/incidents").json() == [row]
    updated = http.patch(target + "/status", json={"status": "in_progress"})
    assert updated.status_code == 200
    assert set(updated.json()) == INCIDENT
    assert updated.json()["created_at"] == row["created_at"]
    assert updated.json()["description"] == row["description"]


@pytest.mark.parametrize("status,score,average", [("OPEN", "", None), ("CLOSED", "1", 1.0), ("CLOSED", "5", 5.0)])
def test_analysis_nested_allowlist_and_csv_preservation(api, monkeypatch, status, score, average):
    http, _ = api
    content = (",".join(REQUIRED_COLUMNS) + "\n" +
               f"TRF-000001,2026-01-01,US,B2C,TRACK001,UPS,LOST_PARCEL,Parcel delayed,{status},synthetic@example.test,{score}\n").encode()
    expected = analyze_csv_bytes(content)
    analyze = incidents.analyze_csv_bytes

    def enriched(raw):
        result = analyze(raw)
        return result | {"internal_token": "private", "satisfaction": result["satisfaction"] | {"raw_rows": ["private"]}}

    monkeypatch.setattr(incidents, "analyze_csv_bytes", enriched)
    response = http.post("/api/incidents/analyze", files={"file": ("synthetic.csv", content, "text/csv")})
    assert response.status_code == 200
    assert response.json() == expected
    for field, keys in (("invalid_reasons", REASON_LABELS), ("categories", CATEGORIES),
                        ("statuses", STATUSES), ("countries", COUNTRIES)):
        assert set(response.json()[field]) == set(keys)
    assert response.json()["satisfaction"]["average"] == average
    assert set(response.json()["satisfaction"]["scores"]) == {"1", "2", "3", "4", "5"}
    exported = http.get("/api/incidents/results/export")
    assert exported.status_code == 200
    assert exported.headers["content-type"].startswith("text/csv")
    assert exported.headers["content-disposition"] == 'attachment; filename="results.csv"'
    assert exported.text == results_to_csv(expected)
    failed = http.post("/api/incidents/analyze", files={"file": ("empty.csv", b"", "text/csv")})
    assert failed.status_code == 400
    assert http.get("/api/incidents/results/export").text == exported.text


def test_inventory_history_variants_and_write_receipts(api, monkeypatch):
    http, user_id = api
    assert http.get("/inventory/orders").json() == []
    assert http.get("/inventory/products").json() == []
    product_response = inventory.product_response
    monkeypatch.setattr(inventory, "product_response", lambda *args: product_response(*args).model_dump() | {"internal_token": "private"})
    created = http.post("/inventory/products", json=dict(
        name="Sneaker", sku="SYNTHETIC-LA", client_name="Synthetic", category="fashion", warehouse="LA"))
    assert created.status_code == 201
    row = created.json()
    assert set(row) == PRODUCT
    inbound = http.post("/inventory/orders/inbound", json=dict(
        sku_id=row["id"], quantity=10, reference="PO-1", warehouse="LA"))
    assert inbound.status_code == 201
    assert set(inbound.json()) == MOVEMENT | JOIN_FIELDS | {"reference"}
    for kind, tracking in (("dispatch", "SHIP-1"), ("loss", None)):
        response = http.post("/inventory/orders/outbound", json=dict(
            sku_id=row["id"], quantity=1, exit_type=kind, tracking_number=tracking, warehouse="LA"))
        assert response.status_code == 201
        assert set(response.json()) == MOVEMENT | JOIN_FIELDS | {"exit_type", "tracking_number"}
    original = inventory.movement_response

    def enriched(*args):
        return original(*args).model_copy(update={"internal_token": "private"})

    monkeypatch.setattr(inventory, "movement_response", enriched)
    history = http.get("/inventory/orders")
    assert history.status_code == 200
    rows = history.json()
    assert len(rows) == 3
    assert {item.get("exit_type") for item in rows} == {None, "dispatch", "loss"}
    for item in rows:
        fields = {"reference"} if item["order_type"] == "inbound" else {"exit_type", "tracking_number"}
        assert set(item) == MOVEMENT | fields
        assert item["user_uuid"] == user_id
        assert item["created_at"].endswith(("Z", "+00:00"))
    for path in ("/inventory/products", f"/inventory/products/{row['id']}"):
        result = http.get(path).json()
        result = result[0] if isinstance(result, list) else result
        assert set(result) == PRODUCT
        assert result["current_stock"] == 8


def test_aggregate_key_domains_and_null_average():
    from pydantic import ValidationError
    from services.api.analysis_schemas import AnalysisResponse

    # All-invalid input is still a successful aggregate with no scored incidents.
    content = (",".join(REQUIRED_COLUMNS) + "\n" + ",".join(["invalid"] * len(REQUIRED_COLUMNS)) + "\n").encode()
    summary = analyze_csv_bytes(content)
    assert summary["valid_records"] == 0
    assert summary["satisfaction"]["average"] is None
    assert AnalysisResponse.model_validate(summary).model_dump() == summary
    for section in ("invalid_reasons", "categories", "statuses", "countries"):
        for bad_value in ("source row", {"raw": "row"}):
            malformed = summary | {section: {next(iter(summary[section])): bad_value}}
            with pytest.raises(ValidationError):
                AnalysisResponse.model_validate(malformed)
        with pytest.raises(ValidationError):
            AnalysisResponse.model_validate(summary | {section: {"unexpected key": 1}})
    with pytest.raises(ValidationError):
        AnalysisResponse.model_validate(summary | {"satisfaction": summary["satisfaction"] | {"scores": {"6": 1}}})


def test_user_delete_remains_empty_204(api):
    http, user_id = api
    response = http.delete("/users/" + user_id)
    assert response.status_code == 204
    assert response.content == b""
    assert "content-type" not in response.headers


def test_openapi_separates_inputs_outputs_and_non_json_exceptions(client):
    from services.api import models, incident_models, inventory_schemas

    for output, input_model in ((models.SupplierResponse, models.SupplierCreate),
                                (inventory_schemas.ProductResponse, inventory_schemas.ProductCreate)):
        assert not issubclass(output, input_model)
    response = getattr(incident_models, "IncidentResponse", None)
    assert response is not None
    assert not issubclass(response, (incident_models.Incident, incident_models.IncidentCreate))
    schema = client.get("/openapi.json").json()
    for path, input_name, output_name in (("/suppliers", "SupplierCreate", "SupplierResponse"),
                                        ("/api/incidents", "IncidentCreate", "IncidentResponse"),
                                        ("/inventory/products", "ProductCreate", "ProductResponse")):
        operation = schema["paths"][path]["post"]
        assert operation["requestBody"]["content"]["application/json"]["schema"]["$ref"].endswith("/" + input_name)
        assert operation["responses"]["201"]["content"]["application/json"]["schema"]["$ref"].endswith("/" + output_name)
    export = next(route for route in incidents.router.routes if route.path.endswith("/export"))
    assert export.response_model is None
    assert export.response_class is StreamingResponse
    content = schema["paths"]["/api/incidents/results/export"]["get"]["responses"]["200"]["content"]
    assert content == {"text/csv": {"schema": {"type": "string", "format": "binary"}}}
    assert "content" not in schema["paths"]["/users/{user_id}"]["delete"]["responses"]["204"]
