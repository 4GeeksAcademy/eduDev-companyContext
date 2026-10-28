import pytest

from services.api.database import StorageError
from services.api.models import Category, Country
from services.api.routes.suppliers import read_suppliers


@pytest.mark.parametrize("country,category,expected", [
    (None, None, {0, 1, 2}), (Country.USA, None, {0, 2}),
    (Country.SPAIN, None, {1}), (None, Category.CARRIER_LAST_MILE, {0, 1}),
    (None, Category.PACKAGING_MATERIALS, {0, 2}),
    (Country.USA, Category.CARRIER_LAST_MILE, {0}),
    (Country.SPAIN, Category.PACKAGING_MATERIALS, set()),
])
def test_filters_use_exact_country_and_category_membership(
    country, category, expected, supplier_factory, database_paths
):
    records = [supplier_factory(categories=["carrier_last_mile", "packaging_materials"]),
               supplier_factory(country="Spain", currency="EUR"),
               supplier_factory(categories=["packaging_materials"])]
    snapshot = database_paths.suppliers.read_bytes()
    assert {record["id"] for record in read_suppliers(country=country, category=category)} == {
        records[i]["id"] for i in expected
    }
    assert database_paths.suppliers.read_bytes() == snapshot


def test_empty_directory():
    assert read_suppliers(country=None, category=None) == []


@pytest.mark.parametrize("enum", [Country, Category])
def test_invalid_filter_enum_is_rejected(enum):
    with pytest.raises(ValueError):
        enum("bad")


def test_directory_storage_failure(database_paths):
    database_paths.suppliers.write_text("broken JSON")
    with pytest.raises(StorageError):
        read_suppliers(country=None, category=None)
