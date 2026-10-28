# Testing TrackFlow — R1

R1 adds isolated Python session/recovery/token/email business-unit tests: **103
cases across seven modules**, alongside the preserved legacy API suite. This guide
is the review-slice snapshot, not the final integrated testing report. Later-slice
tests may already be present in the live uncommitted worktree; they are not R1
results or delivered scope.

## Run the R1 unit

From the repository root, using the existing uv environment:

```bash
unset UV_ENV_FILE
export UV_NO_ENV_FILE=1
uv run pytest tests/test_auth_login.py tests/test_auth_me.py tests/test_auth_forgot_password.py tests/test_auth_reset_password.py tests/test_auth_change_password.py tests/test_auth_tokens.py tests/test_email_delivery.py -q
```

No real credentials, `.env`, running API, seed or mail provider are needed.
Autouse fixtures under `tests/` select temporary users/suppliers/incidents stores,
synthetic configuration and mocked outbound email HTTP before each test. Real
TinyDB, bcrypt, JWT, models and business functions remain in use. Only outbound
transport and the access-expiry clock are replaced where needed. Never substitute
personal accounts, ordinary data or real provider credentials.

## Five-route case plan

The case selection was planned before assignment tests were written. Each route
has its own module under `tests/`; this table retains the happy/edge/failure plan
and rationale for the current slice.

| Route / module | Happy path | Edge or alternate | Failure / reason |
| --- | --- | --- | --- |
| POST /auth/login — `test_auth_login.py` | Normalized email/OAuth username issues bearer token with identity sub/exp | Matching aliases and normalization | Missing/conflicting aliases, wrong/inactive credentials, unsafe password input and invalid config; keep errors generic and state unchanged |
| GET /auth/me — `test_auth_me.py` | Own linked profile and explicit safe response schema | Current database role rather than token role | Invalid/revoked identity and missing profile; resolve current state and fail closed |
| POST /auth/forgot-password — `test_auth_forgot_password.py` | Normalized email persists matching reset ID without changing password | New issuance supersedes the first even when delivery fails | Unknown/inactive accounts and provider/config failure remain generic; invalid model input cannot send or create storage; avoid enumeration and stale links |
| POST /auth/reset-password — `test_auth_reset_password.py` | Replace hash and consume reset state while preserving existing session | Exact successful-token reuse rejected; competing attempts have one winner | Invalid claims/state/user, superseded link and invalid password cannot mutate state; enforce single use |
| POST /auth/change-password — `test_auth_change_password.py` | Verify current password, replace hash and clear pending recovery | Existing session preserved; competing changes check latest stored hash | Wrong credentials/invalid new password leave state unchanged; protect credential replacement under the process lock |

Supporting modules:

- `test_auth_tokens.py`: real salted hashes, UTF-8 byte boundaries, safe password
  verification, token signature/expiry/purpose/required claims, current stored
  identity, and missing or invalid signing/duration configuration.
- `test_email_delivery.py`: real request construction with mocked transport;
  reset URL, JSON, headers/User-Agent, 10-second timeout and provider failures.

AI-assisted case selection emphasized exact reset reuse, supersession despite
failed delivery, current stored roles and state nonmutation. Existing behavior
passed initially; no product bug or artificial RED is claimed for these units.

## Evidence and boundaries

The focused command above passed **103 cases**, with no failures or skips. It is
not a coverage run. AnyIO reports a non-failing `PytestRemovedIn10Warning` for its
deprecated `CallSpec2` alias.

Direct units call validated models and explicitly resolved dependencies. They do
not establish HTTP dependency injection, form/body validation, bearer parsing or
response filtering; explicit schema checks do not substitute for HTTP responses.
One-winner concurrency assertions do not force scheduling overlap. No browser UX,
real email receipt, crash rollback or multi-process safety is established.

The preserved legacy API/TestClient suite remains available from the root:

```bash
uv run python -m unittest discover -s services/api/tests -v
```

Existing focused and manual instructions remain in the
[API README](services/api/README.md#tests). Pytest also discovers the legacy suite;
importlib mode permits duplicate basenames and the helper path supports legacy
`auth_helpers` imports. The legacy suite is preserved, not rerun for this passive
R1 documentation snapshot.

## Planned later slices — not R1 results

This compact forward plan preserves the original plan-before-tests intent:

| Later scope | Planned cases and reason |
| --- | --- |
| R2: POST /users | Linked UUID identity/profile, normalized unique email, bcrypt, optional contacts and UTF-8 boundaries; invalid/privileged fields, duplicate nonmutation and orphan prevention |
| R2: GET /users; GET/PUT/DELETE /users/{id} | Admin directory, self/admin ownership, safe schemas, missing/forbidden targets, email collisions, role restrictions, omitted updates, linked deletion and recovery invalidation |
| R2: GET/PUT /profiles/me | Own nullable contacts for all roles, omission versus null clearing, forbidden identity fields, missing profile and unrelated-record nonmutation |
| R3: API-042 incident manager | Create/list/summary/get/status success, filters and zero groups, all lifecycle pairs, validation, missing records and storage failures |
| R3: API-042 suppliers | Create/list/get/rate/status/delete success, filters, rate boundaries, timestamp semantics, validation, absence and storage failures |
| R4: Tracker Jest auth and FE-019 | Real auth/form utilities: session/SSR, encoding, partial registration, current/stale 401, cancellation, byte limits and nullable contacts; additional label/error/abort helpers: success, unknown/inherited keys and failure cases |

R2 adds the remaining seven identity-route unit modules; R3 adds API-042 units;
R4 adds Jest tooling/tests and the scoped helper correction. These are **PLANNED
later commits**, even if their files already exist uncommitted locally. No future
file links or Jest commands are needed for R1.

The configured pytest coverage sources already include the broader existing
identity, incident and supplier implementation, not just these five routes. Their
presence is not unit-specific coverage evidence. Final integrated commands,
coverage denominators/gates, frontend findings and consolidated results will be
recorded after all slices. Review, staging, commits and publication remain
parent/user-owned; this guide claims none of those outcomes.
