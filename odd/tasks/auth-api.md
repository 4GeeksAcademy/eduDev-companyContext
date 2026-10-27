# AUTH-01 — API authentication

## Objective and authority
Implement the complete 4Geeks authentication assignment in the existing TrackFlow monorepo, simply and with the specified stack. The user explicitly authorized backend, tests, dependencies and documentation changes, all eight operational routes protected, and no frontend changes. They require ODD planning before implementation and a final item-by-item README audit.

Assignment: https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/projects/ai-eng-user-authentication-api/README.md
Branch: feature/auth-api (created from clean main).
The user explicitly authorized local work-unit commits on feature/auth-api. Push, PR and merge remain unauthorized. AUTH-01 commit: b4d353c3855b18d83d19e74f7d7944df6d6330da.

## Scope and design
- FastAPI/Pydantic, TinyDB, uv, python-jose[cryptography], libpass[bcrypt]. No new framework.
- User: id, email, hashed_password, is_active, role, created_at. Role enum: admin/manager/user.
- Profile: id, user_id, name, phone, address. Every user has exactly one profile, even without optional profile data.
- Separate identity TinyDB file, configurable with TRACKFLOW_USERS_DB_PATH, ignored by Git. No change to supplier persistence.
- Store an explicit UUID string user id in TinyDB and JWT sub; this avoids recycled document IDs identifying a replacement account. UUID uses Python stdlib. Other future modules reference this identity as user_uuid, not SQL user tables.
- Public registration defaults to user and cannot set privileged roles or activity state. No public admin bootstrap.
- Conservative authorization: list users admin-only; individual user read/update/delete self or admin; role changes admin-only; profile changes owner-only.
- Password hashing and verification with libpass bcrypt; never expose hash/password in responses, logs, or storage as plaintext. Reject overlong bcrypt inputs rather than silently truncating.
- OAuth2PasswordBearer and signed, expiring JWT. Require valid sub and exp; resolve active user from DB on every request.
- Login must accept email/password and remain compatible with Swagger OAuth password flow (username carries email). Keep one documented form-based contract, allowing email field if necessary.
- JWT secret from environment, loaded from ignored .env through uv run --env-file .env; expiry configurable. No hardcoded development fallback.
- Preserve shared latest incident aggregate semantics for authenticated callers; no per-user incident isolation, raw data persistence or customer-email exposure.
- Preserve successful existing API behavior; frontend will temporarily fail without tokens as explicitly permitted by assignment.
- CORS: add PUT and Authorization, preserve origins and no-cookie policy.
- No Supabase/SQLModel user/profile tables, cookies, sessions, refresh tokens, broad RBAC or frontend work.

## Tasks
- [x] AUTH-00 Plan and map every acceptance requirement. Evidence: full source README read; two read-only exploration handoffs; clean main checked; branch created.
- [x] AUTH-ENV Diagnose and restore uv availability before implementation. User authorized installation; uv 0.13.6 installed locally and version/path verified. No repository commit applicable to user-local tool installation.
- [x] AUTH-01 Registration and TinyDB identity/profile persistence, hashing, schemas, tests and matching setup docs. Verified and committed: b4d353c3855b18d83d19e74f7d7944df6d6330da.
- [x] AUTH-02 JWT login/current user and reusable authentication dependency, token tests and usage docs. Verified and committed: d1703aea1ce26be8b721dc45daac31e485eeeee7.
- [x] AUTH-02B Protected user CRUD and owner profile endpoints, ownership/role tests and docs. Verified and committed: 5b0188de1fc21404c6bb92df7d30a6412a803da5.

AUTH-02 split into two cohesive units before writing to keep the security-critical changes reviewable; scope is unchanged.
- [x] AUTH-03 Protect eight existing routes, authenticated regression tests, CORS and integration docs. Verified and committed: e522ea439b5df7eec35437b247ee35f94f7b6a39.
- [x] AUTH-04 Independent final assignment audit and documented verification evidence. Commit: 9d5e80244b078b2967354adcc18a98cb084d3ff2; structural readback and staged diff check passed. No behavior changes, so no meaningful test-first RED or additional test rerun required for this passive documentation unit.
- [ ] AUTH-05 Configure local ignored .env and perform manual /docs authentication flow with developer. Status: in_progress; awaiting developer participation because no callable browser tools are available.
- [ ] AUTH-06 Publish PR against main and submit instructor link. Status: pending explicit publication authorization.

Final audit was separated from manual verification and publication so passing automated checks does not falsely close mandatory remaining steps.

Each implementation task uses one bounded writer, tests first when deterministic, and records exact RED/GREEN/refactor commands/results. No task is complete while required checks fail. Local work-unit commits are authorized; publishing is not. Avoid oversized units; do not compress tests or readability to reduce diff size.

