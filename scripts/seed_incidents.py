"""Explicit, privacy-safe historical seed; never invoked at API startup."""
import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
import sys
from uuid import UUID, uuid5

# Direct invocation from the repository root (or another working directory).
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pydantic import ValidationError
from packages.shared.incident_validation import validate_header, validate_record, IncidentAnalysisError
from services.api.incident_models import Incident
from services.api.incident_store import insert_incident_if_absent

# Fixed application namespace; UUID5 names are trimmed, validated legacy IDs.
SEED_NAMESPACE = UUID("a38f716a-d93e-5a2b-9dc9-d81d3b3d6139")
STATUSES = {"OPEN": "open", "CLOSED": "resolved", "DISCARDED": "discarded"}
CATEGORIES = {"LOST_PARCEL": "lost_parcel", "DELAYED_DELIVERY": "carrier_issue", "DAMAGE": "carrier_issue", "WRONG_ADDRESS": "delivery_failure", "RETURN_REQUEST": "returns_issue"}
BRANCHES = {"US": "la_office", "ES": "zaragoza_office"}


def read_incidents(path: Path) -> tuple[list[Incident], list[tuple[int, list[str]]]]:
    """Validate the entire structure before persistence; retain no customer fields."""
    incidents, invalid = [], []
    seen_ids: set[str] = set()
    with path.open(encoding="utf-8", newline="") as source:
        reader = csv.DictReader(source, strict=True)
        validate_header(reader.fieldnames, allow_missing_incident_id=True)
        count = 0
        for row in reader:
            count += 1
            if None in row or any(value is None for value in row.values()):
                raise ValueError("Invalid CSV structure.")
            normalized = {key: value.strip() for key, value in row.items()}
            reasons = validate_record(normalized, seen_ids, allow_missing_incident_id=True)
            # Match analyzer ownership: even invalid earlier records reserve IDs.
            source_id = normalized.get("incident_id", "")
            if source_id:
                seen_ids.add(source_id)
            if reasons:
                invalid.append((reader.line_num, reasons))
                continue
            try:
                title = row["description"][:120].strip()
                if not title:
                    raise ValueError("Empty seed title.")
                timestamp = datetime.fromisoformat(normalized["date"]).replace(tzinfo=timezone.utc)
                # Tagged JSON array avoids delimiter ambiguity and valid-ID overlap.
                identity = source_id or json.dumps(
                    ["title+created_at", title, timestamp.isoformat()],
                    ensure_ascii=True, separators=(",", ":"),
                )
                incidents.append(Incident(
                    id=str(uuid5(SEED_NAMESPACE, identity)),
                    title=title, description=row["description"],
                    status=STATUSES[normalized["status"]],
                    category=CATEGORIES[normalized["category"]],
                    origin="customer", branch=BRANCHES[normalized["country"]],
                    created_at=timestamp, updated_at=timestamp,
                ))
            except (KeyError, ValueError, ValidationError):
                invalid.append((reader.line_num, ["invalid_manager_mapping"]))
        if not count:
            raise ValueError("No CSV records.")
    return incidents, invalid


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", type=Path)
    args = parser.parse_args(argv)
    try:
        incidents, invalid = read_incidents(args.csv_path)
    except (OSError, UnicodeError, csv.Error, IncidentAnalysisError, ValueError):
        print("Error: cannot read a structurally valid UTF-8 incident CSV.", file=sys.stderr)
        return 1
    inserted = existing = failures = 0
    for incident in incidents:
        try:
            if insert_incident_if_absent(incident):
                inserted += 1
            else:
                existing += 1
        except Exception:
            # Storage exceptions may contain paths/data; never print their values.
            failures += 1
    print(f"inserted={inserted} existing={existing} invalid={len(invalid)} failures={failures}")
    for line, reasons in invalid:
        print(f"Row {line}: {', '.join(reasons)}")
    if failures:
        print("Error: incident storage failed; successful inserts are safe to rerun.", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
