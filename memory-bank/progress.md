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

## Password Recovery — PR-1

- Implemented public forgot/reset JSON endpoints and real Resend HTTPS adapter
  using stdlib urllib with a 10-second timeout. Generic forgot 200 responses cover
  unknown accounts and provider/config failures; tokens and provider details are
  never returned or logged. No real email sent and no `.env` edits performed.
- Reset JWTs require signature, expiry and password-reset purpose plus a matching
  persistent random reset ID. Password + consumed state update together under the
  identity RLock; concurrent requests yield exactly one success in focused tests.
  New links supersede earlier links; existing sessions remain valid. Reset/session
  token separation preserves legacy session tokens without a purpose claim.
- Exact focused command: `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_auth_password_recovery.py' -v`.
  Observed RED: 6 tests failed on absent routes (404), 1.303s. Initial GREEN:
  6/6, 2.801s; expanded deleted-user/missing-state triangulation: 7/7, 3.023s.
- `uv run --no-sync python -m unittest discover -s services/api/tests -v`
  passed 48/48 in 27.423s. Existing Starlette/httpx deprecation warning remains
  non-failing. Tests use temporary DBs, synthetic secrets, mocked provider HTTP
  and explicitly expired signed tokens; no dependency changes or network calls.
- README documents server-only Resend/base-URL/expiry settings, ignored `.env`,
  no-domain recipient restriction and single-worker TinyDB limits. Tracker UI,
  authenticated change-password and real-email/browser acceptance remain pending.
  No commits, staging, publication, task-document edits or review claims.

## Password Change — PR-2

- Added bearer-protected `POST /auth/change-password` with current/new passwords,
  credential-free validation and success feedback. Wrong current password is 400;
  missing/invalid/reset-token bearer credentials are 401. Existing new-password
  policy is reused. Verification of the latest hash, hashing and password/reset-ID
  replacement share the identity RLock and one write, avoiding stale-hash checks.
- Successful existing PUT password updates now clear pending recovery state too;
  non-password updates preserve it. Existing access JWT lifetime is unchanged.
- `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_auth_password_change.py' -v`:
  RED 7 tests, 6 failures in 3.592s (missing route 404 and stale recovery link
  incorrectly accepted after PUT); GREEN 7/7 in 5.488s. Covers wrong-password and
  malformed-input nonmutation, authentication, old/new login, recovery invalidation,
  session preservation and concurrent changes (one 200, one 400).
- `uv run --no-sync python -m unittest discover -s services/api/tests -v`:
  passed 55/55 in 32.744s, including all PR-1 tests. Existing Starlette/httpx
  deprecation warning remains non-failing. Tests use temporary DBs and synthetic
  credentials; no mail/network, secrets, dependencies, task edits or git writes.
- Tracker UI and real-email/browser acceptance remain pending; no Resend setup
  requested or performed in this unit. README documents the new route/invariant.

## Password Recovery Tracker — PR-3

- Added Spanish public recovery/reset forms and guarded account password change,
  profile/login links, fixed login reset-success feedback and Suspense-safe query
  handling. Only the two recovery routes join the guard's public allowlist.
- Public JSON recovery/reset calls never attach bearer or save tokens; change
  reuses the protected identity client. Forms validate UTF-8 byte limits and
  confirmation before requests, prevent duplicates, abort on departure and ignore
  stale completions. Recovery locks with generic confirmation even on errors.
- `cd uis/talent-pipeline-tracker && node --test tests/*.test.mjs`: RED exit 1,
  20 pass/2 fail (missing password helper and service functions); GREEN 24/24,
  expanded cancellation/transport triangulation 25/25, exit 0, zero skips.
- `cd uis/talent-pipeline-tracker && npm run lint` and
  `cd uis/talent-pipeline-tracker && npm run build` passed (exit 0); production
  output includes all three new routes. Existing Node module-type warning remains
  non-failing. Build automatically reported loading existing `.env.local`; no
  environment contents were inspected or edited. No dependency/API/task changes.
- README includes pending browser/local API and real-mail checklist. Node tests
  cover services/helpers plus a structural guard assertion, not browser E2E.
  Browser interaction, narrow/wide checks and real Resend delivery remain pending.
- `git diff --check` passed; unrelated pre-existing API/task work was preserved.

## Password Recovery — Independent Verification

- API verification independently passed 55/55 tests, including the 7/7 focused
  password-change cases and recovery regressions. Tracker verification independently
  passed `node --test tests/*.test.mjs` (25/25, zero skips), `npm run lint`,
  `npm run build`, and `git diff --check`.
- Existing cached Playwright/Chromium ran the built Tracker on an isolated loopback
  port with synthetic identity HTTP responses and unrelated traffic blocked. Passed:
  public recovery/private change access, generic confirmation on success/HTTP/network
  failure, disabled controls, duplicate prevention, confirmation validation, token
  error links, reset-to-login success, password-change feedback, exact payloads and
  bearer isolation, preserved session, and departure cancellation without redirects.
- Desktop 1440px and mobile 390px checks found no horizontal form overflow; labels,
  focus traversal and keyboard submit access passed. No uncaught browser JavaScript
  errors. This was not an exhaustive visual/accessibility or console-message audit.
  Browser and owned server were stopped; existing servers were untouched. No installs,
  secret inspection, actual API/password mutation or real email occurred.
- Integrated native review `review-36e05904c97e1de3` was approved and acknowledged
  for the 23-file candidate; no blocking findings. This later passive verification
  record is not a new source-review claim. Non-blocking follow-ups remain recorded
  in `odd/tasks/password-reset.md` rather than expanding the assignment.
