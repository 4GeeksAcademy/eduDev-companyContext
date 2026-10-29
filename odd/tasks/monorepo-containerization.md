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
  existing application dependencies or real data. Read-only VPS SSH diagnostics
  completed; no application deployment, publication or remote data changes.
- User authorized checking and installing missing Docker Engine/Compose on the
  selected VPS, without modifying or restarting existing services. Stop before
  package removals/upgrades, configuration conflicts or unclear side effects.
  Starting new Docker-owned services is part of installation, not app deployment.
- User separately authorized a dedicated SSH key: generate it outside Git without
  overwriting an existing identity; the human adds only its public key through
  the VPS console, preserving existing authorized keys. No SSH daemon restart,
  dotenv consumption, private-key disclosure or relaxed host checking.
- Root .env existed before Compose. Do not overwrite or inspect its contents.
  User authorized canonical runtime loading of VPS_IP/VPS_USER/VPS_PASSWORD
  (optional VPS_PORT) solely for SSH authentication, with strict host validation
  and no secret output. Synthetic-only application checks remain the boundary:
  no real application credentials, PostgreSQL/Supabase or mail/reset operations.
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
- [x] T4 — Verify local integration and document reproducible setup. **Done for synthetic local scope.**
  Commit: fc344a77e414820cc52837f86a163df49bb7646f
  (docs(docker): record scoped local reload verification).
  Prove browser/API integration and bind-edit hot reload without image rebuilding;
  check setup, ignored secrets and remaining assignment criteria. Real PostgreSQL
  and live data are separate authorization boundaries, never implied by HTTP503.
- [x] T5a — Prepare Docker Engine/Compose on the selected VPS. **Done.**
  Commit: 0552b97ecc19b431ef43d079261f53ad8820de2c
  (docs(docker): record verified VPS runtime preparation).
  Read-only diagnostics confirmed missing packages/binaries/services/sockets,
  Ubuntu22.04/amd64 and root privileges. Use the official Docker APT repository;
  simulate package changes, preserve existing services and verify the new daemon
  and Compose. No application deployment or existing runtime replacement.
  The initial writer attempt stopped before SSH because its higher-priority
  policy prohibits consuming .env. That blocked attempt installed nothing.
  Dedicated key authentication is authorized. ssh-keygen completed successfully:
  /home/lab/.ssh/trackflow_4geeks_ed25519, outside Git, with no overwrite or private
  key output. The read tool also blocked the public .pub file; do not retrieve it
  through another tool. Human reported ssh-copy-id completion and supplied the
  nonsecret target. One strict key-only SSH check on port22 succeeded with UID0;
  no password fallback, dotenv consumption or protected-file contents retrieved.
  Installation subsequently succeeded through standard key-only SSH; sanitized
  evidence is recorded below. Independent runtime and isolated hello-world
  verification passed; the documentation work-unit commit is recorded above.
- [x] T5b — Prepare and verify minimal production packaging locally. **Done, with disclosed limits.**
  Commit: b57dfb08d2e982a524d6da051548aecc5893d8d8
  (feat(docker): add verified production container mode).
  Preserve default development Dockerfiles/Compose and reload behavior. Add opt-in
  production UI builds/startup and a separate two-service production Compose with
  no source binds, private API/Docker DNS and a dedicated new API data volume.
  Use the existing API image with a non-reload command override; no backend logic
  or dependency changes. Configure public Next proxy settings at build/runtime,
  never backend secrets. Observe focused RED/GREEN, one local image-build pass and
  isolated production runtime/memory checks; reuse valid development evidence.
  Production PostgreSQL configuration remains unavailable; blank DATABASE_URL
  implies inventory503, not full business acceptance. Do not inspect/copy blocked
  dotenv files or invent external credentials. Record a source work-unit commit.
