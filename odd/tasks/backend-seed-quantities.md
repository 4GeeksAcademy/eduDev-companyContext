# Backend Seed Quantities

## Goal
Meet the TrackFlow backend briefing's requirement for two receipts of the same SKU with different quantities, reusing the completed inventory backend.

## Authorization and boundaries
- User authorized the seed correction, its regression test and corresponding documentation.
- Allowed source/documentation surfaces: `services/api/inventory_seed.py`, `tests/test_inventory_seed.py`, `services/api/README.md`, `memory-bank/progress.md`.
- This task file is maintained by the parent orchestrator.
- Preserve existing seed keys, idempotency, stock safety and all unrelated work.
- User subsequently authorized a narrowly scoped read-only Supabase check, commit and push. No remote data mutation, environment changes, dependencies, full-suite checks, PR creation, merge or student-platform submission is authorized.
- Original branch: `feat/inventory-backoffice`; starting HEAD: `5777ef0`.
- Delivery branch: `fix/backend-seed-quantities`, based on `origin/main` at `7cde405` (merged PR #25); base tree is identical to the original HEAD.
- Preserve unrelated untracked task notes `odd/tasks/auth-frontend.md` and `odd/tasks/centralized-incident-manager.md`.

## Tasks
- [x] T1 (implemented and tested; commit authorized): Added the distinct-quantity regression test, observed RED, minimally corrected the repeated seed entry, observed GREEN and updated scoped documentation.
- [x] T2 (verified): Inspected the bounded diff, completed native review and independent focused verification.
- [x] T3 (verified): Queried the configured development database read-only; repeated-SKU receipts have distinct positive quantities.
- [ ] T4 (in progress): Complete scoped pre-commit checks, commit the correction and publish its branch without merge.

## Acceptance and checks
- Fresh isolated seed contains at least two receipts of the same SKU with different positive quantities.
- Six required SKUs, seven entries, three exits and existing seed identities remain unchanged.
- Re-running the seed does not change existing records; existing Supabase demo data is not retroactively modified.
- RED: `uv run pytest tests/test_inventory_seed.py -q` after the new assertion, before the implementation change.
- GREEN: same focused seed test after the fix.
- Scoped regression: `uv run pytest tests/test_inventory_seed.py tests/test_inventory_api.py -q`.
- Structural checks: `git diff --check`, intended-file status and bounded diff readback.
- Tests must use existing isolated SQLite and temporary identity fixtures, never the configured Supabase connection.
- RDD is enabled; inspect and follow provider-issued review authority after implementation. No review outcome grants commit authority.

## Evidence
- Complete upstream backend README and TrackFlow briefing read in the preceding analysis.
- Read-only local mapping confirmed the existing backend covers the remaining functional requirements.
- Before correction, the seed created seven entries all with quantity 20; its test checked repeat presence but not distinct quantities.
- Existing API test stock totals are independent of the seed.
- Startup and seed are development-only operational workflows; this correction adds no production infrastructure.

### T1 evidence
- Writer changed only the four allowed files: 27 insertions and 6 deletions.
- RED: `uv run pytest tests/test_inventory_seed.py -q` failed because repeated quantities were only `{20}`.
- GREEN: the same command passed 1 test after the repeated receipt changed to 10 units.
- Scoped regression: `uv run pytest tests/test_inventory_seed.py tests/test_inventory_api.py -q` passed 13 tests.
- SQLite/temp TinyDB fixtures used; uv synchronization, env-file loading and network resolution disabled through environment flags.
- Existing AnyIO CallSpec2 and Starlette/httpx deprecation warnings remain non-failing.
- Writer and parent `git diff --check` passed; parent read the complete four-file diff.
- ASSESS could not classify because untracked files need declaration; its conservative plan requires an independent verifier. No runtime test failure occurred.

### T2 evidence
- Independent verifier ran `UV_NO_SYNC=1 UV_OFFLINE=1 UV_NO_ENV_FILE=1 uv run pytest tests/test_inventory_seed.py tests/test_inventory_api.py -q` once: 13 passed, 2 existing warnings in 5.90s.
- Independent `git diff --check` passed; before/after Git status was identical. No concrete blockers found.
- Native review `review-0dd7ca8e9c50fc5b` approved; exact acknowledgement completed and burned authority. This task completion note was updated afterward; no executable code changed after review.
- Full-suite, live database, seed CLI and PostgreSQL concurrency checks intentionally not run for this seed-only correction. No remote data or environment changes.

### T3 and pre-commit evidence
- Initial diagnostic failed before connection because optional `dotenv` was absent. Correct cwd/interpreter and installed psycopg2/SQLModel were confirmed; no dependency or configuration changes were made.
- Resumed with `(unset UV_NO_ENV_FILE; UV_NO_SYNC=1 UV_OFFLINE=1 uv run --env-file .env python -B -)` and stdin-only diagnostic code using the existing uv env loader.
- Read-only transaction confirmed `on`; SSL required, connection and statement timeouts 10 seconds. One aggregate query found one SKU/warehouse group with at least two receipts of distinct positive quantities; totals: 6 SKUs, 8 entries, 4 exits. Rollback and close completed; no data changed.
- Independent pre-commit re-read of context, scoped README/rules and exact intended diff passed; no credentials found. Source diff unchanged since the 13-test PASS and approved native review. No tests repeated.

## Delivery
User explicitly authorized commit and push after the bounded read-only database check. PR #25 is already MERGED (fresh GitHub check), so this correction needs a separate branch rather than being treated as an update to that open PR. No PR creation or merge is authorized. Keep code, regression test and scoped docs together; exclude unrelated untracked task notes.

## Next step
Commit and push the scoped correction on `fix/backend-seed-quantities`. Database compliance is confirmed and no mutation is needed. PR creation, merge and student-platform submission remain outside authorization.
