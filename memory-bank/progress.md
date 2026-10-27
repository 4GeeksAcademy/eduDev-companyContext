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
  requirements mirror updated. No secrets or `.env` files created in AUTH-01;
  subsequent local setup is recorded in the final audit below.
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
  Manual Swagger verification was later reported passed (final audit below);
  PR publication remains pending. No git
  writes, dependency changes, runtime data or task-plan edits by this writer.

## Authentication API — Final Assignment Audit

- An independent verifier reread the complete current official authentication
  README and mapped all 22 acceptance items to source and test evidence. No concrete
  implementation noncompliance was found; publication remains outstanding.
- Observed final checks: `uv run python -m unittest discover -s services/api/tests -v`
  passed 41/41 in 24.499s; `uv run python -m unittest shared.test_incident_analysis -v`
  passed 7/7 in 0.085s; `git diff --check` passed. Only the existing non-failing
  Starlette/httpx deprecation warning remains. No frontend files changed.
- Four implementation work units received native review approval and exact
  acknowledgement. Authorized local commits: `b4d353c` (registration), `d1703ae`
  (JWT), `5b0188d` (ownership/CRUD), and `e522ea4` (operational protection).
- A19 passed by human report from a PC via Tailscale `/docs`: registration 201
  (role `user`, active, safe response), login 200 with bearer token, Swagger
  Authorize success, `/auth/me` 200 with correct email/role/profile and no
  credentials, `/suppliers` 200 with supplier list, and unauthenticated
  `/suppliers` 401. These are not agent-browser observations; no manual incident
  upload/export or expired-token check is claimed.
- A13 local setup passed: ignored `.env` created with mode 0600; explicit loading
  verified by real Uvicorn login without exposing secrets. No code changes.
  Independent live HTTP checks passed registration/login/auth-me/suppliers,
  missing/malformed-token 401 and cross-owner 403. Agent Chromium launch failed
  on missing `libatk-1.0.so.0`; human verification resolves the manual requirement.
