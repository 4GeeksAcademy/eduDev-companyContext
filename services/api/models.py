"""Pydantic schemas for TrackFlow suppliers."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator


class Country(StrEnum):
    USA = "USA"
    SPAIN = "Spain"


class Category(StrEnum):
    CARRIER_LAST_MILE = "carrier_last_mile"
    CARRIER_INTERNATIONAL = "carrier_international"
    WAREHOUSE_SUPPLIES = "warehouse_supplies"
    PACKAGING_MATERIALS = "packaging_materials"
    REVERSE_LOGISTICS = "reverse_logistics"
    FLEET_MAINTENANCE = "fleet_maintenance"
    IT_AND_WMS_SOFTWARE = "it_and_wms_software"
    CLEANING_AND_FACILITIES = "cleaning_and_facilities"


class Currency(StrEnum):
    USD = "USD"
    EUR = "EUR"


class SupplierStatus(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


NonBlankString = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
PositiveRate = Annotated[float, Field(gt=0)]


class SupplierCreate(BaseModel):
    """Client-provided fields for a new supplier."""

    model_config = ConfigDict(extra="forbid")

    name: NonBlankString
    country: Country
    categories: Annotated[list[Category], Field(min_length=1)]
    rate_per_shipment: PositiveRate
    currency: Currency
    status: SupplierStatus
    service_zone: str | None = None
    contact_email: str | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_country_currency(self) -> "SupplierCreate":
        expected = Currency.USD if self.country == Country.USA else Currency.EUR
        if self.currency != expected:
            raise ValueError(f"currency must be {expected.value} for {self.country.value}")
        return self


class SupplierResponse(SupplierCreate):
    """Stored supplier returned by the API."""

    id: int
    updated_at: datetime


class SupplierRateUpdate(BaseModel):
    """Allowed payload for changing a supplier rate."""

    model_config = ConfigDict(extra="forbid")
    rate_per_shipment: PositiveRate


class SupplierStatusUpdate(BaseModel):
    """Allowed payload for activating or suspending a supplier."""

    model_config = ConfigDict(extra="forbid")
    status: SupplierStatus