- Existing Starlette/httpx and Node module-type warnings are non-failing. The
  browser's expired-token response was simulated; actual expiry is covered by API
  tests, not by live mailbox acceptance. Real Resend delivery remains unverified.

## AUTH-03 — Isolated Manual Verification

- Manual testing used isolated identity/supplier data, preserving existing project
  data. Configuration and frontend/API origins were checked without exposing secrets.
- Public pages and API schema returned 200; unauthenticated `/auth/me` returned
  401; reset/change CORS preflights returned 200 and the configured origin.
- Initial email delivery failed despite local readiness. Restarting preserved the
  test account but did not resolve delivery; the controlled diagnosis and correction
  are recorded below. Infrastructure readiness is not proof of mailbox receipt.

## Resend User-Agent Compatibility — PR-5

- Added only honest `User-Agent: TrackFlow/1.0` identification to the existing
  urllib Resend Request. POST endpoint, authorization, JSON payload, timeout 10,
  generic responses and persistent single-use semantics are unchanged.
- Parent-provided prior evidence: one authorized adapter diagnostic returned
  403/edge_error_1010; its one-send grant is consumed. A controlled no-credential
  HEAD pair with only UA varied returned 403 (default urllib) versus 200
  (TrackFlow/1.0). This supports compatibility work, not authenticated POST
  acceptance or real-email receipt. Missing-email resolution remains unproven.
- `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_auth_password_recovery.py' -v`:
  RED 8 tests, one missing-UA failure (`None` versus `TrackFlow/1.0`) in 3.063s;
  GREEN 8/8 in 3.048s. New mocked adapter regression also verifies POST URL,
  authorization/content-type, sender/recipient/text/subject and timeout unchanged.
- `uv run --no-sync python -m unittest discover -s services/api/tests -v`:
  passed 56/56 in 33.530s. Existing Starlette/httpx warning remains non-failing.
- Independent verification subsequently confirmed 8/8 recovery and 56/56 API
  tests plus clean diff checks. Native review `review-fb52209080aa0531` was approved
  and acknowledged for the corrected source candidate.
- Controlled API-only reload activated the correction, preserving temporary
  identity/supplier database digests and leaving Tracker untouched. Masked config,
  HTTP and CORS checks passed. No provider call or account mutation occurred during
  activation. Subsequent human-reported live-flow acceptance is recorded below.

## AUTH-03 — User-Reported Delivery Retry

- After activating the User-Agent correction, the user reported "ok, ahora si
  funcionó" in response to the recovery retry/receipt request. This is human-reported
  success, not independently observed mailbox evidence. The delivery blocker is
  considered resolved. The user then explicitly answered "Si, todo ok" to the
  delivered-link reset, old-password rejection/new-password login, reused-link
  rejection and authenticated wrong/correct-current-password checklist. Those
  live results are USER-REPORTED, not independently observed by the agent.
- Final automated evidence: 56/56 API tests, 25/25 frontend tests, lint/build and
  independent mocked-browser checks passed; corrected source review was approved
  and acknowledged. Token expiry has deterministic API coverage, not a live
  30-minute wait. No exhaustive visual/accessibility audit was claimed. Existing
  non-failing dependency warnings remain. Test services are still running.

## Next Steps — AUTH-03

1. User-authorized feature-branch chain is published: draft tracker PR #18 to main,
   API #19 to the tracker branch, UI #20 to the API branch, evidence #21 to the UI
   branch. Commits: `55870a0`, `1b0cbd3`, `48a986f`, `fa54bc7`. Final independent
   checks passed: 56/56 API,25/25 frontend,lint/build,scope/privacy and diff checks.
   Remote base/head/diffs match the intended slices. GitHub reported no status
   checks; no CI success or merge is claimed. Review children before integration.
2. Before any push, remind the user to revisit temporary Tailscale settings and
   confirm secrets/private test values are excluded. Ignored local `.env` does not
   need reverting merely for Git; deployment must use its own correct URLs.
3. Stop owned test services and dispose of temporary accounts only when authorized.
   No secret values or token-bearing URLs belong in chat or Git.

## Centralized Incident Manager — T1 Only

- Extracted legacy CSV validation into standard-library `packages/shared/incident_validation.py`;
  analyzer aggregation/export and compatible imports remain intact. Manager enums,
  nonblank text, UTC normalization and exactly four lifecycle edges are shared separately.
- Added Pydantic registration/record/status-update schemas. Branch is always required;
  descriptions preserve literal text; ordinary records generate UUID4 IDs and UTC dates.
  The 120-character seed-title transformation is not a registration length cap.
- Test-first RED: shared command ran 8 tests (7 passed, missing-module error);
  model command ran 1 failed import test because the schema module did not exist.
  GREEN: `python3 -m unittest shared.test_incident_analysis shared.test_incident_contract -v`
  passed 12/12; `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incident_models.py' -v`
  passed 6/6, no skips. Covers all lifecycle pairs, legacy official counts/CLI,
  literal text, required branch, generated-field rejection and UTC normalization.
- T1 contract only: persistence, seed, manager endpoints and UI remain pending.
  No full suite, commits, staging, publication or dependency changes performed.

## Centralized Incident Manager — T2

- Added dedicated TinyDB incident storage with JSON-mode model serialization,
  UUID insert-if-absent, list/get/create and status-only lifecycle updates.
  One process-wide RLock covers database open through close for thread safety;
  single-worker/no concurrent CLI-process access remains required.
