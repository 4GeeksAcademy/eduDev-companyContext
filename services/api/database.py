"""Small TinyDB helpers for supplier persistence."""

from __future__ import annotations

import os
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Any

from tinydb import Query, TinyDB


DEFAULT_DB_PATH = Path(__file__).resolve().parent / "data" / "suppliers.json"
DB_PATH_ENV = "TRACKFLOW_SUPPLIERS_DB_PATH"


def database_path() -> Path:
    """Return the configured supplier database path."""
    configured = os.getenv(DB_PATH_ENV)
    return Path(configured).expanduser() if configured else DEFAULT_DB_PATH


@contextmanager
def open_database() -> Iterator[TinyDB]:
    """Open the supplier database and always close its file handle."""
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    database = TinyDB(path)
    try:
        yield database
    finally:
        database.close()


def insert_supplier(data: dict[str, Any]) -> int:
    with open_database() as database:
        return int(database.insert(data))


def list_suppliers(country: str | None = None, category: str | None = None) -> list[dict[str, Any]]:
    with open_database() as database:
        records = database.all()
    results = []
    for record in records:
        if country is not None and record.get("country") != country:
            continue
        if category is not None and category not in record.get("categories", []):
            continue
        results.append({"id": int(record.doc_id), **dict(record)})
    return results


def get_supplier(supplier_id: int) -> dict[str, Any] | None:
    with open_database() as database:
        record = database.get(doc_id=supplier_id)
    return None if record is None else {"id": int(record.doc_id), **dict(record)}


def update_supplier(supplier_id: int, fields: dict[str, Any]) -> dict[str, Any] | None:
    with open_database() as database:
        updated = database.update(fields, doc_ids=[supplier_id])
    return get_supplier(supplier_id) if updated else None


def delete_supplier(supplier_id: int) -> bool:
    with open_database() as database:
        removed = database.remove(doc_ids=[supplier_id])
    return bool(removed)


def supplier_names() -> set[str]:
    with open_database() as database:
        name = Query().name
        return {str(record["name"]) for record in database.search(name.exists())}
