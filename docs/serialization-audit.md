# Backend serialization audit — baseline and implemented contracts

**Merged, deployed and automatically verified on the VPS; human manual acceptance deferred.** The inventory preserves
the original state of all 31 application success endpoints alongside final outputs.
All 31 decorators are explicit: 29 JSON schemas and two non-JSON exceptions.
Final Python verification and native review passed. Three new manual Swagger
executions remain pending; the assignment is not yet fully accepted.
The authoritative plan is [serialization-audit](../odd/tasks/serialization-audit.md).

## Review path

1. Compare the 31 numbered rows with the seven routers included by
   `services/api/app/main.py` (no application routes in the entrypoint wrappers).
2. Read target field sets and consumer evidence below before implementing models.
3. Add HTTP-level contract tests first; direct-call units cannot prove filtering.
4. Keep CSV and empty 204 wire formats. Run final backend checks and at least three
   **new manual Swagger `/docs` executions** before claiming assignment completion.

Baseline: **24 explicit `response_model` decorators, seven missing**. Missing:
user DELETE, three password POSTs, supplier DELETE, analyzer POST and export GET.
Of those seven, five are JSON gaps and two are justified non-JSON exceptions.
Return annotations such as `dict[str, Any]` are not explicit field allowlists.
Framework `/docs`, `/redoc`, `/openapi.json`, CORS OPTIONS and error handlers are
not application success endpoints and are not counted. Error privacy remains a
regression requirement; this audit does not replace existing error contracts.

## Classification and status legend

| Code | Rubric classification | Original state and intended action |
|---|---|---|
| **S** | Already serialized | Explicit success schema; retain contract and verify filtering. |
| **L** | Partially serialized | Explicit collection schema, but demonstrated runtime consumers justify a narrower projection. |
| **C** | Already serialized (structural improvement only) | Output inherits create input or doubles as persisted schema; separate transport output for maintainability, not to repair an inherently unsafe wire contract. |
| **P** | Partially serialized | Explicit schema exposes email in public registration; correct the privacy defect. |
| **M** | Not serialized | No explicit field-level JSON output model; generic dict annotations do not satisfy the rubric's schema requirement. |

“Not serialized” here describes missing explicit output contracts, not an inability
of FastAPI to encode JSON. For combined **C,L**, the rubric classification is
**partially serialized** because of L, not inheritance. Safe create-derived schemas
are not automatically exposure bugs; C-only changes preserve the wire fields and
persisted Incident schema without introducing a general DTO framework.

**X** is a separate non-JSON exception, not one of the three JSON rubric classes:
CSV export and empty 204 already have intentional wire formats, but need explicit
response-class/media declarations. They are not claimed as literal equivalents to
Pydantic-serialized JSON endpoints; see Inputs and non-JSON exceptions below.

Combinations describe the original state, not completion. Identity rows 01–12 are
**verified T2** by the focused evidence below; rows 13–31 are **tested T3**.
These are focused implementation results, not T4/manual assignment completion.
Aliases below are exact field sets, not permission to include arbitrary fields.
Paths retain actual decorator parameter names.

## Original 31-endpoint inventory

