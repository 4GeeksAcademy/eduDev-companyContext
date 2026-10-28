import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from services.api.database import StorageError, get_supplier
from services.api.models import SupplierStatusUpdate
from services.api.routes.suppliers import change_supplier_status


@pytest.mark.parametrize("initial", ["active", "suspended"])
@pytest.mark.parametrize("target", ["active", "suspended"])
def test_status_changes_and_same_status_preserve_rate_timestamp(initial, target, supplier_factory):
    record = supplier_factory(status=initial)
    other = supplier_factory()
    result = change_supplier_status(record["id"], SupplierStatusUpdate(status=target))
    assert result == record | {"status": target}
    assert get_supplier(record["id"]) == result
    assert get_supplier(other["id"]) == other


@pytest.mark.parametrize("payload", [{"status": "bad"}, {}, {"status": "active", "rate_per_shipment": 9}])
def test_invalid_status_cannot_mutate(payload, supplier_factory, database_paths):
    supplier_factory()
    snapshot = database_paths.suppliers.read_bytes()
    with pytest.raises(ValidationError):
        SupplierStatusUpdate(**payload)
    assert database_paths.suppliers.read_bytes() == snapshot


def test_status_missing_supplier_is_404():
    with pytest.raises(HTTPException) as error:
        change_supplier_status(1, SupplierStatusUpdate(status="suspended"))
    assert error.value.status_code == 404


def test_status_storage_failure(database_paths):
    database_paths.suppliers.write_text("broken JSON")
    with pytest.raises(StorageError):
        change_supplier_status(1, SupplierStatusUpdate(status="suspended"))
