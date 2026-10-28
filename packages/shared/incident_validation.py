"""Standard-library validation for the legacy TrackFlow CSV contract.

Records passed to validate_record must already have whitespace stripped. The
caller owns duplicate tracking; validation never mutates the supplied set.
"""
from __future__ import annotations

import re
from datetime import date

REQUIRED_COLUMNS = (
    "incident_id", "date", "country", "customer_type", "tracking_number",
    "carrier", "category", "description", "status", "customer_email",
    "satisfaction_score",
)
CATEGORIES = (
    "LOST_PARCEL", "DELAYED_DELIVERY", "WRONG_ADDRESS", "RETURN_REQUEST", "DAMAGE",
)
STATUSES = ("OPEN", "CLOSED", "DISCARDED")
COUNTRIES = ("US", "ES")
CUSTOMER_TYPES = ("B2B", "B2C")
CARRIERS_BY_COUNTRY = {
    "US": {"UPS", "FEDEX", "DHL_US"},
    "ES": {"MRW", "SEUR", "DHL_ES", "LOCAL_ES"},
}
REASON_LABELS = {
    "invalid_incident_id": "Missing or invalid incident ID",
    "duplicate_incident_id": "Duplicate incident ID",
    "invalid_date": "Missing or invalid date",
    "invalid_country": "Missing or invalid country",
    "invalid_customer_type": "Missing or invalid customer type",
    "invalid_tracking_number": "Missing or invalid tracking number",
    "carrier_country_mismatch": "Carrier not valid for declared country",
    "invalid_category": "Missing or invalid category",
    "invalid_description": "Missing or invalid description",
    "invalid_status": "Missing or invalid status",
    "invalid_customer_email": "Missing or invalid customer email",
    "closed_without_score": "Closed incident without satisfaction score",
    "invalid_satisfaction_score": "Invalid satisfaction score",
}
INCIDENT_ID_PATTERN = re.compile(r"TRF-\d{6}\Z")
DATE_PATTERN = re.compile(r"\d{4}-\d{2}-\d{2}\Z")


class IncidentAnalysisError(ValueError):
    """Base class for safe, user-facing analysis errors."""


class EmptyCSVError(IncidentAnalysisError):
    """Raised when a CSV has no usable content or data records."""


class InvalidHeaderError(IncidentAnalysisError):
    """Raised when a CSV header does not exactly match the required schema."""


class MalformedCSVError(IncidentAnalysisError):
    """Raised when CSV syntax or row structure is malformed."""


def validate_header(header: list[str] | None, *, allow_missing_incident_id: bool = False) -> None:
    """Validate schema; only explicit seed callers may omit the ID column."""
    if header is None:
        raise EmptyCSVError("The CSV file is empty.")

    duplicates = sorted({name for name in header if header.count(name) > 1})
    required = set(REQUIRED_COLUMNS)
    if allow_missing_incident_id:
        required.remove("incident_id")
    missing = sorted(required - set(header))
    extra = sorted(set(header) - set(REQUIRED_COLUMNS))
    if duplicates or missing or extra:
        details = []
        if missing:
            details.append(f"missing columns: {', '.join(missing)}")
        if extra:
            details.append(f"unexpected columns: {', '.join(extra)}")
        if duplicates:
            details.append(f"duplicate columns: {', '.join(duplicates)}")
        raise InvalidHeaderError("Invalid CSV header; " + "; ".join(details) + ".")


def validate_record(record: dict[str, str], seen_ids: set[str], *, allow_missing_incident_id: bool = False) -> list[str]:
    """Validate stripped fields; opt-in permits absent IDs, never malformed IDs."""
    reasons: list[str] = []
    incident_id = record.get("incident_id", "")
    if not incident_id and allow_missing_incident_id:
        pass
    elif not INCIDENT_ID_PATTERN.fullmatch(incident_id):
        reasons.append("invalid_incident_id")
    elif incident_id in seen_ids:
        reasons.append("duplicate_incident_id")

    date_value = record["date"]
    if not DATE_PATTERN.fullmatch(date_value) or not is_valid_date(date_value):
        reasons.append("invalid_date")
    if record["country"] not in COUNTRIES:
        reasons.append("invalid_country")
    if record["customer_type"] not in CUSTOMER_TYPES:
        reasons.append("invalid_customer_type")
    if len(record["tracking_number"]) < 8:
        reasons.append("invalid_tracking_number")

    valid_carriers = CARRIERS_BY_COUNTRY.get(record["country"], set())
    if record["carrier"] not in valid_carriers:
        reasons.append("carrier_country_mismatch")
    if record["category"] not in CATEGORIES:
        reasons.append("invalid_category")
    if len(record["description"]) < 5:
        reasons.append("invalid_description")
    if record["status"] not in STATUSES:
        reasons.append("invalid_status")
    if not record["customer_email"] or "@" not in record["customer_email"]:
        reasons.append("invalid_customer_email")

    score_value = record["satisfaction_score"]
    if record["status"] == "CLOSED" and not score_value:
        reasons.append("closed_without_score")
    elif score_value:
        try:
            score = int(score_value)
        except ValueError:
            reasons.append("invalid_satisfaction_score")
        else:
            if str(score) != score_value or score not in range(1, 6):
                reasons.append("invalid_satisfaction_score")
    return reasons


def is_valid_date(value: str) -> bool:
    try:
        date.fromisoformat(value)
    except ValueError:
        return False
    return True