| # | Method/path | Purpose | Original response_model; return style | Original class | Target / action | Status |
|---|---|---|---|---|---|---|
| 01 | POST /users | Public registration | `UserResponse`; internal `User` | P | R; now RegistrationResponse, email filtered at HTTP boundary | verified T2 |
| 02 | GET /users | Admin directory | `list[UserResponse]`; internal User list | S | U[]; unchanged five-field admin contract | verified T2 |
| 03 | GET /users/{user_id} | Self/admin lookup | `UserResponse`; internal User | S | U; unchanged authenticated detail | verified T2 |
| 04 | PUT /users/{user_id} | Self/admin update | `UserResponse`; internal User | S | U; separate existing UserUpdate | verified T2 |
| 05 | DELETE /users/{user_id} | Delete identity/profile | missing; `Response(status_code=204)` | X | Empty 204; now explicit None/Response, no OpenAPI content | verified T2 |
| 06 | POST /auth/login | Form credentials to JWT | `TokenResponse`; model instance | S | T; unchanged intended access token | verified T2 |
| 07 | POST /auth/forgot-password | Account-neutral recovery | missing; message dict | M | M; now explicit MessageResponse | verified T2 |
| 08 | POST /auth/reset-password | Consume recovery token | missing; message dict | M | M; now explicit MessageResponse, no token echo | verified T2 |
| 09 | POST /auth/change-password | Verify/change own password | missing; message dict | M | M; now explicit MessageResponse, unchanged text | verified T2 |
| 10 | GET /auth/me | Current identity/profile | `CurrentUserResponse`; model instance | S | U + profile:F; unchanged owner email | verified T2 |
| 11 | GET /profiles/me | Own contact profile | `Profile`; model instance | S | F; unchanged explicit output | verified T2 |
| 12 | PUT /profiles/me | Update own contacts | `Profile`; model instance | S | F; separate existing ProfileUpdate | verified T2 |
| 13 | POST /suppliers | Register supplier | `SupplierResponse`; dict | C | S; output now independent of create | tested T3 |
| 14 | GET /suppliers | Filtered directory | `list[SupplierResponse]`; dict list | C,L | SL[]; now SupplierListResponse, seven fields | tested T3 |
| 15 | GET /suppliers/{supplier_id} | Supplier detail | `SupplierResponse`; dict | C | S; independent output, all detail fields retained | tested T3 |
| 16 | PATCH /suppliers/{supplier_id}/rate | Change price | `SupplierResponse`; dict | C | S; independent output, rate/detail retained | tested T3 |
| 17 | PATCH /suppliers/{supplier_id}/status | Activate/suspend | `SupplierResponse`; dict | C | S; independent output, status semantics retained | tested T3 |
| 18 | DELETE /suppliers/{supplier_id} | Delete supplier | missing; success/id dict | M | SD; now SupplierDeleteResponse, JSON success | tested T3 |
| 19 | POST /api/incidents/analyze | Aggregate CSV upload | missing; aggregate dict (`dict[str, Any]`) | M | A; now AnalysisResponse with nested SatisfactionResponse | tested T3 |
| 20 | GET /api/incidents/results/export | Download latest aggregates | missing; StreamingResponse | X | Explicit None/StreamingResponse, text/csv OpenAPI | tested T3 |
| 21 | POST /api/incidents | Create incident | `Incident`; stored model | C | I; now IncidentResponse, same nine fields | tested T3 |
| 22 | GET /api/incidents | Filter incidents | `list[Incident]`; stored model list | C | I[]; now list[IncidentResponse], no reduction | tested T3 |
| 23 | GET /api/incidents/summary | Whole-store counts | `IncidentSummary`; dict | S | IS; unchanged enum-keyed aggregates | tested T3 |
| 24 | GET /api/incidents/{incident_id} | Incident detail | `Incident`; stored model | C | I; now IncidentResponse | tested T3 |
| 25 | PATCH /api/incidents/{incident_id}/status | Lifecycle transition | `Incident`; stored model (JSONResponse on error only) | C | I; now IncidentResponse, errors/input unchanged | tested T3 |
| 26 | POST /inventory/products | Register SKU | `ProductResponse`; model instance | C | P; now independent output declaration | tested T3 |
| 27 | GET /inventory/products | Stock by SKU/warehouse | `list[ProductResponse]`; model list | C | P[]; independent output, same seven fields | tested T3 |
| 28 | GET /inventory/products/{id} | SKU/current stock detail | `ProductResponse`; model instance | C | P; independent output, computed stock retained | tested T3 |
| 29 | POST /inventory/orders/inbound | Record receipt | `EntryResponse`; model instance | S | E; unchanged write receipt | tested T3 |
| 30 | POST /inventory/orders/outbound | Record dispatch/loss | `ExitResponse`; model instance | S | O; unchanged write receipt | tested T3 |
| 31 | GET /inventory/orders | Movement history | `list[EntryResponse \| ExitResponse]`; sorted model list | L | H-in / H-out; now list[HistoryResponse], order_type discriminator | tested T3 |

Coverage totals: identity 12 + suppliers 6 + analyzer/export 2 + manager 5 +
inventory 6 = **31**. Twenty-nine JSON successes need explicit output models;
two non-JSON successes need explicit declarations, not JSON wrappers.

