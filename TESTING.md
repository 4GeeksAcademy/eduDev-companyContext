# Testing TrackFlow — R1–R4

R1 retains **103 session/recovery/token/email cases across seven modules**; R2
adds **72 user/profile cases across seven modules**. R3 adds **105 incident/supplier
cases across eleven modules**, alongside the preserved legacy API suite. R4 adds
**85 Tracker Jest cases across five suites** and the scoped label-predicate fix.
This is the R4 candidate's testing snapshot, not the final integrated report or a
commit/review approval claim. R5 consolidated documentation remains planned.

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

## R1: five-route case plan

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

## R2: seven-route case plan

Run only the R2 subset from the root with env-file loading disabled:

```bash
unset UV_ENV_FILE; export UV_NO_ENV_FILE=1; uv run pytest tests/test_users_register.py tests/test_users_list.py tests/test_users_get.py tests/test_users_update.py tests/test_users_delete.py tests/test_profiles_get.py tests/test_profiles_update.py -q
```

These modules extend the original pre-test plan with linked-record lifecycle,
permissions, normalized duplicates, nonmutation and null-versus-omitted checks.

| Route / module | Happy path | Edge or alternate | Failure / reason |
| --- | --- | --- | --- |
| POST /users — `test_users_register.py` | Persist linked UUID identity/profile with bcrypt and safe schema | Optional/null contacts and UTF-8 password boundaries | Normalized duplicate cannot create an orphan; invalid/privileged fields cannot create storage; protect registration authority |
| GET /users — `test_users_list.py` | Admin reads real directory with safe schema | Empty directory with explicitly resolved admin | User/manager refused without mutation; enforce directory policy |
| GET /users/{id} — `test_users_get.py` | Every role reads self; admin reads another identity | Missing admin target returns 404 | Nonowner refused even for unknown target without mutation; prevent existence disclosure |
| PUT /users/{id} — `test_users_update.py` | Owner email/password and admin role updates persist | Empty/same normalized email preserves state; password change clears reset state | Duplicate combined update, forbidden role/ownership, missing admin target and invalid fields cannot partially mutate; preserve uniqueness and recovery invalidation |
| DELETE /users/{id} — `test_users_delete.py` | Self/admin removes linked records and revokes identity token | Unrelated records preserved; repeated deletion is missing | Permission precedes target existence; protect linked lifecycle without disclosure |
| GET /profiles/me — `test_profiles_get.py` | Every role reads only its own nullable profile | Explicitly resolved owner, independent of role | Missing linked profile fails closed; invalid bearer cannot resolve owner; prevent cross-owner disclosure |
| PUT /profiles/me — `test_profiles_update.py` | Update own contacts, preserving identity/unrelated profile | Omitted contacts retained, null clears, empty update stable | Invalid/identity fields cannot partially apply; missing link leaves identity unchanged; separate profile from identity authority |

Registration duplicate checks compare unchanged storage; update collision checks
protect password/role as well as email. Registration write-failure/no-orphan
injection remains legacy HTTP evidence, not a new direct-unit guarantee.

## R3: eleven-route API-042 case plan

Run only the R3 subset from the root with env-file loading disabled:

```bash
unset UV_ENV_FILE; export UV_NO_ENV_FILE=1; uv run pytest tests/test_incidents_*.py tests/test_suppliers_*.py -q
```

This extends the original pre-test plan using real models/routes/TinyDB against
isolated temporary stores. Each operation has a dedicated module under `tests/`.

| Route / module | Happy path | Edge or alternate | Failure / reason |
| --- | --- | --- | --- |
| POST /api/incidents — `test_incidents_create.py` | Persist UUID/UTC record with literal text | Default open; branch required even for nonbranch origin | Invalid/generated fields and corrupt storage; protect creation contract |
| GET /api/incidents — `test_incidents_list.py` | Exact filter membership | AND combinations, empty/no matches | Invalid filters and corrupt records; avoid partial results |
| GET /api/incidents/summary — `test_incidents_summary.py` | Count every dimension | Empty/sparse stores retain zero-filled groups | Malformed record fails rather than returning partial counts; preserve denominator |
| GET /api/incidents/{id} — `test_incidents_get.py` | Return exact stored record | Unknown ID leaves storage unchanged | Storage failure is not absence; distinguish missing from unavailable |
| PATCH /api/incidents/{id}/status — `test_incidents_status.py` | Four allowed lifecycle edges | All 16 status pairs; competing identical transitions have one winner | Rejected edges/models do not write; missing target and storage failure; preserve identity and status-only mutation |
| POST /suppliers — `test_suppliers_create.py` | Persist generated ID/UTC and validated supplier | Country/currency variants, optional literal contacts | Invalid category/rate/fields and corrupt storage; protect creation |
| GET /suppliers — `test_suppliers_list.py` | Exact country/category membership | Combined filters, empty/no matches | Invalid enums and storage failure; verify selection |
| GET /suppliers/{id} — `test_suppliers_get.py` | Preserve exact record at first positive ID | Unknown ID does not mutate | Storage failure is not absence; protect lookup contract |
| PATCH /suppliers/{id}/rate — `test_suppliers_rate.py` | Positive rate refreshes timestamp | Tiny positive rate; only pricing fields change | Invalid rate, missing target and storage failure; reject without mutation |
| PATCH /suppliers/{id}/status — `test_suppliers_status.py` | Active/suspended updates | Same-status update preserves rate timestamp and other fields | Invalid status, missing target and storage failure; preserve status semantics |
| DELETE /suppliers/{id} — `test_suppliers_delete.py` | Remove only target with success object | Unrelated records preserved; repeat is absent | Unknown target and storage failure; verify persistence |

