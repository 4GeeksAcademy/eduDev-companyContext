# Caching report — local implementation verified; delivery pending

**Frontend and backend implementation and scoped local checks passed.** This report covers T2 / S1, S2, S3 and S5 of the [assignment task](odd/tasks/performance-caching.md). Work is organized in a local feature-branch chain; native assessment remains blocked by its untracked-scope preflight after an authorized managed-assets sync, and publication remains unapproved. This is not full submission, production or real-authenticated UI acceptance.

## Frontend decisions

[Separate React.lazy + Suspense wrappers](uis/backoffice/components/inventory-lazy.tsx) defer `InventoryHistory` and `InventoryOrderForm` behind the unchanged session gate; three orders-route references now use them. History is unnecessary for movement entry, and the form is unnecessary for history. Existing Next route splitting did not prevent these component chunks arriving during held session validation.

The [form](uis/backoffice/components/inventory-order-form.tsx) memoizes its existing product option elements with `useMemo` and `[products]`. Stable products reuse the option tree during quantity/reference/tracking edits; replaced products invalidate it. First-render work is unchanged. This retains an element tree in memory, not API responses or a trivial stock threshold. The larger fixture supports avoiding repeated mapping; six-SKU benefits are negligible.

### Observed frontend comparison

Source was measured before edits. Baseline and after production builds passed (after: 3s). One unthrottled synthetic run per version at **1440×900** used the same four fixtures: history/6 SKUs, inbound/6, inbound/1,000 and outbound/1,000 (not four distinct routes). All auth/API calls were intercepted; no real credentials or database were used. Parent comparison of complete JSON outputs found identical status, history text, option text and POST payloads.

| Relevant component chunk | Before: during held validation | After: after validation |
|---|---:|---:|
| History | 3,447 decoded bytes | 3,447 decoded bytes |
| Order form | 5,850 decoded bytes | 5,878 decoded bytes |

This **defers small chunks**, not reduces total JavaScript: form size grew by 28 decoded bytes. Lazy loading adds a request/wait tradeoff; route prefetch may remain. No framework-bundle savings or LCP gain is claimed.

Thirty sequential field edits, **before → after**, measured through CDP:

| Fixture | Script CPU (ms) | Task CPU (ms) | Median fill + requestAnimationFrame (ms) |
|---|---:|---:|---:|
| Inbound, 6 SKUs | 10.833 → 10.113 | 80.023 → 82.282 | 16.681922 → 16.693902 |
| Inbound, 1,000 SKUs | 84.109 → 11.622 | 163.907 → 113.173 | 16.673833 → 17.020285 |
| Outbound, 1,000 SKUs | 80.051 → 10.684 | 156.589 → 91.551 | 16.684804 → 16.696896 |

Larger-fixture script CPU fell, but frame medians stayed approximately **16.7–17ms**, with no meaningful improvement. These totals include other script/task work: they are neither isolated React Profiler/option-creation costs nor production INP. Synthetic 1,000-SKU variety represents a larger workload, not actual traffic or production row counts.

### Focused checks and reproduction

Frontend Node RED **0/2 → GREEN 2/2**, preserved tests **11/11**, and TypeScript passed. Final parent seam checks passed **11 Python + 13 Node**, exit 0; two existing Python deprecations and Node module-type warnings remain. Desktop and separate **390×900** runs each passed four fixtures: no private content/inventory requests before validation, relevant private chunks after validation, and no page errors or blocked requests. The narrow run additionally checked no page overflow; its outputs/payloads matched desktop.

Existing tests/source guards retain unchanged behavior, but the broader error/retry/keyboard/cancellation browser sweep was **not rerun**. No screenshots, live auth/API/DB checks or generic `verify-trackflow-ui` acceptance are claimed. Provenance is parent jobs 2 (baseline), 3 (build), 4 (after), 5 (narrow), summarized in task L14–L17; no permanent raw output is committed.

For later authorized reproduction from repository root, using the existing matching production build and installed tools (not executed for this documentation update):

```bash
node --test uis/backoffice/tests/inventory-caching.test.mjs uis/backoffice/tests/inventory-client.test.mjs uis/backoffice/tests/inventory-form.test.mjs uis/backoffice/tests/next-host.test.mjs
node uis/backoffice/tests/profile-inventory.mjs
TRACKFLOW_BROWSER_WIDTH=390 node uis/backoffice/tests/profile-inventory.mjs
```