## Exact target field sets

| Alias | Exact success fields (arrays contain only these item fields) |
|---|---|
| R — RegistrationResponse | `id, is_active, role, created_at` |
| U — UserResponse | `id, email, is_active, role, created_at` |
| F — Profile | `id, user_id, name, phone, address` (contact values nullable) |
| T — TokenResponse | `access_token, token_type` (`bearer`) |
| M — MessageResponse | `message` |
| S — SupplierResponse | `id, name, country, categories, rate_per_shipment, currency, status, service_zone, contact_email, notes, updated_at` |
| SL — SupplierListResponse | `id, name, country, categories, rate_per_shipment, currency, status` |
| SD — SupplierDeleteResponse | `success, id` |
| I — IncidentResponse | `id, title, description, category, status, origin, branch, created_at, updated_at` |
| IS — IncidentSummary | `total, by_status, by_category, by_origin, by_branch`; maps retain all existing enum keys and integer counts |
| P — ProductResponse | `id, name, sku, client_name, category, warehouse, current_stock` |
| E — EntryResponse | `id, sku_id, name, sku, client_name, category, warehouse, quantity, created_at, user_uuid, order_type, reference` |
| O — ExitResponse | `id, sku_id, name, sku, client_name, category, warehouse, quantity, created_at, user_uuid, order_type, exit_type, tracking_number` |
| H-in — EntryListResponse | `id, name, sku, warehouse, quantity, created_at, user_uuid, order_type, reference` |
| H-out — ExitListResponse | `id, name, sku, warehouse, quantity, created_at, user_uuid, order_type, exit_type, tracking_number` |
| A — AnalysisResponse | `total_records, valid_records, invalid_records, invalid_reasons, categories, statuses, countries, satisfaction` |

A's count maps retain the existing aggregate keys from
`packages/shared/incident_validation.py`: `REASON_LABELS`, `CATEGORIES`, `STATUSES`,
`COUNTRIES`. Values are integer counts, not arbitrary row data. Nested
`satisfaction` has exactly `closed_incidents, scored_incidents, average, scores`;
`average` is nullable numeric; `scores` maps strings `1` through `5` to integers.
The implemented nested Pydantic models use Literal-bounded count-map keys and
integer values, not `Any`. Inspected keys have underscores/uppercase codes:
spaced strings in `REASON_LABELS` are display-label values, not aggregate keys.
No scored incidents produces `average: null`, never an empty JSON string; CSV
represents that null as an empty cell. No source rows, customer email, credentials or internal tokens belong in A.

## Consumer evidence and relationship decisions

