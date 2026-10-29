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
- [x] T1 (done): Implement the minimal authenticated SQLModel inventory API, isolated tests, explicit demo seed command and setup documentation. Commit: `02b7d776823c518eacd16496076734c3599a8615`.
- [x] T2 (done): Add a minimal Next.js backoffice host with same-origin access to existing static login/pages and safe return paths; preserve existing authentication. Commit: `6dc75f6467b71052c91613717da22d213fcd85f4`.
- [x] T3 (done): Implement the four inventory routes and centralized API client with focused behavior checks and domain-specific forms. Commit: `ea2a091ddc2b4ec775a96612b2e95e5976672b79`.
- [x] T4a (done): Diagnose and fix the observed 390px inventory overflow, with a focused browser regression check. Commit: `9ce703a0a9c2987d395b9b3bb209550959fdb409`.
- [ ] T4 (in_progress): Local API/UI integration and evidence complete; real Supabase verification remains blocked by missing DATABASE_URL.

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
- Real DATABASE_URL configuration, schema/seed execution and PostgreSQL concurrency checks remain pending; isolated SQLite cannot prove locking. User has now confirmed local work-unit commits, without push or PR. T1 committed successfully as `02b7d776823c518eacd16496076734c3599a8615` (`feat(inventory): add authenticated warehouse stock API`), with tests and setup docs. No push or PR.

### T2 implementation and open blockers
- Writer implemented minimal Next host, exact legacy static rewrites, inventory route session gate, safe return-path additions, local dependencies, focused tests and README. Products page is explicitly a temporary T2 landing, not the finished T3 view.
- RED: focused Node command failed 2/12 (inventory return resolved to index.html and host config absent). GREEN and final focused run: `node --test uis/backoffice/tests/auth.test.mjs uis/backoffice/tests/session-guard.test.mjs uis/backoffice/tests/next-host.test.mjs` passed 12/12. `cd uis/backoffice && npx tsc --noEmit` passed; `git diff --check` passed.
- `npm --prefix uis/backoffice install` completed but reported one critical-rated dependency. Read-only verifier `mvss4psy-9-4jc4` ran `npm --prefix uis/backoffice audit --json`: exit 1, Next 16.3.1 matches 13 advisory ranges. Audit offers Next 16.4.3 as a non-major fix; no dependency changes have been made. This is the minimum verified offered target, not a compatibility guarantee. No passing tests were repeated. Actual exploitability is conditional; lack of explicit image/cache/action usage does not prove framework endpoints unreachable.
- Owned loopback static server on 3001 and Next dev --webpack on 3300 returned HTTP200 for inventory validation shell, legacy login/index, auth.js and styles.css; writer stopped both. This is not browser-session or full-build verification.
- Next dev unexpectedly generated untracked `uis/backoffice/AGENTS.md` and `uis/backoffice/CLAUDE.md`. Parent confirmed neither tracked, read both, and found Next-generated instructions plus @AGENTS.md reference. Worker stopped for disposition. User selected option 2, explicitly authorizing removal of these two generated files and disabling regeneration; parent cleanup succeeded after confirming both files were still untracked and matched the inspected generated content. Bounded writer `mvsskjl7-a-isou` is applying Next16.4.3 and agentRules:false with focused regression/audit checks. Verifier confirmed the installed Next generator can recreate deleted files and the installed official guide documents top-level `agentRules: false` to prevent generation. This setting does not delete existing files. User selected removal plus disabling generation to preserve the existing project instructions.
- T2 ASSESS returned unassessable because intended untracked files were not declared; independent verification is required. T2 remains in progress, not reviewed or committed. Backend and unrelated task notes untouched.

### T2 correction evidence
- Authorized generated files removed by parent after unchanged/untracked checks; writer set `agentRules: false` and pinned only the new backoffice's Next to `16.4.3`. Tracker/backend untouched.
- Regression RED: the focused Node command passed 12 and failed 1 because agentRules was undefined. Identical command GREEN: 13/13 passed.
- `npm --prefix uis/backoffice install --save-exact next@16.4.3` changed 3 packages; `npm --prefix uis/backoffice audit --json` exited 0 with zero vulnerabilities. React/TypeScript declarations unchanged.
- `cd uis/backoffice && npx tsc --noEmit` and `git diff --check` passed. Owned Next dev startup on 3300 returned HTTP200 for the protected validation shell; AGENTS.md/CLAUDE.md absent before/during/after startup, owned process stopped. No full build or browser-auth verification claimed.
- Parent spot-check read the session gate and confirmed generated files remain absent; whitespace check passed. ASSESS remains unassessable due intended-untracked declaration, so a separate scoped verifier is required before closing T2.