The [helper](uis/backoffice/tests/profile-inventory.mjs) accepts width 390 or 1440 (default 1440), owns loopback3397, fails if occupied and closes its browser/server. Mobile is a separate functional check; the desktop benchmark protocol was unchanged. Existing Playwright Core/Chromium locations and reuse limits are in [TESTING.md](TESTING.md#existing-local-browser-tools--reuse-before-installing). Explicit `chromiumSandbox:false` permission covers only local synthetic fixtures: API interception, external-request blocking, no real credentials or system security changes. No install is needed; a current-code rerun alone does not recreate the pre-edit baseline.

## Backend decisions

Only **GET /api/incidents** and **GET /api/incidents/summary** are cached. Both repeatedly scan and validate the TinyDB incident collection on misses; list applies AND filters, summary counts four dimensions. The manager UI reloads lists for filters and refreshes list/summary after mutations: repeated reads between writes make these plausible candidates. Call frequency and change rates are workflow estimates, not traffic measurements.

| Endpoint | Cost and expected reuse | TTL | Invalidation |
|---|---|---|---|
| GET /api/incidents | Full-store read/model validation and filtering; repeated identical filter selections can reuse results. Local synthetic timing below. | 30 seconds | Clear all incident cache entries before each validated insert/status mutation attempt. |
| GET /api/incidents/summary | Full-store read/model validation plus four counting passes; repeated dashboard refreshes can reuse aggregates between writes. Local synthetic timing below. | 30 seconds | Same invalidation across all users and filter variants. |

Implementation: [cache helper](services/api/cache.py), [store](services/api/incident_store.py), [manager routes](services/api/app/routers/incident_management.py).

- In-process dictionary, at most **128 entries**, monotonic **30-second TTL**. Expired entries are pruned on access; oldest inserted entry is evicted at capacity. No Redis or new library.
- Key: resolved database path, authenticated user ID, endpoint identity and canonical sorted validated filters (empty tuple for summary). Authentication still checks the active identity on every request, including hits.
- The existing `RLock` encloses lookup/population and storage writes, preventing an older read from repopulating after invalidation. Values are deep-copied; loader exceptions are never cached.
- Invalidation happens **before** validated TinyDB insert/update, not merely after success: an `fsync` error can follow a flush that already changed disk bytes. All users/filters are cleared conservatively, even when a failed write ultimately made no change. This is not transactional rollback; sanitized HTTP 500 behavior remains unchanged.

### Complete per-method application endpoint assessment

Cross-checked against the seven router inclusions in [API composition](services/api/app/main.py), their current decorators/OpenAPI declarations, and the [31-endpoint serialization inventory](docs/serialization-audit.md#original-31-endpoint-inventory). Framework docs/OpenAPI, CORS OPTIONS and exception handlers are not application endpoints.

**Cost below is structural, not measured**, except rows 22–23 whose timings follow. Frequency and data changes are qualitative estimates from existing UI/API workflows; production cost, frequency and change rates were not measured. “On action” means user-triggered, not a numeric traffic estimate. TinyDB lookup/read cost can grow with file size; no constant-time claim is intended.

| # | Method/path | Structural operation cost | Estimated calls | Estimated underlying changes | Cache decision |
|---|---|---|---|---|---|
| 01 | POST /users | Uniqueness lookup, bcrypt, linked identity/profile write | Registration action | Each registration | No: write/security |
| 02 | GET /users | Identity collection scan/projection | Occasional admin API use; no directory UI | Registration/edit/delete | No: private admin data, unmeasured demand |
| 03 | GET /users/{user_id} | Identity lookup/projection | Occasional self/admin API lookup | Identity edits/deletion | No: private identity freshness |
| 04 | PUT /users/{user_id} | Lookup, validation, optional bcrypt, persistence | Account edit action | Each accepted edit | No: write/security |
| 05 | DELETE /users/{user_id} | Linked identity/profile removal | Rare account deletion | Each deletion | No: write/revocation |
| 06 | POST /auth/login | Identity lookup, bcrypt verification, JWT signing | Login/session entry | Credentials/activity/session expiry | No: credentials/token issuance |
| 07 | POST /auth/forgot-password | Lookup, reset-state write, possible mail I/O | Recovery action | Each accepted recovery request | No: stateful recovery |
| 08 | POST /auth/reset-password | JWT validation, bcrypt, consume reset state | Recovery completion | Each successful reset | No: single-use security write |
| 09 | POST /auth/change-password | Password verify/hash and locked write | Occasional account action | Each accepted change | No: security write |
| 10 | GET /auth/me | Active identity and profile lookups | Frequent private-page/session checks | Identity/profile edits or revocation | No: gate must see current identity |
| 11 | GET /profiles/me | Auth plus owner profile lookup | Profile page entry | Owner contact edits | No: private owner data |
| 12 | PUT /profiles/me | Validated owner profile write | Profile save action | Each accepted save | No: write |
| 13 | POST /suppliers | Validation and TinyDB insert | Supplier registration action | Each create | No: write |
| 14 | GET /suppliers | Collection scan and country/category filtering | Directory entry/filter/refresh | Supplier create/rate/status/delete | No: no measured bottleneck; avoid another invalidation domain |
| 15 | GET /suppliers/{supplier_id} | Supplier lookup/detail projection | Occasional API detail lookup | Supplier edits/deletion | No: low expected reuse, unmeasured |
| 16 | PATCH /suppliers/{supplier_id}/rate | Lookup and price/timestamp write | Rate edit action | Each accepted edit | No: write |
| 17 | PATCH /suppliers/{supplier_id}/status | Lookup and status write | Activate/suspend action | Each accepted edit | No: write |
| 18 | DELETE /suppliers/{supplier_id} | Lookup/removal | Occasional delete action | Each deletion | No: write |
| 19 | POST /api/incidents/analyze | CSV decode/validation/aggregation, grows with upload | Explicit upload action | Every successful upload replaces latest aggregate | No: upload/state change; no raw-data cache |
| 20 | GET /api/incidents/results/export | Format small existing aggregate as CSV | Download after analysis | Next successful upload | No added cache: latest aggregate already in memory |
| 21 | POST /api/incidents | Validate, construct record, TinyDB insert | Incident registration action | Each accepted create; possible partial failed write | No: write; invalidates incident cache |
| 22 | GET /api/incidents | Full-store read/validation/filter; hit still copies/serializes | Manager entry/filter/retry/refresh | Creates/status changes | Yes: user/filter-scoped 30s |
| 23 | GET /api/incidents/summary | Full-store validation and four count passes | Manager entry/retry/post-write refresh | Creates/status changes | Yes: user-scoped 30s |
| 24 | GET /api/incidents/{incident_id} | TinyDB lookup/model validation | Occasional detail API call; UI has inline list details | Create/status changes | No: limited expected reuse, fresh detail |
| 25 | PATCH /api/incidents/{incident_id}/status | Lookup/lifecycle validation and write | Workflow transition action | Each accepted transition; possible partial failed write | No: write; invalidates incident cache |
| 26 | POST /inventory/products | SQL insert/commit/refresh | SKU registration API action | Each SKU create | No: write |
| 27 | GET /inventory/products | SQL movement preaggregation and SKU joins | Stock page/form entry/retry | Receipts/dispatches/SKU creates | No: current stock required |
| 28 | GET /inventory/products/{id} | SKU lookup plus two stock sum queries | Selected-product lookup | Receipts/dispatches for SKU/warehouse | No: current stock required |
| 29 | POST /inventory/orders/inbound | Transaction, SKU lock and movement insert | Receipt submission | Each accepted receipt | No: transactional write |
| 30 | POST /inventory/orders/outbound | Transaction, SKU lock, stock sums/check and insert | Dispatch/loss submission | Each accepted exit | No: transactional stock check/write |
| 31 | GET /inventory/orders | Two movement/SKU joins, projection, combined sort | History route entry/retry | Every receipt/dispatch | No: operational freshness; unmeasured benefit |

Totals: identity 12 + suppliers 6 + analyzer/export 2 + manager 5 + inventory 6 = **31**.

## Measurements and reproducibility

**Writer-reported local synthetic public TestClient measurements**, recorded in the [task log](odd/tasks/performance-caching.md#log), not production improvements or middleware medians. Two isolated datasets contained **50 and 1,000 incidents**, with varied titles, descriptions, dates, categories, statuses, origins and branches. They are separate small/seeded scenarios, not real database counts. Seven warm requests per endpoint repeated identical filters without sleeps; list URL was `/api/incidents?status=open&branch=central`.

| Endpoint | Synthetic rows | Before warm median (ms) | After warm median (ms) | Warm store scans before → after |
|---|---:|---:|---:|---:|
| GET /api/incidents | 50 | 1.628 | 1.095 | 7 → 0 |
| GET /api/incidents/summary | 50 | 1.327 | 1.008 | 7 → 0 |
| GET /api/incidents | 1,000 | 7.771 | 1.641 | 7 → 0 |
| GET /api/incidents/summary | 1,000 | 7.376 | 0.966 | 7 → 0 |

The first request made one store scan per endpoint. Wall timings include authentication, serialization and TestClient overhead; seeding and login are excluded. The baseline was measured **before caching code**. No benchmark was rerun after the conservative partial-write invalidation correction; these numbers describe the original implementation comparison, not a fresh corrected-candidate run. Seven requests establish bounded local reuse, not sustained-load, expiry-duration or production latency conclusions.

The implemented timing middleware logs method, route template, status and elapsed milliseconds via `trackflow.timing` at INFO; it excludes query/body/headers and arbitrary IDs. Those logs are available after implementation, but are not the source of the medians above. A comparable middleware before/after measurement is not claimed.

For a later authorized reproduction from repository root (documented only, **not executed for this report**):

```bash
env -u UV_ENV_FILE UV_NO_ENV_FILE=1 DATABASE_URL= PYTHONDONTWRITEBYTECODE=1 \
  uv run --offline --no-sync python -B scripts/profile_caching.py --rows 50 1000 --repeats 7
```

[Profiler source](scripts/profile_caching.py) defines `--rows` as one to four counts, each 1–2000 (default `50 1000`), and `--repeats` as 3–20 (default 7); standard `--help` describes them. It owns a system `TemporaryDirectory`, isolates all three TinyDB stores before lifespan, uses synthetic JWT settings, blanks SQL/mail configuration, blocks outbound urllib transport and cleans its temporary data. It seeds through the existing `insert_incident_if_absent` helper. No running API, real data, credentials or installation is needed. This command measures current code only; it cannot recreate the old uncached baseline by itself. Do not point temporary/cache paths into the repository.

### Reused verification evidence and provenance

These are previous writer/verifier observations, **not checks rerun by this documentation task**:

- Initial caching RED: **5 failed / 3 passed**; original GREEN: **9 passed**. Affected regression: **59 passed + 3 subtests**.
- Independent combined backend verification: **68 passed + 3 subtests**. It subsequently found stale cached data after partial writes despite those passes.
- Partial-write regression: **RED 2 failed → GREEN 2 passed**; final caching-only guard: **11 passed**.
- Independent limited corrected-candidate recheck: **6 passed in 5.51s**, covering partial writes, successful-write invalidation and lock contention. Original wider evidence was reused, not globally repeated.
- Reported differential over **31 application responses** preserved exact status/body and stdout/stderr; the independent verifier also found complete OpenAPI JSON equal before the correction. No schema/differential rerun after correction is claimed. No permanent raw-output artifact was retained: provenance is writer/verifier reports in the task log, not an attached reproducible output archive.
- Two existing dependency deprecation warnings remain. Backend evidence above is reused; the final 11-test seam run and scoped frontend evidence are recorded separately. This passive report update reran no tests, builds, browsers or benchmarks.

## Tradeoffs acknowledged

**30 seconds is a short local reuse window, not permission to serve stale application writes.** Application insert/status attempts invalidate immediately under the shared lock. TTL bounds reuse after external changes only; it is not a substitute for invalidation. A short potential delay is a provisional fit for incident monitoring rather than stock allocation, but no production freshness tolerance was measured or accepted.

Run **one API worker**: this dictionary and `RLock` are process-local, not cross-process coordination. Out-of-process historical seeding requires stopping the API and restarting afterward; do not rely on TTL to make concurrent TinyDB writers safe. Restarts discard entries. Multiple workers/instances would require a separately designed coordination strategy, not this implementation.

User-specific keys intentionally reduce hit sharing for privacy even though active users currently view shared incident records. Capacity is bounded by entry count, **not bytes**: large list values and deep copies still consume memory/CPU, and response serialization/authentication still run on hits. Global invalidation favors correctness over maximum hit rate. TinyDB partial writes remain nontransactional.

## What was not cached and why

- **Inventory stock/detail/history:** stock drives operational decisions; immediate fresh reads and transactional write checks outweigh unmeasured cache gains.
- **Authentication, identities and profiles:** credentials, session validity, roles and private contacts must not become stale; every protected cache read still authenticates.
- **Incident detail:** lower expected reuse, inline list details already serve the manager UI; keep the direct lookup uncached.
- **Suppliers:** possible future read candidate, but no measured bottleneck justifies another invalidation domain.
- **Uploads, all mutations and CSV export:** writes must execute; export already formats an in-memory aggregate. No exception/raw-upload caching.
- **Frontend session gate and API data:** authentication remains unchanged; memoization reuses option elements only, not fresh-stock requests, session results or trivial scalar calculations.

## Remaining delivery and limits

S2/S3 implementation and scoped local verification passed; this report supplies S5 decisions and the complete endpoint assessment within S1's authorized scope. S4 evidence remains the explicitly qualified synthetic comparisons above, not middleware medians or production performance. Local delivery follows `feature/caching-optimisation` → `perf/caching-api` → `perf/caching-ui` → `docs/caching-report`; each future child PR targets its immediate parent. API `a631c3e` and UI `c29e88a` are committed. Native assessment could not classify the selected ranges because of untracked-scope handling; one authority inspection then stopped at `managed_assets_outdated`. The user authorized the exact sync, which passed and restored INSPECT to ready without application changes. A fresh isolated API ASSESS still required an untracked declaration despite INSPECT exclusion. No native review was started or approved. An explicit API-review request or a decision to leave review pending remains with the user; unrelated notes are not hidden or staged to bypass this preflight. S6 push/PR/merge/submission remain unauthorized and pending. Local fixture acceptance does not establish real-authenticated, production or global UI acceptance.