| Area | Inspected evidence | Decision / intended improvement |
|---|---|---|
| Registration/login | `uis/talent-pipeline-tracker/services/auth.ts`, `register` ignores registration body and logs in from original input; `services/api/tests/auth_helpers.py` consumes registration ID | Remove registration email, preserve ID and existing safe metadata. Tracker's static `request<User>` annotation is broader than the future body but no runtime body fields are read; no UI edit needed. Login retains only bearer token/type. |
| User directory/detail | `tests/test_users_list.py:18–21` explicitly asserts the five-field UserResponse contract; `services/api/tests/test_auth_users_profiles.py` checks directory authorization/count/privacy and detail/update email | No runtime directory consumer exists in the repository. Tests reading IDs/roles do not establish exclusive runtime needs. Preserve already-serialized `list[UserResponse]` with `id, email, is_active, role, created_at` (U[]) and authenticated detail U; retain the five-field assertions and do not invent an admin UI or list projection. |
| Current user/profile | `uis/talent-pipeline-tracker/services/auth.ts` defines CurrentUser/Profile and uses `/auth/me` and profile PUT; `uis/backoffice/session-guard.js` gates on current identity | Keep owner-only email and one shallow `profile` object in `/auth/me`. Profiles link by `user_id`; no reverse embedded user, hash or reset state. Reuse Profile: it is not ProfileUpdate and already has exact fields. |
| Password actions | Tracker `passwordRequest` ignores success body; existing auth recovery/change HTTP suites assert messages | Reuse one MessageResponse across three identical shapes. Preserve account-neutral forgot text even on unknown account/provider failure. Never echo email, password, hash, reset token or reset ID. |
| Suppliers | `uis/backoffice/suppliers.js`, `supplierRow` reads name/country/categories/rate/currency/status and ID for PATCH; create/status response ignored, rate response reads rate | SL drops `service_zone, contact_email, notes, updated_at`. Keep detail/write S for existing documented API; no embedded incidents or other entities. Category list is a scalar enum collection, not entity expansion. |
| Manager incidents | `uis/backoffice/incidents.js` renders title, category/origin/branch/status, both timestamps, inline `description` and ID; summary renders counts | Keep all I fields in list and detail: dropping description would break inline details. Use a distinct IncidentResponse without altering persisted Incident or IncidentCreate. No user/carrier/customer relations exist to expand. |
| Analyzer | `uis/backoffice/incident-analysis.js`, `renderSummary` uses all top-level aggregates and nested satisfaction; `exportResults` consumes a blob; `shared/incident_analysis.py` produces aggregates | Model aggregate output without changing analyzer storage/export core. Keep process-global latest summary and bounded aggregate maps, not raw source rows or entity embeddings. |
| Products | `uis/backoffice/components/inventory-products.tsx` renders every P field; ID drives links. `uis/backoffice/lib/inventory.ts` provides list/detail access | Keep P for list/detail/write; do not duplicate identical list/detail schemas. Stock remains computed by SKU and warehouse, not persisted or an embedded movement collection. |
| Movements | `uis/backoffice/components/inventory-history.tsx` consumes every H field; it does not read `sku_id, client_name, category`. Existing `tests/test_inventory_api.py` asserts history sku_id as a baseline contract | Remove these three fields only from history HTTP projection; update that old assertion with omission checks. Keep E/O write receipts and stored FK. History keeps name/sku as useful shallow product projection and `user_uuid` attribution, never expands full product/user/profile. |

Keep existing scalar types, enums, UUID/time representations and nullable fields.
Separate output schemas from `SupplierCreate` and `ProductCreate` directly; retain
reusable scalar constraints. IncidentResponse must be independent of the stored
Incident (which may continue inheriting IncidentCreate). Response-to-response reuse
for movement variants is appropriate; no generic serialization/repository layer.
Do not duplicate Profile, TokenResponse, IncidentSummary or product list/detail
models where the exact fields already match. A distinct list schema is justified
only by an actual projection difference.

## Inputs and non-JSON exceptions

Existing writes already have separate inputs: RegistrationInput, UserUpdate,
ProfileUpdate, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput,
SupplierCreate/RateUpdate/StatusUpdate, IncidentCreate/StatusUpdate,
ProductCreate, EntryCreate and ExitCreate. Keep them separate from outputs.
Login's existing form parameters (`password`, `email`, OAuth `username`) are a
separate input contract; do not convert to JSON or reuse TokenResponse as input.
Analyzer accepts multipart `file`, not an aggregate model. DELETE has no body.

- User DELETE: explicitly set `response_model=None`, `response_class=Response`,
  retain status 204 and empty bytes. OpenAPI 204 must have **no content schema**.
- Export: explicitly set `response_model=None`, `response_class=StreamingResponse`
  and document 200 `text/csv` via `responses` content (string/binary schema), with
  no misleading `application/json` success media. Retain attachment filename
  `results.csv` and `section,metric,value` CSV header/aggregate rows.
- These satisfy wire-format correctness, **not literal equivalence** to a rubric
  demanding a Pydantic model on every endpoint. Document the exceptions honestly;
  neither should be converted into a JSON envelope to inflate model coverage.

## Implementation scope (original plan retained)

T2 source candidates (parent must authorize actual edits):
`services/api/auth_models.py`, `services/api/routes/users.py`,
`services/api/routes/auth.py`. Profiles need tests, not a duplicate response class.

