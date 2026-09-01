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

This repository contains TrackFlow deliverables for Hitos 1 through 4: the original public website, TypeScript business utilities, talent pipeline frontend, and the AI-driven engineering setup.

- `CONTEXT.md` contains the official general TrackFlow company briefing.
- `CONTEXT-hito-1.md`, `CONTEXT-hito-2.md`, and `CONTEXT-hito-3.md` preserve milestone-specific contexts.
- `uis/talent-pipeline-tracker/` contains the Hito 3 app and its own setup README.
- `uis/website/` and `uis/backoffice/` contain the static Hito 4 interfaces.
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
