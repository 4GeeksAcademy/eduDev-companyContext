# Inventory Backoffice

## Goal and rationale
Deliver the four authenticated inventory views required by the 4Geeks assignment inside the existing monorepo. Add only the real API and minimal Next.js foundation needed to make those views work, using the future backend assignment's SQLModel/Supabase design rather than a disposable CSV or TinyDB inventory implementation.

## Authorization and boundaries
- User explicitly authorized the minimum Next.js adaptation, inventory backend, SQLModel/Supabase, and necessary services/dependency changes.
- Keep existing static backoffice functionality, authentication and URLs. Do not migrate the website or tracker, add Docker, or modify protected milestone contexts/root applications.
- Preserve pre-existing untracked `odd/tasks/auth-frontend.md` and `odd/tasks/centralized-incident-manager.md`.
- Branch: `feat/inventory-backoffice` (created from `main`). No publishing or remote database mutation until the target and prerequisites are clear.
- Keep checks focused during each task. Reserve the applicable integrated checks for closure; never claim a live Supabase check from isolated tests.
- RDD is enabled. Each source candidate needs native inspection/review and the repository pre-commit workflow. User explicitly authorized local work-unit commits for this feature after checks were presented, without push or PR. Never count an uncommitted task as fully closed.

## Sources and domain contract
- Current assignment: https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/projects/ai-eng-inventory-management-backoffice/README.md
- Future backend: https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/projects/ai-eng-milestone-backend-development/README.md
- Official domain: https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/contexts/05-backend-development/trackflow-BRIEFING.en.md
- SKU: id, name, sku, client_name, category (fashion/electronics/cosmetics), warehouse (LA/ZGZ), computed current_stock only in responses.
- StockEntry: sku_id, positive integer quantity, reference, warehouse, created_at, user_uuid.
- StockExit: sku_id, positive integer quantity, exit_type (dispatch/loss), tracking_number (required for dispatch, null for loss), warehouse, created_at, user_uuid.
- Stock is entries minus exits per SKU row/warehouse. Movement warehouse must match its SKU row. No SQL user table; ownership comes from authenticated TinyDB `user.id`.
- Insufficient stock returns HTTP 400: `Insufficient stock for SKU '{sku}'. Available: {available}, requested: {quantity}.`

## Tasks
- [ ] T1 (in_progress): Implement the minimal authenticated SQLModel inventory API, isolated tests, explicit demo seed command and setup documentation.
- [ ] T2 (pending): Add a minimal Next.js backoffice host with same-origin access to existing static login/pages and safe return paths; preserve existing authentication.
- [ ] T3 (pending): Implement the four inventory routes and centralized API client with focused behavior checks and domain-specific forms.
- [ ] T4 (pending): Run final scoped API/UI integration, real Supabase verification when configured, and record delivery/setup evidence.