- A22 publication completed with explicit developer authorization: branch pushed
  and [PR #12](https://github.com/4GeeksAcademy/eduDev-companyContext/pull/12) opened
  against `main`. Instructor submission and merge remain pending. Future Supabase
  identity placement is a documented constraint, not an already-tested migration.
- Full requirement evidence, review identities and known non-blocking limitations
  are tracked in `odd/tasks/auth-api.md`.

## Tracker Authentication — AUTH-FE-01

- Added an isolated identity/session client and nine Node 24 mocked-fetch tests.
  Candidate API behavior is unchanged; identity uses `NEXT_PUBLIC_AUTH_API_URL`
  (local default port 8000). Auth pages/guards remain forthcoming; backoffice is
  deferred and the public website is untouched.
- Observed RED: focused test command exited 1 because `services/auth.ts` did not
  exist. GREEN: `node --test tests/auth.test.mjs` passed 9/9. Coverage includes
  request encoding, profile nulls, field errors, registration partial success,
  session cleanup, preserved sessions on other failures and stale-401 protection.
- `npm run lint` passed (exit 0) after a documented standalone-navigation rule
  exemption; `npm run build` passed (exit 0). Node reports a non-failing
  MODULE_TYPELESS_PACKAGE_JSON warning; dependencies/package files are unchanged.
- No integrated browser/API execution or overall assignment completion claimed.

## Tracker Authentication — AUTH-FE-02

- Added public Spanish login/registration forms, optional registration contacts,
  field-level errors and UTF-8 password validation. Partial registration success
  offers manual login and prevents resubmission until deliberate input changes.
- Root client guard validates identity before mounting private candidate content;
  pathname-keyed sessions abort obsolete checks. Transient errors retain the token
  with retry/logout. Public routes skip validation; private navigation adds logout.
- Form-helper RED: `node --test tests/*.test.mjs` exited 1 (missing helper), with
  existing nine tests passing. GREEN: same command passed 12/12 (exit 0), including
  byte boundaries, required/email checks and normalized optional contacts.
- `npm run lint` and `npm run build` both exited 0. JSX has no configured
  deterministic UI runner; structural inspection confirms gating before child
  mount, but browser/live API behavior is not verified. Existing Node module-type
  warning is non-failing. Candidate/identity APIs remain separate and unchanged;
  profile and backoffice remain deferred, public website untouched.

## Tracker Authentication — AUTH-FE-05

- Each form submission now owns an AbortController, aborted and detached on
  unmount; stale/aborted completions cannot update form state or navigate. No
  mounted flag is used, avoiding StrictMode effect-replay lifetime assumptions.
- Login checks cancellation before requests and immediately before token storage.
  Registration checks before automatic login and propagates cancellation instead
  of reporting it as a manual-login failure; real login failures retain the
  account-created message. Canceled/failed login preserves existing sessions.
- Test-first `node --test tests/*.test.mjs`: RED exit 1, 12 passed/4 failed
  (behavior assertions); GREEN exit 0, 16/16, including deferred fetch/body parsing,
  already-aborted submissions and registration cancellation. Final triangulation
  rerun also passed 16/16. Existing module-type warnings remain non-failing.
- `npm run lint` and `npm run build` exited 0. JSX cleanup was structurally
  inspected only: no installed DOM runner. Browser/live API checks remain pending;
  known Chromium missing `libatk-1.0.so.0` was not retried or installed.

## Tracker Authentication — AUTH-FE-04

- Added guarded `/account/profile` and private-only Perfil navigation. Email is
  read-only; name, phone and address load before editing. Nullable contacts become
  empty inputs; only trimmed profile fields are sent, with blanks cleared to null.
- Load errors offer retry; save errors preserve edits and expose field messages.
  Successful saves display the server response. Pending saves lock editing and
  duplicate submission; unmount aborts requests and stale completions are ignored.
  Auth client, session guard and original candidate requests are unchanged.
- Test-first `node --test tests/*.test.mjs`: RED exit 1 (missing profile helper,
  existing 16 tests passed); GREEN exit 0, 20/20 including null conversion, blank
  clearing, trimming, identity exclusion and contact-string preservation.
- `npm run lint`, `npm run build` and `git diff --check` passed (exit 0).
  Existing Node module-type warnings remain non-failing. No meaningful automated
  JSX RED is available without a DOM runner; lint/build and structural review are
  not browser acceptance. At AUTH-FE-04, browser/live API verification was pending;
  Chromium's missing `libatk-1.0.so.0` had not been retried or installed. Backoffice
  remains explicitly deferred; public website and backend are untouched.

## Tracker Authentication — AUTH-FE-03 Runtime Closeout

- Initial tracker scope is implemented and runtime verified at `dd0bd71` by
  verifier `mvr8xgvw-b-rbem`; the earlier browser blockers above are historical.
  After user/admin installed Chromium system libraries, `ldd` was clean and cached
  Playwright Chromium `about:blank` launch/close passed. Verifier installed nothing.
- All eight ephemeral browser groups passed: public navigation/five-route gating;
  real isolated registration/contact fields/login/localStorage and validation
  (required/email/UTF-8 >72 bytes, duplicate 409, wrong-password 401); real profile
  read/update/null clearing/reload with injected save delays/errors; logout/storage/
  refresh/back/private access; real invalid/expired signed JWT 401 plus injected
  protected 401/guard network/500 retry; delayed login/register/profile departure
  cancellation; real registration plus injected login failure/manual real login
  without repeat registration; mocked candidate GET-only display regression.
- Profile errors preserve edits/session and prevent duplicate submits; departure
  prevents stale token/UI/navigation, but server writes may still complete.
  Candidate list/status-stage-search/detail/notes used mocked external responses:
  no Authorization, no requests reached playground, no candidate mutations tested.
- `node --test tests/*.test.mjs` passed again 20/20. Prior lint/build passed with
  code unchanged; neither was rerun for this runtime run. No permanent E2E suite
  added. Optional public website browser smoke skipped; its code stayed untouched.
- Initial harness runs failed on redirect-abort waits, strict locators and
  prehydration interactions; corrected reruns passed without application changes.
  Temporary tracker copies isolated BOTH identity/supplier stores (startup seeds
  suppliers), used ephemeral secrets and no `.env`; existing data was untouched.
- Dev command: `npm run dev -- --webpack --hostname 127.0.0.1 --port <allocated>`;
  backend: `.venv/bin/python -B -m uvicorn services.api.main:app --host 127.0.0.1 --port <allocated> --no-access-log`.
  Public auth URL/CORS process environment matched temporary ports. All browsers
  and six owned server process groups stopped; zero members/temp directories remain.
  Verifier left Git unchanged except the preexisting parent task file.
- Static backoffice remains explicitly deferred; global all-application README
  compliance is not claimed. Four local source commits are on `feature/auth-frontend`.
  The feature-branch chain is the selected future delivery strategy; slice branches
  and PRs have not been created, and no publication has been performed.

## Backoffice Authentication Expansion — AUTH-BO-01

- Added standalone English login and plain-JS auth helper with origin-local token
  storage, cancellable form login, `/auth/me`, raw bearer Response handling,
  safe backoffice returns and existing API host/port configuration semantics.
- Tracker runtime closeout above remains unchanged. This newly authorized static
  expansion is separate: overview, analyzer and supplier gating/request wiring
  remain pending AUTH-BO-02; no global authentication completion is claimed.
- Node 24 RED exited 1 (missing auth module); GREEN passed 9/9 (exit 0), covering
  encoding, raw multipart/blob compatibility, session failures/stale 401, abort,
  API configuration and safe redirects. No DOM runner or live UI/API checks run.

## Backoffice Authentication — AUTH-BO-02

- All three private shells start hidden, including headers/sidebar/sample content.
  Shared guard validates `/auth/me` before one-time initialization; transient errors
  offer retry/logout. Departure cancels validation and hides content; persisted
  restores and cross-tab token events revalidate. Sidebar apiPort is preserved.
- Analyzer multipart/export and all supplier requests now use the existing raw
  bearer helper. Login native fallback uses POST and departure resets pending UI.
- RED: Node suite passed existing 9 tests, failed missing guard module. GREEN:
  10/10 passed, including retry, cancellation, restore, 401 and missing session.
  Browser/API acceptance and verify-trackflow-ui runtime were pending at this
  implementation stage; subsequent AUTH-BO-03 closeout is recorded below.
  Tracker, website, backend and historical root apps are unchanged.

## Backoffice Authentication — AUTH-BO-03 Closeout

- Scoped automated/runtime acceptance completed for source `8186751`, following
  foundation `b9db58d`; evidence is summarized in `uis/backoffice/README.md`.
  Verifiers `mvra4y7t-i-t17g` and `mvrae4y4-k-x08r` observed Node 10/10 twice,
  six JS syntax checks and diff checks passing, real isolated auth/supplier/CSV
  flows, session replacement/concealment, keyboard and 390/1440 error-free checks.
  Synthetic persisted handlers passed; actual bfcache was attempted but not
  exercised (`pageshow.persisted=false`), not an application failure.
- Public website separately passed its skill run without auth calls/redirects.
  Isolated browser tasks made no source edits; resources were cleaned without
  stopping existing servers. Tracker 20/20 + lint/build were not rerun here;
  candidate reads were mocked, no external writes tested.
- USER-REPORTED manual completion: after live Tailscale tracker/backoffice/website/
  API docs URLs and checklist, user said “listo, probado”; no issues described.
  Not independently observed manual assertions. Host checks saw pages 200,
  unauthenticated `/auth/me` 401 and CORS for both origins. Requested manual
  servers remain running on 3000/3001/8000 with ordinary local data, no reset.
- Route inventories and shared-identity/separate-origin session boundaries are in
  both UI READMEs. Website/public B2B intake remain unchanged; legacy Hito 2
  `operations.html` stays outside scope, without established private/public or
  superseded status. No global 100% claim.
- All work remains sequential local commits on ONE `feature/auth-frontend` branch.
  Feature-branch PR-chain is the selected strategy only: no slice branches/PRs,
  publication or merge. Source reviews were approved and acknowledged; this
  passive documentation does not claim a new review outcome.

## Next Steps

1. Share PR #12 with the instructor; its description lists the eight protected
   routes and separates automated/live HTTP results from human-reported Swagger checks.
2. Address review feedback if needed; merge only after approval and user authorization.
   GitHub reported no status checks for the PR at publication; no CI success is claimed.
