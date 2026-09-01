# TrackFlow Backend Architecture Proposal

## Decision

TrackFlow's first backend should be one **FastAPI modular monolith** organized as
a shallow layered application. It should live in this monorepo at the future path
`services/backend/` and expose a versioned HTTP/JSON API under `/api/v1`.

This direction gives the small TrackFlow Tech team one application to understand,
operate, and change while preserving clear boundaries between logistics domains.
Domain-focused routers and services can be extracted later if measured traffic,
reliability, or team ownership makes that extra operational cost worthwhile.

> **Milestone scope:** this proposal is documentation only. It does not create
> `services/backend/`, install FastAPI, select infrastructure, or implement a
> backend, database, authentication, deployment pipeline, or API endpoint.

## Purpose and Business Drivers

The backend must gradually provide a shared operational view over systems that are
currently disconnected. The proposal responds to these TrackFlow conditions:

| Driver | Architectural consequence |
| --- | --- |
| Warehouses in Los Angeles and Zaragoza use different systems | Put integration details behind one data-access boundary and expose one consistent API contract. |
| Inventory is not visible across both countries | Keep warehouse and inventory responsibilities separate, but coordinate their rules in one application. |
| Eight carriers are checked and managed separately | Normalize carrier interactions behind adapters instead of exposing carrier-specific behavior to routes. |
| Shipment tracking is fragmented across carrier portals | Give shipments a domain router and service that can present unified tracking information. |
| Returns require repeated human decisions | Isolate return rules so they can evolve without being mixed into shipment or inventory endpoints. |
| Legacy WMS, ERP, scripts, and cloud data stores must coexist | Use repositories and adapters to contain legacy integration details and gradual replacements. |
| The technology team is small | Prefer one deployable application and simple boundaries over distributed-system overhead. |
| Current UIs already live under `uis/` | Keep the backend under `services/` and connect systems only through HTTP/JSON contracts. |

## Chosen Pattern: Layered Modular Monolith

The proposed application has domain-focused route modules over shared service and
data-access layers. It is a modular monolith because these modules run as one
FastAPI application, not as independently deployed services.

This fits TrackFlow because inventory, shipments, carriers, and returns are closely
related operational flows. A shipment may require warehouse stock, carrier
selection, tracking events, and a later return. Keeping those rules in one
application avoids network calls and cross-service coordination while the team is
still learning and formalizing the business rules.

The layers provide practical separation:

| Layer | Responsibility | TrackFlow reason |
| --- | --- | --- |
| API routers | HTTP paths, parameters, status codes, and schema conversion | Keeps endpoint concerns out of logistics rules and avoids one oversized endpoint file. |
| Schemas | Validated request and response contracts | Gives all UIs and legacy consumers predictable JSON shapes. |
| Services | Business rules and coordination across domain operations | Keeps return decisions, stock rules, and shipment transitions explicit and testable. |
| Repositories | Data-access interfaces and persistence operations | Allows later database selection without coupling services to a product now. |
| Integrations | Carrier, WMS, ERP, and other external-system adapters | Contains different external formats and failures at the boundary. |
| Core | Central settings and shared error definitions | Prevents duplicated configuration and inconsistent API failures. |

### Alternatives Considered

| Alternative | Decision for the first backend |
| --- | --- |
| Microservices | Rejected. Separate deployments, network failures, distributed data consistency, and observability would burden a small team before domain ownership or scale justifies them. |
| Serverless functions by endpoint | Rejected. TrackFlow's related workflows and legacy integrations need coherent rules and configuration; fragmented functions would make those flows harder to trace and test. |
| One unstructured FastAPI file | Rejected. It would be quick initially but would mix five operational domains, HTTP handling, and integrations in one change hotspot. |

The proposal deliberately excludes event buses, Kubernetes, CQRS, DDD ceremony,
authentication design, cloud selection, database product selection, and speculative
scaling mechanisms. Those are separate decisions that need real requirements.

