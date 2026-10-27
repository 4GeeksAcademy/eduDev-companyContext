# Project Progress

## Current State

- Hito 1: root corporate website and B2B form completed.
- Hito 2: typed inventory, shipment, carrier, validation, and reporting utilities completed.
- Hito 3: Talent Pipeline Tracker completed under `uis/talent-pipeline-tracker/`; PR #7 merged into `main`.
- Hito 4: general company context, memory bank, agent guidance, one scoped rule, one reusable verification skill, public website, and internal backoffice completed; PR #8 merged into `main`, visual evidence was attached to the PR, and campus delivery was completed.
- Backend Architecture Proposal: drafted and verified in `docs/ARCHITECTURE_PROPOSAL.md` as a documentation-only proposal for a future FastAPI modular monolith.
- Incident Analyzer: implementation and full milestone compliance audit passed. Shared/CLI tests pass 7/7, permanent API tests pass 8/8, dependency installation and `pip check` passed in the ignored `.venv`, and live Uvicorn/curl integration passed on port 8001 because an unrelated service owns port 8000. Manual narrow/wide browser and console verification passed, and both required screenshots are ready for the PR.
- Supplier Directory: backend models, TinyDB persistence, 15-record idempotent seed, CRUD/filter endpoints, startup bootstrap, focused tests, and the static backoffice directory page are implemented. Supplier rows become labelled cards on narrow screens while desktop tables remain unchanged. API tests pass 16/16, shared incident tests pass 7/7, backoffice JavaScript syntax checks pass, TypeScript typecheck/build pass, isolated `uv run seed` reports 15 then 0 inserts, live API bootstrap/filter smoke passes, and `git diff --check` passes. Manual desktop/mobile verification passed with a clean browser console, and all three required milestone screenshots were captured and verified.

## Authentication API — AUTH-01

- Public `POST /users` registration now persists separate TinyDB identity/profile
  records with UUID IDs, normalized unique emails, server-controlled role/activity,
  bcrypt hashes and credential-free responses. Every identity gets a profile.
- Identity storage uses `TRACKFLOW_USERS_DB_PATH`; supplier storage is unchanged.
  JWT login and `/auth/me` are delivered in AUTH-02 below; user CRUD/profile
  endpoints and operational protection are delivered in AUTH-02B/AUTH-03 below.
- Dependencies added with `uv add "python-jose[cryptography]" "libpass[bcrypt]"`;
  requirements mirror updated. No secrets or `.env` files created.
- Test-first evidence: baseline API suite passed 16/16; registration RED observed
  missing-route 404 failures; focused GREEN passed 8/8 including failure consistency,
  UTF-8 bcrypt limits and UUID non-reuse. Final `uv run python -m unittest
  discover -s services/api/tests -v` passed 24/24; `git diff --check` passed.

## Authentication API — AUTH-02

- Form `POST /auth/login` accepts email or Swagger OAuth username plus password;
  conflicting aliases and validation errors do not echo credentials. Generic 401
  covers invalid credentials/inactive users, including unsupported bcrypt inputs.
- HS256 JWTs use stored UUID `sub` and mandatory `exp`. Reusable bearer dependency
  resolves active users and roles from TinyDB on every request. `/auth/me` returns
  safe identity plus linked profile; missing profiles fail closed.
- `JWT_SECRET_KEY` is environment-only with no fallback; configurable positive,
  finite `ACCESS_TOKEN_EXPIRE_MINUTES` defaults to 30. Invalid configuration returns
  value-free 503. README documents ignored `.env` loading via uv and form login.
- Test-first `uv run python -m unittest discover -s services/api/tests -p
  'test_auth_tokens.py' -v`: RED ran 8 tests with 16 failures and 2 errors (missing
  routes and unsupported password input); GREEN 8/8, then expanded negative/config
  fixtures 8/8. `uv run python -m unittest discover -s services/api/tests -v`:
  32/32 passed. Existing Starlette/httpx deprecation warning remains non-failing.
- No manual `/docs` execution claimed. Operational and user CRUD/profile
  protection are delivered in AUTH-03/AUTH-02B below. No dependency changes,
  runtime identity data writes, real secrets, commits or task-plan edits.

## Authentication API — AUTH-02B

- Protected user directory (admin only), individual GET/PUT/DELETE (self or admin),
  and owner-only GET/PUT `/profiles/me` implemented. Managers have no admin powers;
  only admins may supply role, even if unchanged. Public registration is preserved.
- Credential updates normalize email, enforce uniqueness, hash passwords and reject
  null/unknown fields. Profile updates preserve omitted contacts and allow null
  clearing. Safe response schemas exclude credentials. Locked single-write services
  preserve UUIDs and delete identity/profile together; deleted tokens fail 401.