## Final acceptance matrix
Independent verifier mvr3dc9z-c-q5ck reread the complete current official README. PASS means implementation inspection plus applicable automated checks, not manual/browser or publication evidence. Paths below are repository-relative. No concrete implementation noncompliance found; full delivery remains PARTIAL.

| ID | Requirement | Result and observed evidence |
| --- | --- | --- |
| A01 | Existing monorepo, feature/auth-api, uv-only workflow | PASS: branch observed; pyproject.toml:6-14; recorded uv add command |
| A02 | User fields/roles and TinyDB separation | PASS: services/api/auth_models.py:14-46; auth_database.py:32-63 |
| A03 | Create/get ID/get email/update/delete services | PASS: services/api/auth_database.py:41,67,73,90,111 |
| A04 | Public registration hashes password, role user, linked Profile | PASS: services/api/routes/users.py:23; auth_database.py:47-63; tests/test_auth_registration.py:37 |
| A05 | Protected user list/read; safe responses | PASS: services/api/routes/users.py:15-44; admin directory, self/admin lookup |
| A06 | Self/admin update; admin-only valid roles | PASS: services/api/routes/users.py:47-58; tests/test_auth_users_profiles.py:53,88 |
| A07 | Protected delete and profile cascade | PASS: services/api/routes/users.py:61; auth_database.py:111; tests/test_auth_users_profiles.py:147 |
| A08 | One-to-one Profile in TinyDB with required fields | PASS: services/api/auth_models.py:20; auth_database.py:52-63 |
| A09 | Protected owner-only GET/PUT /profiles/me | PASS: services/api/routes/profiles.py:12-29; tests/test_auth_users_profiles.py:126 |
| A10 | Email/password login and signed JWT | PASS: services/api/routes/auth.py:16-31; tests/test_auth_tokens.py:58,80; form email and OAuth username alias |
| A11 | /auth/me email, role, linked profile | PASS: services/api/routes/auth.py:34-39; tests/test_auth_tokens.py:58 |
| A12 | OAuth2 bearer dependency, token validation and DB identity | PASS: services/api/auth_dependencies.py:17,41-61; tests/test_auth_tokens.py:115,130 |
| A13 | Environment secret and configurable expiry | PASS implementation: services/api/auth.py:32-49; tests/test_auth_tokens.py:149. LOCAL SETUP PENDING: real ignored .env not created or inspected |
| A14 | Required route authentication and 401/403 distinction | PASS: services/api/routes/users.py:18-20; tests/test_auth_users_profiles.py:53 |
| A15 | Five or more existing additional routes protected | PASS: eight routes; services/api/app/main.py:47-48; tests/test_auth_operational.py:20-29,58 |
| A16 | libpass bcrypt, no plaintext storage/comparison | PASS: pyproject.toml:9; services/api/auth.py:8-24; tests/test_auth_registration.py:37 |
| A17 | TinyDB identities retained; future user_uuid references only | PASS current architecture: services/api/auth_database.py:37-63 and API README. Future Supabase migration is not yet present/tested |
| A18 | Stateless JWT, no session/cookie authentication | PASS: auth/dependency code inspection; services/api/app/main.py:43 disables CORS credentials |
| A19 | Manual /docs registration → login → authorization → protected route | PENDING: no browser tool available; README labels walkthrough unexercised |
| A20 | Missing/malformed/expired token returns 401 | PASS automated: services/api/tests/test_auth_tokens.py:115; test_auth_operational.py:58. Manual evidence still pending |
| A21 | Valid-token existing API behavior unchanged | PASS: real-login helpers and preserved incident/supplier regressions; 41/41 API and 7/7 shared analysis tests |
| A22 | Push/PR against main, protected-route/check description, instructor link | PENDING: publication not authorized; no push/PR/submission/merge |

Interpretations checked independently:
- Stored UUID User.id satisfies the assignment; TinyDB integer doc_id is an internal storage key, not a required JWT identity.
- Login accepts actual email/password form fields and an OAuth username alias; the official README does not mandate JSON.
- Profiles expose only /me; identity injection is rejected (422), nonexistent /profiles/{id} is 404, and other-user credential operations return 403.
- All active roles may use operational routes; role-wide RBAC is optional.
- Expected frontend 401 behavior and shared latest incident aggregate are documented, not regressions or per-user isolation claims.

## Protected operational routes
1. POST /api/incidents/analyze
2. GET /api/incidents/results/export
3. POST /suppliers
4. GET /suppliers
5. GET /suppliers/{supplier_id}
6. PATCH /suppliers/{supplier_id}/rate
7. PATCH /suppliers/{supplier_id}/status
8. DELETE /suppliers/{supplier_id}

