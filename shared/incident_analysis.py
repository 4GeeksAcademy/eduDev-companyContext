"""Privacy-safe validation, aggregation, and export for TrackFlow incident CSVs."""

from __future__ import annotations

import csv
import io
from collections import Counter
from pathlib import Path
from typing import Any


# Reexport the existing contract, including private helper aliases, for callers.
from packages.shared.incident_validation import (
    REQUIRED_COLUMNS, CATEGORIES, STATUSES, COUNTRIES, CUSTOMER_TYPES,
    CARRIERS_BY_COUNTRY, REASON_LABELS, INCIDENT_ID_PATTERN, DATE_PATTERN,
    IncidentAnalysisError, EmptyCSVError, InvalidHeaderError, MalformedCSVError,
    validate_header as _validate_header,
    validate_record as _validate_record,
    is_valid_date as _is_valid_date,
)


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
