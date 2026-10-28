# TrackFlow Backoffice

Static internal operations interface for TrackFlow's Los Angeles and Zaragoza teams.
The overview uses local sample data; the incident and supplier pages connect to the
local FastAPI service. Public `login.html` provides sign-in. All four private
pages hide their complete shell until shared `/auth/me` validation succeeds;
incident and supplier operations use bearer requests through `auth.js`.

## Run Locally

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
bearer response and stores `trackflow.auth.token` in localStorage. Only the four
explicitly allowed relative backoffice page names are accepted as `next`; `apiPort` is retained.
Configure `window.TRACKFLOW_API_BASE_URL` consistently **on every page, including
login**, before its module loads. No query parameter can override the API host.

`auth.js` exports `getApiBase`, `getToken`, `setToken`, `logout`, `login(email,
password, { signal })`, `safeReturnTarget(next)`, `protectedFetch(path, options)`
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
No build step is required.

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
