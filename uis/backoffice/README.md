# TrackFlow Backoffice

Static internal operations interface for TrackFlow's Los Angeles and Zaragoza teams.
The overview uses local sample data; the incident and supplier pages connect to the
local FastAPI service and have no authentication.

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

No build step is required.