## Acceptance and focused checks
### T1
- Six routes: GET/POST `/inventory/products`, GET `/inventory/products/{id}`, POST `/inventory/orders/inbound`, POST `/inventory/orders/outbound`, GET `/inventory/orders`.
- Separate SQLModel tables and Pydantic schemas; injected per-request session, no stored stock, no N+1 product lookups for history; every inventory route authenticated for internal use.
- Guard outbound stock within one transaction with a PostgreSQL SKU row lock to avoid concurrent overselling. Reject invalid quantities, warehouse mismatch and dispatch/loss tracking violations before writes.
- Missing DATABASE_URL keeps existing API routes usable and returns a safe inventory configuration error; no production test-storage fallback or leaked connection strings.
- Seed only by explicit operator command with authenticated/existing user attribution; use the six briefing SKUs and meaningful entries/exits.
- Test-first with isolated SQLModel SQLite test engine only: observe RED, then GREEN for the new contract. Run `uv run pytest tests/test_inventory_*.py -q`; focused existing auth regression as needed. SQLite checks cannot prove PostgreSQL locking behavior.
### T2
- Next.js uses existing project's Next/React versions where installable. Existing root static server and tracker remain unchanged.
- Next port 3000 and existing static server port 3001 can share browser-facing login/static pages through a loopback rewrite; verify exact startup commands before documenting.
- Exact current assignment routes stay `/backoffice/inventory/products`, `/backoffice/inventory/orders/inbound`, `/backoffice/inventory/orders/outbound`, `/backoffice/inventory/orders` (not a single substitute route).
- Preserve origin-local `trackflow.auth.token`; validate session using existing `/auth/me` behavior. Extend login return allowlist only for exact safe inventory routes.
- Focused auth/return-route tests and one Next host smoke; no full suite during iteration.
### T3
- Central client only; no fetch in components. Bearer token read at request time, safe visible 4xx/5xx errors and loading/empty states.
- SKU table contains domain fields, current stock, commented low-stock threshold and product-prefilled movement links.
- Entry form resets and confirms success, shows API errors. Exit form fetches stock reactively before quantity entry, warns on excessive quantity and shows 400 beside quantity.
- History is read-only with SKU name, quantity, movement type, date, warehouse and user_uuid.
- Focused deterministic client/form helper checks where meaningful; browser checks for real interaction, build deferred until relevant UI is complete.
### T4
- Applicable inventory/backend auth checks, Next build and one bounded browser flow across four routes, including unauthenticated redirects, inbound, outbound warning/error and history.
- Real Supabase target required before live check; no unrelated configured Supabase MCP project.
- Update `memory-bank/progress.md`, area READMEs and the UI verification skill for static versus Next hosting. Record exact passed/failed/skipped commands.
- Inspect intended Git scope/diff, whitespace and repository pre-commit requirements. Native review follows candidate scope, not the accumulated branch.

## Evidence and current state
- Complete assignment and TrackFlow backend briefing read; read-only scouts mapped auth, persistence, static UI and focused test fixtures.
- Initial worktree: `main...origin/main`, only the two unrelated untracked task notes above. New feature branch created without other Git changes.
- Root `.env` exists but a redacted variable-presence check found no DATABASE_URL/SUPABASE_URL. Services env files and backoffice .env.local absent. No credentials displayed or copied.
- User asked to configure the intended project's DATABASE_URL in ignored root `.env`; configuration remains pending. Implementation and isolated tests may proceed, real database verification may not.
- T1 writer implemented the inventory tables/schemas/database/router/seed, wired main startup, added only SQLModel and psycopg2-binary dependency resolution, and documented setup. No remote database calls or commits.
- RED: focused pytest collection failed first for missing dependencies, then missing inventory modules. No behavior-assertion RED claimed.
- GREEN: `uv run pytest tests/test_inventory_api.py tests/test_inventory_seed.py -q` passed 13 tests (including bounded queries, sanitized failure and PostgreSQL lock-clause compilation). `uv run pytest tests/test_inventory_api.py tests/test_inventory_seed.py services/api/tests/test_auth_operational.py -q` passed 18 tests and 76 subtests. `uv lock`, `uv sync`, and `git diff --check` passed. Existing deprecation warnings remain.
- Parent spot-check read the inventory router and confirmed computed stock/warehouse scoping and the outbound transaction/row-lock shape; `git diff --check` passed. ASSESS returned unassessable (untracked declaration required), requiring an independent verifier; task `mvsjn0ou-6-t14z` is running the same focused combined command once and inspecting the bounded diff.
- Independent verifier ran `uv run pytest tests/test_inventory_api.py tests/test_inventory_seed.py services/api/tests/test_auth_operational.py -q` once: 18 passed, 76 subtests passed in 8.69s; `git diff --check` passed. No concrete API violation found. Its initial unchanged-worktree warning was caused by the parent's concurrent authorized progress documentation update, not source changes; read-only reconciliation returned PASS and cleared the warning without repeating tests.
- Native review `review-62c05b8c8695291b` approved and exact acknowledgement burned successfully. Two informational advisories only: quantity storage boundary and stock read snapshot; no correction offered. One earlier consent expired with no lineage/mutation, then fresh consent succeeded.
- Real DATABASE_URL configuration, schema/seed execution and PostgreSQL concurrency checks remain pending; isolated SQLite cannot prove locking. User has now confirmed local work-unit commits, without push or PR. T1 remains in progress until its commit succeeds.

## Next step
Commit the verified T1 changes locally, record its identity, and start T2. Keep T2–T4 pending until that boundary; do not repeat the passing focused tests solely for bookkeeping.