T2 tests: extend `services/api/tests/test_auth_registration.py`,
`services/api/tests/test_auth_users_profiles.py`,
`services/api/tests/test_auth_tokens.py`,
`services/api/tests/test_auth_password_recovery.py`,
`services/api/tests/test_auth_password_change.py`; update justified registration
expectations in `tests/test_users_register.py`. Keep `tests/test_users_list.py`
as an unchanged five-field directory-contract regression.
T2 adds `services/api/tests/test_serialization_auth.py` for explicit decorator/OpenAPI
shape, HTTP allowlists and injected-extra-field regression, with isolated fixtures.
T3 HTTP/schema coverage now lives in `services/api/tests/test_serialization_contracts.py`.
Direct-route units returning internal User must not be mistaken for HTTP leaks.

T3 source candidates:
`services/api/models.py`, `services/api/routes/suppliers.py`,
`services/api/incident_models.py`,
`services/api/app/routers/incident_management.py`,
`services/api/app/routers/incidents.py`,
`services/api/inventory_schemas.py`, `services/api/routes/inventory.py`.
Analyzer response models were placed in authorized `services/api/analysis_schemas.py`
to keep legacy CSV domains separate from manager enums; no persistence/shared-core changes.

T3 tests: extend `services/api/tests/test_suppliers.py`,
`services/api/tests/test_incidents.py`,
`services/api/tests/test_incident_management.py`, `tests/test_inventory_api.py`,
`services/api/tests/test_serialization_contracts.py`; adjust only impacted baseline assertions
in `tests/test_suppliers_list.py`, `tests/test_incidents_list.py` if necessary.
Retain storage/lifecycle tests unchanged unless a genuine expectation changes.

Test-first plan: observe registration email and explicit-model failures; implement
T2; verify authenticated own email/token preservation, denied roles, generic reset
responses and empty 204. For T3 observe extra-list-field/model failures first;
then verify exact JSON keys, empty lists, both movement variants, incident inline
fields, bounded nested aggregates, CSV media/header and failed-upload preservation.
Inject sentinel internal fields in HTTP fixtures to prove output filtering.
Check OpenAPI input/output separation, not just decorator presence.

## Installed runner and safe commands for later tasks

Read-only inspection found uv **0.13.6** at `/home/lab/.local/bin/uv`,
`.venv/bin/python` **3.14.4**, pytest **9.2.0**, FastAPI **0.141.1**,
Pydantic **2.13.5**, SQLModel **0.0.48**. `python3` is `/usr/bin/python3`.
No installation, application import/startup, functional tests or `.env` access
was performed in T1. Versions were read through `importlib.metadata` only.

Run from repository root in later authorized tasks. Commands disable dotenv,
dependency synchronization/network resolution, bytecode and pytest cache writes;
blank DATABASE_URL prevents real SQL startup. Existing tests own temporary stores,
synthetic secrets and mocked mail (`tests/conftest.py` and legacy setUp fixtures).
New HTTP contract tests must isolate all three TinyDB stores before lifespan and
mock outbound mail; inventory must override its session with disposable SQLite.
Do not run new tests until those protections are implemented and inspected.

```bash
# T2 existing HTTP regressions (not run in T1)
env -u UV_ENV_FILE UV_NO_ENV_FILE=1 DATABASE_URL= PYTHONDONTWRITEBYTECODE=1 uv run --offline --no-sync python -B -m pytest -p no:cacheprovider services/api/tests/test_auth_registration.py services/api/tests/test_auth_users_profiles.py services/api/tests/test_auth_tokens.py services/api/tests/test_auth_password_recovery.py services/api/tests/test_auth_password_change.py tests/test_users_register.py tests/test_users_list.py -q

# T2 isolated HTTP/schema contracts (RED then GREEN; see evidence below)
env -u UV_ENV_FILE UV_NO_ENV_FILE=1 DATABASE_URL= PYTHONDONTWRITEBYTECODE=1 uv run --offline --no-sync python -B -m pytest -p no:cacheprovider services/api/tests/test_serialization_auth.py -q

# T3 focused HTTP regressions (not run in T1)
env -u UV_ENV_FILE UV_NO_ENV_FILE=1 DATABASE_URL= PYTHONDONTWRITEBYTECODE=1 uv run --offline --no-sync python -B -m pytest -p no:cacheprovider services/api/tests/test_suppliers.py services/api/tests/test_incidents.py services/api/tests/test_incident_management.py tests/test_inventory_api.py -q

# T4 relevant backend regression suite (not authorized/run in T1)
env -u UV_ENV_FILE UV_NO_ENV_FILE=1 DATABASE_URL= PYTHONDONTWRITEBYTECODE=1 uv run --offline --no-sync python -B -m pytest -p no:cacheprovider tests services/api/tests -q
```