- README includes route/response permission matrix and trusted, stopped-server
  first-admin provisioning instructions; no bootstrap endpoint or privileged seed.
- Test-first `uv run python -m unittest discover -s services/api/tests -p
  'test_auth_users_profiles.py' -v`: RED 4 tests/16 failures (absent routes, 404/405);
  GREEN 4/4 in 7.364s; expanded alternate cases 4/4 in 7.579s. Full
  `uv run python -m unittest discover -s services/api/tests -v`: 36/36 in 15.309s.
  Existing Starlette/httpx warning remains non-failing. No manual `/docs` claim.
- Operational protection and CORS are delivered in AUTH-03 below; no frontend/dependency changes,
  runtime accounts, task-plan edits or git writes performed by this writer.

## Authentication API — AUTH-03

- All eight incident/supplier endpoints now require `get_current_user` through
  router inclusion dependencies; bodies, schemas, validation, seeds and IDs are
  unchanged. Every active role may operate them; inactive/deleted identities fail
  closed on every request. Registration/login/docs and preflight remain public.
- CORS adds PUT and Authorization, preserving explicit origins, existing methods
  and no-cookie policy. Tests reject an unrelated origin.
- Existing incident/supplier HTTP tests use real registration/login with dummy
  secrets and temporary identity AND supplier stores; no dependency overrides.
  Added eight-route absent/malformed/expired-token matrix, all-role access,
  inactive/deleted revocation, public docs/OpenAPI and cross-user shared aggregate
  checks. No raw source/email export; failed uploads preserve the shared summary.
- Test-first operational command: RED 5 tests/50 failures (48 missing protection,
  one CORS failure, one overbroad privacy assertion corrected because aggregate
  `invalid_customer_email` counts are legitimate); focused GREEN 5/5 in 2.628s.
  Incident and supplier focused suites each passed 8/8. Expanded operational
  rerun passed 5/5 in 2.818s; cleanup refactor keeps environment restoration before
  temporary directory cleanup. Final
  `uv run python -m unittest discover -s services/api/tests -v`: 41/41 in 24.229s;
  `uv run python -m unittest shared.test_incident_analysis -v`: 7/7 in 0.084s.
  `git diff --check` passed. Existing Starlette/httpx deprecation warning remains
  non-failing.
- Automated evidence covers operational A14/A15/A21 and invalid-token A20.
  Static frontend remains unchanged and now receives 401 without tokens.
  Single-worker TinyDB and process-global authenticated shared aggregate boundaries
  are documented. The independent final assignment audit is recorded below.
  Manual Swagger/browser verification and PR publication remain pending. No git
  writes, dependency changes, runtime data or task-plan edits by this writer.

## Authentication API — Final Assignment Audit

- An independent verifier reread the complete current official authentication
  README and mapped all 22 acceptance items to source and test evidence. No concrete
  implementation noncompliance was found; delivery is not yet 100% complete.
- Observed final checks: `uv run python -m unittest discover -s services/api/tests -v`
  passed 41/41 in 24.499s; `uv run python -m unittest shared.test_incident_analysis -v`
  passed 7/7 in 0.085s; `git diff --check` passed. Only the existing non-failing
  Starlette/httpx deprecation warning remains. No frontend files changed.
- Four implementation work units received native review approval and exact
  acknowledgement. Authorized local commits: `b4d353c` (registration), `d1703ae`
  (JWT), `5b0188d` (ownership/CRUD), and `e522ea4` (operational protection).
- A19 remains pending: the required manual `/docs` register/login/authorize/protected
  route flow was not performed. Automated HTTP/OpenAPI tests are not manual evidence.
  No callable browser tool is available in this session.
- A13 local setup remains unverified: no real `.env` or signing secret was created
  or inspected. Environment configuration and error behavior are tested; local
  ignored `.env` setup is documented in `services/api/README.md`.
- A22 remains pending: no push, PR, instructor submission or merge was performed.
  The user authorized local commits only. Future Supabase identity placement is a
  documented constraint, not a migration that has already been tested.
- Full requirement evidence, review identities and known non-blocking limitations
  are tracked in `odd/tasks/auth-api.md`.

## Next Steps

1. Configure an ignored local `.env` and perform the manual `/docs` authentication
   flow with the developer; record the observed results before claiming completion.
2. After explicit publication authorization, push `feature/auth-api` and open a PR
   against `main` describing the eight protected routes and exact verification.
3. Share the PR with the instructor; merge only after approval and user authorization.
