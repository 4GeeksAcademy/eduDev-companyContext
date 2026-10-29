# `uis` folder

This folder contains **all the user interfaces** related to the company for the cross-functional AI Engineering project (for example: web applications, internal dashboards, customer portals, Streamlit/Gradio apps, etc.).

Each subfolder inside `uis/` must correspond to **one specific user interface** (for example: `website`, `backoffice`) and include its own technical and functional documentation.

- **Main purpose**: to centralize in a single place all the frontend applications that support the company's use cases.
- **Recommendation**: document in this file (or in sub-READMEs) the applications you add, their objective, the technology used, and how to run them.

> _Spanish version: [README.es.md](./README.es.md)._

## UI development container

Build from the repository root with **`./uis` as the context**, not the repository:

```bash
docker build -t trackflow-ui ./uis
docker run --rm --init -p 3000:3000 -p 3001:3001 trackflow-ui
```

The isolated image passed local Docker startup and shutdown checks, including
website/login/assets and the inventory validation shell (not authenticated API
acceptance). Stop the owned container with Ctrl+C. The image installs each app independently
with `npm ci`; no tracker, backend or root dependencies are copied.

| Host | URL |
| --- | --- |
| Website (Next dev) | `http://localhost:3000/uis/website/` |
| Backoffice (Next dev) | `http://localhost:3001/backoffice/inventory/products` |
| Legacy login via backoffice | `http://localhost:3001/uis/backoffice/login.html` |

`start.sh` starts both Next dev hosts on `0.0.0.0` and an allowlisted legacy
asset server on private `127.0.0.1:3002`. `BACKOFFICE_LEGACY_PORT` configures both
the upstream and rewrites; never set it to either Next port. Any unexpected child
exit fails the launcher and stops its siblings; termination is forwarded and
owned children are reaped. The image is for development, not production serving.

Root Compose binds only `./uis/website` to `/app/uis/website`,
`./uis/backoffice` to `/app/uis/backoffice` and read-only `./uis/start.sh` to
`/app/uis/start.sh`. Neither the whole UI tree nor the tracker is mounted.
Separate named volumes remain at
`/app/uis/website/node_modules`, `/app/uis/backoffice/node_modules`,
`/app/uis/website/.next` and `/app/uis/backoffice/.next` so mounts do not hide
installed dependencies or mix host caches. See the [root Compose setup](../README.md#development-compose-stack-t3-packaging)
for environment and isolated API data configuration. UI receives only
`BACKOFFICE_LEGACY_PORT`, never backend credentials. T3 packaging adds no API proxy:
browser routing remains T3b and full-stack/hot-reload verification remains T4.
Browser API URLs must remain browser-reachable and match backend CORS;
Docker service names are not browser DNS. Independent synthetic T3 runtime checks
passed website/login200 and a server-side UI fetch to `http://api:8000/openapi.json`.
Next dev may regenerate two imports in `backoffice/next-env.d.ts`; this expected
generated output is not a browser-routing fix.

Focused checks (no Docker or API required):

```bash
node --test uis/backoffice/tests/next-host.test.mjs uis/backoffice/tests/legacy-server.test.mjs uis/tests/start.test.mjs
sh -n uis/start.sh
node --check uis/backoffice/legacy-server.mjs
```

## Available Interfaces

| Folder | Purpose | Local URL after `npm run serve` from the repository root |
| --- | --- | --- |
| `website/` | Hito 4 public corporate website | `http://localhost:3000/uis/website/` |
| `backoffice/` | Operations snapshot, Incident Analyzer, and Supplier Directory | `http://localhost:3000/uis/backoffice/` |
| `talent-pipeline-tracker/` | Hito 3 talent pipeline frontend | See its local README |