## Verification strategy
- Baseline and final suite: uv run python -m unittest discover -s services/api/tests -v
- Focused new tests per unit, observe meaningful RED before implementation and GREEN after.
- git diff --check; inspect intended paths and full diff.
- Before delivery reread AGENTS.md, relevant context/rules, services/README.md, services/api/README.md and memory-bank/techContext.md.
- Independent verifier audits fresh official README against code/tests, including every evaluation item, not merely the new tests.
- Native review follows user-owned switch and provider consent; it never replaces functional checks.
- Manual /docs check must not be inferred from TestClient/OpenAPI checks.
- No frontend test run required for unchanged UI; explicitly report expected frontend token incompatibility.

## Evidence and progress
- Read-only exploration complete; no auth code exists initially.
- Branch feature/auth-api created; initial worktree clean.
- Baseline attempt: `uv run python -m unittest discover -s services/api/tests -v` exited 127 (`uv: command not found`) in writer environment. No tests executed, no RED/GREEN reached, no source/dependency edits made.
- Parent confirmed only untracked odd/ on feature/auth-api after blocked writer. Read-only diagnosis mvr1pn1t-4-cl0g found no uv in PATH or five standard executable locations; mise ls uv was empty and mise which uv reported not installed. Standard user-local bin directories are already in PATH. Other locations remain unverified. No install, fetch, profile changes or alternative dependency workflow performed.
- User explicitly authorized uv installation. Official versioned installer https://astral.sh/uv/0.13.6/install.sh ran with UV_INSTALL_DIR=$HOME/.local/bin and UV_NO_MODIFY_PATH=1; exit 0. `uv --version` returned 0.13.6; `command -v uv` returned /home/lab/.local/bin/uv. No sudo or shell-profile changes. Git still showed only untracked odd/.
### AUTH-01 implementation evidence
- Writer mvr23sx7-5-qz8o completed public registration, schemas, separate TinyDB identity/profile tables, UUID IDs, hash helpers, dependencies and matching docs.
- Baseline: `uv run python -m unittest discover -s services/api/tests -v`: 16/16 passed.
- Test-first RED: focused registration suite ran 6 tests with 19 failures/subtest failures, chiefly missing route 404. GREEN: 6/6; expanded final focused suite: 8/8.
- Final writer full suite: 24/24; independent verifier mvr27qj5-6-qsuq reran full suite: 24/24 passed in 2.375s. Existing Starlette/httpx deprecation warning is non-failing.
- `uv add "python-jose[cryptography]" "libpass[bcrypt]"` succeeded; requirements mirror aligned.
- Writer, parent and independent verifier `git diff --check`: passed.
- Parent spot-read auth_database.py; independent verifier found no concrete fix-now defects.
- Evidence covers A01/A02/A04/A16; implemented portions of A03/A08/A13/A17. JWT, protected routes, remaining CRUD, manual /docs and submission remain pending.
- Native review review-1ce8e455690f9cac reviewed the registration work unit (12 paths, 731 changed lines, including 327 lockfile lines). Four lenses approved. Exact acknowledgement returned native-approved-acknowledgement-completed, authority burned, target sha256:5a9e45c73202932f9dc1930ca462dcb78535e513fd6202275725aefe0027d570.
- Non-blocking advisories retained as later-work considerations, not correction authority: R1-email-backtracking (auth_models.py:53), R3-nul-password (auth_models.py:59-63), R4-hash-lock (auth_database.py:47), R4-partial-storage-write (auth_database.py:61).
- TinyDB single API worker constraint documented; concurrency stress and crash recovery were not exercised or promised.
- After explicit developer authorization, AUTH-01 committed as b4d353c3855b18d83d19e74f7d7944df6d6330da (`feat(auth): add secure registration with linked TinyDB profiles`). Staged diff check passed; only untracked odd/ remained afterward.
- No push, PR, frontend changes or manual /docs checks performed.

### AUTH-02 implementation evidence
- Writer mvr2g40y-7-rbij implemented form login, JWT HS256 issuance, reusable bearer dependency and /auth/me safe response.
- Focused test-first RED: 8 tests, 16 failures and 2 errors (missing features/unsafe password handling); GREEN and expanded rerun: 8/8.
- Full writer suite: `uv run python -m unittest discover -s services/api/tests -v`: 32/32 passed; `git diff --check` passed (writer and parent).
- JWT_SECRET_KEY required from environment; expiry ACCESS_TOKEN_EXPIRE_MINUTES defaults 30, positive finite valid duration. Configuration errors yield value-free 503; invalid authentication yields 401.
- Covered automated A10-A13/A20 and reinforced A16/A18; manual /docs NOT exercised.
- Native review review-9d8eb0d756f2d0e0: 4 lenses approved 414 changed lines in 8 files. Exact acknowledgement returned authority burned for target sha256:4ea91daed71bb99636be920eb8e4b53ae455ae4e1d59d30cc1a6fdd5177a946a.
- ASSESS reported unassessable due to untracked scope; independent verifier mvr2vuf5-8-qaa5 ran full suite: 32/32 passed in 7.816s, diff check passed, no concrete fix-now defects. Existing Starlette/httpx warning remains non-failing. Invalid config on /auth/me is not directly tested; manual /docs remains pending.
- Parent checked branch/status, staged exact 8 intended paths and ran staged diff check (including newly tracked files): passed. Commit d1703aea1ce26be8b721dc45daac31e485eeeee7 (`feat(auth): add JWT login and bearer identity validation`), 400 insertions/14 deletions. Only untracked odd/ remained.