No live SQL/mail, seed, services, builds, UI tests or dependency operations are
needed. Follow [TESTING.md](../TESTING.md)'s additional protective temporary-store
wrapper for final verification; never load actual environment-file secrets.
Manual `/docs` acceptance remains separate: at minimum record registration 201
without email, authenticated `/auth/me` with own profile, and a projected supplier
list. Also inspect export media/204 where practical. Historical manual passes do
not establish these new contracts; **zero new manual executions performed**.

## T2 focused evidence

The exact T2 commands above ran offline/no-sync with dotenv disabled and blank
DATABASE_URL. New fixtures isolate all three stores before lifespan, use synthetic
JWT settings, blank mail configuration and blocked outbound transport. Existing
focused suites isolate touched stores without lifespan and mock recovery mail.

- New HTTP/schema command: RED **6 failed, 2 passed** before source edits: public
  registration email, four output-schema references and missing explicit Response.
  GREEN **8 passed** after the three minimal source changes.
- Existing focused command: **52 passed, 52 subtests passed**. Security, validation,
  normalized email, persistence, authorization and recovery errors remain covered.
  Direct registration assertions now use stored email and RegistrationResponse;
  the route still returns an internal User to its caller, filtered only at HTTP.
- `test_registration_filters_internal_fields_at_http_boundary` injects internal
  password/reset/extra fields into the real registration result and checks the
  exact four-field wire allowlist while verifying stored hash/profile.
- Alternate cases retain exact directory/detail/update/me/profile fields, login
  token/type, all three success messages, password persistence, deleted identity
  revocation, empty 204 bytes and no OpenAPI 204 content. No architecture refactor
  was needed; input models and the User store are unchanged.
- Existing AnyIO pytest and Starlette/httpx deprecation warnings remain.
  Full backend suite, live services and new manual Swagger executions **not run**;
  T3 evidence follows; T4 remains pending. No UI/dependency/data/infrastructure or Git delivery changes.

## T3 focused evidence

- RED: **7 failed, 1 passed** before source changes: missing explicit decorator,
  supplier inherited extra-forbid behavior, three nested aggregate leaks, oversized
  history and input/output inheritance. GREEN: **8 passed** after minimal changes;
  expanded triangulation **10 passed**, with no skips.
- Relevant regression initially **59 passed, 2 failed, 50 subtests passed**: the
  seed test read detail-only `service_zone` from the new list, and history expected
  removed `sku_id`. Adjusted those intentional wire expectations only: seed still
  checks every canonical field in storage, history checks SKU and omitted joins.
  Final regression **61 passed, 50 subtests passed**.
- HTTP sentinel injection proves supplier, incident, product, movement and nested
  analyzer output filtering. Cases retain descriptions/timestamps, actor attribution,
  dispatch/loss distinctions, empty collections, boundary scores/null averages,
  failed-upload export preservation, byte-equivalent CSV and empty user-delete 204.
  Invalid map keys/non-count values are rejected. AST/OpenAPI proves 31 explicit
  decorators, 29 JSON schemas and exactly two documented None exceptions.
- Direct supplier/incident calls still return full internal records; persisted
  Incident, all create/update inputs, SQL queries, computed stock and write receipts
  are unchanged. History discrimination uses the existing `order_type` literal.
- Reused the isolated T2 client fixture (all three disposable TinyDB paths,
  synthetic JWT, blank SQL/mail, blocked transport); inventory overrides sessions
  with in-memory SQLite. Legacy suites isolate touched stores and do not invoke mail.
  Existing AnyIO pytest/Starlette-httpx warnings only. No installs or live providers.

Exact commands, run sequentially in the foreground from repository root:

