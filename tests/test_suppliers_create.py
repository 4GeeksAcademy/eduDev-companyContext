from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from services.api.database import StorageError, get_supplier
from services.api.models import SupplierCreate


@pytest.mark.parametrize("optional", [{}, {"contact_email": " literal not-an-email ",
                                           "notes": " Notes\n ", "service_zone": " local "}])
@pytest.mark.parametrize("country,currency", [("USA", "USD"), ("Spain", "EUR")])
def test_create_validated_supplier_persists(country, currency, optional, supplier_factory):
    before = datetime.now(timezone.utc)
    result = supplier_factory(country=country, currency=currency, **optional)
    assert result["id"] == 1
    assert result["name"] == "Unit carrier"
    assert result["country"] == country and result["currency"] == currency
    assert result["categories"] == ["carrier_last_mile"]
    assert before <= datetime.fromisoformat(result["updated_at"]) <= datetime.now(timezone.utc)
    for key, value in optional.items():
        assert result[key] == value
    assert get_supplier(1) == result
    assert supplier_factory()["id"] == 2


@pytest.mark.parametrize("changes", [
    {"name": " "}, {"country": "bad"}, {"categories": []},
    {"categories": ["bad"]}, {"rate_per_shipment": 0}, {"rate_per_shipment": -1},
    {"country": "USA", "currency": "EUR"}, {"country": "Spain", "currency": "USD"},
    {"currency": "bad"}, {"status": "bad"}, {"id": 42}, {"updated_at": "injected"},
])
def test_invalid_supplier_creation_cannot_write(changes, database_paths):
    payload = dict(name="Carrier", country="USA", categories=["carrier_last_mile"],
                   rate_per_shipment=1, currency="USD", status="active")
    with pytest.raises(ValidationError):
        SupplierCreate(**(payload | changes))
    assert not database_paths.suppliers.exists()


def test_create_corrupt_storage_is_failure(supplier_factory, database_paths):
    database_paths.suppliers.write_text("broken JSON")
    with pytest.raises(StorageError):
        supplier_factory()
    assert database_paths.suppliers.read_text() == "broken JSON"