### AUTH-02B implementation evidence
- Writer mvr2y8kh-9-lni7 implemented protected user CRUD, owner profile endpoints and locked single-write storage mutations.
- Focused RED: 4 tests, 16 failures (missing routes/401s); GREEN 4/4, expanded rerun 4/4. Tests cover self/admin/manager, same-role denial, duplicate updates/no side effects, changed passwords, safe outputs, profile isolation/null clearing, cascade deletion/token invalidation.
- Full API suite writer: 36/36 in 15.309s; independent verifier mvr32pdv-a-y4m9: 36/36 in 15.530s. No concrete fix-now defects. Existing Starlette/httpx warning is non-failing.
- Writer, verifier, parent and staged `git diff --check` passed. Parent inspected branch/status and exact intended file scope.
- Native review review-47cf95b5647d463e approved 447 changed lines/8 files; exact acknowledgement returned authority burned for target sha256:94a4f6b14f6134c4de07d841e390ca9dff4c6f497e1225d9e6b3c028d2c978de.
- Non-blocking follow-up: R3-role-transition-coverage (test_auth_users_profiles.py:116-119); no native correction requested.
- Commit 5b0188de1fc21404c6bb92df7d30a6412a803da5 (`feat(auth): enforce user and profile ownership permissions`), 417 insertions/30 deletions. Only untracked odd/ remained.
- A03/A05-A09 and user/profile A14 implemented and tested; manual Swagger, operational protection/CORS and final audit still pending.

### AUTH-03 implementation evidence
- Writer mvr37ork-b-60sp implemented inclusion-level authentication for all eight routes and CORS PUT/Authorization; endpoint bodies and frontend unchanged.
- Focused RED: 5 tests, 50 failures: 48 missing-protection failures, 1 CORS failure, 1 overbroad privacy assertion corrected (invalid_customer_email metric is allowed; email values are not). GREEN/expanded rerun 5/5.
- Existing incident and supplier suites: 8/8 each. Full API writer suite: 41/41 in 24.229s. Shared incident analysis: 7/7. Diff check passed.
- Tests use real registration/login, temp identity/supplier storage; cover all active roles, inactive/deleted identities, cross-user shared aggregates, CORS and OpenAPI security. Static frontend intentionally gets 401 without tokens.
- Native review review-4ec1e10a0c6f0e32 approved 300 changed lines/8 paths; exact acknowledgement returned authority burned for target sha256:b804a389a4813469ea9bc401d10ec9be76fb6020809f2e59653d7b321703d5e6.
- ASSESS unassessable untracked scope requires independent verifier; combined independent functional + full official-README audit mvr3dc9z-c-q5ck passed implementation checks. Full API 41/41 in 24.499s, shared analysis 7/7 in 0.085s, diff check passed; status before/after matched. Existing warning non-failing.
- Parent staged only 8 intended paths, checked staged diff including new test files, and committed e522ea439b5df7eec35437b247ee35f94f7b6a39 (`feat(auth): protect operational routes and preserve authenticated behavior`), 261 insertions/39 deletions. Only odd/ remained untracked.
- Browser tool discovery returned no matching browser/playwright tools. No manual /docs check claimed.

## Next step
Request developer participation for the manual /docs flow; implementation and audit are committed locally. Configure a private ignored .env locally without exposing secrets; do not overwrite existing secrets or start services on occupied ports. No publication until separately authorized. Parent owns this document and Engram mirror.

## Final check limitations
- No failing automated tests; Starlette/httpx deprecation warning is pre-existing and non-failing.
- Historical RED reported by bounded writers; final GREEN independently rerun.
- Manual browser /docs, real local .env setup and publication remain pending.
- No concurrency stress, multiprocess operation or crash-recovery testing; single-worker TinyDB explicitly documented.
- Frontend tests skipped because no UI changes; existing static clients intentionally receive 401 without bearer tokens.
- Native reviews are approved for all four work units, not proof of manual acceptance or publication.
