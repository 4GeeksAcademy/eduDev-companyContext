# Testing TrackFlow

Final BP-06 independent functional verification **passed**: Python 377 tests and
Tracker Jest 85 tests, with no failures or skips. AUTH-088 is mandatory; API-042
and FE-019 are authorized extras. Code/test slices R1–R4 are locally committed,
native-review approved and exactly acknowledged. The initial whole-candidate
preflight budget stop is historical, resolved for code/tests through those slices.
Documentation slice R5 is committed and natively approved; its acknowledgement is
blocked by the review integration and explicitly deferred by the user. Publication
is authorized without further review attempts; no merge is authorized.

## Quickstart

From the repository root (uv manages the Python environment):

```bash
uv sync
uv run pytest
uv run pytest --cov
```

From `uis/talent-pipeline-tracker/`:

```bash
npm ci
npm exec -- jest --coverage
# Equivalent existing script:
npm run test:jest:coverage
```

No real credentials, `.env`, running API, seed or mail provider are needed.
Tests isolate the stores/configuration they touch and mock outbound transport.
Do not substitute personal accounts or production data. Keep real secrets and
reset URLs out of Git, terminal output and reports.

## Choose the right suite

| Suite / command | What it establishes |
| --- | --- |
| Root `uv run pytest tests/` | 280 new direct business-logic tests: real routes/services, models, TinyDB, bcrypt and JWT |
| Root `uv run pytest` | Those 280 plus 97 legacy API/TestClient regressions |
| Tracker `npm exec -- jest --coverage` | 85 auth service/form and frontend helper units across five suites |
| Tracker `node --test tests/*.test.mjs` | Separate 32-test legacy service/helper regression suite |
| Root `uv run python -m unittest discover -s services/api/tests -v` | Legacy API runner remains available |
| Tracker `npm exec -- tsc --noEmit --incremental false` / `npm run lint` | Type and lint integration, not behavior or browser evidence |

Pytest importlib mode permits duplicate endpoint basenames; its helper path also
supports legacy `auth_helpers` imports. Jest discovers `__tests__/*.test.ts` and
uses ts-jest/node; native Node tests remain separate and unchanged.

Direct units call validated models and explicitly resolved dependencies. They do
**not** prove FastAPI dependency injection, request validation, bearer parsing or
response filtering. Legacy HTTP regressions retain those boundaries. Internal
`User` objects are not safe HTTP responses; response schemas are checked explicitly.
Incident/supplier authentication is router-inclusion wiring, not direct-call proof.

## Endpoint case plan and why

The following matrix was established before assignment tests were written.
Every endpoint now has a dedicated module under `tests/`, covering the required
success, boundary/alternate and failure minimum. This is the original selection
rationale, not a claim that every optional edge proposal became a test.

### Identity: 12 endpoints

| Endpoint | Planned cases | Reason |
| --- | --- | --- |
| POST /users | Linked UUID user/profile, normalized email, bcrypt and safe schema; optional/null contacts and UTF-8 limits; duplicate, invalid or privileged fields, no orphan | Prevent privilege injection and inconsistent registration |
| GET /users | Admin directory/empty result; user/manager forbidden; safe schema | Enforce directory policy |
| GET /users/{id} | Self/admin; missing admin target; nonowner forbidden even for unknown ID | Avoid existence disclosure |
| PUT /users/{id} | Email/password/admin role persistence; empty/omitted updates; collision, null/unknown fields, forbidden role; nonmutation | Protect ownership, uniqueness and recovery invalidation |
| DELETE /users/{id} | Linked removal/204; unrelated records preserved; forbidden/missing/repeated deletion; revoked identity | Preserve identity lifecycle |
| POST /auth/login | Email/OAuth username and normalized aliases; bearer sub/exp; conflicting/missing aliases, wrong/inactive credentials, unsafe bcrypt input/config | Keep failures generic and aliases consistent |
| GET /auth/me | Own profile/safe schema; current database role; invalid/revoked identity; missing profile | Resolve current state and fail closed |
| POST /auth/forgot-password | Persist reset ID; normalized email; unknown/inactive/provider/config generic outcome; invalid input; supersession despite delivery failure | Avoid enumeration and stale links |
| POST /auth/reset-password | Hash replacement/state consumption; preserved session; invalid claims/state/user, reuse/supersession; competing attempts | Enforce single-use recovery |
| POST /auth/change-password | Current-password verification, hash update/reset clearing; preserved session; invalid credentials/input; competing changes | Check latest credentials within the process lock |
| GET /profiles/me | Own nullable profile for every role; missing profile/invalid bearer | Prevent cross-owner disclosure |
| PUT /profiles/me | Own contacts; omission/null/empty update; forbidden identity fields, missing profile; unrelated data unchanged | Separate profile and identity authority |

Actual endpoint modules are `test_users_{register,list,get,update,delete}.py`,
`test_auth_{login,me,forgot_password,reset_password,change_password}.py` and
`test_profiles_{get,update}.py`. Braces here abbreviate filenames, not commands.

