"""Public inventory inputs and explicit inbound/outbound response contracts."""
from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Warehouse = Literal["LA", "ZGZ"]
Quantity = Annotated[int, Field(strict=True, gt=0)]


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ProductCreate(Input):
    name: Text
    sku: Text
    client_name: Text
    category: Literal["fashion", "electronics", "cosmetics"]
    warehouse: Warehouse


class ProductResponse(ProductCreate):
    id: int
    current_stock: int


class MovementCreate(Input):
    sku_id: Annotated[int, Field(strict=True, gt=0)]
    quantity: Quantity
    warehouse: Warehouse


class EntryCreate(MovementCreate):
    reference: Text


class ExitCreate(MovementCreate):
    exit_type: Literal["dispatch", "loss"]
    tracking_number: Text | None = None

    @model_validator(mode="after")
    def tracking_matches_type(self):
        if (self.exit_type == "dispatch") != (self.tracking_number is not None):
            raise ValueError("Dispatch requires tracking; loss requires null tracking.")
        return self


class MovementResponse(BaseModel):
    id: str
    sku_id: int
    name: str
    sku: str
    client_name: str
    category: str
    warehouse: Warehouse
    quantity: int
    created_at: datetime
    user_uuid: str

    @field_validator("created_at")
    @classmethod
    def utc_date(cls, value):
        # SQLite test storage drops timezone information; production uses timestamptz.
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


class EntryResponse(MovementResponse):
    order_type: Literal["inbound"] = "inbound"
    reference: str


class ExitResponse(MovementResponse):
    order_type: Literal["outbound"] = "outbound"
    exit_type: Literal["dispatch", "loss"]
    tracking_number: str | None
