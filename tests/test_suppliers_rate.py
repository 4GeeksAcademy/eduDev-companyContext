from datetime import datetime, timezone

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from services.api.database import StorageError, get_supplier
from services.api.models import SupplierRateUpdate
from services.api.routes import suppliers


@pytest.mark.parametrize("rate", [0.000001, 12.5])
def test_rate_refreshes_timestamp_and_only_pricing_fields(rate, supplier_factory, monkeypatch):
    record = supplier_factory()
    other = supplier_factory()
    later = datetime(2040, 1, 1, tzinfo=timezone.utc)
    monkeypatch.setattr(suppliers, "utc_now", lambda: later)
    result = suppliers.change_supplier_rate(record["id"], SupplierRateUpdate(rate_per_shipment=rate))
    assert result == record | {"rate_per_shipment": rate, "updated_at": later.isoformat()}
    assert get_supplier(record["id"]) == result
    assert get_supplier(other["id"]) == other


@pytest.mark.parametrize("payload", [{"rate_per_shipment": 0}, {"rate_per_shipment": -1},
                                     {}, {"rate_per_shipment": 1, "status": "suspended"}])
def test_invalid_rate_leaves_storage_unchanged(payload, supplier_factory, database_paths):
    supplier_factory()
    snapshot = database_paths.suppliers.read_bytes()
    with pytest.raises(ValidationError):
        SupplierRateUpdate(**payload)
    assert database_paths.suppliers.read_bytes() == snapshot


def test_rate_missing_supplier_is_404():
    with pytest.raises(HTTPException) as error:
        suppliers.change_supplier_rate(1, SupplierRateUpdate(rate_per_shipment=2))
    assert error.value.status_code == 404


def test_rate_storage_failure(database_paths):
    database_paths.suppliers.write_text("broken JSON")
    with pytest.raises(StorageError):
        suppliers.change_supplier_rate(1, SupplierRateUpdate(rate_per_shipment=2))
