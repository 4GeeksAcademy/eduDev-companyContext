"""Privacy-safe validation, aggregation, and export for TrackFlow incident CSVs."""

from __future__ import annotations

import csv
import io
import re
from collections import Counter
from datetime import date
from pathlib import Path
from typing import Any


REQUIRED_COLUMNS = (
    "incident_id",
    "date",
    "country",
    "customer_type",
    "tracking_number",
    "carrier",
    "category",
    "description",
    "status",
    "customer_email",
    "satisfaction_score",
)

CATEGORIES = (
    "LOST_PARCEL",
    "DELAYED_DELIVERY",
    "WRONG_ADDRESS",
    "RETURN_REQUEST",
    "DAMAGE",
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


def analyze_csv_file(path: str | Path) -> dict[str, Any]:
    """Analyze a UTF-8 CSV file without returning or logging source records."""
    raw_content = Path(path).read_bytes()
    return analyze_csv_bytes(raw_content)


def analyze_csv_bytes(raw_content: bytes) -> dict[str, Any]:
    """Decode and analyze CSV bytes, preserving Unicode errors for callers."""
    if not raw_content:
        raise EmptyCSVError("The CSV file is empty.")
    return analyze_csv_text(raw_content.decode("utf-8"))


def analyze_csv_text(content: str) -> dict[str, Any]:
    """Validate incident records and return aggregate-only metrics."""
    if not content.strip():
        raise EmptyCSVError("The CSV file is empty.")

    try:
        reader = csv.DictReader(io.StringIO(content, newline=""), strict=True)
        header = reader.fieldnames
        _validate_header(header)

        categories = Counter({category: 0 for category in CATEGORIES})
        statuses = Counter({status: 0 for status in STATUSES})
        countries = Counter({country: 0 for country in COUNTRIES})
        reasons: Counter[str] = Counter()
        scores = Counter({score: 0 for score in range(1, 6)})
        seen_incident_ids: set[str] = set()
        total_records = 0
        valid_records = 0
        closed_incidents = 0

        for row in reader:
            total_records += 1
            if None in row or any(value is None for value in row.values()):
                raise MalformedCSVError(
                    f"CSV row {reader.line_num} does not match the header structure."
                )

            normalized = {key: value.strip() for key, value in row.items()}
            row_reasons = _validate_record(normalized, seen_incident_ids)
            incident_id = normalized["incident_id"]
            if incident_id:
                seen_incident_ids.add(incident_id)

            if row_reasons:
                reasons.update(row_reasons)
                continue

            valid_records += 1
            categories[normalized["category"]] += 1
            statuses[normalized["status"]] += 1
            countries[normalized["country"]] += 1
            if normalized["status"] == "CLOSED":
                closed_incidents += 1
                scores[int(normalized["satisfaction_score"])] += 1
    except csv.Error as error:
        raise MalformedCSVError("The CSV file is malformed.") from error

    if total_records == 0:
        raise EmptyCSVError("The CSV file contains a header but no records.")

    scored_incidents = sum(scores.values())
    score_total = sum(score * count for score, count in scores.items())
    average = round(score_total / scored_incidents, 2) if scored_incidents else None

    return {
        "total_records": total_records,
        "valid_records": valid_records,
        "invalid_records": total_records - valid_records,
        "invalid_reasons": {key: reasons[key] for key in REASON_LABELS},
        "categories": {key: categories[key] for key in CATEGORIES},
        "statuses": {key: statuses[key] for key in STATUSES},
        "countries": {key: countries[key] for key in COUNTRIES},
        "satisfaction": {
            "closed_incidents": closed_incidents,
            "scored_incidents": scored_incidents,
            "average": average,
            "scores": {str(score): scores[score] for score in range(1, 6)},
        },
    }


def results_to_csv(summary: dict[str, Any]) -> str:
    """Serialize aggregate metrics only, with one row per metric."""
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(("section", "metric", "value"))
    writer.writerow(("totals", "total_records", summary["total_records"]))
    writer.writerow(("totals", "valid_records", summary["valid_records"]))
    writer.writerow(("totals", "invalid_records", summary["invalid_records"]))

    for metric, value in summary["invalid_reasons"].items():
        writer.writerow(("invalid_reasons", metric, value))
    for section in ("categories", "statuses", "countries"):
        for metric, value in summary[section].items():
            writer.writerow((section, metric, value))

    satisfaction = summary["satisfaction"]
    writer.writerow(("satisfaction", "closed_incidents", satisfaction["closed_incidents"]))
    writer.writerow(("satisfaction", "scored_incidents", satisfaction["scored_incidents"]))
    writer.writerow(("satisfaction", "average", satisfaction["average"] or ""))
    for score, value in satisfaction["scores"].items():
        writer.writerow(("satisfaction_scores", score, value))
    return output.getvalue()


def _validate_header(header: list[str] | None) -> None:
    if header is None:
        raise EmptyCSVError("The CSV file is empty.")

    duplicates = sorted({name for name in header if header.count(name) > 1})
    missing = sorted(set(REQUIRED_COLUMNS) - set(header))
    extra = sorted(set(header) - set(REQUIRED_COLUMNS))
    if duplicates or missing or extra or len(header) != len(REQUIRED_COLUMNS):
        details = []
        if missing:
            details.append(f"missing columns: {', '.join(missing)}")
        if extra:
            details.append(f"unexpected columns: {', '.join(extra)}")
        if duplicates:
            details.append(f"duplicate columns: {', '.join(duplicates)}")
        raise InvalidHeaderError("Invalid CSV header; " + "; ".join(details) + ".")


def _validate_record(record: dict[str, str], seen_ids: set[str]) -> list[str]:
    reasons: list[str] = []
    incident_id = record["incident_id"]
    if not INCIDENT_ID_PATTERN.fullmatch(incident_id):
        reasons.append("invalid_incident_id")
    elif incident_id in seen_ids:
        reasons.append("duplicate_incident_id")

    date_value = record["date"]
    if not DATE_PATTERN.fullmatch(date_value) or not _is_valid_date(date_value):
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


def _is_valid_date(value: str) -> bool:
    try:
        date.fromisoformat(value)
    except ValueError:
        return False
    return True
