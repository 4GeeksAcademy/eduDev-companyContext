"""Dedicated incident persistence; one worker, serialized in-process access."""
from collections.abc import Iterator
from contextlib import contextmanager
import os
from pathlib import Path
from threading import RLock

from tinydb import Query, TinyDB

from packages.shared.incidents import IncidentStatus, utc_now, validate_status_transition
from services.api.incident_models import Incident, IncidentCreate

DEFAULT_DB_PATH = Path(__file__).resolve().parent / "data" / "incidents.json"
DB_PATH_ENV = "TRACKFLOW_INCIDENTS_DB_PATH"
_LOCK = RLock()


def database_path() -> Path:
    configured = os.getenv(DB_PATH_ENV)
    return Path(configured).expanduser() if configured else DEFAULT_DB_PATH


@contextmanager
def _open_database() -> Iterator[TinyDB]:
    # Hold through close: separate TinyDB instances must not cache stale writes.
    with _LOCK:
        path = database_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        database = TinyDB(path)
        try:
            yield database
        finally:
            database.close()


def insert_incident_if_absent(incident: Incident) -> bool:
    """Insert by public UUID; existing records are never overwritten."""
    with _open_database() as database:
        if database.contains(Query().id == incident.id):
            return False
        database.insert(incident.model_dump(mode="json"))
        return True


def create_incident(payload: IncidentCreate) -> Incident:
    now = utc_now()
    incident = Incident(**payload.model_dump(), created_at=now, updated_at=now)
    if not insert_incident_if_absent(incident):
        raise ValueError("Incident identity already exists.")
    return incident


def list_incidents() -> list[Incident]:
    with _open_database() as database:
        return [Incident.model_validate(record) for record in database.all()]


def get_incident(incident_id: str) -> Incident | None:
    with _open_database() as database:
        record = database.get(Query().id == incident_id)
        return Incident.model_validate(record) if record is not None else None


def update_incident_status(incident_id: str, status: IncidentStatus | str) -> Incident | None:
    """Return None if absent; invalid lifecycle edges raise ValueError without writes."""
    with _open_database() as database:
        record = database.get(Query().id == incident_id)
        if record is None:
            return None
        incident = Incident.model_validate(record)
        incident.status = validate_status_transition(incident.status, status)
        incident.updated_at = utc_now()
        serialized = incident.model_dump(mode="json")
        database.update({key: serialized[key] for key in ("status", "updated_at")}, doc_ids=[record.doc_id])
        return incident