Helper plans cover salted hashes and 72-byte multibyte boundaries; JWT signature,
expiry, purpose, required UUID/finite numeric claims and current stored roles;
missing/invalid configuration; linked CRUD and reset invalidation; and mocked
email URL/JSON/headers/User-Agent/10-second timeout and provider failures.
`test_auth_tokens.py` and `test_email_delivery.py` supplement endpoint modules.

Actual units exercise exact successful-reset-token reuse, normalized duplicate
registration with byte-identical nonmutation, combined-update collision, omitted
versus null contacts and one-winner reset/change attempts. Explicit response-schema
checks do not substitute for HTTP filtering. Registration write-failure/no-orphan
coverage also lives in the legacy HTTP suite. Exhaustive I/O faults and crash
rollback were proposed concerns, **not** guarantees established by these units.

### API-042: five incident and six supplier operations

| Endpoint | Planned cases | Reason |
| --- | --- | --- |
| POST /api/incidents | UUID/UTC/default open/literal text; required branch; invalid/generated fields, storage failure | Preserve registration contract |
| GET /api/incidents | Each filter and AND combinations; empty/no matches; invalid query/corrupt storage | Verify exact membership |
| GET /api/incidents/summary | All dimensions, empty/sparse zero groups; malformed records | Keep aggregate denominator complete |
| GET /api/incidents/{id} | Exact stored record; missing and storage failure | Distinguish absence from failure |
| PATCH /api/incidents/{id}/status | Four allowed edges, all rejected edges/nonmutation; missing/invalid; status-only fields and competing transitions | Protect lifecycle |
| POST /suppliers | Generated ID/UTC, optional literal contacts; country/currency/category/rate/extra-field validation, storage failure | Protect creation |
| GET /suppliers | Country/category/combined filters; empty/no matches; invalid enums/storage failure | Verify selection |
| GET /suppliers/{id} | Existing/first positive ID; missing, invalid path, storage failure | Preserve lookup contract |
| PATCH /suppliers/{id}/rate | Positive/tiny positive rate and refreshed time; zero/negative, missing, nonmutation | Protect pricing |
| PATCH /suppliers/{id}/status | Active/suspended including self-update; preserved timestamp/other fields; invalid/missing | Preserve status semantics |
| DELETE /suppliers/{id} | Actual removal/success object; unrelated records; repeated/missing/storage failure | Verify persistence |

Modules: `test_incidents_{create,list,summary,get,status}.py` and
`test_suppliers_{create,list,get,rate,status,delete}.py`.
Actual units check all 16 incident lifecycle pairs, AND-filter membership,
zero-filled summaries, literal text, timestamps and corrupt temporary storage for
every operation. Invalid supplier path handling remains a model/legacy HTTP
boundary, not direct route validation. Corrupt-read tests do not prove crash-write
rollback. Analyzer expansion, real seeding and live services are excluded.

### TypeScript: mandatory auth and additional FE-019 helpers

| Real module | Cases selected and exercised |
| --- | --- |
| `services/auth.ts` | Storage/SSR/logout; login/register encoding and partial success; valid/malformed tokens; public versus bearer requests; missing/current/stale 401; preserved sessions on other failures; cancellation before fetch/during body and exact AbortError identity |
| `lib/auth-form.ts` | Required/email validation, 1/72/73 UTF-8 bytes; trimmed email/contacts, blank omission/login exclusion; password preservation |
| `lib/profile-form.ts` | Null-to-empty, trim/blank-to-null, contact strings, nonmutation and identity exclusion |
| `lib/password-form.ts` | Mode-specific required/byte/confirmation checks; single nonblank token and exact success query; duplicate rejection and safe status guidance |
| `lib/labels.ts` | Known/unknown/null statuses/stages; inherited `toString`, `constructor`, `__proto__` rejection |
| `services/api.ts` helpers | Safe `candidateErrorMessage` mapping/fallback; `isCandidateAbort` positive/negative and real DOMException cancellation identity |

FE-019 helpers supplement, not replace, mandatory auth units. Fetch, storage and
location are local fakes restored between tests. Whole-candidate-service coverage
is retained, but helper cases are **not** comprehensive candidate-service tests.

## Final verification evidence

Independent verifier `mvs36fl2-e-n632` ran the following; placeholders below denote
verifier-owned temporary paths, not literal shell arguments or new commands run
by this documentation update.

| Command (root unless marked Tracker) | Observed result |
| --- | --- |
| `uv run pytest` | 377 passed (280 new + 97 legacy), 81.73s |
| `uv run pytest --cov --cov-report=term-missing --cov-report=json:<owned-temp>/integrated.json` | 377 passed, 81.84s |
| Tracker `npm exec -- jest --coverage --runInBand --coverageDirectory=<owned-temp>/jest --coverageReporters=text --coverageReporters=json-summary` | 85 passed, five suites, 0.76s |
| Tracker `npm exec -- tsc --noEmit --incremental false` | Passed |
| Tracker `npm run lint` | Passed |
| `git diff --check` | Passed |

No failures/skips. Unit-only 280-test coverage and legacy Tracker Node **32/32**
are **reused** from the preceding independent final run, not rerun after type-only,
config and comment corrections. Application/assertions did not change between
those observations and final verification.

