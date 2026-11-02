"""Aggregate-only outputs for the legacy CSV analyzer (not manager enums)."""
from typing import Literal

from pydantic import BaseModel

Reason = Literal[
    "invalid_incident_id", "duplicate_incident_id", "invalid_date", "invalid_country",
    "invalid_customer_type", "invalid_tracking_number", "carrier_country_mismatch",
    "invalid_category", "invalid_description", "invalid_status", "invalid_customer_email",
    "closed_without_score", "invalid_satisfaction_score",
]
AnalysisCategory = Literal["LOST_PARCEL", "DELAYED_DELIVERY", "WRONG_ADDRESS", "RETURN_REQUEST", "DAMAGE"]
AnalysisStatus = Literal["OPEN", "CLOSED", "DISCARDED"]
AnalysisCountry = Literal["US", "ES"]
Score = Literal["1", "2", "3", "4", "5"]


class SatisfactionResponse(BaseModel):
    closed_incidents: int
    scored_incidents: int
    average: float | None
    scores: dict[Score, int]


class AnalysisResponse(BaseModel):
    total_records: int
    valid_records: int
    invalid_records: int
    invalid_reasons: dict[Reason, int]
    categories: dict[AnalysisCategory, int]
    statuses: dict[AnalysisStatus, int]
    countries: dict[AnalysisCountry, int]
    satisfaction: SatisfactionResponse