```bash
env -u UV_ENV_FILE UV_NO_ENV_FILE=1 DATABASE_URL= PYTHONDONTWRITEBYTECODE=1 uv run --offline --no-sync python -B -m pytest -p no:cacheprovider services/api/tests/test_serialization_contracts.py -q
env -u UV_ENV_FILE UV_NO_ENV_FILE=1 DATABASE_URL= PYTHONDONTWRITEBYTECODE=1 uv run --offline --no-sync python -B -m pytest -p no:cacheprovider services/api/tests/test_suppliers.py services/api/tests/test_incidents.py services/api/tests/test_incident_management.py tests/test_inventory_api.py tests/test_suppliers_list.py tests/test_incidents_list.py -q
git diff --check
```

The first command ran RED, GREEN, then expanded GREEN; the second ran before and
after the two intentional contract assertion updates. Whitespace and bounded
status/diff inspection passed. Independent verification can focus on
`services/api/tests/test_serialization_contracts.py::test_inventory_history_variants_and_write_receipts`.
At the end of T3, final review/regression and three new manual Swagger checks
were pending. T3 itself ran no full suites, servers, browser, production/real
DB/mail, commits or publication. Final automated evidence follows below.

## T1 verification boundary

Documentation-only: no meaningful RED/GREEN and no functional test claim.
Reconcile route decorators statically against rows 01–31, check the 24/7 split,
inspect the diff and run `git diff --check`. Only this audit and a concise progress
entry were in scope at T1. Implementation and final regression were pending then;
T2–T4 evidence records their later outcomes. Measured payload savings and manual
acceptance are not claimed. No commit/push/PR has been performed.

## T4 final automated verification

Independent verifier ran once, under the protective temporary-store/subprocess
environment documented in [TESTING.md](../TESTING.md):

```bash
uv run --offline --no-sync python -B -m pytest -p no:cacheprovider -q .
```

Result: **423 passed, 249 subtests passed, 2 warnings, 92.17 seconds**, exit 0;
no failures or skips. The explicit `.` also collected `shared/` tests beyond the
configured testpaths; their fixtures were inspected before execution. Stores,
TMPDIR and COVERAGE_FILE were temporary; JWT synthetic, SQL/mail blank, dotenv
and bytecode disabled. No real database or mail provider was used.

- All 31 explicit route declarations, 29 JSON contracts, CSV/204 and discriminated
  history responses passed automated checks. No functional defect was found.
- `git diff --check` passed; before/after short Git status was identical.
- Existing AnyIO pytest CallSpec2 and Starlette/httpx deprecation warnings remain.
- Final four-lens native review approved the source candidate and its exact
  acknowledgement completed. This evidence-only documentation update followed it.
- No frontend build/tests or coverage rerun: no frontend source changed. No
  installation, live server, commits, push or PR was performed.

## Automated Swagger browser verification — passed

Playwright 1.62.1 / Chromium 151.0.7922.34 exercised the rendered Swagger controls
against the current worktree in a disposable loopback API. Four operations passed:
POST /users (201, four-field email-free response), POST /auth/login (200, token/type
only), OAuth Authorize then GET /auth/me (200, exact identity/profile allowlists),
and GET /suppliers (200, all 15 seeded rows with exactly seven list fields).
No direct-fetch or APIRequestContext substitute was used for operation execution.

Successful run: 4.83s, exit 0, zero browser console/page/network errors. Five earlier
attempts stopped on automation selectors or login input configuration; email plus
a conflicting default username returned 422. Supplying matching aliases succeeded.
No application correction was needed. All six owned API processes, browser
contexts and temporary stores were cleaned; the user's port 8011 was untouched.
Repository status and tracked/nonignored-untracked file hashes stayed unchanged.
No installations, screenshots, traces, credential artifacts or VPS access occurred.

This is automated browser evidence, not human manual execution. The checklist
below remains pending until actual human observations are reported.

## Manual Swagger acceptance — pending

Use a disposable local API with synthetic credentials and temporary stores, not
production or real mail/SQL. These steps have **not** been executed manually:

| Endpoint | Expected status and response fields | Observed |
|---|---|---|
| POST /users | 201; exactly id, is_active, role, created_at; no email | Pending |
| POST /auth/login | 200; exactly access_token, token_type=bearer | Pending |
| GET /auth/me (Authorize first) | 200; own identity/email/profile; no password/hash/reset fields | Pending |
| GET /suppliers (recommended) | 200; only the seven SL fields documented above | Pending |

