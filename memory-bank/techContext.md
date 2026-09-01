# Technical Context

## Current Stack

| Area | Technology |
| --- | --- |
| Root site and Hito 4 UIs | Static HTML, CSS, and browser JavaScript |
| Hito 2 utilities | TypeScript compiled with `tsc`; `tsx` for the console demo |
| Hito 3 UI | Next.js, React, TypeScript, and Tailwind CSS in its own folder |
| Local static server | `http-server` from the root development dependencies |

## Architecture Decisions

- Keep each UI isolated under `uis/<name>/` with its own entry page, styles, scripts, and README.
- Keep the public website and internal backoffice layouts separate.
- Use native Web Components for small reusable public-site elements; no framework is needed.
- Use static sample data in the backoffice. Hito 4 adds no backend, database, authentication, or API proxy.
- Preserve root Hito 1 and Hito 2 files and `uis/talent-pipeline-tracker/` as independent milestone deliverables.

## Commands

Run from the repository root:

```bash
npm run typecheck
npm run build
npm run demo
npm run serve
```

After `npm run serve`, open:

- Public website: `http://localhost:3000/uis/website/`
- Internal backoffice: `http://localhost:3000/uis/backoffice/`

## Constraints

- Do not add dependencies for Hito 4.
- Keep technical artifacts and UI copy in English.
- Treat `CONTEXT.md` as the official general briefing; preserve milestone contexts separately.
- Keep application logic out of `uis/`; future backend services belong under `services/`.