- Explicit historical seed validates shared legacy rules before mapping, preserves
  literal descriptions, creates trimmed 120-character titles and UTC-midnight
  timestamps, and stores only manager fields. Fixed UUID5 identity preserves
  existing records on rerun, including updated statuses and timestamps.
- Official CSV tests observed 95 inserted/5 invalid, expected status/category/
  origin/branch distributions, then 0 inserted/95 existing. The initial missing-ID
  limitation was corrected below with explicit seed-only shared-validation opt-in.
- RED: store command failed import (1 error, missing module); seed command ran
  5 tests with 3 failures because the script was missing (2 negative tests passed).
  Initial GREEN: store 3/3, seed 5/5. Final alternate-case/refactor verification:
  `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incident_store.py' -v`
  passed 4/4; `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incident_seed.py' -v`
  passed 5/5, zero skips. Tests cover concurrent writes/transitions, safe failures,
  duplicate ownership, literal text, field privacy and rejected-update nonmutation.
- All test writes used temporary databases. No real seed, startup hook, endpoints,
  UI, dependency changes, staging or commits; T1 work preserved. T3 remains pending.

### T2 seed-only fallback correction

- Shared header/record validators now accept keyword-only
  `allow_missing_incident_id=False`. Seed opts in for an absent ID column or blank
  stripped ID; nonempty malformed IDs and every other legacy rule remain invalid.
  Analyzer defaults stay strict, verified at both validator and analyzer levels.
- Valid source-ID UUID5 namespace/names are unchanged. Missing IDs use that same
  namespace over a tagged compact ASCII JSON array of transformed title and UTC
  midnight ISO timestamp. Equal fallback keys deduplicate; title/date changes
  distinguish incidents. No original IDs or fallback-only fields persist, and
  reruns preserve existing status and timestamps.
- Observed RED: seed command ran 7 tests with 1 failure/3 errors from unsupported
  fallback; shared command ran 13 with 1 unsupported-keyword error. GREEN:
  `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incident_seed.py' -v`
  passed 8/8; `python3 -m unittest shared.test_incident_analysis shared.test_incident_contract -v`
  passed 13/13; `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incident_store.py' -v`
  passed 4/4, all zero skips. Official95/5 and valid-ID compatibility remain tested.
- Only temporary stores were used. No dependencies, real seed, endpoints, Git
  writes or task-document changes; parent owns independent verification/disposition.

## Centralized Incident Manager — T3

- Added five authenticated management routes with AND-combined enum filters,
  zero-filled summary groups, full record responses and status-only updates.
  Analyzer routes remain first; summary precedes the dynamic manager ID route.
- Router-local handling returns safe field-mapped 400 validation errors and generic
  JSON 500 for unexpected failures, including corrupt storage/response validation.
  Dedicated shared `InvalidStatusTransitionError(ValueError)` distinguishes invalid
  lifecycle edges from incidental storage ValueErrors. Existing auth and legacy
  validation/error semantics are preserved. Exact UI contracts are in the API README.
- Endpoint test-first RED: exact focused manager command ran 8 tests with 27
  failures/1 error (missing routes/module plus one incorrect legacy 400 assertion).
  Corrected that assertion to the observed existing 415 without changing analyzer.
  GREEN: `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incident_management.py' -v`
  passed 8/8. Tests exercise all lifecycle pairs, all five auth protections/roles,
  official95/5 summary counts, validation/nonmutation, filters and safe500 failures.
- Required regressions passed: `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incidents.py' -v`
  8/8; `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_auth_operational.py' -v`
  5/5; `python3 -m unittest shared.test_incident_contract -v` 6/6. Zero skips;
  existing Starlette/httpx deprecation warning remains non-failing.
- All test data writes used temporary stores; no real seed, dependencies, frontend,
  commits, staging, publication or review invocation. T4/T5 and parent disposition
  remain outstanding; T1/T2 and pre-existing task files are preserved.

## Centralized Incident Manager — T4 source implementation

- Added authenticated `uis/backoffice/incidents.html` with separate registration,
  list and summary sections, scoped CSS and native browser JavaScript. URL:
  `http://localhost:3000/uis/backoffice/incidents.html` (optional `?apiPort=8001`).
  Four private pages now link to the manager; only its explicit filename was added
  to the auth return allowlist. Session guard and analyzer/supplier logic unchanged.
- Registration validates whitespace-only text and enums, always requires branch,
  highlights branch-origin guidance, blocks duplicate submits and resets errors/
  fields/highlight on success. Safe local field guidance never displays server
  bodies. List filters include status/origin/branch/category with stale-response
  protection, recoverable errors and meaningful empty states. Legal status controls
  restore server baseline on failure; terminal records are read-only. Summary has
  independent retry and zero-filled presentation for all four dimensions.
- Observed RED: `node --test uis/backoffice/tests/incidents.test.mjs` failed one
  missing-module import; `node --test uis/backoffice/tests/auth.test.mjs uis/backoffice/tests/session-guard.test.mjs`
  passed 9/10 with the new incidents return-target assertion failing as intended.
  GREEN: incidents initially 8/8, expanded controller/page-node tests 10/10;
  auth/session guard 10/10, zero failures/skips. `node --check uis/backoffice/incidents.js`
  and `node --check uis/backoffice/auth.js` passed. `git diff --check` passed.
  No warnings observed.
