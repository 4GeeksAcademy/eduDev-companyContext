"""Supplier directory HTTP endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, status

from services.api.database import (
    delete_supplier,
    get_supplier,
    insert_supplier,
    list_suppliers,
    update_supplier,
)
from services.api.models import (
    Category,
    Country,
    SupplierCreate,
    SupplierRateUpdate,
    SupplierResponse,
    SupplierStatusUpdate,
)


router = APIRouter(prefix="/suppliers", tags=["suppliers"])


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def stored_payload(supplier: SupplierCreate) -> dict[str, object]:
    return {
        **supplier.model_dump(mode="json", exclude_none=True),
        "updated_at": utc_now().isoformat(),
    }


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(supplier: SupplierCreate) -> dict[str, object]:
    payload = stored_payload(supplier)
    supplier_id = insert_supplier(payload)
    return {"id": supplier_id, **payload}


@router.get("", response_model=list[SupplierResponse])
def read_suppliers(
    country: Country | None = None,
    category: Category | None = None,
) -> list[dict[str, object]]:
    return list_suppliers(country=country.value if country else None, category=category.value if category else None)


@router.get("/{supplier_id}", response_model=SupplierResponse)
def read_supplier(supplier_id: Annotated[int, Path(gt=0)]) -> dict[str, object]:
    supplier = get_supplier(supplier_id)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found.")
    return supplier


@router.patch("/{supplier_id}/rate", response_model=SupplierResponse)
def change_supplier_rate(
    supplier_id: int,
    update: SupplierRateUpdate,
) -> dict[str, object]:
    supplier = update_supplier(
        supplier_id,
        {
            "rate_per_shipment": update.rate_per_shipment,
            "updated_at": utc_now().isoformat(),
        },
    )
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found.")
    return supplier


@router.patch("/{supplier_id}/status", response_model=SupplierResponse)
def change_supplier_status(
    supplier_id: int,
    update: SupplierStatusUpdate,
) -> dict[str, object]:
    supplier = update_supplier(supplier_id, {"status": update.status.value})
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found.")
    return supplier


@router.delete("/{supplier_id}")
def remove_supplier(supplier_id: int) -> dict[str, object]:
    if not delete_supplier(supplier_id):
        raise HTTPException(status_code=404, detail="Supplier not found.")
    return {"success": True, "id": supplier_id}