### T2 acceptance evidence
- Independent verifier `mvssnlki-b-o8df`: PASS. Focused Node command executed once: 13 passed, no failures/skips; `git diff --check` passed. Initial/final Git scope matched, no source drift. Reviewed exact proxy allowlist, safe login returns, gate lifecycle/SSR short-circuit, pinned versions and absent generated instructions. No blocking regressions.
- Native review `review-df407c9d8728aa02`: four lenses approved; exact acknowledgement burned successfully. One informational advisory about React gate behavioral coverage, no correction. Browser gate verification remains part of T4; helper tests do not prove React browser behavior.
- T2 committed as `6dc75f6467b71052c91613717da22d213fcd85f4` (`feat(backoffice): add Next.js host with shared session protection`). Most changed lines are the generated package lock. Full build and browser/API integration remain intentionally deferred to T3/T4. No push/PR.

### T3 implementation evidence and generated-file disposition
- Writer implemented four inventory routes, central authenticated API client, typed payload/form helpers, responsive scoped CSS and setup documentation. Shared protectedFetch gained an optional explicit API base; existing callers remain unchanged.
- RED: 10 existing tests passed, two new test modules failed because implementation modules were absent. GREEN: `node --test uis/backoffice/tests/inventory-client.test.mjs uis/backoffice/tests/inventory-form.test.mjs uis/backoffice/tests/auth.test.mjs` passed 16/16, including errors/cancellation/stale401 and quantity/tracking/stock-warning helpers. No assertion RED claimed for the absent modules.
- `cd uis/backoffice && npx tsc --noEmit`, `npm --prefix uis/backoffice run build`, and `git diff --check` passed. All four routes generated. Module-type and workspace-root warnings remain non-failing; no browser or real database verification claimed.
- Required Next production build changed only two imports in `uis/backoffice/next-env.d.ts` from `.next/dev/types/` to `.next/types/`. This file was omitted from the writer's T3 allowed surfaces, so the worker stopped. Parent confirmed the exact generated diff; no revert performed. User approved retaining the two generated production-type imports. Disposition cleared; no revert or repeat build is needed.
- Parent spot-check inspected outbound form cancellation, selection/reset and inline400 handling; whitespace passed. ASSESS returned unassessable (untracked declaration), requiring an independent verifier before closing T3.

### T3 acceptance evidence
- Independent verifier `mvst1tux-e-xkdg`: PASS. Exact focused Node command ran once: 16/16 passed (104.46ms), no skips; whitespace passed and initial/final Git scope identical. Read-back found no concrete blocking rubric violation. Helper checks are not React/browser proof.
- Native four-lens review `review-34271c6025855046` approved and exact acknowledgement burned. Informational advisories only: form interaction coverage, prefill, response shape and ambiguous write retry; no correction offered. Final browser checks remain applicable independently of review.
- T3 committed as `ea2a091ddc2b4ec775a96612b2e95e5976672b79` (`feat(inventory): add authenticated stock management views`), with tests/docs and approved generated imports. No full build or backend suite repetition needed for bookkeeping.

### T4 verification progress
- Documentation worker updated technical context, the existing verify-trackflow-ui skill and backoffice README to distinguish static vs Next hosting, production-build reuse, isolated vs live database evidence, and owned-process cleanup. Structural readback/links/package-script comparison and `git diff --check` passed. No meaningful RED for passive docs, no tests/builds run for them.
- Parent read the complete updated skill and reran whitespace check. ASSESS remained unassessable because unrelated untracked task notes lack declaration; the final independent verifier also inspects these docs structurally.
- Cached Node Playwright packages and Chromium executables were located without installation. Independent verifier `mvstflyl-g-xzjs` is running one bounded real-browser + real local FastAPI/auth integration using explicit temporary SQLite session override and isolated TinyDB files. No source writes, no .env reads, no real data mutations or Supabase calls; production Next build is reused without rebuild.
- Redacted recheck confirms DATABASE_URL still absent/empty. Real Supabase connectivity/schema/seed and PostgreSQL concurrency remain pending and cannot be inferred from local SQLite results.

