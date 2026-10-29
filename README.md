# TrackFlow — AI Engineering Company Project

[![4Geeks Academy](https://img.shields.io/badge/4Geeks-Academy-blue)](https://4geeksacademy.com)
[![AI Engineering](https://img.shields.io/badge/track-AI%20Engineering-green)](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)

_TrackFlow's transversal project for the AI Engineering Career Program — 4Geeks Academy._

> _Instrucciones disponibles en español en [README.es.md](./README.es.md)._

---

## Purpose

This repository is the active **TrackFlow monorepo**. It contains the company's milestone deliverables and the shared structure for future work.

- Read the official company briefing in `CONTEXT.md` before making changes.
- Use the memory bank and `AGENTS.md` as active project guidance.
- Follow directory-level `README.md` files when adding milestone deliverables.

---

## Current project status

This repository contains TrackFlow deliverables for Hitos 1 through 4 plus the Incident Analyzer and Supplier Directory milestones: the original public website, TypeScript business utilities, talent pipeline frontend, AI-driven engineering setup, private aggregate CSV analysis, and persistent supplier operations.

- `CONTEXT.md` contains the official general TrackFlow company briefing.
- `CONTEXT-hito-1.md`, `CONTEXT-hito-2.md`, and `CONTEXT-hito-3.md` preserve milestone-specific contexts.
- `uis/talent-pipeline-tracker/` contains the Hito 3 app and its own setup README.
- `uis/website/` and `uis/backoffice/` contain the static Hito 4 interfaces.
- `shared/incident_analysis.py` provides canonical incident validation and aggregation for the CLI and API.
- `scripts/analyze.py` provides the terminal incident-analysis workflow.
- `services/api/` provides the incident endpoints and TinyDB-backed supplier API.
- `memory-bank/`, `AGENTS.md`, and `.agents/` provide the minimal Hito 4 project context and agent guidance.
- Root npm scripts validate, build, demonstrate, and serve the project.
- Shared template folders remain available for later milestones.

## TrackFlow Hito 2

Hito 2 adds the typed business logic used to manage TrackFlow inventory, shipments, and carriers. The implementation intentionally uses plain TypeScript and browser DOM APIs to stay within the Coding Fundamentals scope.

### Implemented functionality

- Typed models for products, shipments, carriers, destinations, and inventory movements.
- Non-mutating inventory filters and sorting.
- Linear searches by SKU and shipment ID, plus binary search by product weight.
- Shipping-cost calculation, carrier scoring, and best-carrier selection.
- Inventory and shipment reports using typed aggregations.
- Business validation with complete error lists.
- Console demo with representative assertions.
- Responsive operations dashboard connected to the TypeScript utilities.

### Hito 2 structure

```text
src/
├── data/sampleData.ts
├── types/models.ts
├── utils/collections.ts
├── utils/search.ts
├── utils/transformations.ts
├── utils/validations.ts
├── demo.ts
└── operations.ts

operations.html
```

The pure business functions live under `src/utils/`. `src/demo.ts` provides a development runtime check, while `src/operations.ts` only connects those functions to `operations.html`.

---

## Repository structure

```text
eduDev-companyContext/
├── README.md
├── README.es.md
├── CONTEXT.md                # Official general TrackFlow briefing
├── agents/                   # Agent patterns/templates and tools docs
├── data/                     # raw, process, pipelines, eval
├── docs/                     # Project and architecture documentation
├── infra/                    # Docker, Terraform, deployment configs
├── internal/                 # CLIs, packaged migration scripts, internal utilities
├── mcps/                     # Model Context Protocol (MCP) Servers
├── packages/
│   └── shared/               # Shared package (@repo/shared-types)
├── scripts/                  # Script conventions/documentation
├── services/                 # APIs and background workers
├── shared/                   # Shared assets/conventions at repo level
├── skills/                   # Reusable agent skills
├── uis/                      # User interfaces (React, Next.js, Streamlit, HTML)
└── workflows/                # Automation/orchestration documentation
```

---

## Working in this repository

1. **Clone** this repository or open it in Codespaces.
2. **Read** `CONTEXT.md`, `AGENTS.md`, and the three files in `memory-bank/`.
3. **Review** each relevant folder `README.md` before adding files.
4. **Implement** milestone deliverables in the folder defined by the repository structure.

---

## Running locally

The TrackFlow public site (Hito 1) is a static HTML/CSS/JS application served from the repository root. No build step is required.

```bash
npx http-server . -p 3000 -a 0.0.0.0
```

Then open:

- Landing page: `http://localhost:3000/index.html`
- B2B lead form: `http://localhost:3000/application.html`
- Hito 4 public website: `http://localhost:3000/uis/website/`
- Hito 4 internal backoffice: `http://localhost:3000/uis/backoffice/`
- Incident analyzer: `http://localhost:3000/uis/backoffice/incident-analysis.html`
- Supplier directory: `http://localhost:3000/uis/backoffice/suppliers.html`
- Centralized Incident Manager: `http://localhost:3000/uis/backoffice/incidents.html` — [delivery guide, setup and evidence](docs/centralized-incident-manager.md).

### Development Compose stack (T3 packaging)

Requires Docker with BuildKit and Docker Compose 2.17+ supporting
`build.additional_contexts`. From the repository root:

1. For a new setup, create an ignored root `.env` with the settings below. If it
   already exists, merge only missing keys privately; **never overwrite existing
   values**. A human must configure real credentials privately before starting.
2. Keep all three database paths under `/app/data`; review host ports and bind
   address. These are suggested local values, not proof your `.env` is complete.
3. After configuration, run `docker compose up --build`; stop with
   `docker compose down` (no `-v`).

| Setting | Local value / requirement |
| --- | --- |
| `COMPOSE_PROJECT_NAME` | `trackflow` |
| `TRACKFLOW_BIND_ADDRESS` | `127.0.0.1` (loopback only) |
| `WEBSITE_HOST_PORT` / `BACKOFFICE_HOST_PORT` / `API_HOST_PORT` | `3000` / `3001` / `8000` |
| `BACKOFFICE_LEGACY_PORT` | `3002` (private upstream) |
| `TRACKFLOW_API_PROXY` | `1` (opt in to same-origin backoffice API routing) |
| `TRACKFLOW_API_ORIGIN` | `http://api:8000` (server-only internal API origin) |
| `JWT_SECRET_KEY` | Blank initially; supply a private random key before starting, no fallback |
| `DATABASE_URL` | Blank; inventory503 unless existing PostgreSQL is configured |
| `ACCESS_TOKEN_EXPIRE_MINUTES` / `PASSWORD_RESET_EXPIRE_MINUTES` | `30` / `30` |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `FRONTEND_PUBLIC_URL` | Blank; configure mail separately |
| `TRACKFLOW_CORS_ORIGINS` | `http://localhost:3000,http://localhost:3001` |
| `TRACKFLOW_USERS_DB_PATH` | `/app/data/users.json` |
| `TRACKFLOW_SUPPLIERS_DB_PATH` | `/app/data/suppliers.json` |
| `TRACKFLOW_INCIDENTS_DB_PATH` | `/app/data/incidents.json` |

Default URLs: website `http://localhost:3000/uis/website/`, backoffice
`http://localhost:3001/uis/backoffice/login.html`, API `http://localhost:8000/docs`.
Compose automatically reads root `.env` for interpolation but passes only explicit
API settings; UI receives no backend secrets. Shell environment overrides `.env`.

The two images share a project-named network. UI source binds include only
`./uis/website`, `./uis/backoffice` and read-only `./uis/start.sh` at their matching
`/app/uis/` paths; the tracker and whole repository are not mounted. Source binds
support development reload; four named UI volumes isolate dependencies/Next caches. API dependencies
live outside source binds. A separate named volume stores users, suppliers and
incidents; legacy host TinyDB data is masked, not migrated. Startup populates the
existing supplier demo only in that isolated store. Preserve volumes to retain data.

Inventory needs an approved PostgreSQL/Supabase `DATABASE_URL` and the existing
[schema/RLS prerequisites](services/api/README.md#inventory-api-t1). Blank URL
returns inventory503; there is no fallback. Configured API startup may create
inventory tables through existing application behavior. Do not point this stack at
a real database without approval; these setup instructions run no schema or seed commands.
Optional mail settings remain blank until separately configured; the Tracker recovery
frontend is not included in this two-service stack.

Independent synthetic T3 verification passed image builds, standalone shared-module
imports, API/website/login HTTP200, UI-to-API service DNS, registration/login and
expected inventory503 with blank SQL configuration. Next dev may regenerate the
two imports in `uis/backoffice/next-env.d.ts`; review generated changes separately.

T3b implements opt-in same-origin backoffice routing: the browser receives only
`/api`, while Next forwards four fixed auth/supplier/inventory/incident families to
the validated server-only origin. Restart Next after changing proxy settings.
Independent static hosting and local Next without opt-in retain hostname/apiPort defaults.
No backend secrets or upstream origins are emitted by the configuration script.

**Boundary:** T3 packaging/runtime and T3b focused tests plus synthetic browser
proxy/authentication checks passed on the documented `localhost` URL. A cosmetic
favicon404 failed the strict console assertion; a clean console is not claimed.
Hot reload was verified on disposable committed-source copies without rebuilding
images or recreating containers: website changes/restoration triggered automatic
Next document reload; backoffice updated in place; Uvicorn reloaded API changes.
Original source remained unchanged. Root `.env` is ignored/untracked and absent
from the available local Git history. Real `.env` completeness, configured
PostgreSQL and production/VPS acceptance remain separate and unverified.

Focused configuration checks use temporary synthetic environment fixtures, no daemon,
real credentials or root `.env`:

```bash
node --test tests/container-config.test.mjs
```

### Production images (T5b verified; limited T5 VPS runtime)

The verified images now run in a limited initial VPS deployment:
[public URLs, sanitized evidence and boundaries](docs/evidence/containerization/README.md).
SQL is blank (inventory unavailable), first admin is unconfigured, and public UI
access is HTTP only: do not send real credentials/tokens. T5 remains in progress.

Development remains the default. Build production images **locally**, then transfer
these tags to the target Docker host using your approved image transport. No VPS
build, source mounts or backend credentials belong in the UI build:

```bash
docker build -t trackflow-ui:production -f uis/Dockerfile \
  --build-arg TRACKFLOW_UI_MODE=production \
  --build-arg TRACKFLOW_API_PROXY=1 \
  --build-arg TRACKFLOW_API_ORIGIN=http://api:8000 ./uis
docker build -t trackflow-api:production -f services/Dockerfile \
  --build-context shared=./shared \
  --build-context packages_shared=./packages/shared ./services
```

The UI installs build dependencies per app, builds website then backoffice inside
Docker, and uses direct `next start` leaf processes with the existing private
legacy server/lifecycle handling. Production selection rejects unknown modes and
requires the exact public proxy settings above. Rebuild when changing rewrites:
Next reads them at **build time**, not just runtime. No host `.next` output.

On the target host, provide operator-managed settings privately, then use only:

```bash
docker compose -f docker-compose.production.yml up -d --no-build
docker compose -f docker-compose.production.yml down  # retain persistent data
```

| Production setting | Contract |
| --- | --- |
| `TRACKFLOW_UI_IMAGE` / `TRACKFLOW_API_IMAGE` | Required transferred image tags, e.g. `trackflow-ui:production` / `trackflow-api:production` |
| `COMPOSE_PROJECT_NAME` | Set a dedicated name, e.g. `trackflow-production`; keep it stable for persistence |
| `JWT_SECRET_KEY` | Required private durable random secret, API only; no fallback |
| `DATABASE_URL` | Optional blank for isolated checks; real PostgreSQL/schema/RLS readiness still missing |
| `TRACKFLOW_BIND_ADDRESS` | Defaults to `127.0.0.1`; choose exposure deliberately for the target host |
| `WEBSITE_HOST_PORT` / `BACKOFFICE_HOST_PORT` | Defaults `3000` / `3001` |
| Public proxy / legacy settings | Fixed `1`, `http://api:8000`, private port `3002` at runtime; same values baked into UI |
| Other API settings | Explicit allowlist as in development table; expiry defaults30, mail blank, CORS defaults localhost3000/3001 |

Only UI ports are published. API is internal service DNS `api:8000`, single-worker
Uvicorn without reload (TinyDB). A new project-scoped `production_api_data` volume
stores all three JSON stores at fixed `/app/data` paths; no host records are imported.
Supplier startup bootstrap remains unchanged. Both services restart unless stopped
and rotate JSON logs at5MiB x3. The base file has no resource caps; sustained
capacity on the1CPU/~1GiB target remains unproven.
No new TLS/domain/firewall platform is included. The initial VPS rollout uses a
remote-owned override enforcing UI512MiB/.75CPU and API256MiB/.25CPU; short observed
coexistence and remaining limitations are recorded in the evidence linked above.

For a disposable **synthetic-only** local check, use a unique owned project name
and free loopback ports; this bypasses root dotenv and inherited application secrets:

```bash
env -i PATH="$PATH" HOME="$HOME" COMPOSE_DISABLE_ENV_FILE=1 \
  COMPOSE_PROJECT_NAME=trackflow-t5b-synthetic \
  TRACKFLOW_UI_IMAGE=trackflow-ui:production TRACKFLOW_API_IMAGE=trackflow-api:production \
  JWT_SECRET_KEY=synthetic-local-check-only DATABASE_URL= \
  TRACKFLOW_BIND_ADDRESS=127.0.0.1 WEBSITE_HOST_PORT=3340 BACKOFFICE_HOST_PORT=3341 \
  docker compose --env-file /dev/null -f docker-compose.production.yml up -d --no-build
```

This creates only that project's network/new data volume. Use the same settings
and explicit env-file for subsequent `ps`, `logs`, `stats` and `down`; remove only
that owned synthetic volume after checking ownership, never unknown project data.
No real DB/mail/provider calls are needed. Blank SQL configuration means inventory503,
not full business acceptance. API startup `create_all` is **not** a production
migration strategy. Favicon404 remains known. T5b production build/runtime/memory, independent checks,
review and commit passed. Limited initial VPS runtime and independent live checks
also passed; private SQL/operator admin setup remains pending. No100% completion claim.

### Incident Analyzer

Create the isolated Python environment and install only the API dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r services/api/requirements.txt
```

Run the CLI from the repository root:

```bash
python3 scripts/analyze.py scripts/incidents-trackflow.csv
```

Run the API and static UI in separate terminals:

```bash
uvicorn services.api.app.main:app --host 0.0.0.0 --port 8000
npm run serve
```

### Supplier Directory

Install the root uv project, load the 15 canonical suppliers, and start the same
API without changing the Incident Analyzer:

```bash
uv sync
uv run seed
uv run uvicorn services.api.main:app --host 0.0.0.0 --port 8000
npm run serve
```

The API persists suppliers at `services/api/data/suppliers.json` by default. Set
`TRACKFLOW_SUPPLIERS_DB_PATH` to isolate another database. See
`services/api/README.md` for endpoints and test commands.

### Hito 2 development commands

Install the development dependencies once:

```bash
npm install
```

Validate, build, and run the TypeScript utilities:

```bash
npm run typecheck
npm run build
npm run demo
```

Serve the existing frontend and the operations page:

```bash
npm run serve
```

---

## Milestones (reference)

| Milestone | Focus        | Typical deliverables                        |
| --------- | ------------ | ------------------------------------------- |
| 0         | Prework      | Environment setup, first prompts            |
| 1         | Web          | Corporate website, forms, SEO               |
| 2         | Programming  | Business logic, scoring, calculations       |
| 3         | AI-driven UI | AI-generated interfaces                     |
| 4         | AI engineering | Memory bank, agent rules, UI foundations  |
| 5         | Backend      | Central API (locations, menus, sales, etc.) |
| 6         | Telemetry    | Data pipeline, dashboards                   |
| 7         | RAG & Memory | Semantic knowledge base, search             |
| 8         | Agents       | Support, onboarding, training agents        |
| 9         | Workflows    | n8n automations                             |
| 10        | Real-time    | Live dashboards, alerts, streaming          |

---

## Links

- [4Geeks Academy — AI Engineering](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)
- [How to start a coding project](https://4geeks.com/lesson/how-to-start-a-project)

---

## Contributors

The original project template was built as part of the 4Geeks Academy AI Engineering Career Program by [@marcogonzalo](https://www.linkedin.com/in/marcogonzalo) and [@alezanchezr](https://x.com/alesanchezr) and many other contributors. Find out more about our [AI Engineering Course](https://4geeksacademy.com/en/career-programs/ai-engineering), and [other courses](https://4geeksacademy.com/en/program-comparison).

You can find other templates and resources like this at the [4Geeks Academy GitHub page](https://github.com/4geeksacademy).

_The original template is maintained by 4Geeks Academy for the AI Engineering track. For exclusive use in the programme._
