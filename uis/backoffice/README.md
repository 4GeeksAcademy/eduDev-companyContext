# TrackFlow Backoffice

Static internal operations interface for TrackFlow's Los Angeles and Zaragoza teams. The operations overview uses local sample data. The incident analysis page connects directly to the local aggregate-analysis API and has no authentication.

## Run Locally

Start the API from the repository root in one terminal:

```bash
source .venv/bin/activate
uvicorn services.api.app.main:app --host 0.0.0.0 --port 8000
```

Start the existing static server in another terminal:

```bash
npm run serve
```

Open:

- Operations overview: `http://localhost:3000/uis/backoffice/`
- Incident analysis: `http://localhost:3000/uis/backoffice/incident-analysis.html`

The incident page infers the API URL from the page hostname on port `8000`. To
override it, define `window.TRACKFLOW_API_BASE_URL` before loading
`incident-analysis.js`. This is public browser configuration and must not contain
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
The `apiPort` parameter accepts only a numeric port from `1` to `65535`; it never
changes the page hostname. `window.TRACKFLOW_API_BASE_URL` remains the highest-
priority override.

No build step is required.