### Protective execution environment (distinct from quickstart)

The verifier retained a Python 3 `TemporaryDirectory` + subprocess wrapper around
each Python command, despite confirming that tests isolate touched stores/config
without user-supplied secrets. Reproduce its protective scheme by setting all of:

- `TRACKFLOW_USERS_DB_PATH`, `TRACKFLOW_SUPPLIERS_DB_PATH`,
  `TRACKFLOW_INCIDENTS_DB_PATH`: separate JSON files inside the owned temp directory.
- `TMPDIR` and `COVERAGE_FILE`: owned temporary locations; JSON coverage reports
  and Jest `coverageDirectory` also point there.
- Synthetic `JWT_SECRET_KEY`/`RESEND_API_KEY`; `ACCESS_TOKEN_EXPIRE_MINUTES=30` and
  `PASSWORD_RESET_EXPIRE_MINUTES=30`; `RESEND_FROM_EMAIL='BP06 <sender@example.test>'` and
  `FRONTEND_PUBLIC_URL=https://tracker.example.test`.
- Remove `UV_ENV_FILE` from the subprocess environment; set `UV_NO_ENV_FILE=1`.

No `.env`, real service or default data was used; owned artifacts were cleaned.
This describes the observed wrapper environment, not an additional observed run.

## Coverage: statements and branches separately

Full implementation-source denominators in `pyproject.toml` are unchanged:
auth includes auth/database/dependency/model/email modules and auth/users/profiles
routers; incidents includes manager router/models/store/shared lifecycle rules;
suppliers includes database/models/router. No denominator trimming or branch
exclusions. coverage.py's combined headline metric is not statement coverage.

| Group / statement gate | Unit-only statements (reused) | Integrated statements (fresh) | Unit-only branches | Integrated branches |
| --- | --- | --- | --- | --- |
| Auth ≥70% | 429/441 = 97.28% | 436/441 = 98.87% | 88/92 = 95.65% | 88/92 = 95.65% |
| Incidents ≥60% | 166/184 = 90.22% | 183/184 = 99.46% | 17/22 = 77.27% | 21/22 = 95.45% |
| Suppliers ≥60% | 145/148 = 97.97% | 148/148 = 100% | 16/16 = 100% | 16/16 = 100% |

All statement gates pass independently, including unit-only. Six integrated
statements remain uncovered across auth database/dependency/router and incident
store code. Legacy HTTP execution contributes to integrated, not unit-only results.

| Fresh Jest scope | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| Auth service | 100% | 96.55% | 100% | 100% |
| Auth/profile/password forms and labels | 100% | 100% | 100% | 100% |
| Whole candidate `services/api.ts` | 35.95% | 31.20% | 27.77% | 37.83% |
| Overall | 74.43% | 68.21% | 69.76% | 75.91% |

## AI-assisted findings, corrections and limitations

AI-assisted case selection emphasized reset reuse, normalized duplicate/orphan
prevention, stale-401 sessions, null/omission, lifecycle pairs and inherited keys.
Existing Python behavior passed initially; no artificial RED was manufactured.

- **Product bug:** inherited keys were accepted by both label predicates. Initial
  helper run: 3 passed/7 failed; six true regressions justified user-authorized
  own-property fixes in two predicates. Final helper run: 13 passed.
- **Harness, not product:** the seventh failure was native DOMException versus
  Jest VM Error realm mismatch. Jest setup aligns explicit host Error constructors;
  production cancellation classifier is unchanged. It does not realign every
  VM-thrown intrinsic error. Real DOMException and ordinary-error negatives remain.
- **Test/tooling corrections:** remaining auth/form cases passed 72 after five
  async expectation-timing mistakes were corrected. Final integration fixed the
  pytest legacy helper path, four mock type signatures and one line-local CommonJS
  setup lint exception. Earlier collection/type/lint blockers are resolved.

Current warnings: AnyIO `PytestRemovedIn10Warning` and Starlette/httpx deprecation.
Reused Node evidence has `MODULE_TYPELESS_PACKAGE_JSON`; Jest had no warnings.
No new build/browser was needed for pure predicates/tests/config. These units do
not establish browser UX, live provider delivery, crash durability, multi-process
safety or forced concurrency overlap; one-winner assertions do not force overlap.

### Dependency disclosure and next step

Prior independent audit found existing **5 high + 1 critical package findings**
(including Next), predating installation, plus **6 new low package findings**
propagated from deepmerge advisory 1243505 through Jest's dev chain. Counts are
packages, not unique advisories. Lock comparison: 243 added dev-only locations,
zero existing package records changed/removed. Deprecated glob was reported;
install scripts were not manually approved/executed. No audit fix, upgrades,
exploitability assessment or risk acceptance is claimed; remediation is separate.

Full chronological evidence belongs in the [task](odd/tasks/bullet-proof-tests.md)
and [progress](memory-bank/progress.md), not an expanding run log here.
Review approval does not resolve the disclosed dependency findings. The user
explicitly deferred R5 acknowledgement and authorized commit, push and PR; merge
remains a separate decision.