- HTML/CSS have no meaningful deterministic visual RED; Node page-node wiring tests
  are source-level checks, not browser verification. Browser smoke, narrow/wide
  checks, console inspection, three screenshots and T5 integrated verification
  remain pending. No servers, real API mutations, dependencies, Git writes,
  backend edits or native review performed. Prior work preserved.

### T4 success confirmation correction

- Successful registration now displays “Incident registered successfully.” in the
  existing form status region after resetting fields/errors/branch emphasis.
  Saving completion and independent list/summary failures preserve the confirmation;
  the next invalid or pending submission replaces stale success feedback.
- Extended the existing small page-wiring regression before changing production:
  `node --test uis/backoffice/tests/incidents.test.mjs` RED 9/10 (expected success
  message was empty); GREEN 10/10, zero failures/skips. The same regression checks
  independent refresh errors and subsequent submission feedback.
  `node --check uis/backoffice/incidents.js` and `git diff --check` passed.
- Browser checks and screenshots remain pending; no browser/API mutation claimed.

## Centralized Incident Manager — Current T1–T5 delivery state

- T1–T4 behavior independently verified: shared13/models6/store4/seed8,
  manager8/analyzer8/operational-auth5/shared-contract6 and backoffice20/20.
  Earlier pending statements above are historical implementation-stage records.
- Actual incidents page passed Chromium1440/390: validation, loading/create/reset/
  confirmation, filters/empty/error/retry states, lifecycle updates/rollback and
  independently resilient summary. Isolated real API initial95/post-synthetic-create96.
- Overall verify-trackflow-ui **FAIL** remains explicit: pre-existing overview index
  overflow, baseline/current513px at390 and1440px at1440 using the same Chromium.
  Incident page passes; no source CSS changed for the unrelated limitation.
- [Delivery guide](../docs/centralized-incident-manager.md) records exact historical
  writer RED versus independent GREEN, seed identity/counts, setup and three sanitized
  byte-identical PNGs. Form capture was recaptured with real page validation and
  fixture auth/list/summary to clear stale feedback; list/summary use isolated real
  API, with summary96 including one synthetic create, not a changed official95 seed.
- Verification-owned servers/temp DBs were cleaned; the previously retained tracker
  was stopped with user approval. Earlier live-server statements are historical,
  not a current availability claim. Existing Starlette/httpx deprecation, optional
  favicon404 and intentional injected-failure events are disclosed.
- Latest independent verifier `mvrjcv4b-h-37pg` passed combined API82/82,
  shared13/13 and backoffice20/20 plus incidents/auth syntax and diff checks, with
  no failures/errors/skips; existing Starlette/httpx deprecation remains. Exact
  commands are in the delivery guide, separate from historical writer RED evidence.
  Links20/PNG dimensions/hashes passed, copies unchanged; no accidental paths,
  whitespace or obvious secret markers found. Parent accepted documentation/screenshots.
- No browser rerun: earlier actual Chromium manager390/1440 PASS is reused; overall
  skill FAIL remains solely the pre-existing overview overflow above. Seed/API
  quick-start now load the same ignored environment for consistent store selection.
- Native review `review-d01e45fb968ac84a` was approved and exactly acknowledged;
  authority was consumed. Four informational warnings remain separate follow-up work,
  with no required corrections. Only passive status documentation changed afterward;
  reviewed application/test code is unchanged. No commit, push or PR was performed.

## Error-handling Audit — EH-02 implementation

- Candidate API now maps network, invalid JSON/required shapes and HTTP failures
  to fixed Spanish messages, ignoring untrusted error bodies. Successful requests,
  pagination, optional signals and delete 204 are preserved. AbortError identity
  and cancellation before/after fetch/body parsing remain observable.
- List/detail/edit loads offer retry. All touched candidate/note mutation paths
  use safe messages and `finally` cleanup; departure cancels requests and suppresses
  stale completions. Failed writes retain drafts/data for deliberate retry.
- Exact observed command: `node --test uis/talent-pipeline-tracker/tests/api.test.mjs`.
  RED exited 1, 0/5 passed: exposed network/server detail, accepted unexpected 204,
  malformed required data and missing single-record signal support. Initial GREEN
  exited 0, 5/5 passed. Expanded triangulation exited 0, 7/7 passed, zero skips,
  including malformed entities, safe unknown-error fallback and delayed-body abort.
- `node --test uis/talent-pipeline-tracker/tests/auth.test.mjs` was explicitly not
  needed: no shared auth client behavior changed; candidate requests stay isolated.
- `git diff --check` passed (exit 0). Existing non-failing Node
  MODULE_TYPELESS_PACKAGE_JSON warning remains. No compiler/build/lint, browser,
  server or real API writes performed. No deterministic JSX runner is configured;
  manual final recovery/cancellation/mutation/layout checks are documented in the
  tracker README and remain parent-owned. Static verify-trackflow-ui does not
  target this Next.js UI. EH-03/EH-04 and integrated EH-05 remain separate tasks.
- No dependencies, task documents, unrelated notes, Engram mirror, staging, commits
  or publication changed by this writer. Native review is parent-owned.

## Error-handling Audit — EH-03 implementation

- Added a central sanitized JSON500 fallback, preserving existing HTTP handlers and
  the manager's local contract. Supplier/identity contexts narrowly translate only
  OSError/JSONDecodeError; recovery remains account-neutral and corrupt reset storage
  no longer masquerades as invalid input. No persistence/transaction guarantees added.
