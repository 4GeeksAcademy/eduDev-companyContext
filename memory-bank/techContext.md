# Technical Context

## Current Stack

| Area | Technology |
| --- | --- |
| Root/public website and legacy Hito 4 backoffice | Preserved static HTML, CSS, and browser JavaScript |
| Backoffice inventory | Next.js 16.4.3 App Router, React 19.2.8, TypeScript; separate host in `uis/backoffice/` |
| Inventory API/storage | FastAPI, SQLModel and PostgreSQL/Supabase; existing TinyDB authentication |
| Hito 2 utilities | TypeScript compiled with `tsc`; `tsx` for the console demo |
| Hito 3 UI | Next.js, React, TypeScript, and Tailwind CSS in its own folder |
| Local static server | `http-server` from the root development dependencies |
| Incident analysis core and CLI | Python 3 standard library (`csv`, no pandas) |
| Incident API | FastAPI, Uvicorn, and multipart uploads under `services/api/` |
| Supplier Directory | Pydantic, FastAPI, and TinyDB with a static backoffice client |
| Identity API | Separate TinyDB users/profiles, libpass bcrypt, python-jose HS256 JWT, uv |

## Architecture Decisions

- Keep each UI isolated under `uis/<name>/` with its own entry point, styles, scripts, and README.
- The Next inventory host serves the four `/backoffice/inventory/` routes and proxies only allowlisted legacy assets/login on the same browser origin to loopback `127.0.0.1:3001`. Root static serving remains independent; it cannot render App Router routes.
- Keep the public website and internal backoffice layouts separate.
- Use native Web Components for small reusable public-site elements; no framework is needed.
- Keep the Hito 4 operations overview on static sample data; the separate incident page calls the incident API directly.
- Reuse `shared/incident_analysis.py` from both CLI and API for aggregation/export. Legacy CSV validation now lives in standard-library `packages/shared/incident_validation.py`, with compatible analyzer reexports. Manager rules in `packages/shared/incidents.py` feed Pydantic schemas in `services/api/incident_models.py`; keep legacy and manager enums distinct.
- Keep uploaded incident source files transient and retain only the last successful aggregate summary in process memory.
- Keep supplier persistence small: one schema module, TinyDB helper functions, one router, and one shared idempotent seed function.
- Preserve root Hito 1 and Hito 2 files and `uis/talent-pipeline-tracker/` as independent milestone deliverables.

## Commands

Run from the repository root:

```bash
npm run typecheck
npm run build
npm run demo
npm run serve
```

Independent standard-library incident CLI checks (no API setup required):

```bash
python3 scripts/analyze.py scripts/incidents-trackflow.csv
python3 -m unittest shared.test_incident_analysis -v
```

Current test runners and coverage are documented in the root
[testing guide](../TESTING.md), including temporary-store/config safety and the
protective final-verification environment. Tests need no real secrets or `.env`.

```bash
# Repository root: new business units + legacy API regressions
uv sync
uv run pytest
uv run pytest --cov
# Then from uis/talent-pipeline-tracker/: auth/form/helper Jest units
npm ci
npm exec -- jest --coverage
# Equivalent: npm run test:jest:coverage
```

Operations/authentication API setup and legacy checks (uv only; the local-server
configuration below is not required for automated tests):
Create an ignored local `.env` with a private `JWT_SECRET_KEY`; optionally set
`ACCESS_TOKEN_EXPIRE_MINUTES` (default 30). Never commit secrets. See
`services/api/README.md` for the real-login/manual Swagger flow and permissions.

```bash
uv sync
uv run seed
uv run python -m unittest discover -s services/api/tests -v
uv run python -m unittest discover -s services/api/tests -p 'test_auth_operational.py' -v
uv run python -m unittest shared.test_incident_analysis -v
uv run --env-file .env uvicorn services.api.main:app --host 0.0.0.0 --port 8000
node --check uis/backoffice/suppliers.js
```

After `npm run serve`, open:

- Public website: `http://localhost:3000/uis/website/`
- Internal backoffice: `http://localhost:3000/uis/backoffice/`
- Incident analysis: `http://localhost:3000/uis/backoffice/incident-analysis.html`
- Supplier directory: `http://localhost:3000/uis/backoffice/suppliers.html`
- Incident manager: `http://localhost:3000/uis/backoffice/incidents.html` — see [delivery guide](../docs/centralized-incident-manager.md).

### Inventory setup and verification

See the [backoffice README](../uis/backoffice/README.md#inventory-host) for isolated
package setup, API URL/apiPort alignment, CORS and exact host commands. Root
`npm run build` compiles Hito 2; inventory uses
`npm --prefix uis/backoffice run build`. For browser verification, reuse a successful
production build with `npm --prefix uis/backoffice run start -- --hostname 127.0.0.1 --port 3300`
and the separate `npm --prefix uis/backoffice run legacy` upstream (3001).
Choose an explicit available browser port; do not restart unrelated processes.

The [API inventory guide](../services/api/README.md#inventory-api-t1) documents
`DATABASE_URL`, explicit environment loading, schema setup and optional attributed
seed. Runtime inventory has no SQLite/TinyDB fallback; missing configuration returns
safe 503 responses while legacy APIs remain usable. Focused isolated checks:

```bash
uv run pytest tests/test_inventory_api.py tests/test_inventory_seed.py services/api/tests/test_auth_operational.py -q
node --test uis/backoffice/tests/inventory-client.test.mjs uis/backoffice/tests/inventory-form.test.mjs uis/backoffice/tests/auth.test.mjs
cd uis/backoffice && npx tsc --noEmit
```

Use the [UI verification skill](../.agents/skills/verify-trackflow-ui/SKILL.md) for
static versus Next browser checks. Final inventory browser evidence is pending;
`DATABASE_URL` is currently absent. Isolated SQLite/session-override evidence does
not establish live Supabase connectivity or PostgreSQL concurrency behavior.

## Constraints

- Do not add frontend dependencies for the static backoffice.
- Use uv for API dependency/setup/test workflow in `.venv`; the shared core and CLI remain standard-library only.
- Run one API worker: TinyDB is not multi-process coordinated. Identity, supplier and incident stores remain separate; isolate all three for tests. Stop the API before the separate historical incident seed; incidents are never seeded at startup (supplier bootstrap remains).
- All thirteen incident/supplier routes (five manager, two analyzer, six supplier) require an active database identity via bearer JWT; all active roles may operate them. Registration/login/docs and CORS preflight remain public.
- Static backoffice private shells validate `/auth/me` before reveal; `auth.js` attaches bearer tokens to analyzer, supplier and manager requests. Sessions are origin-local, not SSO.
- The process-global latest incident aggregate is shared between authenticated users, transient across restart and not user-owned. No raw uploads persist.
- Keep technical artifacts and UI copy in English.
- Never print, log, export, or return source incident rows or customer email addresses.
- Treat `CONTEXT.md` as the official general briefing; preserve milestone contexts separately.
- Keep application logic out of `uis/`; future backend services belong under `services/`.
