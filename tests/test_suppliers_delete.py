import pytest
from fastapi import HTTPException

from services.api.database import StorageError, get_supplier
from services.api.routes.suppliers import remove_supplier


def test_delete_removes_only_target_and_repeat_is_absent(supplier_factory, database_paths):
    record = supplier_factory()
    other = supplier_factory()
    assert remove_supplier(record["id"]) == {"success": True, "id": record["id"]}
    assert get_supplier(record["id"]) is None
    assert get_supplier(other["id"]) == other
    snapshot = database_paths.suppliers.read_bytes()
    with pytest.raises(HTTPException) as error:
        remove_supplier(record["id"])
    assert error.value.status_code == 404
    assert database_paths.suppliers.read_bytes() == snapshot


def test_unknown_delete_is_404():
    with pytest.raises(HTTPException) as error:
        remove_supplier(999)
    assert error.value.status_code == 404


def test_delete_storage_failure(database_paths):
    database_paths.suppliers.write_text("broken JSON")
    with pytest.raises(StorageError):
        remove_supplier(1)