- Analyzer reads attempt close in finally; upload I/O failures are sanitized and
  parsing errors retain 400/422 with fixed messages (submitted headers are not echoed).
  Failed analysis preserves the last successful aggregate. No routine exception logs.
- Exact focused command:
  `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_error_responses.py' -v`.
  Initial RED: 6 tests, 8 errors from non-JSON500 responses. An expanded run found
  one test-fixture TypeError (helper returns an ID string); corrected without source
  workaround, then GREEN 8/8. Additional header-privacy RED: 9 tests, 1 failure
  exposing hostile submitted columns; final GREEN 9/9 in 3.868s, zero skips.
- Exact regressions:
  `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incidents.py' -v`
  passed 8/8 (final rerun 3.407s);
  `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_suppliers.py' -v`
  passed 8/8 in 3.034s;
  `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_auth_users_profiles.py' -v`
  passed 4/4 in 7.667s;
  `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_auth_password_recovery.py' -v`
  passed 8/8 in 3.020s (identity storage touched).
- New failure-injection tests isolate users/suppliers/incidents before TestClient
  lifespan and use raise_server_exceptions=False solely to inspect Starlette's
  last-resort response; production propagation is unchanged. Existing non-failing
  Starlette/httpx deprecation remains. Auth dependency code unchanged, so no
  conditional operational-auth run; no broad suite/build/browser checks performed.
- `git diff --check` passed (exit 0).
- No real DB writes/seed, mail/network, installs, dependency changes, tracker edits,
  task/mirror edits, staging, commits, publication or native review by this writer.

## Error-handling Audit — EH-04 implementation

- Supplier CLI catches only the existing normalized `StorageError` at the seed
  call, prints fixed actionable stderr and returns nonzero; startup/shared seed
  semantics remain unchanged. Incident seed catches only `OSError` and
  `json.JSONDecodeError` per insert, preserving safe failure counts/partial success
  while TypeError, ordinary ValueError and KeyError propagate.
- Analyzer hostile-header RED reproduced arbitrary submitted-column reflection.
  Read/parse/write failures now use distinct fixed stderr guidance without raw
  input or I/O paths. Shared parsing and valid aggregate/export output unchanged.
- Exact focused commands and observed RED then final GREEN:
  - `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_seed_cli.py' -v`:
    RED 3 tests/3 failing storage subcases (tracebacks); GREEN 3/3 in 1.300s.
  - `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incident_seed.py' -v`:
    RED 10 tests/3 failing programmer-error subcases (swallowed exceptions);
    expanded GREEN 11/11 in 2.436s.
  - `python3 -m unittest shared.test_incident_analysis -v`:
    RED 9 tests/2 failures (hostile header and raw read diagnostics);
    GREEN 9/9 in 0.238s.
- Alternate cases cover corrupt/missing/new storage, directory/blocked-parent
  targets, injected permission failure with partial counts, supplier15/0 and
  incident95/0 reruns, malformed/empty/invalid-UTF8 CSV and blocked export target.
  All writes were temporary; no fixture corrections or warnings observed.
- No real DB seeding, installs, dependencies, full suite, browser, task/mirror
  edits, staging, commits, publication or native review. Prior API/tracker work
  preserved; final independent acceptance remains parent-owned.

## EH-03 — Registration test contract correction

- Updated only the legacy storage-write failure test: retained fail-once injection,
  asserted HTTP500 and exact sanitized JSON, and rejected internal message/type,
  traceback and database path diagnostics. Both existing users/profiles no-orphan
  assertions now execute unconditionally, including when storage is absent/empty.
  No production behavior changed; all unrelated work preserved.
- Exact isolated command run before and after the test edit:

```bash
uv run --no-sync python - <<'PY'
import os, subprocess, sys, tempfile
from pathlib import Path
with tempfile.TemporaryDirectory(prefix='trackflow-registration-check-') as directory:
    root = Path(directory)
    env = dict(os.environ)
    env.update(TRACKFLOW_USERS_DB_PATH=str(root / 'users.json'), TRACKFLOW_SUPPLIERS_DB_PATH=str(root / 'suppliers.json'), TRACKFLOW_INCIDENTS_DB_PATH=str(root / 'incidents.json'), JWT_SECRET_KEY='error-audit-test-only-secret', ACCESS_TOKEN_EXPIRE_MINUTES='30')
    result = subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', 'services/api/tests', '-p', 'test_auth_registration.py', '-v'], env=env)
    code = result.returncode
sys.exit(code)
PY
```

- RED: 8 tests, 7 passed/1 failed in 2.344s, `OSError not raised`.
  GREEN: 8/8 passed in 2.324s; both no-orphan assertions reached and passed.
  No errors/skips; existing non-failing Starlette/httpx deprecation warning only.
- `git diff --check`: passed. No full suite, tracker checks, installs, real-data
  writes, staging, commits or native review performed.

## EH-02 — Detail effect lifecycle correction

- Moved the six mutation/control/feedback/draft resets from the synchronous effect
  body into the successful candidate-and-notes load continuation, immediately after
  its aborted-signal guard. Accepted new loads reset departed-candidate controls;
  failed or stale/aborted loads cannot clear current drafts or mutation state.
  Existing request cancellation, retry and `finally` cleanup remain unchanged.
- `npm --prefix uis/talent-pipeline-tracker run lint`: RED exited 1 with one
  `react-hooks/set-state-in-effect` error at CandidateDetail.tsx:28; after the
  lifecycle correction, GREEN exited 0 with no warnings/errors.