- [ ] T5 — Deploy to existing VPS and prepare evidence. **Limited initial runtime running; in progress.**
  Initial runtime and sanitized evidence are independently verified. Private
  SQL/operator setup remains pending; delivery must disclose that limitation.
  Transfer the already verified images without rebuilding, use a new isolated
  deployment directory/project/data volume, and preserve existing workloads.
  Generate a fresh durable JWT privately on the server; do not reuse/inspect
  blocked credential files. With no approved SQL configuration available, blank
  DATABASE_URL is only an explicitly limited initial runtime, not inventory or
  full-business acceptance. Publish course UI ports only; keep API internal.
  Check fresh VPS resources and owned stack behavior before declaring rollout.
  User authorized end-to-end assignment deployment, local image builds and routine
  necessary steps without repeated approval prompts. Preserve OpenClaw, existing
  data and unrelated services; safety/credential-access controls still apply.
  Current capacity:1CPU,957MiBRAM/391MiBavailable,2GiBswap,9.6GiBdiskfree.
  Preserve listeners22/53/18789/43947 and the existing workload; lack of an
  OpenClaw process-name match does not prove absence. Prefer local image builds;
  production runtime/configuration and memory feasibility still need verification.
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

### T5b local packaging writer (before independent checks)

- Existing UI image now validates development/production mode, retaining dev as
  default. Per-app install layers include build dependencies; production builds
  website then backoffice inside Docker and starts direct Next start leaves.
  Private legacy server and fail-fast/reaping logic remain unchanged.
- Image-only docker-compose.production.yml defines exactly ui/api, named network,
  internal API8000, one non-reload worker and new production_api_data volume with
  fixed isolated paths. UI gets only public proxy/mode/legacy settings; JWT is
  required and API-only. UI production builds require1/http://api:8000 explicitly,
  matching runtime. Source binds and cache overlays are absent; logs rotate.
- `node --test tests/container-config.test.mjs uis/tests/start.test.mjs`:
  observed RED10pass/7fail of17 (missing production file/build contract/start mode
  and validation); GREEN17/17; final triangulation17/17, zero skips. Final config
  harness uses sanitized synthetic env, COMPOSE_DISABLE_ENV_FILE=1 and explicit
  --env-file /dev/null. Tests cover unchanged default dev leaves, production start,
  both modes' TERM/three child exits, invalid mode, missing image/JWT settings,
  topology/data/secrets/network and configurable ports. `sh -n uis/start.sh` passed.
- README documents exact local build contexts/args, image-only target startup and
  isolated synthetic loopback/project check. No builds/runtime/browser/SSH, secret
  reads, real DB/mail, native review or Git delivery by this writer. Root dev
  Compose/services Dockerfile, dependencies and business logic remain untouched.
- T5b remains in progress: parent owns one production build/runtime/memory pass,
  independent checks, review and commit. No resource-fit claim; PostgreSQL/schema/
  RLS readiness missing, inventory503 expected with blank URL. Favicon404 retained.
  Remote deployment already authorized and pending, not newly blocked on approval.

### T5a preflight

- Two authorized read-only SSH connections completed with existing-host-key
  verification. Credential values, dotenv contents and SSH configuration were
  never displayed; temporary secret-free ASKPASS helpers were removed.
- Docker/dockerd/containerd/docker-compose command lookups exited1; twelve
  requested runtime package queries exited1. Common binaries, local sockets,
  Docker APT/key/config paths were absent; Docker/containerd units were not-found.
  No conflicting package was found in the checked set; nonstandard installations
  and arbitrarily named repository files were not exhaustively excluded.
- Current official instructions support Ubuntu22.04/amd64:
  https://docs.docker.com/engine/install/ubuntu/ . No convenience script,
  package removals, system upgrade, user-group changes or app port publication.
- Infrastructure installation has no meaningful application RED/GREEN cycle;
  use observed preflight, package-plan checks, daemon/Compose functional checks
  and preservation checks. Do not repeat completed application test suites.

### T5a installation self-checks