Record at least three actual `/docs` executions and redacted field sets before
claiming assignment completion. Keep passwords and bearer tokens out of evidence.
The user subsequently authorized publication, merge and VPS deployment. Delivery
proceeds using automated evidence; human manual acceptance is not claimed.

## Delivery chain

| Slice | Commit | PR / outcome |
|---|---|---|
| Identity contracts, tests and API docs | `99e91e3` | [#32](https://github.com/4GeeksAcademy/eduDev-companyContext/pull/32), merged |
| Operational contracts, tests and API docs | `bdf3a5d` | [#33](https://github.com/4GeeksAcademy/eduDev-companyContext/pull/33), merged |
| Complete audit and evidence | `de28087` | [#34](https://github.com/4GeeksAcademy/eduDev-companyContext/pull/34), merged; final assignment entry point |
| VPS rollout and live verification evidence | `22b7882` | [#35](https://github.com/4GeeksAcademy/eduDev-companyContext/pull/35), documentation follow-up |

Each source slice received native approval and acknowledgement. GitHub reported
clean/mergeable branches and no check runs; this is not a claim of CI passing.
Source/tests after the second merge match the originally verified full candidate.
The advisory 400-line split retained coherent operational tests (438 lines) and
the complete audit rather than dropping evidence. The deployed source release is
merge commit `7a2fc656dc6fb70914dec79c37d89126a96790c3`.

## VPS deployment and live verification

The API image was built from an archive of that exact merged commit, not the dirty
worktree. Local production-command smoke passed with isolated storage and no
network. Transferred image identity matched before deployment:

- Tag: `trackflow-api:serialization-7a2fc65`.
- Image: `sha256:1747959ceeb82c206b63c44c4b9ba2ad6c86d75289cca6c706be6a62f34553f0`.
- Only the API was recreated, using the existing production/resources/HTTPS Compose
  files. The API image pin was persisted; UI, TLS, mail settings, limits, mounts,
  network identity and other deployment files were preserved.
- Old image `trackflow-t5b-verify-0552b97-0622-api:production` remains available for
  API-only rollback. No volume removal, database migration or UI rebuild was run.

The first apply rolled back after an unidentified invariant assertion. Read-only
diagnosis confirmed the old API was serving successfully and configuration was
restored. The second controlled apply used named checks and compared environment
variables as duplicate-rejecting name/value maps. It observed changed ordering
with identical values; all preservation checks passed and readiness took 32.5s.
The first assertion's exact cause was not retained and is not claimed as proven.

Independent checks against public HTTPS `https://162.243.69.7` passed:

| Check | Observed outcome |
|---|---|
| Website, Tracker login, backoffice login | 200; trusted TLS, pages rendered |
| POST /api/users | 201; four registration fields, no email |
| POST /api/auth/login | 200; bearer token/type only |
| GET /api/auth/me | 200; correct own identity/profile and safe allowlists |
| GET /api/suppliers | 200; 15 rows, seven fields each |
| GET /api/inventory/products | 200; six rows, seven-field shape |
| GET /api/inventory/orders | 200; 12 rows, correct inbound/outbound projections |
| Real backoffice login and supplier page | Correct return path; all 15 displayed names/rates/statuses matched |
| Owned synthetic account cleanup | Internal self-authorized DELETE 204; old token 401 internally/publicly |

The final real-form Playwright run had zero console/page/network/HTTP errors. A
previous automation run ended with a generic Error; its exact cause is unproven.
A bounded rerun avoided delayed response-body reads across navigation and passed;
no application changes or broad test reruns were made for that harness issue.

Each of the two sequential synthetic-account sessions was cleaned in a finally
path. Public user-ID routes are intentionally not proxied, so deletion used the
internal HTTP API over authorized SSH with the same user's JWT and explicit
ownership checks, never direct database editing. No synthetic account remains.
Original users/profiles counts and canonical/byte hashes, plus supplier byte hashes,
matched before/after. No inventory writes, real mail or external candidate calls.

The final runtime had zero restarts/OOM; Docker healthchecks are not configured.
These are scoped automated checks, not human manual Swagger acceptance, sustained
load testing, full live endpoint coverage or proof of email delivery.
