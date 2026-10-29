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
- [x] T3 — Package FastAPI and compose development services. **Done.**
  Scoped runtime checks and native review passed.
  Commit: 5a52c85e675b15341b7093d6526d69957a338171
  (feat(docker): compose FastAPI with isolated development storage).
  Use existing API requirements, Python3.11/uv, additional shared-module contexts,
  two services, explicit environment allowlists and isolated data/dependency volumes.
- [x] T3b — Connect browser requests through the Next API proxy. **Done, with disclosed warning.**
  Code27/27, typecheck, bounded functional browser assertions and native review passed.
  Strict console assertion failed on cosmetic favicon404; warning retained below.
  Commit: d4404a0d3a9923e632031e64f9765878342ee80c
  (feat(ui): proxy backoffice API requests through Next).
- [ ] T4 — Verify local integration and document reproducible setup. **Checks complete; commit pending.**
  Prove browser/API integration and bind-edit hot reload without image rebuilding;
  check setup, ignored secrets and remaining assignment criteria. Real PostgreSQL
  and live data are separate authorization boundaries, never implied by HTTP503.
- [ ] T5 — Deploy to existing VPS and prepare evidence. **Pending authorization.**
  User selected the 4Geeks VPS previously used by eduDev-openclaw; Engram16421
  records connection variables in that project's ignored .env.local (unread).
  Historical1CPU/~1GiBRAM+2GiBswap is not current capacity proof. Confirm SSH
  target, existing OpenClaw workload, ports/config and side effects first.
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
- T3b uses /uis/backoffice/api-config.js: static file is a no-op; a dynamic
  Next route returns fixed window.TRACKFLOW_API_BASE_URL='/api' only with
  server-side TRACKFLOW_API_PROXY=1, otherwise harmless200. Never serialize
  upstream URLs/secrets. Legacy pages load it before modules; root Next layout
  uses beforeInteractive. Keep it outside the legacy rewrite/server allowlist.
- Add only the four used API families: /api/auth, /api/suppliers, /api/inventory,
  /api/api/incidents to corresponding backend paths. The doubled incident prefix
  preserves existing client paths. Validate server-only TRACKFLOW_API_ORIGIN as
  a credential-free HTTP(S) origin; Compose gets values through root.env variables.
  Existing auth/inventory helpers already accept '/api'; preserve their source.
- T3b tests cover dynamic/no-op config, script ordering, origin validation/fixed
  rewrites, relative API helpers and unchanged local apiPort behavior. Synthetic
  config contract tests include only the two new nonsecret UI variables.

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

### T3b

- Writer RED21/26 included four implementation failures and a missing test
  AbortSignal; fixture corrected, GREEN26/26 then27/27; local tsc passed.
  Independent27/27, UI-only image build and enabled/disabled config HTTP passed.
- Four enabled families reached401; users/profiles404; config200/no-store exposes
  only '/api', disabled200no-op removes routing. No internal origin in browser JS.
- Browser hang at127.0.0.1 was traced to Next's dev-origin HMR rejection. A single
  script A/B did not resolve it; documented localhost produced HMR101 and correct
  hydration/redirect without source changes or disabled browser security.
- Final bounded browser assertions passed on localhost: registration201, actual
  login200, auth/me200, suppliers200 with visible rows, inventory503 with visible
  unavailable message (no PostgreSQL). Signout cleared the session and private
  navigation returned to same-origin login. Config preceded first auth request;
  every observed browser request stayed on backoffice origin. Zero page exceptions.
- Verification caveats: an earlier broad alert selector collided with Next's
  route-announcer. The final strict-console assertion still exited nonzero due
  to favicon.ico404; follow-up identified the cosmetic resource, not proxy/auth
  failure. HEAD has no favicon/icon asset and T3b adds none. Keep this warning
  visible; do not claim a clean console or a clean verifier-command exit.
- Owned browser/2containers/5volumes/network/tempconfig cleaned;3330/3331/8330
  released. Retained image trackflow-t3b-verify-d667720d-ui:latest. Parent restored
  only the2generated next-env imports. No other scoped source mutation reported.
- Review review-ef2fad0868e2eceb approved four lenses; exact acknowledgement
  burned authority for target sha256:88b08820cbf12ea631f98a97611235e11720bb54f5b2670249faaa5ffc201909.
  Informational R4-build-runtime at the API-config route:4-5 is a later production
  configuration follow-up, not a correction or reason to rerun this review.

### T4

- Disposable committed-source fixture proved backoffice marker/restoration in
  place and API title marker/restoration through Uvicorn reload. Container/image
  IDs unchanged, restart counts0. No builds or original protected-source edits.
- Website initially hit an overly strict verifier zero-navigation assertion;
  automatic document reload is valid for this assignment. Focused follow-up
  observed both marker and restoration automatically, one document navigation
  each, no manual refresh. Parent read nonempty saved JSON confirming both.
- Evidence: /tmp/trackflow-t4-436f3f3d-kzsmkgy9/{compose-ps.txt,identities.json}
  and /tmp/trackflow-web-91819337-uq2imyx0/website-evidence.json.
- Owned containers/volumes/network/fixtures removed; test ports released. Original
  source unchanged. Known favicon404 disclosed; no new page errors observed.
- Root .env is ignored/untracked; zero commits touching it in available local Git
  refs. No dotenv contents read. Actual user configuration/live PostgreSQL not
  verified. Documentation-only closure uses readback/diff checks, not new suites.

## Current boundary and next step

- T3 setup docs now use an independently authored README settings table. Both
  .env and .env.example remain ignored; .gitignore matches its original state.
- Native ASSESS cannot assess untracked candidates in this runtime; its conservative
  independent-verifier requirement has been fulfilled for T1, T2 and T3.
- T3 review review-9f4d67b3294f8d18 approved and exact acknowledgement burned
  authority for target sha256:1c1b1b9a5279acd158953435c23b2291d43162d05108fa1453b0d6f44b70b009.
  Only passive status docs changed after review; source stayed unchanged.
- T3 committed successfully as 5a52c85; only unrelated task notes remained.
  T3b committed as d4404a0. Next: commit T4's passive verification evidence,
  then request safe read-only VPS access/preflight. Do not restart completed
  local tests, access protected dotenv files or deploy before authorization.
  Never include ignored template or unrelated task notes.
- Local synthetic packaging, proxy/auth and bind-edit reload are verified with
  disclosed warnings. Actual user environment, production builds/configuration,
  live PostgreSQL and VPS acceptance remain pending. No clean-console claim.
- Commits: T1 4545d9e; T2 8397d13; T3 5a52c85; T3b d4404a0.
  No push, PR, merge or VPS actions.
