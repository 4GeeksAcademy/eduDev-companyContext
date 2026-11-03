"""Bounded synthetic HTTP profile; never uses configured stores or external services."""
from argparse import ArgumentParser
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
from statistics import median
import sys
from tempfile import TemporaryDirectory
from time import perf_counter
from unittest.mock import patch
from uuid import UUID

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


@contextmanager
def synthetic_client(rows):
    """Isolate all stores/config before app import and lifespan; clean on failure too."""
    with TemporaryDirectory(prefix="trackflow-cache-profile-") as directory:
        environment = {
            "TRACKFLOW_USERS_DB_PATH": str(Path(directory) / "users.json"),
            "TRACKFLOW_SUPPLIERS_DB_PATH": str(Path(directory) / "suppliers.json"),
            "TRACKFLOW_INCIDENTS_DB_PATH": str(Path(directory) / "incidents.json"),
            "JWT_SECRET_KEY": "synthetic-cache-profile-only-not-a-deployment-secret",
            "ACCESS_TOKEN_EXPIRE_MINUTES": "30", "DATABASE_URL": "",
            "RESEND_API_KEY": "", "RESEND_FROM_EMAIL": "",
        }
        with patch.dict(os.environ, environment), patch(
            "urllib.request.urlopen", side_effect=AssertionError("Network forbidden")
        ):
            from fastapi.testclient import TestClient
            from packages.shared.incidents import (
                IncidentBranch, IncidentCategory, IncidentOrigin, IncidentStatus,
            )
            from services.api.app.main import app
            from services.api.incident_models import Incident
            from services.api.incident_store import insert_incident_if_absent
            from services.api.tests.auth_helpers import register_and_login

            for index in range(rows):
                timestamp = datetime(2025, 1, 1, tzinfo=timezone.utc) + timedelta(hours=index)
                record = Incident(
                    id=str(UUID(int=index + 1)), title=f"Synthetic shipment {index}",
                    description=f"Synthetic route {index % 37}: parcel exception {index}",
                    category=list(IncidentCategory)[index % len(IncidentCategory)],
                    status=list(IncidentStatus)[index % len(IncidentStatus)],
                    origin=list(IncidentOrigin)[index % len(IncidentOrigin)],
                    branch=list(IncidentBranch)[index % len(IncidentBranch)],
                    created_at=timestamp, updated_at=timestamp,
                )
                assert insert_incident_if_absent(record)
            with TestClient(app) as client:
                _, headers = register_and_login(client)
                client.headers.update(headers)
                yield client


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--rows", type=int, nargs="+", default=[50, 1000],
                        help="Synthetic row counts, each 1..2000 (default: 50 1000).")
    parser.add_argument("--repeats", type=int, default=7,
                        help="Warm requests per endpoint, 3..20 (default: 7).")
    args = parser.parse_args()
    if not 3 <= args.repeats <= 20 or len(args.rows) > 4 or any(not 1 <= n <= 2000 for n in args.rows):
        parser.error("Use at most four row counts in 1..2000 and repeats in 3..20.")
    from services.api.app.routers import incident_management as routes
    for rows in args.rows:
        with synthetic_client(rows) as client:
            for path in ("/api/incidents?status=open&branch=central", "/api/incidents/summary"):
                with patch.object(routes, "list_incidents", wraps=routes.list_incidents) as scan:
                    start = perf_counter()
                    response = client.get(path)
                    cold_ms = (perf_counter() - start) * 1000
                    assert response.status_code == 200
                    cold_scans = scan.call_count
                    samples = []
                    for _ in range(args.repeats):
                        start = perf_counter()
                        repeated = client.get(path)
                        samples.append((perf_counter() - start) * 1000)
                        assert repeated.status_code == 200 and repeated.json() == response.json()
                    print(json.dumps(dict(rows=rows, path=path.split("?")[0],
                                          repeats=args.repeats, cold_ms=round(cold_ms, 3),
                                          warm_median_ms=round(median(samples), 3),
                                          cold_scans=cold_scans,
                                          warm_scans=scan.call_count - cold_scans)))


if __name__ == "__main__":
    main()
