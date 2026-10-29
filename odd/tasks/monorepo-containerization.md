# Monorepo containerization

## Goal

Meet the [4Geeks containerization assignment](https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/projects/ai-eng-container-project/README.md)
with a simple, reproducible TrackFlow development stack and a separately authorized
production deployment to the existing VPS.

Required: one Node Alpine UI container for Next website3000/backoffice3001;
one Python/FastAPI container using uv, requirements.txt and Uvicorn reload;
root Compose, hot-reloading source mounts, environment configuration, named
network/service DNS, ignored secrets, and local/VPS delivery evidence.

## Authority and constraints

- User approved implementation, minimal public Next adaptation, new website
  manifest/lock, services/Dockerfile and services/.dockerignore, and website
  .gitignore. Existing dependencies/backend business logic remain unchanged.
- Keep scope small; focused checks during implementation, broader integration
  only at closure when needed. No unrelated applications or frameworks.
- Current branch: feat/monorepo-containerization, based on f327ed0.
  Original branch: fix/backend-seed-quantities.
- Preserve unrelated untracked odd/tasks/auth-frontend.md and
  odd/tasks/centralized-incident-manager.md; never stage them.
- Do not edit protected milestone contexts/root applications, tracker, infra,
  existing dependencies or real data. No VPS, publication or remote data actions
  have been performed. Delivery follows current session/repository authority.
- Root .env existed before Compose. Do not overwrite or inspect its contents.
  User explicitly approved synthetic-only verification, not real credentials,
  PostgreSQL/Supabase access, mail/reset operations or dotenv/template reads.
- .env.example access was blocked. Leave that generated file physically untouched
  and ignored, outside delivery; no alternate read/copy/hash/staging. Configuration
  documentation is independently authored in README from public variable contracts.

## Tasks

- [x] T1 — Adapt public website minimally to Next.js. **Done.**
  Preserve content/design, static files and /uis/website URL.
  Commit: 4545d9e94060c029bf607fc7ad4bfbe38dc08cb6
  (feat(ui): add Next.js public website host).
- [x] T2 — Package both UIs in one Node Alpine container. **Done.**
  Independent installs, dual Next dev, private allowlisted Node legacy server,
  process lifecycle handling and Docker ignore rules.
  Commit: 8397d13416bc2ae89bbefce1e5bab7ace561ccd3
  (feat(docker): package website and backoffice in one UI image).
- [ ] T3 — Package FastAPI and compose development services. **In progress.**
  Implementation, scoped runtime checks and native review passed; commit pending.
  Use existing API requirements, Python3.11/uv, additional shared-module contexts,
  two services, explicit environment allowlists and isolated data/dependency volumes.
- [ ] T3b — Connect browser requests through the Next API proxy. **Pending.**
  Same-origin browser paths, internal service-name URL, opt-in configuration;
  preserve static/local apiPort behavior and shared login/session/inventory identity.
- [ ] T4 — Verify local integration and document reproducible setup. **Pending.**
  Prove browser/API integration and bind-edit hot reload without image rebuilding;
  check setup, ignored secrets and remaining assignment criteria. Real PostgreSQL
  and live data are separate authorization boundaries, never implied by HTTP503.
- [ ] T5 — Deploy to existing VPS and prepare evidence. **Pending authorization.**
  Confirm SSH target, ports/services, production config and side effects first.
  Collect local/VPS evidence; publishing/PR/merge are separate delivery decisions.

## Implementation decisions

- Website uses plain JSX App Router, existing CSS and pinned Next/React versions.
- UI image context is ./uis, copying only website/backoffice/launcher. Container
  Next ports3000/3001; private legacy upstream127.0.0.1:3002. Validated
  BACKOFFICE_LEGACY_PORT retains local default3001 outside containers.
- UI source mounts are exactly website, backoffice and read-only start.sh, not
  all uis or tracker. Four named volumes isolate per-app node_modules/.next.
- API image context is ./services, with Compose additional_contexts for shared/
  and packages/shared/. Copy only required Python modules, no scripts or data.
  Existing requirements unchanged; virtualenv remains outside source mounts.
- API source/module mounts plus separate /app/data named volume; tmpfs masks
  pre-existing source-mounted services/api/data. No migration of existing users
  or suppliers; test startup's supplier bootstrap affects only new isolated storage.