- Strict key-only OpenSSH completed two useful sessions with exit0 and no stderr:
  immediate read-only preservation/network checks, then a serialized installation
  transaction with its own fresh baseline. No dotenv, password or ASKPASS helper
  was used; no key/config/known-hosts contents were retrieved.
- Remaining docker-doc/docker-buildx conflicts were absent. New Docker key/source
  and daemon configuration paths were absent. Native nftables had zero tables/rules;
  iptables/ip6tables had no rules or restrictive policies. Only standard route
  tables were present, with no route overlapping Docker's default172.17.0.0/16.
  Initial IPv4/IPv6 forwarding was0. These are bounded compatibility checks, not
  exhaustive proof against every nonstandard installation or future network effect.
- Created only new official repository files /etc/apt/keyrings/docker.asc (0644)
  and /etc/apt/sources.list.d/docker.sources (Jammy/stable/amd64, Signed-By).
  HTTPS key retrieval passed with TLS verification; signed APT index update exit0,
  no APT warning/error prefixes. Existing curl/ca-certificates were reused.
- APT simulation exit0: exactly5 new packages,0 upgrades,0 removals, no additional
  dependencies. Installed the inspected explicit versions with no recommends,
  no remove/no upgrade, process-only DEBIAN_FRONTEND=noninteractive and
  NEEDRESTART_MODE=l. Installation exit0; installed-new count5, and every
  previously installed package retained its version.
  - docker-ce / docker-ce-cli: 5:29.9.2-1~ubuntu.22.04~jammy
  - containerd.io: 2.4.2-3~ubuntu.22.04~jammy
  - docker-buildx-plugin: 0.38.1-1~ubuntu.22.04~jammy
  - docker-compose-plugin: 5.6.1-1~ubuntu.22.04~jammy
- New docker.service, docker.socket and containerd.service were active. Local
  Unix-socket /_ping returned OK; Compose5.6.1 meets >=2.17; Buildx v0.38.1
  was available. No dockerd/containerd TCP listener and zero containers.
- All20 previously running services retained MainPID and monotonic main-process
  start timestamps. All7 pre-existing TCP/UDP listener records, including owner
  metadata, were preserved; zero new listener records. Ports22/53/18789/43947
  remained represented. No existing package upgrade/removal, service restart,
  manual firewall operation, public-port exposure or application operation was run.
- New package-managed runtime/services/socket/bridge and Docker-owned network effects
  are installation state retained on the VPS, not rolled back. No helper files
  were created. Optional hello-world pull/run was skipped; no application suites
  or builds were repeated. Infrastructure checks replace an inapplicable app
  RED/GREEN cycle. APP NOT DEPLOYED; production/configuration/live DB unverified.
- At writer handoff, independent verification and the documentation commit were
  pending; the subsequent verifier evidence follows. T5 deployment stays separate.

### T5a independent verification

- Separate verifier completed one strict key-only SSH session, exit0/no stderr.
  Five package status/version queries passed. Unix-socket /_ping returned OK;
  Docker29.9.2, Compose5.6.1 and Buildx0.38.1 were independently observed, with
  Docker service/socket and containerd active. Explicit local Unix host and an
  empty config-directory override avoided ambient contexts/registry credentials.
- One public hello-world container ran with --rm, --network none,32MiB memory and
  16PID limit: exit0 and expected greeting. No binds, published ports or secrets.
  Owned container absent afterward; zero containers remain. Retained public image:
  hello-world@sha256:c567b231f65614688711a75f31518a064258a51d442117a3e771a3a8fdba78ef.
- TCP ports22/53/18789/43947 were unchanged before/after smoke; no Docker TCP API
  listener. Historical preservation of20service identities,7TCP/UDP owners and
  previous package versions remains writer-recorded; no baseline artifact was
  available for independent reconstruction. Do not overstate this evidence.
- Native ASSESS was unassessable because unrelated untracked task notes require
  declaration. Its conservative separate-verifier requirement was fulfilled;
  unrelated files were neither selected nor changed. This passive documentation
  closure uses structural/diff checks, not a new native source-review transaction.
