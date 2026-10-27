# TrackFlow Backoffice

Static internal operations interface for TrackFlow's Los Angeles and Zaragoza teams.
The overview uses local sample data; the incident and supplier pages connect to the
local FastAPI service. Public `login.html` provides sign-in. All three private
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
bearer response and stores `trackflow.auth.token` in localStorage. Only the three
relative backoffice page names are accepted as `next`; `apiPort` is retained.
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
Live browser/API acceptance (including back/forward cache, multipart and downloads)
is pending independent verification; no skill runtime PASS is claimed.
No build step is required.
