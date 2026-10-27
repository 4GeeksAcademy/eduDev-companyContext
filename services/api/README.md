# TrackFlow Operations API

This FastAPI service preserves the aggregate-only Incident Analyzer and adds a
small Pydantic + TinyDB Supplier Directory. Incident source files remain transient;
supplier records persist in an API-owned JSON database. Public user registration
stores identities and linked profiles in a separate TinyDB file. JWT login and
route protection are not delivered yet; operational routes remain unchanged.

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

## Public registration

`POST /users` accepts JSON with required `email` and `password`, plus optional
`name`, `phone`, and `address`:

```json
{"email": "person@example.test", "password": "choose-a-private-password", "name": "Person"}
```

A successful request returns **201** with `id`, normalized `email`, `is_active`,
`role`, and `created_at`. It never returns the password or hash. Registration
always assigns role `user`, active status and a UTC timestamp server-side. All
unknown fields (including `role`, `is_active`, and IDs) return **422**. Passwords
must contain 1–72 UTF-8 bytes; oversized multibyte input is rejected, not truncated.
Email validation is deliberately simple; surrounding whitespace and case are
normalized consistently. A duplicate normalized email returns **409**.

Identity storage defaults to `services/api/data/users.json`; override with
`TRACKFLOW_USERS_DB_PATH` for isolated environments. Named `users` and `profiles`
tables hold separate records, and every identity has a profile even if contact
fields are absent. Explicit UUID strings are stored in record `id` fields;
TinyDB document IDs are not identities. Future modules should reference these
identities as `user_uuid`, not create SQL user/profile tables.

Run **one API worker** with this local TinyDB store. Registration serializes
in-process access and writes both records together; TinyDB does not provide
multi-process coordination or crash-safe transactions. Keep the identity file
private: it contains email/contact data and bcrypt hashes.

`uv sync` installs `libpass[bcrypt]` (imported as `passlib.hash.bcrypt`, not the
legacy passlib distribution). `python-jose[cryptography]` is installed for the next
unit but is not used yet. No JWT secret or `.env` file is required for registration;
`.env` files are ignored. Login, tokens, user CRUD and profile endpoints remain
pending. No authentication protection is claimed for existing endpoints.

## Tests

Run all API tests from the repository root:

```bash
uv run python -m unittest discover -s services/api/tests -v
```

Focused registration checks use temporary TinyDB files, including credential
verification, safe responses, validation and failure consistency:

```bash
uv run python -m unittest discover -s services/api/tests -p 'test_auth_registration.py' -v
```

`services/api/requirements.txt` remains available for the existing virtualenv +
pip workflow.