- `node --test uis/talent-pipeline-tracker/tests/api.test.mjs`: passed 7/7,
  zero skips (exit 0); existing MODULE_TYPELESS_PACKAGE_JSON warning only.
- `git diff --check`: passed (exit 0). No full suite/build/browser rerun, installs,
  task/mirror changes, commits or native review. Parent's final verifier must
  recheck candidate-ID navigation/retry with pending mutations and stale loads,
  plus compiler validation; Node tests do not establish JSX lifecycle behavior.

## Error-handling Audit — Final functional acceptance / EH-05 handoff

- EH-02/03/04 behavior is accepted; this supersedes earlier pending functional,
  compiler and browser stages above without replacing their historical evidence.
  [Reviewer guide](../docs/error-handling-audit.md) contains scope, rubric coverage,
  limits and isolated repeatable commands; full history remains in the task.
- Independent final API97/97 PASS supersedes historical96/97 after the registration
  assertion correction; both no-orphan checks pass. Shared15/15 and tracker Node32/32
  passed. Focused subsets are included in those totals, not additional tests.
- Final tracker lint/build PASS follows the detail lifecycle correction. Earlier
  browser7 fixture groups and layouts390/1440 are reused; final focused detail
  retry/candidate-ID navigation during delayed loads/PATCH/note POST/DELETE PASS.
  Synthetic auth/candidate interception only, no external passthrough/writes, zero
  uncaught exceptions; deliberate failure resource errors remain expected.
- Node module-type and Starlette/httpx warnings remain. Two unattributed unclosed
  SpooledTemporaryFile ResourceWarnings are disclosed, not a proven production leak.
  Live candidate schema/exhaustive accessibility remain unverified; pre-existing
  edit-during-create clearing is unchanged. Startup/already-started streams cannot
  receive replacement JSON; TinyDB remains nontransactional/single-worker.
- Documentation-only closure adds no features/dependencies or new screenshots and
  reruns no suites/build/browser. Same branch: feature/error-handling-audit.
  Native review and final EH-05 disposition remain parent-owned; commits and
  publication await explicit user confirmation. No staging or publication performed.

## Previous Milestone Follow-ups

1. Share PR #12 with the instructor; its description lists the eight protected
   routes and separates automated/live HTTP results from human-reported Swagger checks.
2. Address review feedback if needed; merge only after approval and user authorization.
   GitHub reported no status checks for the PR at publication; no CI success is claimed.

### Error-handling audit — native review closure

- Native review `review-2fbaca21d66564d9` approved all four lenses and its exact
  acknowledgement succeeded; authority consumed, no correction required.
- Informational advisories `R3-storage-decoding` and `R4-storage-decoding` at
  `scripts/seed_incidents.py:87` remain separate nonblocking follow-up work.
- Only passive status documentation changed afterward; reviewed application/test
  code is unchanged. Functional acceptance remains API97/shared15/tracker32 plus
  lint/build and Chromium checks documented in the [guide](../docs/error-handling-audit.md).
- Authorized work-unit commits: tracker `99cd2d3`, API `a68a1d5`, scripts
  `986c81b`, consolidated audit docs `b990ebe`; tests/local docs stay with behavior.
