"""Standard-library incident manager rules, separate from legacy CSV enums."""
from datetime import datetime, timezone
from enum import StrEnum


class IncidentStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISCARDED = "discarded"


class IncidentOrigin(StrEnum):
    CUSTOMER = "customer"
    BRANCH = "branch"
    INTERNAL = "internal"


class IncidentBranch(StrEnum):
    CENTRAL = "central"
    LA_WAREHOUSE = "la_warehouse"
    LA_OFFICE = "la_office"
    ZARAGOZA_WAREHOUSE = "zaragoza_warehouse"
    ZARAGOZA_OFFICE = "zaragoza_office"


class IncidentCategory(StrEnum):
    LOST_PARCEL = "lost_parcel"
    DELIVERY_FAILURE = "delivery_failure"
    INVENTORY_DISCREPANCY = "inventory_discrepancy"
    CARRIER_ISSUE = "carrier_issue"
    RETURNS_ISSUE = "returns_issue"
    WAREHOUSE_INCIDENT = "warehouse_incident"
    SYSTEM_FAILURE = "system_failure"
    CLIENT_COMPLAINT = "client_complaint"
    OTHER = "other"


STATUS_TRANSITIONS = frozenset({
    (IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS),
    (IncidentStatus.OPEN, IncidentStatus.DISCARDED),
    (IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED),
    (IncidentStatus.IN_PROGRESS, IncidentStatus.DISCARDED),
})


class InvalidStatusTransitionError(ValueError):
    """A valid pair of statuses is not an allowed lifecycle edge."""


def validate_status_transition(current: str, target: str) -> IncidentStatus:
    """Return the target status or reject any edge outside the lifecycle."""
    current_status, target_status = IncidentStatus(current), IncidentStatus(target)
    if (current_status, target_status) not in STATUS_TRANSITIONS:
        raise InvalidStatusTransitionError("Invalid incident status transition.")
    return target_status


def validate_nonblank(value: str) -> str:
    """Reject blank text without altering literal descriptions."""
    if not value.strip():
        raise ValueError("Must not be blank.")
    return value


def normalize_utc(value: datetime) -> datetime:
    """Normalize aware timestamps; reject ambiguous naive timestamps."""
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("Timestamp must include a timezone.")
    return value.astimezone(timezone.utc)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