Incident status updates preserve `created_at` and all non-status fields except
`updated_at`. Supplier rate changes refresh the pricing timestamp; supplier status
changes preserve it. Corrupt-read checks do not prove crash-write rollback.
Analyzer expansion, real seeding and live services are excluded.

## R4: Tracker Jest case plan

From `uis/talent-pipeline-tracker/`, using the existing installed dependencies:

```bash
npm exec -- jest --runInBand --runTestsByPath __tests__/auth-service.test.ts __tests__/auth-form.test.ts __tests__/profile-form.test.ts __tests__/password-form.test.ts __tests__/frontend-helpers.test.ts
npm exec -- tsc --noEmit --incremental false
npm run lint
```

| Real module / suite | Selected success, edge and failure cases / reason |
| --- | --- |
| `services/auth.ts` / `auth-service.test.ts` | Session/storage/SSR/logout, login/register encoding and partial success, token validation, public versus bearer requests, current/stale 401, session-preserving failures, cancellation before fetch/during body with exact AbortError identity; protect identity/session boundaries |
| `lib/auth-form.ts` / `auth-form.test.ts` | Required/email checks, 1/72/73 UTF-8 bytes, trimmed contacts and blank omission, login exclusion and password preservation; match API input policy |
| `lib/profile-form.ts` / `profile-form.test.ts` | Null-to-empty, trim/blank-to-null, contact strings, nonmutation and identity exclusion; preserve profile authority |
| `lib/password-form.ts` / `password-form.test.ts` | Mode-specific required/byte/confirmation checks, single nonblank token and exact success query, duplicate rejection and safe guidance; protect recovery navigation/input |
| `lib/labels.ts` / `frontend-helpers.test.ts` | FE-019 functions `isCandidateStatus` and `isCandidateStage`: known, unknown/null and inherited keys; reject prototype properties |
| `services/api.ts` / `frontend-helpers.test.ts` | FE-019 functions `candidateErrorMessage` and `isCandidateAbort`: safe mapping/fallback, ordinary-error negatives and native DOMException cancellation identity; preserve safe errors/cancellation |

The four FE-019 functions supplement mandatory auth/form units. Local fetch,
storage and location fakes are restored between tests; no real network, `.env` or
credentials are needed. Selected candidate-service helpers are **not comprehensive
coverage of the whole candidate API service**. Jest does not replace legacy Node
checks or browser/manual acceptance.

### Prior bug and harness evidence (reused, not new RED)

The original helper run had **3 passed / 7 failed**: six inherited-key failures
proved a product bug in the two label predicates. The authorized fix uses
own-property checks, preserving null guards. The seventh failure was native
DOMException versus Jest VM Error realm mismatch, not a production classifier bug.
Jest-only setup aligns explicit host Error constructors; it does not realign every
VM-thrown intrinsic error. The production cancellation classifier is unchanged.
The corrected helper suite passed **13 cases**, retaining real DOMException
identity and ordinary-error/subclass negatives.

Other prior integration corrections were typed fetch mocks, async cancellation
expectation timing and a narrow documented CommonJS setup lint exception. They
changed test/tooling compatibility, not production classifier behavior.

### Dependency disclosure (prior evidence, not a new audit)

Prior independent comparison found **243 added dev-only lock locations**, with no
existing package records changed or removed. Prior audit evidence distinguished
**5 high + 1 critical pre-existing package findings** (including Next) from **6 new
low dev-package findings** propagated through deepmerge advisory **1243505**.
These count packages, not unique advisories. Deprecated glob was also reported;
install scripts were not manually approved/executed. No new audit, remediation,
upgrade, exploitability assessment or risk acceptance is claimed.

The full generated lockfile is retained unchanged, without normalization or
minification. Its size may independently exceed native review's context budget;
this guide does not promise review success. Delivery decisions remain parent-owned.

## Evidence and boundaries

Earlier separate focused runs passed **103 R1**, **72 R2** and **105 R3 cases**,
with no failures or skips; Python was not rerun for R4. Those runs reported the
non-failing AnyIO `PytestRemovedIn10Warning` for the deprecated `CallSpec2` alias.
Existing Python behavior passed; no artificial RED or Python product fix is claimed.

The R4 command above passed **85 Jest cases across five suites**, without failures,
skips or warnings. TypeScript and lint checks also passed. These are focused
behavior/compatibility checks, not coverage, build or browser evidence. No combined
Python/JavaScript suite observation is claimed.

Direct units call validated models and explicitly resolved dependencies. They do
not establish HTTP dependency injection, form/body validation, bearer parsing or
response filtering; explicit schema checks do not substitute for HTTP responses.
Incident/supplier authentication is router-inclusion wiring, not direct-call proof;
legacy HTTP regressions retain that boundary. Supplier path validation likewise
remains a model/HTTP boundary, not direct-route validation.
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
R4 documentation snapshot.

## Planned R5 — final integrated documentation

This compact forward plan preserves the original plan-before-tests intent:

| Later scope | Planned cases and reason |
| --- | --- |
| R5: consolidated documentation | Restore the final integrated guide and record complete verification, coverage and delivery evidence after all slices |

R5 is a **PLANNED later local commit**, even if its documentation already exists
uncommitted locally. Final integrated results/history will be consolidated there;
no future task-document link is included here.

The configured pytest coverage sources already include the broader existing
identity, incident and supplier implementation, not only thin route wrappers. Their
presence is not unit-specific coverage evidence. Final integrated commands,
coverage denominators/gates, frontend findings and consolidated results will be
recorded after all slices. Review, staging, commits and publication remain
parent/user-owned; this guide claims none of those outcomes.
