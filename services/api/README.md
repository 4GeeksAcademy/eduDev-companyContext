# TrackFlow Operations API

This FastAPI service preserves the aggregate-only Incident Analyzer and adds a
small Pydantic + TinyDB Supplier Directory. Incident source files remain transient;
supplier records persist in an API-owned JSON database. Public user registration
stores identities and linked profiles in a separate TinyDB file. Form login issues
JWTs. All eight operational endpoints below, user CRUD and owner profile routes
require bearer authentication. Registration, login and API documentation remain public.

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

## Protected operational endpoints

All active authenticated roles (`user`, `manager`, `admin`) may use these eight
routes. Send `Authorization: Bearer <access_token>`. Missing, malformed or expired
tokens and deleted/inactive identities return **401** with `WWW-Authenticate: Bearer`.
Successful schemas, validation, supplier IDs and seed behavior are unchanged;
there is no supplier ownership or admin-only operational policy.

- `POST /api/incidents/analyze` accepts one UTF-8 `.csv` upload.
- `GET /api/incidents/results/export` downloads aggregate metrics as `results.csv`.
- `POST /suppliers` creates a validated supplier.
- `GET /suppliers` lists suppliers; optional exact `country` and `category` query
  parameters can be combined.
- `GET /suppliers/{id}` returns one supplier.
- `PATCH /suppliers/{id}/rate` updates a positive rate and its timestamp.
- `PATCH /suppliers/{id}/status` activates or suspends a supplier.
- `DELETE /suppliers/{id}` removes a supplier.

The unchanged static incident/supplier frontend does not send tokens and now
receives **401**; frontend authentication integration is outside this delivery.
CORS permits PUT and Authorization alongside the existing methods and Content-Type,
using the explicit origin allowlist without cookies. Browser preflight OPTIONS is
public; unrelated origins do not receive permission.

The latest successful incident summary remains **process-global and shared between
authenticated users**, not user-owned. A failed upload preserves it; a restart
clears it. Only aggregates are retained/exported, never source rows or customer
email values. Uploaded source files remain transient. Use one API worker for
TinyDB and consistent latest-summary behavior; this is not multi-worker storage.

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

## User and profile permissions

| Route | Permission | Success |
| --- | --- | --- |
| `POST /users` | Public, always creates an ordinary user | 201 safe identity |
| `GET /users` | Admin only (directory policy) | 200 safe identity list |
| `GET /users/{id}` | Self or admin | 200 safe identity |
| `PUT /users/{id}` | Self or admin; only admin may supply `role` | 200 safe identity |
| `DELETE /users/{id}` | Self or admin | 204 empty body |
| `GET /profiles/me` | Authenticated owner, including admins/managers | 200 own profile |
| `PUT /profiles/me` | Authenticated owner only | 200 updated own profile |

Managers have no admin privileges. Missing/invalid authentication returns **401**;
forbidden ownership or role assignment returns **403**. Account lookup follows
permission checks: an admin gets **404** for an unknown ID, while another user's
ID (even nonexistent) returns **403** to ordinary users/managers. No response
contains passwords or hashes. Deleted identities' existing tokens return **401**.
Deletion removes both identity and linked profile in one locked storage write.
Updates and deletion have the same single-process, non-crash-safe limits as registration.

User PUT changes only supplied `email`, `password`, and/or enum `role`
(`admin`, `manager`, `user`). Omitted fields are preserved; null credentials/role,
invalid values and unknown fields (including profile fields and `is_active`)
return **422** without echoing credentials. Email normalization/uniqueness matches
registration; collisions return **409** without partial updates. Passwords are
hashed before persistence. Non-admins cannot supply even their existing role.
Profile PUT accepts only `name`, `phone`, `address`; omission preserves values,
null clears them. Unknown identity/role fields return **422**. The owner comes
only from the bearer dependency; there is intentionally no `/profiles/{id}` route.
A missing linked profile fails closed with **500**.

### Provision the first admin out of band

There is no bootstrap endpoint or automatic privileged seed. A trusted local
operator must stop **all API workers**, select an existing registered account,
and open a local Python context with the same `TRACKFLOW_USERS_DB_PATH` as the
server. Review the intended account privately, then use the identity services:

```python
from services.api.auth_database import get_user_by_email, update_user
from services.api.auth_models import Role, UserUpdate

account = get_user_by_email("operator@example.test")  # substitute the approved account
assert account is not None and account.is_active
update_user(account.id, UserUpdate(role=Role.admin))
```

This is an operator procedure, not startup code: do not commit account data,
print hashes, or run it against an unverified database. Restart the single API
worker afterward. These trusted services do not perform HTTP authorization;
routers enforce permissions. Services return full internal `User` objects;
HTTP routes filter through `UserResponse`.

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

### Manual Swagger check — human-reported pass (A19)

1. Start with the ignored `.env` loaded and open `http://localhost:8000/docs`.
2. Register through `POST /users`, then log in with the form in `POST /auth/login`.
3. Click **Authorize**; use the email in the **username** field and the password.
4. Execute `GET /auth/me`; confirm email, database role and linked profile.
5. Execute `GET /suppliers`, upload a CSV through `POST /api/incidents/analyze`,
   then download `GET /api/incidents/results/export` with the same authorization.
6. Clear authorization and retry `/auth/me` and the operational routes for **401**.
   A malformed or expired bearer token must also return **401** (automated fixtures
   cover these cases).

The developer reports passing the manual flow from a PC via the private test
network and API `/docs`: registration **201** (`user`, active, safe
response), login **200** with bearer token, Swagger **Authorize** success,
`/auth/me` **200** with correct email/role/profile and no credentials, and
`/suppliers` **200** with a supplier list; unauthenticated `/suppliers` returned
**401**. These are human-reported results, not agent-browser observations.
The additional incident walkthrough steps above are retained as instructions,
not claimed as manually exercised.

