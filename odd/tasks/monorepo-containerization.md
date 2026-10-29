# Monorepo containerization

## Objective and scope

Meet the 4Geeks Company Monorepo Containerization assignment with the smallest
maintainable change to TrackFlow. Preserve existing website content and design,
legacy backoffice behavior, and existing application data.

Source: https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/projects/ai-eng-container-project/README.md

The assignment requires one Node Alpine UI container running website and
backoffice with Next.js on ports 3000/3001, one Python/FastAPI container using
uv and requirements.txt, root Docker Compose, source bind mounts and hot reload,
explicit network, environment-based configuration, and deployment to the existing
VPS. Delivery needs local and VPS evidence and a PR to main.

## Authorization and boundaries

- User approved proceeding with minimal website adaptation to Next.js.
- Keep this bootcamp project simple; use only the assignment technologies.
- Run focused checks during implementation; broader checks only at final
  integration when justified. Ask before unresolved product decisions.
- Do not change talent-pipeline-tracker, historical milestone context, root
  milestone applications, infrastructure, data, or unrelated dependencies.
- User explicitly authorized creating uis/website/package.json,
  uis/website/package-lock.json, services/Dockerfile and services/.dockerignore.
  Do not change existing dependency manifests/locks or backend business logic
  under this approval.
- User explicitly authorized the T1 local commit and continuation to Docker.
  Do not access or mutate the VPS, publish, open a PR, or merge in this unit.
  Further delivery follows live session authority and repository policy.
- Never expose secrets; do not overwrite the existing ignored root .env.

## Repository baseline

- Feature branch: feat/monorepo-containerization, starting at f327ed0.
- Previous branch: fix/backend-seed-quantities.
- Existing unrelated untracked files: odd/tasks/auth-frontend.md and
  odd/tasks/centralized-incident-manager.md. Preserve both.
- Website is static; backoffice combines Next.js with a legacy server currently
  on loopback port 3001. That internal port conflicts with the required new
  backoffice Next port and must be addressed in its own task.
- Browser-facing API calls cannot resolve Docker-only service DNS. Plan the
  server/browser boundary explicitly; same-container loopback remains valid.
- Root .env already exists; its values have not been read or printed.

## Tasks

- [x] T1 — Adapt the public website minimally to Next.js. **Done.**
  Implementation, focused HTTP/browser checks and native review passed.
  Commit: 4545d9e94060c029bf607fc7ad4bfbe38dc08cb6
  (feat(ui): add Next.js public website host). No publication or deployment.
- [ ] T2 — Package both UIs in one Node Alpine container. **In progress.**
  Add UI Dockerfile, start.sh and .dockerignore; install each app separately;
  run website/backoffice on 3000/3001. Use a Node built-in allowlisted legacy
  server on loopback3002 inside the container; configurable rewrite port keeps
  local default3001 unchanged. Cover requests, rejection and process lifecycle.
- [ ] T3 — Package FastAPI and compose the development stack. **Pending.**
  Add Python Dockerfile, requirements and .dockerignore; use uv pip install
  and Uvicorn --reload. Add root Compose, named network, bind mounts, ports,
  environment configuration and internal service-name communication.
- [ ] T4 — Verify local integration and document reproducible setup. **Pending.**
  Prove root compose startup, both UI routes, backend communication, hot reload,
  ignores and no committed secrets. Keep evidence bounded and disclose gaps.
- [ ] T5 — Deploy to the existing VPS and prepare delivery evidence. **Pending authorization.**
  Confirm SSH target, existing services, ports and production configuration;
  deploy only after approval. Collect local/VPS evidence; request approval for
  publication/PR/merge rather than treating review as delivery permission.

## Acceptance and checks

Use test-first for meaningful deterministic behavior. For packaging and passive
docs without a meaningful RED, record the reason and use targeted structural
and runtime checks. Do not run unrelated UI or full repository suites mid-task.
No applicable failed or unavailable check may be reported as passing.

Native review follows the user-owned review switch and candidate consent. It
never substitutes for functional verification or authorizes commits/deployment.
T1's local work-unit commit is explicitly authorized; other delivery decisions
follow the live session's authority and repository policy.

## Evidence and next step

- Full assignment README read; read-only repository exploration completed.
- Baseline git status: only the two unrelated untracked task documents above.
- Feature branch created successfully before source implementation.
- T1 mapping completed: use a small App Router page, retain CSS and legacy
  static files, preserve /uis/website URL and content. Prefer plain JSX to
  avoid adding TypeScript tooling just for the public site.
- Explicit protected-file approval received for website manifest/lockfile and
  services Dockerfile/.dockerignore. Existing dependencies remain untouched.
- Backend packaging must account for root shared/ and packages/ imports;
  the existing services/api/requirements.txt is a compatibility mirror.
- T1 implementation returned with interaction_required: new isolated Next
  website, unchanged legacy static files, scoped README and progress evidence.
