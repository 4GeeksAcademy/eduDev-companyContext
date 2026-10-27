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
  JWT login and `/auth/me` are delivered in AUTH-02 below; operational route
  protection, user CRUD and profile endpoints remain pending.
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
- No manual `/docs` execution claimed. Operational routes remain public until
  AUTH-03; user CRUD/profile routes remain AUTH-02B. No dependency changes,
  runtime identity data writes, real secrets, commits or task-plan edits.

## Next Steps

1. Complete the developer-authorized commit and delivery workflow.
2. Attach the verified seed, filtered API, and filtered UI screenshots to the pull request.