- Branch pushed and [PR #23](https://github.com/4GeeksAcademy/eduDev-companyContext/pull/23)
  opened against `main`. GitHub reported OPEN/non-draft, CLEAN and no status checks;
  no CI success or merge is claimed. Pre-existing unrelated task notes stay excluded.
  Only passive delivery records changed after review; source/test code is unchanged.

## Bullet-proof Tests — BP-01 setup

- Wrote root `TESTING.md` before fixtures: planned cases/reasons for all 12 identity
  endpoints, five incident-manager and six supplier operations, token/password/
  recovery logic, mandatory TypeScript auth utilities and separate FE-019 helpers.
  New test results and coverage remain pending; no new bugs claimed.
- Added root uv dev dependencies pytest/pytest-cov and locked resolution. Pytest
  discovers new `tests/` and existing API suites with importlib mode. Branch-aware
  coverage sources include actual auth/recovery, incident and supplier modules;
  per-group statement gates remain unmeasured (70% auth, 60% each extra group).
- Added new-unit-only autouse temporary users/suppliers/incidents paths, synthetic
  JWT/recovery config, mocked outbound email HTTP, and real bcrypt/TinyDB user
  factory. Environment restoration uses pytest monkeypatch; no startup/seed/server
  or application source changes. Legacy suites remain untouched.
- Observed setup checks: `uv add --dev pytest pytest-cov` passed;
  `uv sync --locked` passed; `uv run pytest --version` reported pytest 9.2.0;
  `uv run python -m py_compile tests/conftest.py` passed. Compilation does not
  verify runtime fixture behavior. Config/docs/shared setup has no meaningful
  behavioral RED; no tests, full suite, build, browser or coverage run in BP-01.

## Bullet-proof Tests — BP-02 auth business units

- Added dedicated direct-call login/me/forgot/reset/change-password modules plus
  token/password and email adapter tests. Real TinyDB, bcrypt, JWT, models and
  active-identity dependency run against temporary stores and synthetic config;
  only outbound email transport and the access-expiry clock are replaced.
- First run GREEN: `uv run pytest tests/test_auth_login.py tests/test_auth_me.py tests/test_auth_forgot_password.py tests/test_auth_reset_password.py tests/test_auth_change_password.py tests/test_auth_tokens.py tests/test_email_delivery.py -q`
  passed 103/103 in 19.63s, zero failures/skips, one AnyIO
  `PytestRemovedIn10Warning` for the deprecated `CallSpec2` alias. No manufactured
  RED or product bug. TESTING.md records actual cases/test names and boundaries.
- Covers endpoint happy/edge/failure, state/nonmutation, exact reset reuse,
  supersession despite failed delivery, concurrent single-winner reset/change,
  preserved sessions, current stored roles and token purpose/claim rejection.
  No HTTP/server/seed/real mail, legacy/full suite or coverage run. BP-03–06 and
  integrated gates remain pending. No source/dependency/task/Git lifecycle edits.

## Bullet-proof Tests — BP-03 identity CRUD/profile units

- Added seven dedicated direct-call registration/user CRUD/profile modules, reusing
  isolated fixtures, real TinyDB/bcrypt/JWT and explicit resolved identities.
  Tests check linked lifecycle, permissions before existence disclosure, duplicate
  nonmutation, privilege rejection, PUT recovery invalidation and null/omission.
- First and only run: `uv run pytest tests/test_users_register.py tests/test_users_list.py tests/test_users_get.py tests/test_users_update.py tests/test_users_delete.py tests/test_profiles_get.py tests/test_profiles_update.py -q`
  passed 72/72 in 18.88s, zero failures/skips, one existing AnyIO
  `PytestRemovedIn10Warning`. No artificial RED, proven bug or source/fixture edits.
- TESTING.md records actual evidence and limitations; no BP-02/legacy/full suite,
  coverage, HTTP client, startup, real data or network checks ran. Independent
  final verification and coverage remain pending BP-06; parent owns task/mirror.

## Bullet-proof Tests — BP-04 incident/supplier units

- Added eleven dedicated endpoint modules and two small appended factories. Real
  models/routes/TinyDB run only during tests against isolated temporary stores.
  Checks include every incident lifecycle pair, exact AND-filter membership,
  zero-filled summaries, literal text/identity preservation, supplier validation,
  rate-versus-status timestamp semantics, absence and corrupt-storage failures.
- First and only run: `uv run pytest tests/test_incidents_*.py tests/test_suppliers_*.py -q`
  passed 105/105 in 0.38s, zero failures/skips; one existing AnyIO
  `PytestRemovedIn10Warning`. Existing behavior passed immediately; no artificial
  RED, corrections, proven bug or source/config/dependency changes.
- TESTING.md records scope and limits. Direct calls do not establish router auth,
  HTTP validation or safe serialization; no auth-matrix duplication, existing/full
  suites, coverage, startup, real seed or network ran. Independent verification
  and coverage remain BP-06; frontend BP-05 and task/mirror/review stay parent-owned.

## Bullet-proof Tests — BP-05 partial

- Installed only Jest/@types/jest/ts-jest as Tracker dev dependencies; added node
  Jest config with transform-only TS overrides, real-module coverage selection and
  additive scripts. Native Node/backend suites and all application source untouched.
- First focused command (Tracker cwd): `npm exec -- jest --runInBand --runTestsByPath __tests__/frontend-helpers.test.ts`
  exited 1: 3 passed, 7 failed, 0 skipped. Six failures prove both label predicates
  accept inherited toString/constructor/__proto__ keys. Exact regressions retained;
  stopped before mandatory auth Jest tests per source-authorization boundary.
- Proposed, not applied: own-property checks in lib/labels.ts. Seventh failure is
  native DOMException AbortError classification under Jest; possible Error realm
  mismatch, not yet a proven product defect. TESTING.md records evidence and gaps.
- npm reported glob deprecation, 12 audit vulnerabilities and two uncovered install
  scripts; no remediation, peer bypass, build/full suite/browser/coverage performed.
  Parent owns source authorization, task/mirror and review disposition.

## Bullet-proof Tests — BP-05A focused correction

- Reconfirmed Jest RED: 3 passed/7 failed/0 skipped (0.252s): six inherited-key
  label failures plus one confirmed native DOMException/Jest Error realm artifact.
- Only production changes are two own-property predicate replacements in labels.ts,
  preserving null guards and inherited-key regressions. services/api.ts is untouched.
- Jest-only setup aligns the explicit built-in Error constructor family to host
  Node before imports. Expanded tests preserve real DOMException assertions and
  fetch/body rejection identity, Error/subclass negatives and inheritance semantics.
- Same focused Jest command passed 13/13 (0.33s), no warnings; native
  `node --test tests/api.test.mjs` passed 7/7 (103.58ms), existing module-type warning
  only. No full suite/build/coverage; mandatory BP-05 auth suites remain pending.
- TESTING.md distinguishes the production bug from environment correction and
  records parent diagnostic lock/audit evidence: 243 dev-only additions, no existing
  metadata/version changes/removals; baseline6 versus candidate12 findings, adding
  six low deepmerge findings; critical Next advisory predates this work. No package
  changes/remediation/script execution; risk disposition remains parent-owned.

## Bullet-proof Tests — BP-05 mandatory auth/form completion

- Added four Jest modules for real auth service and auth/profile/password form
  exports. Covers session/SSR, login/register partial outcomes, public/bearer
  boundaries, current/stale401, session-preserving errors, exact DOMException
  cancellation identity, UTF-8 limits, trimming/null and duplicate URL parameters.
- Exact command (Tracker cwd): `npm exec -- jest --runInBand --runTestsByPath __tests__/auth-service.test.ts __tests__/auth-form.test.ts __tests__/profile-form.test.ts __tests__/password-form.test.ts`.
  First run67 passed/5 failed/0 skipped: test evaluated signal.reason before async
  body abort. Corrected with pre-created real DOMException identity; final run72/72,
  zero failures/skips, 0.387s, no warnings. No product fix or artificial RED.
- Fresh local fetch/storage/location fakes restored after each service test.
  Existing source/dependencies/Jest setup/helper regressions and all legacy suites
  preserved. TESTING.md records focused evidence; no full suite/coverage/build/
  browser/install/audit ran. Independent integrated checks and coverage remain
  BP-06; parent owns task/mirror/review and dependency-risk disposition.

## Bullet-proof Tests — BP-06A integration corrections

- Reproduced five legacy auth_helpers collection errors, four TS2743 mock generic
  errors and the setup CommonJS lint error before edits. Added only the legacy
  pytest helper path, compatible typed fetch mocks and a documented line-local
  setup lint exception; no product/dependency/coverage-denominator changes.
- Focused GREEN: isolated collection38 (no execution), project tsc exit0, focused
  ESLint exit0, auth-service/helper Jest68/68 across2 suites (0.367s); diff-check
  passed. Existing AnyIO and Starlette/httpx warnings remain; uv implicitly rebuilt
  the editable local project after pyproject changed. Detailed command history is
  in odd/tasks/bullet-proof-tests.md; TESTING.md summarizes the final evidence.
  No full suites/coverage/build/browser reruns in BP-06A; final BP-06 integration,
  task/mirror and native review remain parent-owned.

## Bullet-proof Tests — BP-06 final functional acceptance

- Independent verifier `mvs36fl2-e-n632` passed root pytest **377/377** (280 new +
  97 legacy, 81.73s), integrated coverage **377/377** (81.84s), Tracker Jest
  **85/85 across five suites** (0.76s), TypeScript, lint and diff-check. No failures
  or skips. This supersedes historical BP-06 collection/type/lint blockers above.
- Full implementation statement gates pass: integrated auth **98.87%**, incidents
  **99.46%**, suppliers **100%**; reused unit-only values **97.28% / 90.22% / 97.97%**.
  Legacy Tracker Node **32/32** is reused, not rerun after type/config/comment-only
  corrections; no application/assertion changes separate that evidence.
- Python commands retained temporary users/suppliers/incidents, synthetic config,
  disabled env-file loading and temporary coverage outputs; no real data/services
  or secrets. Owned artifacts cleaned. AnyIO and Starlette/httpx warnings remain;
  reused Node module-type warning remains, no Jest warnings.
- [TESTING.md](../TESTING.md) consolidates the pre-test case rationale, ordinary
  commands versus verification wrapper, coverage denominators, AI-discovered label
  fix, harness corrections, dependency findings and honest boundaries. READMEs and
  technical context link it; root coverage files are ignored (Tracker already was).
- Functional acceptance is complete. Native review START stopped at preflight with
  `lens_context_budget_exceeded`: complete candidate evidence exceeds its budget;
  no review authority or lineage was created and the same candidate cannot succeed
  on retry. Smaller review candidates need a user decision before local commits.
  No review approval, staging, commit, push, mode change or risk acceptance is claimed.
  Dependency remediation is separate; full history remains above and in the task.

## Bullet-proof Tests — R1–R4 review closure / R5 documentation

- User authorized local commits only. The initial whole-candidate native preflight
  budget stop above remains historical; four smaller code/test slices now have
  native approval and exact acknowledgement, superseding that pending decision:

  | Slice | Local commit | Native review | Informational advisory IDs |
  | --- | --- | --- | --- |
  | R1 | `a50cef8b413574c1ef7f74fb73e0bcf56511f171` | `review-671c85dde9867aae` | `R3-001` |
  | R2 | `7dd69dde79893fae987018d38732fc8e58c6b885` | `review-b1870f9819319d87` | `R3-001`, `R3-002` |
  | R3 | `809500c1b566339d5355dd2f2d36c83e431d0a2f` | `review-c392f7c0fd370909` | None |
  | R4 | `b20649e1d9c9be446143c0a8b1bc03b8eed2472d` | `review-8725dab0a1e5a56f` | None |

- No advisory required correction. Fresh slice checks passed Python 103/72/105
  (19.37s/18.14s/0.34s respectively) and Jest 85 (0.322s), plus R4 type/lint
  checks. These repeat existing cases, not new tests added to the final totals.
  Full lock evidence was retained without formatting or dependency changes to fit
  review. Code/test/config bytes have not changed since final functional acceptance;
  BP-06A corrections preceded that acceptance. Intermediate guide snapshots changed.
- R5 restores the final guide and README coverage pointers; technical context
  already has the final commands. Final functional evidence and reused labels above
  remain unchanged; no suites, coverage, build, browser, install or audit rerun here.
  AnyIO, Starlette/httpx and Node warnings, six new low dev-package findings and
  five high/one critical pre-existing findings remain disclosed, not resolved by
  review approval. See the [testing guide](../TESTING.md) and
  [task history](../odd/tasks/bullet-proof-tests.md).
- R5 documentation commit `b9e2106` received low-risk native approval under
  `review-9156c08b69d4f7a9`; acknowledgement remains blocked by the integration's
  committed-range selector handling. No authority consumption is claimed.
- The user explicitly authorized the pending tracking commit, push and one PR to
  `main`, accepting deferred R5 acknowledgement and no further review attempts.
  Implementation and functional acceptance remain complete; merge is not authorized.