## Proposed Future Structure

The following tree is a proposal, not a description of implemented files:

```text
services/backend/
├── README.md
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── warehouses.py
│   │       ├── inventory.py
│   │       ├── shipments.py
│   │       ├── carriers.py
│   │       ├── returns.py
│   │       └── health.py
│   ├── schemas/
│   │   ├── warehouse.py
│   │   ├── inventory.py
│   │   ├── shipment.py
│   │   ├── carrier.py
│   │   └── return_item.py
│   ├── services/
│   │   ├── inventory.py
│   │   ├── shipments.py
│   │   ├── carriers.py
│   │   └── returns.py
│   ├── repositories/
│   │   ├── warehouses.py
│   │   ├── inventory.py
│   │   ├── shipments.py
│   │   └── returns.py
│   ├── integrations/
│   │   ├── carriers/
│   │   └── legacy/
│   └── core/
│       ├── config.py
│       └── errors.py
└── tests/
    ├── warehouses/
    ├── inventory/
    ├── shipments/
    ├── carriers/
    └── returns/
```

The structure is intentionally shallow. `main.py` creates and configures the
application. `api/v1/` owns routers, `schemas/` owns public data contracts,
`services/` owns business behavior, `repositories/` isolates data access,
`integrations/` isolates external systems, and `core/` contains application-wide
configuration and errors. Domain-named test folders mirror the behavior under
review rather than the internal layer layout.

## Domain and Responsibility Boundaries

A module should own a business concept and its rules, not merely group endpoints
that happen to use the same HTTP method.

| Domain | Owns | Does not own |
| --- | --- | --- |
| Warehouses | Warehouse identity, country, location, and operational availability | SKU quantities or shipment lifecycle rules |
| Inventory | Stock by SKU and warehouse, availability, and inventory adjustments | Warehouse metadata or carrier tracking |
| Shipments | Shipment lifecycle, parcel details, assignment, and unified tracking view | Carrier API protocol details |
| Carriers | Carrier catalog, capabilities, assignment criteria, and normalized carrier operations | General shipment state or return approval rules |
| Returns | Return requests, decisions, collection state, and disposition | Original shipment transport implementation |
| Health | Basic service readiness and dependency status | Business data or operational mutations |

Cross-domain work belongs in a service that coordinates explicit collaborators.
Routers must not query persistence or carrier APIs directly. A domain boundary is
a future extraction candidate only when evidence shows independent team ownership,
release cadence, load, or reliability requirements.

## Proposed API Routes

All business routes use `/api/v1`. The table is representative and can be refined
when use cases and schemas are specified; it is not an implemented contract.

| Group | Representative endpoint | Responsibility |
| --- | --- | --- |
| Health | `GET /api/v1/health` | Report whether the application can serve requests without exposing business data. |
| Warehouses | `GET /api/v1/warehouses` | List the Los Angeles and Zaragoza warehouse records. |
| Warehouses | `GET /api/v1/warehouses/{warehouse_id}` | Return one warehouse's identity and operational metadata. |
| Inventory | `GET /api/v1/inventory?sku=&warehouse_id=` | Return stock visibility filtered by SKU or warehouse. |
| Inventory | `POST /api/v1/inventory/adjustments` | Record a validated stock movement or correction. |
| Shipments | `POST /api/v1/shipments` | Create a shipment request from validated order and parcel data. |
| Shipments | `GET /api/v1/shipments/{shipment_id}` | Return shipment details and normalized current status. |
| Shipments | `GET /api/v1/shipments/{shipment_id}/tracking-events` | Return normalized tracking history across carriers. |
| Carriers | `GET /api/v1/carriers` | List configured carriers and relevant service capabilities. |
| Carriers | `POST /api/v1/carrier-recommendations` | Evaluate destination, weight, and urgency against assignment rules. |
| Returns | `POST /api/v1/returns` | Submit a return request for evaluation. |
| Returns | `GET /api/v1/returns/{return_id}` | Return approval, collection, inspection, and disposition status. |
| Returns | `PATCH /api/v1/returns/{return_id}/decision` | Record an authorized approval or rejection decision. |

