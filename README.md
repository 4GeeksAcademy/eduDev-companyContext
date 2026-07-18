# AI Engineering Company Project — Student Template

[![4Geeks Academy](https://img.shields.io/badge/4Geeks-Academy-blue)](https://4geeksacademy.com)
[![AI Engineering](https://img.shields.io/badge/track-AI%20Engineering-green)](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)

_Base template for transversal projects in the AI Engineering Career Program — 4Geeks Academy._

> _Instrucciones disponibles en español en [README.es.md](./README.es.md)._

---

## Purpose

This repository is the **starter template** for transversal projects. You will work on real company scenarios (Brasaland, TrackFlow, Nexova), building deliverables that map to course milestones (Web, Programming, Backend, Telemetry, RAG, Agents, Workflows, Real-time).

- Create a template from this repository.
- Replace the placeholder `CONTEXT.md` with your assigned company context.
- Use `skills/` and the directory-level `README.md` files as working guidance.

---

## Current project status

This repository contains the completed TrackFlow public website from Hito 1 and the TypeScript business utilities developed for Hito 2.

- `CONTEXT.md` contains the active TrackFlow Hito 2 context.
- `CONTEXT-hito-1.md` preserves the previous website context.
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
ai-engineering-company-project-monorepo/
├── README.md
├── README.es.md
├── CONTEXT.md                # Placeholder to be replaced with assigned context
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

## How to start

1. **Use this repository as a template** and create your own project repo.
2. **Clone** your repository (or open it in Codespaces).
3. **Replace** `CONTEXT.md` with the full context for your assigned company.
4. **Review** each top-level folder `README.md` to understand intended responsibilities (`uis/`, `services/`, `data/`, `skills/`, etc.).
5. **Start implementing** milestone deliverables in `uis/` and `services/`, reusing `packages/shared/` and `data/` as needed.

---

## Running locally

The TrackFlow public site (Hito 1) is a static HTML/CSS/JS application served from the repository root. No build step is required.

```bash
npx http-server . -p 3000 -a 0.0.0.0
```

Then open:

- Landing page: `http://localhost:3000/index.html`
- B2B lead form: `http://localhost:3000/application.html`

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
| 4         | Next.js      | Portals, loyalty app, operations UI         |
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

This template was built as part of the 4Geeks Academy AI Engineering Career Program by [@marcogonzalo](https://www.linkedin.com/in/marcogonzalo) and [@alezanchezr](https://x.com/alesanchezr) and many other contributors. Find out more about our [AI Engineering Course](https://4geeksacademy.com/en/career-programs/ai-engineering), and [other courses](https://4geeksacademy.com/en/program-comparison).

You can find other templates and resources like this at the [4Geeks Academy GitHub page](https://github.com/4geeksacademy).

_This template is maintained by 4Geeks Academy for the AI Engineering track. For exclusive use in the programme._
