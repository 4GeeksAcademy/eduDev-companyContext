import pytest
from fastapi import HTTPException

from services.api.database import StorageError
from services.api.routes.suppliers import read_supplier


def test_get_first_positive_id_preserves_record(supplier_factory, database_paths):
    record = supplier_factory(contact_email="not validated as email")
    snapshot = database_paths.suppliers.read_bytes()
    assert read_supplier(1) == record
    assert database_paths.suppliers.read_bytes() == snapshot


def test_unknown_supplier_does_not_mutate(supplier_factory, database_paths):
    supplier_factory()
    snapshot = database_paths.suppliers.read_bytes()
    with pytest.raises(HTTPException) as error:
        read_supplier(999)
    assert error.value.status_code == 404
    assert database_paths.suppliers.read_bytes() == snapshot


def test_get_storage_failure_is_not_absence(database_paths):
    database_paths.suppliers.write_text("broken JSON")
    with pytest.raises(StorageError):
        read_supplier(1)