- Compose requires BuildKit/Compose2.17+. Explicit environment allowlists keep
  backend secrets out of UI. Empty DATABASE_URL deliberately yields inventory503.
- Browser API proxy is separate T3b: Docker DNS is not browser DNS. Config script
  must be harmless under static/local hosting, not introduce missing-script404s.

## Verification evidence

### T1

- Writer RED: missing manifest; GREEN2/2 HTTP/config tests, zero skips.
- Independent browser375px/1280px: content, cards, anchors, focus/skip link passed;
  no horizontal overflow, console/page errors or failed resources. Legacy static
  files unchanged; owned browser/server stopped, port3310 released.
- Review review-ee589c538e3d4f4d approved and exactly acknowledged (authority burned).
  Passive status documentation followed; source unchanged.

### T2

- Writer RED2passed/4failed, GREEN6/6, expanded8/8 lifecycle/rewrite/server tests;
  independent8/8 plus shell/Node syntax and whitespace checks passed.
- Real Docker build/start: website3000, backoffice3001, private legacy3002.
  Website smoke2/2; login/assets/inventory validation shell200, private paths404.
  Normal stop exit0; website CLI termination produced fail-fast exit1.
- Owned containers removed, ports3310/3311 released. Retained image
  trackflow-ui:t2-verify-4545d9e (169d1d1b728a).
- Review review-e00d2b1f129846a1 approved four lenses and exactly acknowledged.
  Non-blocking informational R3-shutdown-escalation at uis/tests/start.test.mjs:29
  is later follow-up, not a correction or reason to reopen review.

### T3

- Config contract RED0/4, GREEN4/4 then5/5. Restricting broad UI mount observed
  RED4/5 then GREEN5/5. Tests use literal synthetic settings, sanitized env and
  COMPOSE_DISABLE_ENV_FILE=1; they do not read .env.example.
- Independent5/5 config tests; both images built. API standalone imports passed
  without source mounts/network, including shared and packages.shared modules.
- Synthetic project trackflow-t3-verify-cf2fa4d621: API openapi/website/login200,
  Uvicorn0.0.0.0:8000 with reloader, correct exact source/storage/tmpfs mounts.
  UI-container fetch http://api:8000/openapi.json200 proves service-name DNS.
- Isolated POST/users201, form POST/auth/login200, authenticated inventory503
  with empty DATABASE_URL. No real credentials or external database used.
- Two containers/five volumes/network/temp config removed. Initial plain port
  rebindEADDRINUSE was followed by connection-refusal/reusable-bind checks proving
  no listeners on3320/3321/8320. Images retained: project-api:latest c38700e711d6,
  project-ui:latest f092edb99e1f (project prefix above).
- Known generated mutation: Next changed two tracked next-env.d.ts imports to
  .next/dev/types. Parent restored ONLY those two lines; file diff is empty.
  No other scoped source mutation observed; final git diff --check passed.
- Earlier verification stops: parent template-path typo, protected-template read
  denial, overly broad UI mount including tracker filenames, and expected Next
  generated output. All were handled without accessing protected dotenv contents.
  No secret-integrity hash claim is made. Build/runtime checks were not repeated
  unnecessarily after passive documentation normalization.

## Current boundary and next step

- T3 setup docs now use an independently authored README settings table. Both
  .env and .env.example remain ignored; .gitignore matches its original state.
- Native ASSESS cannot assess untracked candidates in this runtime; its conservative
  independent-verifier requirement has been fulfilled for T1, T2 and T3.
- T3 review review-9f4d67b3294f8d18 approved and exact acknowledgement burned
  authority for target sha256:1c1b1b9a5279acd158953435c23b2291d43162d05108fa1453b0d6f44b70b009.
  Only passive status docs changed after review; source stayed unchanged.
- Next: local T3 work-unit commit, then bounded T3b browser/API mapping.
  Never include ignored template or unrelated task notes.
- Next.js production builds, browser proxy, bind-edit hot reload, configured
  PostgreSQL and VPS acceptance are not established by the current packaging tests.
- Commits: T1 4545d9e; T2 8397d13. No push, PR, merge or VPS actions.
