"""Inventory tables; stock is never stored and identities stay in TinyDB."""
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class SKU(SQLModel, table=True):
    __tablename__ = "inventory_sku"
    id: int | None = Field(default=None, primary_key=True)
    name: str
    sku: str = Field(unique=True, index=True)
    client_name: str
    category: str
    warehouse: str


class Movement(SQLModel):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    sku_id: int = Field(foreign_key="inventory_sku.id", index=True)
    quantity: int
    warehouse: str
    user_uuid: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=DateTime(timezone=True))
    # Stable identifiers are used only by the explicit demonstration seed.
    seed_key: str | None = Field(default=None, unique=True)


class StockEntry(Movement, table=True):
    __tablename__ = "inventory_stock_entry"
    reference: str


class StockExit(Movement, table=True):
    __tablename__ = "inventory_stock_exit"
    exit_type: str
    tracking_number: str | None = None