## Influence of Standard FastAPI Structure

FastAPI's official [Bigger Applications guide][fastapi-bigger-applications]
demonstrates an `app` package with `main.py`, dependencies, and separate router
modules. An `APIRouter` can define a prefix, tags, and dependencies, and the main
application includes each router.

This proposal follows that convention as follows:

- `app/main.py` is the composition point for the FastAPI application, middleware,
  error handlers, and router inclusion.
- Each file in `app/api/v1/` defines a domain-focused `APIRouter`; no single file
  contains all endpoints.
- Router prefixes and tags make `/api/v1` grouping and generated API documentation
  consistent.
- `app/schemas/` contains Pydantic request and response models. They are deliberately
  named schemas to distinguish the public API contract from future persistence
  models, which are deferred until storage is selected.
- `app/core/config.py` centralizes settings rather than reading environment
  variables throughout the application.

FastAPI's official [Request Body guide][fastapi-request-body] explains that
Pydantic models read JSON, convert types, validate input, return detailed validation
errors, and generate JSON Schema for OpenAPI documentation. TrackFlow will apply
these conventions to logistics inputs such as inventory adjustments, shipment
requests, and return requests. The official [Response Model guide][fastapi-response-model]
shows that return annotations or `response_model` document, validate, serialize,
and filter outputs. TrackFlow response schemas will therefore define safe,
documented public contracts and prevent integration or internal fields from being
returned accidentally. These API schemas remain separate from future persistence
models, which are still deferred until storage is selected.

FastAPI's official [Settings guide][fastapi-settings] explains that Pydantic
Settings reads environment variables and can load `.env` values. It also shows
settings supplied through dependency injection, which improves test substitution,
and caching settings so configuration is not reread for every request. TrackFlow
should use those conventions when the backend is implemented.

## Frontend and Backend Coexistence

The monorepo already separates user interfaces under `uis/` from future backend
logic under `services/`. That boundary should remain visible:

| Concern | Decision |
| --- | --- |
| Communication | UIs consume the backend through documented HTTP/JSON requests; they never import Python modules or backend internals. |
| Base URL | Each UI reads an environment-specific API base URL rather than hard-coding a local or production origin. |
| Existing precedent | `uis/talent-pipeline-tracker/services/api.ts` already reads `NEXT_PUBLIC_API_URL`, and its `.env.example` provides a versioned API URL. |
| Public configuration | Next.js requires browser-visible variables to use `NEXT_PUBLIC_`; these values are bundled publicly and must never contain secrets. |
| Local origins | Frontend and backend commonly run on separate ports, so they are separate origins even on the same host. |
| CORS | The backend uses explicit environment-specific allowlists for the actual UI origins, methods, and headers; it does not use a broad wildcard when credentials are involved. |