## Password recovery (PR-1)

Public `POST /auth/forgot-password` accepts JSON `{ "email": "person@example.test" }`.
Registered and unknown accounts receive the same **200** message; provider/config
failures also receive that message. No token is returned. Invalid input returns
credential-free **422**. Delivery is a bounded (10-second timeout) HTTPS call to
Resend, not a log/console substitute. Do not log request bodies, reset URLs,
provider errors, email addresses or credentials; keep proxy/access logs from
capturing reset URL query strings.

The Resend adapter identifies itself honestly as `User-Agent: TrackFlow/1.0`.
A prior controlled, credential-free HEAD comparison returned 403 with default
urllib identification versus 200 with this application header. That supports a
compatibility correction, not proof of authenticated POST acceptance or email
receipt. After API reload, the user separately confirmed real receipt and the
reset/login/reuse/change flow; these are human-reported acceptance results.

Configure these **server-only** environment variables in the ignored local `.env`
and load it explicitly with `uv run --env-file .env ...`:

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET_KEY` | Existing private signing secret; no fallback |
| `RESEND_API_KEY` | Private Resend API key; never expose in browser bundles |
| `RESEND_FROM_EMAIL` | Resend-approved sender address (optionally display name) |
| `FRONTEND_PUBLIC_URL` | Trusted frontend base URL, e.g. `http://localhost:3000`; HTTPS in deployment |
| `PASSWORD_RESET_EXPIRE_MINUTES` | Optional finite duration, 15–60 minutes; default 30 |

Without a verified sender domain, Resend testing is restricted to the Resend
account owner's recipient address. The user confirmed the live-email flow on an
isolated test account; browser interactions were also checked with mocked API
responses. The link points to the Tracker's `/reset-password?token=...` page.
See `memory-bank/progress.md` for evidence boundaries. Do not commit `.env` or keys.

Public `POST /auth/reset-password` accepts JSON `{ "token": "<link token>",
"new_password": "<new private password>" }`. It applies the existing 1–72 UTF-8
byte password policy. Signature, expiry, reset purpose, active existing identity
and matching unused persistent reset ID are required. Invalid/expired/reused
links return **400**, invalid input **422**, success **200**. Password hashing and
reset-state consumption use one user-record update under the existing RLock;
new issuance supersedes earlier links (even if subsequent delivery fails).
Session tokens cannot reset passwords; reset tokens cannot authenticate sessions.
Existing session tokens are not revoked by password recovery.

Run **one worker**: the RLock prevents concurrent consumption only within one
process. TinyDB is neither multi-process coordinated nor crash-transactional.
See the [Tracker README](../../uis/talent-pipeline-tracker/README.md) for the UI
verification checklist. Delivery failures are intentionally invisible to callers;
operators must validate configuration
privately before enabling recovery. Generic bodies do not promise equal timing.

Focused tests mock outbound HTTP and use temporary identity storage, synthetic
secrets and explicitly expired signed tokens; no network or actual email:

```bash
uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_auth_password_recovery.py' -v
```

## Authenticated password change (PR-2)

`POST /auth/change-password` requires an active bearer identity and JSON:

```json
{"current_password": "<current private password>", "new_password": "<new private password>"}
```

Success returns **200** with `{"message": "Password changed successfully."}`.
An incorrect current password returns **400**; absent/invalid authentication or a
reset token used as bearer credentials returns **401**. Invalid input returns
credential-free **422**. New passwords use the existing 1–72 UTF-8 byte policy;
unknown fields are rejected. Failed validation/verification does not change the
password or pending recovery state.

Verification reads the latest stored hash under the identity RLock, then hashes
and writes the new password plus cleared `password_reset_id` in one update.
Successful password updates through existing `PUT /users/{id}` also clear pending
recovery links; non-password updates preserve them. Existing access JWTs remain
valid until their normal expiry (subject to existing active-identity checks).
There is no new session/revocation infrastructure. The single-worker TinyDB
limitations above still apply; no email configuration is needed for this route.

Focused tests include concurrent changes, stale recovery links and existing PUT
regressions, using temporary databases and synthetic credentials without mail:

```bash
uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_auth_password_change.py' -v
```

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

Focused CRUD/profile checks use isolated identity/supplier files and real login:

```bash
uv run python -m unittest discover -s services/api/tests -p 'test_auth_users_profiles.py' -v
```

Focused operational authentication/CORS checks use real registration/login,
synthetic test secrets and temporary identity AND supplier stores (no dependency
overrides). Existing incident/supplier HTTP regressions also use real tokens:

```bash
uv run python -m unittest discover -s services/api/tests -p 'test_auth_operational.py' -v
uv run python -m unittest discover -s services/api/tests -p 'test_incidents.py' -v
uv run python -m unittest discover -s services/api/tests -p 'test_suppliers.py' -v
uv run python -m unittest shared.test_incident_analysis -v
```

Final implementation audit and human-reported mandatory manual verification are
complete. Prior automated checks passed API **41/41** and shared **7/7**;
independent live Uvicorn HTTP checks also passed. The agent's Chromium attempt
was blocked by missing `libatk-1.0.so.0`, not a manual success observation.
Published as [PR #12](https://github.com/4GeeksAcademy/eduDev-companyContext/pull/12)
from `feature/auth-api` to `main`. Instructor submission and merge remain pending.

Use **uv only** for this assignment. `services/api/requirements.txt` is a
compatibility mirror, not the recommended setup workflow.
