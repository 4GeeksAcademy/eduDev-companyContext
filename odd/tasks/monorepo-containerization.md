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

- [ ] T1 — Adapt the public website minimally to Next.js. **Commit authorized; in progress.**
  Implementation, focused HTTP/browser checks and native review are complete.
  Preserve the checked source candidate; close after the authorized work-unit
  commit. No push, PR, merge or deployment is implied.
- [ ] T2 — Package both UIs in one Node Alpine container. **Pending.**
  Add UI Dockerfile, start.sh and .dockerignore; install each app separately;
  run website/backoffice on 3000/3001 and preserve private legacy serving.
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
- Next: create the authorized local commit
  feat(ui): add Next.js public website host; then proceed to the dual-UI container.
  T1 remains open until that commit succeeds.
- Commits: T1 authorized; no commit created yet.