An origin is the combination of protocol, domain, and port. FastAPI's official
[CORS guide][fastapi-cors] notes that defaults are restrictive, explicit origins
are needed, especially with credentials, and browser preflight requests use
`OPTIONS`. [MDN's CORS guide][mdn-cors] likewise explains that browsers require
server authorization headers for cross-origin requests and may send preflight
requests. Development, staging, and production must therefore define separate,
reviewable allowlists rather than sharing permissive configuration.

The [Next.js environment variable guide][nextjs-environment] also notes that
`.env` files are normally ignored. The repository may keep non-secret example
values in `.env.example`, but actual credentials and secrets belong only in
private environment configuration and must not use the `NEXT_PUBLIC_` prefix.

## Initial Technical Decisions

| Decision | TrackFlow-specific justification |
| --- | --- |
| Version business endpoints under `/api/v1` | Current UIs and future legacy consumers need a stable contract while logistics behavior evolves. |
| Define explicit request and response schemas | Data from two warehouse systems and eight carriers must be normalized and validated at the API boundary. |
| Keep business rules in domain services | Stock adjustments, shipment transitions, carrier selection, and return decisions should not depend on HTTP handlers. |
| Add repository interfaces without choosing a database yet | Legacy sources and future persistence are uncertain; services need a stable boundary before a product is selected. |
| Centralize settings | Environment URLs, CORS origins, and integration options must vary safely between local, staging, and production environments. |
| Return consistent error shapes | UIs need predictable codes and messages for validation, missing resources, conflicts, and unavailable integrations. |
| Use one adapter per carrier protocol | Eight carrier APIs can differ or fail independently; normalized adapters keep those differences out of shipment services. |
| Organize tests by domain | Reviewers can verify each logistics capability and its edge cases without navigating tests split only by technical layer. |

Authentication, authorization roles, a database product, cloud provider, and
deployment design require separate requirements and are not decided here.

## Risks and Points of Attention

| Risk | Consequence | Initial mitigation |
| --- | --- | --- |
| Business rules become mixed across routers | Inventory, shipments, and returns become difficult to change safely. | Keep routers thin, assign each rule to one domain service, and review cross-domain calls explicitly. |
| Two-warehouse updates disagree or arrive late | The global stock view may show unavailable inventory or accept conflicting adjustments. | Define warehouse/source identifiers, timestamps, idempotency rules, and reconciliation behavior before write endpoints are implemented. |
| Carrier coupling or outages leak into shipment logic | One carrier failure may produce inconsistent statuses or block unrelated carriers. | Normalize data through adapters, define timeouts and mapped errors, and test each adapter contract independently. |
| CORS is permissive or public configuration contains secrets | Unapproved browser origins may call the API, or credentials may be exposed in a frontend bundle. | Maintain explicit origin allowlists per environment and review every `NEXT_PUBLIC_` value as public information. |
| Too many abstractions are added before real behavior exists | A bootcamp-sized backend becomes harder to navigate than the problem itself. | Start with the shallow tree above and add modules only for implemented behavior or proven integration differences. |

## Later Implementation Sequence (Out of Scope Now)

1. Confirm the first domain use case and its request, response, and error contracts.
2. Create the minimal FastAPI application, centralized settings, CORS policy, and
   health route under `services/backend/`.
3. Implement one end-to-end domain slice with router, schemas, service, repository
   boundary, and domain tests.
4. Add the remaining domains one at a time, introducing carrier and legacy adapters
   only when a use case needs them.
5. Connect one UI through an environment-specific API URL and verify the HTTP/JSON
   contract before expanding integration coverage.

This sequence is guidance for a later coding milestone. None of these steps is part
of the current documentation deliverable.

## References

1. [FastAPI: Bigger Applications - Multiple Files][fastapi-bigger-applications]
2. [FastAPI: CORS (Cross-Origin Resource Sharing)][fastapi-cors]
3. [FastAPI: Settings and Environment Variables][fastapi-settings]
4. [FastAPI: Request Body][fastapi-request-body]
5. [FastAPI: Response Model - Return Type][fastapi-response-model]
6. [MDN: Cross-Origin Resource Sharing (CORS)][mdn-cors]
7. [Next.js: How to use environment variables][nextjs-environment]

[fastapi-bigger-applications]: https://fastapi.tiangolo.com/tutorial/bigger-applications/
[fastapi-cors]: https://fastapi.tiangolo.com/tutorial/cors/
[fastapi-settings]: https://fastapi.tiangolo.com/advanced/settings/
[fastapi-request-body]: https://fastapi.tiangolo.com/tutorial/body/
[fastapi-response-model]: https://fastapi.tiangolo.com/tutorial/response-model/
[mdn-cors]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
[nextjs-environment]: https://nextjs.org/docs/app/guides/environment-variables