- Scoped diff/readback and git diff --check passed; no credentials, endpoint or
  key bytes in the diff. Prior T1–T4 evidence/favicon404 warning is retained.
  No application build/test/deployment or live database check was performed.

### T5b independent production verification

- Focused tests17/17 and whitespace checks passed; no host source/generated-type
  mutation. Exactly one local sequential build per image completed, including
  both Next production builds; API used cached layers. Both images are amd64.
- Retained tags: trackflow-t5b-verify-0552b97-0622-ui:production (720b393714f3,
  1462694552 bytes) and trackflow-t5b-verify-0552b97-0622-api:production
  (af504a8e775c,343379057 bytes). Sizes are image metadata, not transfer/disk deltas.
- Isolated two-service production stack had no source mounts/API published port,
  no UI backend-secret names, zero restarts and correct production processes.
  Internal api:8000/openapi.json200, website/login/assets/config200; config exposes
  only '/api'. Chromium login/auth-me/15suppliers/private redirects/signout passed,
  with same-origin API requests and zero page exceptions. Blank SQL inventory503
  and explicit favicon404 remain disclosed; no full-business/clean-console claim.
- API recreation changed its container ID but retained volume/user/login readiness.
  Actual limits: UI512MiB/.75CPU,API256MiB/.25CPU. Warmed Docker memory252.3MiB;
  sum of separately recorded cgroup peaks287.2MiB, not necessarily simultaneous.
  No OOM; this short local check does not prove coexistence/load capacity on VPS.
- Evidence: /tmp/trackflow-t5b-verify-0552b97-0622/{images.json,runtime.json,
  compose-ps.txt,browser.json,backoffice.png,persistence.txt}, plus build logs.
  Parent spot-checked browser.json. Owned containers/network/volume/helpers removed;
  ports3340/3341 released, images/evidence retained. Optional docker top -eo args
  failed; ordinary docker top succeeded. No SSH, real DB/mail or dependency changes.
- Native review review-f69c096725adf830 approved all four lenses and exact
  acknowledgement burned authority; staged tree matched the reviewed tree before
  commit b57dfb0. Informational R3-args-readiness at uis/tests/start.test.mjs:52
  is later follow-up, not a correction or reason to reopen this review.
  Responsive audit, sustained load, real PostgreSQL/schema/RLS acceptance and
  deployment were not performed by this local check.

## T5 limited initial rollout — current evidence

- Exact retained UI/API images imported through streamed save/gzip/SSH/load; all
  pipeline statuses0, remote IDs match full approved IDs in the
  [evidence guide](../../docs/evidence/containerization/README.md). No rebuild/push.
  Committed production Compose hash matches remote bytes; source b57dfb0.
- Created only new /opt/trackflow-containerization/ with docker-compose.production.yml,
  resources.override.yml, deployment-marker.json, empty docker-config/ and private
  deployment.env. Private config exclusive-created root:root0600 using new server
  CSPRNG JWT, never read back/hashed/copied. SQL/mail blank; public UI CORS set.
- Native config --quiet and up -d --no-build --pull never passed. Exactly UI/API
  running in project trackflow-production; network trackflow-production_network;
  retained volume trackflow-production_production_api_data mounted only by API.
  API internal8000/private legacy3002 unpublished, no source mounts. Verified caps
  UI512MiB/.75CPU and API256MiB/.25CPU; restart0/OOMfalse.
- Immediate pre-write available RAM350MiB/free swap1816MiB/disk9838739456bytes;
  warmed available249MiB/free swap1770MiB/disk8031633408bytes. Docker memory
  UI158.9MiB/API78.98MiB. All22 fresh baseline service PID/start identities and
  seven listener records preserved; only planned UI3000/3001 listeners added.
