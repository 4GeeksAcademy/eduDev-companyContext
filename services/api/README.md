# TrackFlow Operations API

This FastAPI service preserves the aggregate-only Incident Analyzer and adds a
small Pydantic + TinyDB Supplier Directory. Incident source files remain transient;
supplier records persist in an API-owned JSON database.

## Run locally

From the repository root:

```bash
uv sync
uv run seed
uv run uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload
```

The application also runs the same idempotent seed bootstrap at startup, so a new
default database never produces an empty demonstration. `uv run seed` remains the
explicit setup command: a clean run reports 15 inserts and later runs report 0.

Supplier data defaults to `services/api/data/suppliers.json`. Override it for
isolated tests or local experiments without changing code:

```bash
TRACKFLOW_SUPPLIERS_DB_PATH=/tmp/trackflow-suppliers.json uv run seed
```

The API documentation is available at `http://localhost:8000/docs`.

To allow another static UI origin, set a comma-separated explicit allowlist:

```bash
TRACKFLOW_CORS_ORIGINS="http://localhost:3000,http://your-tailnet-host:3000" \
  uvicorn services.api.app.main:app --host 0.0.0.0 --port 8000
```

## Endpoints

- `POST /api/incidents/analyze` accepts one UTF-8 `.csv` upload.
- `GET /api/incidents/results/export` downloads aggregate metrics as `results.csv`.
- `POST /suppliers` creates a validated supplier.
- `GET /suppliers` lists suppliers; optional exact `country` and `category` query
  parameters can be combined.
- `GET /suppliers/{id}` returns one supplier.
- `PATCH /suppliers/{id}/rate` updates a positive rate and its timestamp.
- `PATCH /suppliers/{id}/status` activates or suspends a supplier.
- `DELETE /suppliers/{id}` removes a supplier.

## Tests

Run all API tests from the repository root:

```bash
uv run python -m unittest discover -s services/api/tests -v
```

`services/api/requirements.txt` remains available for the existing virtualenv +
pip workflow.
