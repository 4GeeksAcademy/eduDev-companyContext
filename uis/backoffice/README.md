# TrackFlow Backoffice

Internal operations interface for TrackFlow's Los Angeles and Zaragoza teams.
Legacy operations remain static; a minimal Next.js App Router host adds the
four authenticated inventory views without replacing those pages.
The overview uses local sample data; the incident and supplier pages connect to the
local FastAPI service. Public `login.html` provides sign-in. All four private
pages hide their complete shell until shared `/auth/me` validation succeeds;
incident and supplier operations use bearer requests through `auth.js`.

## Container versus local hosting

The [shared UI image](../README.md#ui-development-container) runs the website on
3000 and this Next dev host on3001. Its builtin Node legacy asset server binds
only `127.0.0.1:3002`; `BACKOFFICE_LEGACY_PORT=3002` also selects that rewrite
upstream. Only fixed HTML/JS/CSS assets are served, never repository/config files.
The launcher stops siblings on an unexpected exit and reaps owned children.
Isolated Docker startup/routing/shutdown and synthetic proxy authentication
passed. Configured PostgreSQL, hot reload and VPS acceptance remain separate.

The independent local commands below remain unchanged: the root http-server
upstream uses3001 and Next uses another port. Without an environment override,
Next rewrites still default to3001. `BACKOFFICE_LEGACY_PORT` accepts only integer
ports1–65535; it must differ from the browser-facing Next port. Changing the
rewrite environment does not reconfigure the existing local `npm run legacy`.

## Opt-in same-origin API routing (T3b)

Set server-side `TRACKFLOW_API_PROXY=1` and `TRACKFLOW_API_ORIGIN` to a
credential-free HTTP(S) origin (Compose: `http://api:8000`), then restart Next.
Missing or invalid enabled origins fail configuration clearly. Leave
`NEXT_PUBLIC_INVENTORY_API_URL` unset so inventory shares auth's `/api` base.

All five legacy pages load relative `api-config.js` before modules; the Next root
layout loads `/uis/backoffice/api-config.js` with `beforeInteractive`. That dynamic
route returns fixed JavaScript selecting `/api` only in mode1, otherwise a harmless
200 no-op. Both responses are JavaScript/no-store. Static root hosting serves a
no-op file, preserving defaults and existing manual overrides. The script remains
outside the legacy rewrite/server allowlist; no upstream URL or secrets reach it.

Only `/api/auth`, `/api/suppliers`, `/api/inventory` and `/api/api/incidents`
are proxied to their corresponding backend paths. The doubled incident prefix
preserves existing analyzer/manager clients. No users/profiles or catchall proxy
is provided. Local mode without opt-in retains hostname/validated apiPort behavior.

Focused Node tests passed27/27 and TypeScript passed. Synthetic Compose/browser
checks confirmed real login, auth/me, supplier rows, logout and same-origin traffic;
blank DATABASE_URL showed the expected inventory-unavailable message. Use the
documented `localhost` URL for Next dev: literal127.0.0.1 was rejected by its HMR
origin defaults. No browser-security or authentication changes were needed.
The strict console check failed on cosmetic `/favicon.ico`404 (plus expected
inventory503); functional assertions passed, but a clean console is not claimed.
T4 hot reload and separately authorized PostgreSQL/VPS work remain pending.

## Inventory host

From the repository root, install the isolated host dependencies:

```bash
npm --prefix uis/backoffice install
```

Run these in **separate terminals** (no process manager):

```bash
# Private legacy upstream: repo-root serving directory, loopback only, port 3001
npm --prefix uis/backoffice run legacy
# Browser-facing Next host, port 3000
npm --prefix uis/backoffice run dev -- --hostname 0.0.0.0 --port 3000
```

For verification, prefer the existing successful production build rather than dev:

```bash
# Separate terminal from the legacy upstream; choose an available browser port
npm --prefix uis/backoffice run start -- --hostname 127.0.0.1 --port 3300
```

This requires a matching prior `npm --prefix uis/backoffice run build`; do not
silently rebuild or restart existing servers during verification. Root
`npm run serve` only serves static files, not inventory App Router routes.
Follow the [static-versus-Next UI verification workflow](../../.agents/skills/verify-trackflow-ui/SKILL.md),
including process ownership, API alignment and truthful evidence boundaries.

The legacy script runs exactly
`cd ../.. && ./node_modules/.bin/http-server . -p 3001 -a 127.0.0.1`
from the backoffice package. It needs the existing root http-server installation.
Next rewrites an explicit allowlist of backoffice HTML/JS/CSS files to
`http://127.0.0.1:3001`; it does not proxy the repository, config or secrets. Optional API rewrites are
separate from this unchanged legacy allowlist.
Do not expose the upstream publicly. Ports must differ to avoid recursion.
Top-level `agentRules: false` disables Next's automatic agent-instruction generation
so the existing project instructions remain authoritative.

Open `http://localhost:3000/backoffice/inventory/products` for live SKUs and
stock status (low below 10 units, healthy at 10 or more). Row links preselect a
SKU for goods receipt/stock entry or dispatch/loss/stock exit. The four views are:

- `/backoffice/inventory/products`: read-only SKU stock table.
- `/backoffice/inventory/orders/inbound`: goods receipt with reference.
- `/backoffice/inventory/orders/outbound`: fresh selected-SKU stock, dispatch tracking or loss.
- `/backoffice/inventory/orders`: read-only movement history with user attribution.

Stock exits warn above displayed stock; the backend remains authoritative and
HTTP 400 feedback appears beside quantity. Successful movements reset the form;
selecting a SKU again fetches fresh outbound stock. No product administration is included. The shared inventory layout
validates `/auth/me` before mounting private content; transient failures offer
retry/sign-out, departure aborts validation, and cross-tab changes revalidate.
No bearer token is placed in a URL or manually forwarded by the host.

Legacy login remains at `/uis/backoffice/login.html`, on the same browser-facing
origin as inventory, so existing `trackflow.auth.token` storage is reused.
Use the same browser-reachable identity/inventory API service for login and
inventory. The existing auth helper defaults to the page hostname on port 8000;
optional validated `?apiPort=8001` changes only the port and survives login return.
Custom `window.TRACKFLOW_API_BASE_URL` must be configured consistently on login,
legacy pages and the inventory host before auth calls; the opt-in script above
provides this consistently for same-origin proxy mode. Optionally configure `NEXT_PUBLIC_INVENTORY_API_URL`
before starting/building Next for all inventory requests; otherwise they reuse
`getApiBase()` (dynamic browser hostname and validated apiPort). This URL MUST
identify the intended same authentication service/identity store as legacy login
and the session gate. It does not reconfigure either of them. For a non-default
local API port, use matching `?apiPort=8001` on legacy login and inventory links,
even when the inventory API URL is explicitly configured.
No query parameter may supply an arbitrary API hostname. Allow the exact Next
browser origin in API CORS. No external fonts or network assets are used.

Focused checks (repository root):

```bash
node --test uis/backoffice/tests/auth.test.mjs uis/backoffice/tests/session-guard.test.mjs uis/backoffice/tests/next-host.test.mjs
cd uis/backoffice && npx tsc --noEmit
```

T2 observed 12/12 Node tests and TypeScript passing. A bounded Next dev HTTP
smoke (3300, private upstream 3001) returned 200 for the protected landing's
validation shell, legacy login/index, auth.js and styles.css; both owned servers
were stopped. This is not browser-auth acceptance. The T2 foundation did not run a full build or four-route browser/API checks. The initial Next 16.3.1 installation
matched Tracker metadata but reported one critical audit finding. With explicit
authorization, only Next was upgraded to the audit-offered 16.4.3 pin; React/ReactDOM
remain 19.2.8 and TypeScript tooling is unchanged. The subsequent npm audit reported
zero vulnerabilities. Correction checks passed 13/13 Node tests and TypeScript;
one owned Next dev start returned the protected validation shell with AGENTS.md
and CLAUDE.md absent before/during/after startup, then stopped. Legacy rewrite smoke
above is earlier evidence, not rerun by the correction; neither check proves browser
authentication or complete T2 acceptance.

## Inventory source verification and T4 acceptance

Run from the repository root:

```bash
node --test uis/backoffice/tests/inventory-client.test.mjs uis/backoffice/tests/inventory-form.test.mjs uis/backoffice/tests/auth.test.mjs
cd uis/backoffice && npx tsc --noEmit
# Back at repository root:
npm --prefix uis/backoffice run build
git diff --check
```

Native Node tests mock fetch/storage and exercise real request serialization,
bearer/session handling, readable API errors, cancellation and form helpers. They
are not browser integration evidence. T4 acceptance covered all four guarded routes,
keyboard/narrow/wide layouts, SKU prefill, delayed selection/departure cancellation,
stock warning/400 feedback, duplicate submission, success reset and history refresh.
Local browser verification passed using the production build, real FastAPI auth
and inventory routes, isolated TinyDB stores, and an explicit temporary SQLite
session override. Core movements, stock warnings/real HTTP 400, history, session
handling, retries, selection/departure cancellation, duplicate prevention, keyboard
access, and 390/1440px layouts passed. Error/empty/delay injections were identified
separately from real API outcomes; no unexpected console/page errors remained.
The mobile table overflow found during verification was corrected with a positioned
scroll container. Verification-owned servers and temporary stores were cleaned.
Expired-token-specific and optional outbound HTTP 500 cases were not exercised;
real invalid-token HTTP 401 was verified.

**Live development acceptance: PASS.** The intended TrackFlow Supabase target is
configured in ignored root `.env`; URL/authentication/TLS/SELECT 1 passed. Authorized
setup created only the three inventory tables, model indexes and two SKU foreign
keys, with RLS enabled/no public policies. The privileged FastAPI PostgreSQL
connection works; no SQL user table or auth migration was introduced. Initial seed
6 SKUs/7 entries/3 exits was idempotent on rerun. Real API receipt/dispatch 201,
overstock 400 without mutation and fresh-session persistence passed, leaving
6 SKUs/8 entries/4 exits. PostgreSQL two-transaction NOWAIT returned expected
`55P03`, with both rolled back; this was not a load test.

Live browser products/inbound/outbound stock passed. The initial history assertion
expected standalone SKU text, but the UI renders `name (SKU)`; no app defect was
found. Corrected independent read-only follow-up using actual PostgreSQL, real API
and production Next passed 6 products and 12 history rows with all required fields
and zero console/page errors. Counts and the identity file stayed unchanged;
owned servers stopped and temporary stores were removed. Live checks preloaded a
helper-generated token, not a password-login retest; real password login passed
in the earlier isolated browser run. The expired-token-specific/optional outbound
500 limits above still apply. No functional blocker remains; no push or PR.
See [API inventory setup, manual RLS/TLS requirements and verification boundaries](../../services/api/README.md#inventory-api-t1).

## Run Locally — legacy static-only mode

Start the API from the repository root in one terminal:

```bash
uv sync
uv run seed
uv run uvicorn services.api.main:app --host 0.0.0.0 --port 8000
```

Start the existing static server in another terminal:

```bash
npm run serve
```

Open:

- Operations overview: `http://localhost:3000/uis/backoffice/`
- Incident analysis: `http://localhost:3000/uis/backoffice/incident-analysis.html`
- Supplier directory: `http://localhost:3000/uis/backoffice/suppliers.html`
- Incident manager: `http://localhost:3000/uis/backoffice/incidents.html`

The incident and supplier pages infer the API URL from the page hostname on port `8000`. To
override it, define `window.TRACKFLOW_API_BASE_URL` before loading
their page script. This is public browser configuration and must not contain
secrets.

### Alternate API Port

If port `8000` is unavailable, start the API on another port and allow the exact
static UI origin when needed:

```bash
TRACKFLOW_CORS_ORIGINS="http://localhost:3000" \
  uvicorn services.api.app.main:app --host 0.0.0.0 --port 8001
```

Then open
`http://localhost:3000/uis/backoffice/incident-analysis.html?apiPort=8001`.
Use `http://localhost:3000/uis/backoffice/suppliers.html?apiPort=8001` for the
Supplier Directory.
The `apiPort` parameter accepts only a numeric port from `1` to `65535`; it never
changes the page hostname. `window.TRACKFLOW_API_BASE_URL` remains the highest-
priority override.

## Authentication foundation (AUTH-BO-01)

Open `http://localhost:3000/uis/backoffice/login.html?apiPort=8001` for standalone
sign-in. Login sends form-urlencoded credentials to `/auth/login`, validates the
bearer response and stores `trackflow.auth.token` in localStorage. The four
explicitly allowed relative backoffice page names and only these exact root-relative
inventory paths are accepted as `next`: `/backoffice/inventory/products`,
`/backoffice/inventory/orders`, `/backoffice/inventory/orders/inbound`, and
`/backoffice/inventory/orders/outbound`. `apiPort` is retained across login and inventory navigation.
Configure `window.TRACKFLOW_API_BASE_URL` consistently **on every page, including
login**, before its module loads. No query parameter can override the API host.

`auth.js` exports `getApiBase`, `getToken`, `setToken`, `logout`, `login(email,
password, { signal })`, `safeReturnTarget(next)`, `protectedFetch(path, options, apiBase?)`
and `getCurrentUser(options)`. Protected paths are API-relative (`/suppliers`);
the wrapper returns an unconsumed Response and preserves supplied Headers/body.
Callers set JSON Content-Type themselves; multipart boundaries remain automatic.
Missing tokens/current-token 401 clear and redirect; stale 401 cannot revoke a
newer session. Other errors preserve storage. Login 401 never redirects.

`guardSession(initialize)` in `session-guard.js` validates before revealing HTML
or running the callback once. Transient failures retain the token and offer retry
and sign-out. Departure aborts checks and hides content; persisted browser restores
and cross-tab session changes revalidate. Sidebar links preserve validated apiPort.
Login uses native POST fallback and unlocks canceled submissions on departure.
Tracker registration/profile remain in the independent Next app. Different origins
(including ports) have separate localStorage sessions: this is not SSO or token handoff.

Run `node --test uis/backoffice/tests/*.test.mjs` from the repository root.
Tests exercise auth and gate lifecycle with minimal browser/fetch/storage fakes.
Legacy static-only mode needs no build. The inventory host uses Next.js.

## Incident manager — T4 (source implementation)

`incidents.html` provides registration, a filterable list and an independent summary
using native HTML/CSS/JavaScript. Use `?apiPort=8001` for an alternate API port;
all sidebar links retain the validated port through the existing session guard.
The page stays hidden until session validation and uses `protectedFetch` for bearer
requests. Automatically generated IDs/timestamps are read-only disclosures.

| Operation | Contract |
| --- | --- |
| Register | `POST /api/incidents`, JSON title/description/category/status/origin/branch; 201 full record |
| List | `GET /api/incidents`, AND status/origin/branch/category filters; 200 array |
| Status | `PATCH /api/incidents/{id}/status`, JSON status; 200 full record |
| Summary | `GET /api/incidents/summary`; total and by_status/by_category/by_origin/by_branch |

Branch is always required (including Central), with extra guidance for branch
origin. Registration blocks duplicates and resets fields, errors and branch emphasis
on success. Only legal next statuses are offered; terminal records are read-only.
Failed updates restore the original server status. Filter request versions prevent
stale list results; list and summary have separate loading/error/retry states.
Server error bodies are never displayed: known field keys map to local guidance.
User-entered record text is rendered with textContent, not HTML.

Focused source checks (repository root):

```bash
node --test uis/backoffice/tests/incidents.test.mjs
node --test uis/backoffice/tests/auth.test.mjs uis/backoffice/tests/session-guard.test.mjs
node --check uis/backoffice/incidents.js
node --check uis/backoffice/auth.js
git diff --check
```

These Node tests use injected requests and minimal page-specific nodes, not a browser.
Independent source verification passed incidents10/10 and auth/guard10/10 plus syntax
checks. Subsequent actual incidents-page Chromium checks passed at1440/390: validation,
loading/create/reset/confirmation, all filters/empty states, lifecycle updates, failed
update rollback, list/summary failures and independent retry. The isolated real API
started at95 and reached96 after one synthetic create. Failure-injection console
messages were intentional; optional favicon404 is non-blocking.

**Overall verify-trackflow-ui: FAIL** on pre-existing overview `index.html` overflow:
baseline/current both513px at390 and both1440px at1440 with the same Chromium.
The incidents page passes; no source CSS was modified for this limitation.
See the [delivery guide, exact evidence and three screenshots](../../docs/centralized-incident-manager.md).
The validation capture uses real page validation with fixture auth/list/summary;
list/summary captures use the isolated real API (summary96 includes the synthetic create).
Verification servers/temp DBs were cleaned; the previously retained tracker was
stopped with user approval. Latest independent verifier `mvrjcv4b-h-37pg` passed
combined API82/82, shared13/13 and backoffice20/20 plus syntax/diff checks, with no
failures/errors/skips (existing Starlette/httpx deprecation only). Exact commands
are in the delivery guide. Links/PNG integrity checks passed; parent accepted
documentation/screenshots. No browser rerun occurred; prior incident-page evidence
is reused. Native review `review-d01e45fb968ac84a` is **approved and acknowledged**
with four non-blocking advisories. This passive status update does not change the
reviewed application/tests; delivery has not been performed.
Useful smoke selectors: `#incident-form`, `#branch-field`, `#submit-incident`,
`#form-state`, `#filter-status`, `#filter-origin`, `#filter-branch`, `#filter-category`,
`#incident-list`, `#list-retry`, `#summary-content`, `#summary-retry`.
Do not treat the earlier AUTH-BO-03 runtime evidence below as verification of this
new page. No new dependencies or metadata endpoint were added.

## Runtime acceptance — AUTH-BO-03
Source `8186751` passed isolated runtime checks by `mvra4y7t-i-t17g` and
`mvrae4y4-k-x08r`; both identity and supplier stores were temporary, with no shared
or user-data writes. Node tests passed 10/10 twice; six JS syntax checks and diff
checks passed. Real API checks covered absent/invalid/genuinely expired tokens on
all three pages (including folder/index entry), wrong/successful login, safe `next`
and `apiPort` navigation, bearer supplier GET/filter/create/rate/status updates,
generated CSV multipart upload/results/aggregate blob export, invalid CSV handling
and expired-token export cleanup.

Delayed validation and JavaScript-disabled checks concealed the entire private
shell. Injected 500/network/401 cases preserved/retried or cleared sessions as
appropriate. Real cross-tab logout and invalid/valid token replacement revalidated
before reveal; login duplicate prevention/cancellation/native POST (no password in
URL), keyboard navigation and normal back/logout/login reuse passed. All three
pages at 390/1440 had zero console, JS, request or HTTP errors. Synthetic persisted
restore handlers passed; an actual bfcache attempt returned `pageshow.persisted=false`,
so actual bfcache was **not exercised**, not an application failure. Corrected
harness assumptions required no source changes; all verification-owned resources
were cleaned without stopping existing servers.

Separately, the public website skill run passed: HTTP 200, TrackFlow content and
header/main/section/footer at 390/1440, clean console, empty storage, no auth calls
or redirect. Website and public lead intake remain unchanged. Legacy root
`operations.html` (Hito 2 practice panel) is outside this scope; no global coverage
claim is made. Tracker evidence and candidate API limitations remain in its README.

**USER-REPORTED manual completion:** after receiving the live Tailscale tracker,
backoffice, website and API docs URLs, the user said “listo, probado”, with no issues
described. This is not independently observed, item-by-item manual acceptance.
At that historical closeout, manual servers were retained with ordinary local data.
This is not a current live-service claim: the tracker was subsequently stopped with
user approval for incident-manager verification; verification resources were cleaned.
For future simultaneous local use, keep tracker on 3000 and the installed static server on
3001 (`./node_modules/.bin/http-server . -p 3001`). Run the root API with explicit
`TRACKFLOW_CORS_ORIGINS="http://localhost:3000,http://localhost:3001"` and the existing
private environment configuration; set tracker `NEXT_PUBLIC_AUTH_API_URL` to the
browser-reachable API URL. For remote access, replace localhost consistently with
the reachable hostname in both origins and API URL. No reseeding is needed.