### T4 browser evidence and mobile blocker
- Verifier `mvstflyl-g-xzjs` reused the production build and actual FastAPI/auth via a temporary SQLite session override and isolated TinyDB files. All4 unauthenticated redirects/safe login return, six SKUs/warehouse stock/labels, inbound reset+one write under double-submit, reactive outbound stock, stale selection cancellation, exact insufficient-stock400 without write, valid dispatch/loss, reset/fresh stock, and read-only history fields passed.
- All4 routes passed desktop1440 overflow/control checks. At390px products document.scrollWidth was718: FAIL. Root cause unconfirmed; remaining mobile/session/error/console completion checks were skipped at the stop. Keyboard SKU→quantity passed. Intentional400 was the only recorded console error; final page-error assertion not reached.
- Harness `/tmp/inventory-t4-n4934sjv/run.py` ran twice: first a harness assertion incorrectly expected next without apiPort; corrected once, second reached the app's mobile failure. No source edits. Only delay injections (350ms inbound,600ms product detail), no fabricated core API outcomes.
- Evidence: `/tmp/inventory-t4-n4934sjv/retry.log`, desktop screenshots and owned server logs. All owned servers stopped; ports3001/3300/18000 closed; temporary stores removed. Whitespace passed and Git scope unchanged. Docs/skill links structurally verified.

### T4a focused correction evidence
- Writer measured the actual cause: absolute screen-reader action labels had a containing block outside the static table scroller. Added only `position: relative` and one explanatory CSS comment; no data/control hiding or page overflow suppression.
- `LAYOUT_PROBE=1 .venv/bin/python -B /tmp/inventory-t4a-layout/run.py` reproduced RED (718px document at390 viewport), then a temporary CSS probe reduced width390 (not final acceptance).
- `npm --prefix uis/backoffice run build` passed; actual rebuilt UI without injected CSS passed eight layouts (four routes at390/1440). Products document390/wrapper316/table717; history document390/table837; desktop documents1440. Internal horizontal scroll, named action focus, history reachability and form controls passed; no console/page errors.
- An initial GREEN harness attempt reused fixture identifiers and received409; harness corrected to fresh isolated storage, then passed. No application change for that harness error. All owned servers stopped, ports3001/3300/18000 closed; temp harness/stores retained. Parent confirmed the one-property CSS diff and whitespace pass.
- Native review `review-0b0f96754d4f8a40` approved the CSS correction and updated verification docs; exact acknowledgement burned successfully, no findings. Independent verifier `mvstt5td-i-vfdj` is spot-checking mobile containment plus the previously skipped session/error/departure checks, using the existing rebuilt app and a fresh disposable harness. No core inventory CRUD repeat or rebuild requested; T4a commit awaits that evidence.

### T4 independent local follow-up
- Verifier `mvstt5td-i-vfdj`: PASS, one isolated invocation `.venv/bin/python /tmp/inventory-t4a-l8xgkm3r/run.py` reusing the current production build. Independent products/history390px containment and internal scrolling passed; keyboard action focus stayed visible (3px solid).
- Real login/logout, safe return/apiPort, cross-tab removal, fresh login, hidden delayed validation and real invalid-token401 clear/redirect passed. Explicit auth500 injection retained valid token and Retry reached real API. Products/receipt/outbound loading/empty/nonJSON500/retry, detail500 disable/retry, delayed-departure cancellation, receipt400/500 input retention and history loading/empty/error/retry passed. Core write successes/real overstock400 were reused from the prior run, not repeated.
- Zero unexpected console/page errors; nine deliberately injected/resource400/401/500 messages separated. Exactly one setup movement remained; intercepted error submissions did not persist. Expired-token-specific and optional outbound500 were not exercised; real invalid-token401 was.
- Whitespace passed, pre/post source scope unchanged. Owned servers stopped and ports3001/3300/18000 closed; test stores removed. Logs/screenshots retained under `/tmp/inventory-t4a-l8xgkm3r/`. Local acceptance uses combined prior core-flow evidence, writer8layout matrix and this independent follow-up; no Supabase claim.
- T4a correction and verification docs committed as `9ce703a0a9c2987d395b9b3bb209550959fdb409` (`fix(inventory): contain mobile tables and document verified flows`). The original mobile FAIL is resolved; no current source blocker found. Non-failing Node/dependency deprecation and Next workspace-root warnings remain documented.

## Next step
Wait for the intended TrackFlow DATABASE_URL in ignored root .env. All implementation units and local verification evidence are committed; no push or PR. T4 stays incomplete until authorized live connectivity/schema/seed and appropriate PostgreSQL checks are observed. Do not repeat passing local suites or publish without user authorization.
