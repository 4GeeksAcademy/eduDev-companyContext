# Technical Context

## Current Stack

| Area | Technology |
| --- | --- |
| Root site and Hito 4 UIs | Static HTML, CSS, and browser JavaScript |
| Hito 2 utilities | TypeScript compiled with `tsc`; `tsx` for the console demo |
| Hito 3 UI | Next.js, React, TypeScript, and Tailwind CSS in its own folder |
| Local static server | `http-server` from the root development dependencies |
| Incident analysis core and CLI | Python 3 standard library (`csv`, no pandas) |
| Incident API | FastAPI, Uvicorn, and multipart uploads under `services/api/` |

## Architecture Decisions

- Keep each UI isolated under `uis/<name>/` with its own entry page, styles, scripts, and README.
- Keep the public website and internal backoffice layouts separate.
- Use native Web Components for small reusable public-site elements; no framework is needed.
- Keep the Hito 4 operations overview on static sample data; the separate incident page calls the incident API directly.
- Reuse `shared/incident_analysis.py` from both CLI and API; never duplicate validation or calculations.
- Keep uploaded incident source files transient and retain only the last successful aggregate summary in process memory.
- Preserve root Hito 1 and Hito 2 files and `uis/talent-pipeline-tracker/` as independent milestone deliverables.

## Commands

Run from the repository root:

```bash
npm run typecheck
npm run build
npm run demo
npm run serve
```

Incident Analyzer setup and checks:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r services/api/requirements.txt
python3 scripts/analyze.py scripts/incidents-trackflow.csv
python3 -m unittest shared.test_incident_analysis -v
python3 -m unittest discover -s services/api/tests -v
uvicorn services.api.app.main:app --host 0.0.0.0 --port 8000
```

After `npm run serve`, open:

- Public website: `http://localhost:3000/uis/website/`
- Internal backoffice: `http://localhost:3000/uis/backoffice/`
- Incident analysis: `http://localhost:3000/uis/backoffice/incident-analysis.html`

## Constraints

- Do not add frontend dependencies for the static backoffice.
- Install Python dependencies only inside `.venv`; the shared core and CLI remain standard-library only.
- Keep technical artifacts and UI copy in English.
- Never print, log, export, or return source incident rows or customer email addresses.
- Treat `CONTEXT.md` as the official general briefing; preserve milestone contexts separately.
- Keep application logic out of `uis/`; future backend services belong under `services/`.