- Writer observed RED on missing website package.json; then GREEN 2/2 tests
  without skips against its owned Next dev server on 127.0.0.1:3310. Anchor
  targets, CSS HTTP 200 and unknown-route 404 also passed. Owned server stopped.
- npm website install passed (22 packages). Parent git diff --check passed.
  Approximately 279 authored added lines, 5 removed, plus 1,012 lockfile lines.
- User-selected option 2 applied: uis/website/.gitignore contains .next/.
  Writer and parent git check-ignore matched that local rule; git status no
  longer lists the cache and git diff --check passed. Cache retained, no
  deletion or behavior changes. Generated-output blocker resolved.
- Native inspect accepted the explicit intended-untracked file list, excluding
  the two unrelated task notes. Native review review-ee589c538e3d4f4d approved
  the website candidate; exact acknowledgement returned authority burned for
  target sha256:46bb321bcaac2bebf1bdadf99b69ce3c6d3e83d84b2e6dc6ef199781f2cb12f5.
  Review closure is not commit or publication authorization.
  Native assess still returns unassessable on undeclared untracked files even
  after inspect; no further assess retries. Its independent-verifier fallback
  was fulfilled: website smoke repeated with 2/2 passing, zero skips.
- Independent browser acceptance passed with existing Playwright Core/Chromium,
  no installs: 375px/1280px layouts, content, responsive cards, anchor/home/contact
  navigation, keyboard focus/skip link, zero overflow/console/page/resource errors.
  Cached wrapper import failed; direct cached core import recovered tooling.
- Verification observed zero source changes and closed its browser/server;
  port3310 was free afterward. Screenshots: /tmp/website-verify-375.png and
  /tmp/website-verify-1280.png (temporary local evidence, not delivery assets).
- Production build and full integration intentionally deferred. No Docker or
  VPS execution yet. T1 functional checks and review passed. Only passive status
  documentation changed after acknowledgement; implementation stayed unchanged.
- T1 committed successfully as 4545d9e94060c029bf607fc7ad4bfbe38dc08cb6.
  Post-commit status contained only the two unrelated task documents.
- T2 mapping complete: root http-server is outside the ./uis build context.
  A small Node built-in legacy server avoids installing any new dependency or
  exposing the repository. Preserve legacy assets, package manifests and locks.
- T2 edit surface: uis/Dockerfile, start.sh, .dockerignore, backoffice
  legacy-server.mjs, next.config.ts, tests/next-host.test.mjs,
  tests/legacy-server.test.mjs, uis/tests/start.test.mjs, uis/README.md,
  backoffice/README.md, memory-bank/techContext.md and progress.md.
- T2 checks: test-first focused Node rewrite/server/lifecycle checks and shell
  syntax; then one isolated UI image build/run as applicable. No full Next
  production build, API/data operations, whole-repository suite or VPS access.
- Local Docker CLI29.9.0/Compose5.6.0 uses rootless local Unix socket; no remote
  override observed. Daemon reachability and image execution remain unverified.
- T2 writer completed 12 scoped files (333 additions/4 deletions): Dockerfile,
  startup supervision, allowlisted loopback server, configurable validated
  rewrite port, ignores, tests and docs. No dependencies or legacy assets changed.
- T2 observed RED: Node command 2 passed/4 failed (missing implementations and
  configurable rewrite). GREEN 6/6, then expanded lifecycle coverage 8/8 without
  skips. sh -n, node --check and git diff --check passed. Non-failing Node
  module-type warning remains; no Docker runtime proof from writer tests.
- Native assess returned unassessable on untracked inventory; required independent
  verification passed: repeated8/8 Node checks, Docker build and real UI runtime.
  Retained image trackflow-ui:t2-verify-4545d9e (169d1d1b728a), local rootless only.
- Both Next hosts listened on0.0.0.0:3000/3001; legacy remained127.0.0.1:3002.
  Website container smoke2/2, backoffice login/assets and inventory validation
  shell200, private/config paths404. Image had no app-root .env/host .next before
  startup. This is not API/authenticated/Compose acceptance.
- Normal container stop exited0; terminating website CLI caused fail-fast exit1.
  Both owned containers removed, no running processes, host3310/3311 free.
  Source unchanged; diff checks passed. Node module-type, telemetry and deprecated
  Docker --time warnings did not block. Bind-mount hot reload remains T4.
- Native T2 review review-e00d2b1f129846a1 approved all four lenses; exact
  acknowledgement returned authority burned for target
  sha256:2ce1545436d280eff2e839f414273e4da21406537a9b1159fb79148c62535dea.
  Informational non-blocking R3-shutdown-escalation at uis/tests/start.test.mjs:29
  is a later follow-up, not a correction or reason to reopen review.
- Next: local T2 work-unit commit, then T3 backend and Compose mapping.
  Only passive status documentation changed after review; T2 remains in
  progress until the work-unit commit succeeds.
- Commits: T1 4545d9e; no push, PR, merge or VPS actions.