- Early10-second API connection/proxy500 was startup-not-ready; bounded follow-up
  returned internal OpenAPI200 and same-origin anonymous auth/me401. Website,
  login, auth.js, styles.css/config200 both VPS and external HTTP. Config only /api.
  No real credentials/public authenticated traffic, users/admin JWTs, SQL or mail.
- Evidence preserves local synthetic Compose text/browser PNG; no new terminal
  screenshot tooling. HTTP/noTLS, first-admin unconfigured, historical favicon404,
  blank-SQL expected inventory503 and short-smoke limits explicit. No full business
  acceptance. Parent independent live check, approved private SQL and delivery
  closure remain; T5 unchecked. Owned configuration/images/data retained.
- This current rollout supersedes historical APP NOT DEPLOYED/production-pending
  statements in the chronological record below. No commit/push/PR/new native review.

### T5 independent live verification and delivery evidence

- One independent strict SSH check confirmed exact deployed image IDs, two running
  containers, zero OOM/restarts, enforced caps/mounts and unpublished API. Internal
  api:8000/openapi.json200; parent external website/login200 and proxy401 passed.
- Current containers146.1/72.38MiB; host available282MiB, free swap1754MiB and disk
  8031506432bytes. Existing22/53/18789/43947 listeners remain with planned3000/3001;
  no public8000/3002. Historical service-identity preservation remains writer-recorded.
- Independent passive diff/sanitization, original-artifact cmp and whitespace
  checks passed. Added local-containers.png as a visibly labelled faithful render
  of authentic recorded local Compose output, not a new terminal/live-state capture.
  No new tooling, application reruns or private data were used for that image.
- Publication target is existing project4GeeksAcademy/eduDev-companyContext, main,
  with native GH WRITE permission confirmed. Keep one assignment PR with a clear
  work-unit review map and disclose the aggregate size (mostly docs/tests/lockfile);
  do not invent project-specific approved-issue/type/size-label gates or auto-merge.
- Private SQL/admin configuration and full business acceptance remain pending;
  HTTP/noTLS, favicon404 and no sustained-load claim stay explicit in delivery.

## Current boundary and next step

- T3 setup docs now use an independently authored README settings table. Both
  .env and .env.example remain ignored; .gitignore matches its original state.
- Native ASSESS cannot assess untracked candidates in this runtime; its conservative
  independent-verifier requirement has been fulfilled for T1, T2 and T3.
- T3 review review-9f4d67b3294f8d18 approved and exact acknowledgement burned
  authority for target sha256:1c1b1b9a5279acd158953435c23b2291d43162d05108fa1453b0d6f44b70b009.
  Only passive status docs changed after review; source stayed unchanged.
- T3 committed successfully as 5a52c85; only unrelated task notes remained.
  T3b committed as d4404a0; T4 evidence committed as fc344a7. T5a independent
  runtime verification passed and evidence was committed as0552b97. T5b source
  is committed asb57dfb0; initial VPS rollout and independent live checks passed.
  Next: publish sanitized assignment evidence/PR and obtain private SQL/operator
  configuration without exposing credentials. Do not repeat routine approvals.
  Do not repeat completed local tests or inspect protected dotenv files.
  Application deployment is now authorized; SSH credential consumption
  is not permission to copy application secrets or access real data.
  Never include ignored template or unrelated task notes.
- Local synthetic packaging, proxy/auth and bind-edit reload are verified with
  disclosed warnings. Production images and isolated runtime/browser behavior are
  now verified, including anonymous live VPS readiness. Private SQL/operator admin
  setup and full business acceptance remain pending. No clean-console claim.
- Commits: T1 4545d9e; T2 8397d13; T3 5a52c85; T3b d4404a0; T4 fc344a7;
  T5a 0552b97; T5b b57dfb0.
  The application containers are deployed in a limited initial configuration;
  independent live infrastructure checks passed. SQL/admin and HTTP/TLS limits
  remain explicit. Evidence publication is next; no push, PR or merge yet.
