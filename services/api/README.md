# TrackFlow Operations API

This FastAPI service preserves the aggregate-only Incident Analyzer and adds a
small Pydantic + TinyDB Supplier Directory. Incident source files remain transient;
supplier records persist in an API-owned JSON database. Public user registration
stores identities and linked profiles in a separate TinyDB file. Form login issues
JWTs and `GET /auth/me` requires a bearer token. Existing operational endpoints
and registration remain public; user CRUD/profile routes and operational route
protection belong to the next units.

## Run locally

From the repository root:

```bash
uv sync
uv run seed
uv run --env-file .env uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload
```

Before starting, create a local ignored `.env` with `JWT_SECRET_KEY` set to a
private, randomly generated signing secret (for example, generate one locally with
Python's `secrets.token_urlsafe(32)`). Never commit the secret or real `.env`.
Optionally set `ACCESS_TOKEN_EXPIRE_MINUTES=30`; 30 minutes is the default.
The duration must be positive, finite, representable as a datetime, and produce a
future JWT expiry at whole-second precision. There is no fallback signing secret.
Invalid or missing configuration returns **503** with a value-free error for token
issuance/authentication; registration does not require JWT configuration.
`uv run --env-file .env ...` explicitly loads these variables; plain `uv run` does
not load that file automatically.

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
  uv run --env-file .env uvicorn services.api.app.main:app --host 0.0.0.0 --port 8000
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
legacy passlib distribution). `python-jose[cryptography]` signs and validates JWTs.
No JWT secret or `.env` file is required for registration; `.env` files are ignored.
User CRUD and profile endpoints remain pending. Existing incident and supplier
endpoints are explicitly **not protected yet**.

## Login and current user

- `POST /auth/login` accepts `application/x-www-form-urlencoded` fields: required
  `password`, and `email` or OAuth `username` containing the email. Both aliases
  may be supplied only if they normalize to the same email. This is a form-only
  contract, not JSON. Successful login returns `access_token` and
  `token_type: bearer`. Invalid credentials or inactive users return generic
  **401**; invalid form input returns credential-free **422**.
- Tokens use only **HS256**, stored UUID `User.id` as `sub`, and mandatory `exp`.
  Requests resolve active identities and roles from TinyDB, never token roles.
- `GET /auth/me` requires `Authorization: Bearer <access_token>` and returns safe
  identity fields plus linked `profile` (`id`, `user_id`, `name`, `phone`, `address`).
  Passwords/hashes are never returned. A missing linked profile is a **500** storage
  invariant error, not a successful partial response.
- Missing/invalid/expired tokens and deleted/inactive identities return **401**
  with `WWW-Authenticate: Bearer`. No sessions, cookies or refresh tokens are used.

### Manual Swagger check — instructions only, not exercised

1. Start with the ignored `.env` loaded and open `http://localhost:8000/docs`.
2. Register through `POST /users`, then log in with the form in `POST /auth/login`.
3. Click **Authorize**; use the email in the **username** field and the password.
4. Execute `GET /auth/me`; confirm email, database role and linked profile.
5. Clear authorization and retry `/auth/me` for **401**. A malformed or expired
   bearer token must also return **401** (automated fixtures cover these cases).

No manual `/docs` execution is claimed by the automated HTTP/OpenAPI tests.

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

Focused token checks (temporary TinyDB, no real secret or runtime data):

```bash
uv run python -m unittest discover -s services/api/tests -p 'test_auth_tokens.py' -v
```

Use **uv only** for this assignment. `services/api/requirements.txt` is a
compatibility mirror, not the recommended setup workflow.
