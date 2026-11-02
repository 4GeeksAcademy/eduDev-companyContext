# Performance caching
Implement the 4Geeks caching assignment with measured, minimal changes to existing Next.js/FastAPI behavior.
Branch: `feature/caching-optimisation`; base: `2ee31dd17c2870172bc4c107f2afc25c90567a95`; delivery: feature-branch-chain (user-selected; ~400 authored lines per child); runners: existing uv/pytest, Node tests, TypeScript and scoped browser checks.

## Specs

### S1 — User scope and authorization
> Tenemos un nuevo trabajo para este proyecto, te voy a dejar el README.md para que lo leas 100% y lo analices a fondo para poder cumplir con todos los puntos del trabajo. Recuerda que es un trabajo para el bootcamp AI Engineering de 4geeks y debemos mantenerlo simple y usar solo las tecnologías mencionadas. Cuando necesites hacer verificaciones, solo hazlas acotadas a lo que estés implementando, deja verificaciones completas solamente para cuando termines de implementar y solo si hace falta. Si necesitas mi intervención en algún punto o hay algo que te genera dudas, solo dimelo o preguntame antes de continuar. https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/projects/ai-eng-performance-caching/README.md

> ok, entonces avanza, porque debemos cumplir con la tarea del readme

The last authorization follows the explicit explanation that `services/api/` changes are required and protected by AGENTS.md. No real-data, deployment, dependency, infra or Tracker changes are included.

### S2 — Frontend (verbatim assignment requirements)
- "Audit your Next.js application and identify at least **two components or routes** that are good candidates for Lazy Loading. Document your reasoning: why is deferring this component's load justified?"
- "Implement Lazy Loading for those components using `next/dynamic` or `React.lazy`."
- "Audit your components for expensive computed values. Identify at least **one `useMemo` opportunity** where the computation is non-trivial and the dependency array is well-defined."
- "Implement the `useMemo` optimisation. Do not apply it to trivial calculations."
- "Only apply it when profiling shows the computation is genuinely expensive — premature memoization adds complexity without benefit."

### S3 — Backend (verbatim assignment requirements)
- "List all endpoints in your FastAPI application. For each one, assess: (a) how expensive is the operation? (b) how frequently is it called? (c) how often does the underlying data change?"
- "Identify at least **two endpoints** that meet the cost + frequency + stability criteria for caching."
- "Implement caching for those endpoints. You may use an in-memory dictionary with TTL logic, `functools.lru_cache` where applicable, or a Redis-based cache if your stack supports it."
- "Implement cache invalidation: if the underlying data changes (e.g., a write operation), the relevant cached values must be cleared or marked stale."
- "Do not cache endpoints that return personalised, session-specific, or sensitive data without scoping the cache key to the authenticated user. A shared cache key for private data is a data leak, not a performance gain."
- "At least two backend endpoints are cached with TTL-based expiry."

### S4 — Evidence (verbatim assignment guidance)
- "Before you cache anything, you need data."
- "Use your frontend or repeat the same requests (same URL, same query params)."
- "Ask your **coding agent** to generate a **seeder** (script in your stack: Alembic, Prisma seed, Django management command, etc.) or a **SQL script** that inserts many records, then review and run it locally."
- "Prioritise **data quality**, not just row count: varied names, categories, dates, prices, and valid foreign keys so filters, joins, sorts, and aggregations behave like production — not five hundred identical `\"test\"` rows."
- "Re-run the timing middleware after seeding. In `CACHING_REPORT.md`, note approximate row counts before vs. after and how latency on your chosen endpoints changed."

Use isolated synthetic stores only. Distinguish local measurements, estimated frequency and production claims. Preserve existing public interfaces, error bodies, permissions and persistence behavior.

### S5 — Report (verbatim assignment requirements)
- "Write a `CACHING_REPORT.md` (or equivalent) in your monorepo with the following sections:"
- "**Frontend decisions**: which components were lazy-loaded and why; which values were memoized and what the measured or estimated benefit is."
- "**Backend decisions**: for each cached endpoint, document the operation cost, call frequency estimate, TTL chosen, and invalidation strategy."
- "**Tradeoffs acknowledged**: at least one explicit discussion of a data freshness tradeoff — where you chose a specific TTL and why that level of potential staleness is acceptable for this use case."
- "**What was not cached and why**: identify at least one endpoint or component you considered but decided against caching, with justification."
- "Decisions in the report are specific and justified — not generic (\"we cached this because it's slow\")."

### S6 — Delivery (verbatim assignment requirements)
- "Create a new branch: `git switch -c feature/caching-optimisation`"
- "Make sure both the frontend and backend run correctly before making any changes."
- "Push your branch to GitHub and open a Pull Request to `main` in your transversal project repository. Share the PR link according to your instructor's instructions."

Branch created; publishing/merge require separate human authorization. First establish bounded isolated runtime baselines, not global suites. Frontend and backend are independent units; commits retain tests and documentation with each behavior.

## Tasks
- T1 | S1,S3–S4,S6 | delegated backend unit, initially parallel with frontend (several files, independent surfaces; context backstop active) | done (implementation and independent functional verification only) | commit pending in T4; risk items2/4; cache11pass, corrected-blocker independent6pass, broader68+3subtests reused.
- T5 | S1–S2,S4,S6 | delegated frontend unit (split from original T1) | done (implementation and measured focused verification) | commit pending T4; RED→GREEN2/2, preserved11/11, TypeScript/build passed,4browser fixtures/differential passed; final scoped integration in T3.
- T2 | S1,S3,S5 | delegated report unit (context backstop) | done (report and structural checks) | commit pending T4;31endpoint rows,18numeric checks,17links/anchors and whitespace passed; parent readback corrected desktop/mobile overflow scope.
- T3 | S1–S6 | inline final seam/mobile checks; backend independent high-risk verifier passed | done (scoped functional verification) | commit pending; parent seam11Python+13Node passed,390px4fixtures passed; wider unchanged real-auth/browser workflows not rerun.
- T4 | S1,S6 | inline reviewable commits/native review and close | in_progress | user selected feature-branch-chain; tracker then API/frontend/report children; no push/PR/merge authorization.

## Log
L1 — Original request:
> Tenemos un nuevo trabajo para este proyecto, te voy a dejar el README.md para que lo leas 100% y lo analices a fondo para poder cumplir con todos los puntos del trabajo. Recuerda que es un trabajo para el bootcamp AI Engineering de 4geeks y debemos mantenerlo simple y usar solo las tecnologías mencionadas. Cuando necesites hacer verificaciones, solo hazlas acotadas a lo que estés implementando, deja verificaciones completas solamente para cuando termines de implementar y solo si hace falta. Si necesitas mi intervención en algún punto o hay algo que te genera dudas, solo dimelo o preguntame antes de continuar. https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/projects/ai-eng-performance-caching/README.md

L2 — Clarification and authorization:
> Pero no entiendo, el trabajo pide cambios ahí directamente?
> ok, entonces avanza, porque debemos cumplir con la tarea del readme

Explained frontend + FastAPI requirements and protected `services/` confirmation. User authorized implementation. No code, tests or runtime changes during initial read-only exploration.

L3 — Baseline and routing:
- Base `2ee31dd17c2870172bc4c107f2afc25c90567a95`; new branch from existing checked-out history. Local main is stale; origin/main is at `3eae1f1`, current base adds two existing documentation commits, not new feature changes. Do not reset or rewrite them. Existing untracked `odd/tasks/auth-frontend.md` and `odd/tasks/centralized-incident-manager.md` are unrelated and preserved.
- RDD reads on (global). Native review only after actual implementation assessment; candidate consent is separate.
- Prefer incident list/summary for measured backend candidates to avoid making live stock stale. Existing `list_incidents`, `create_incident`, `update_incident_status` and store locking remain authoritative. Do not cache writes or bypass auth, validation or response schemas.
- Frontend hypotheses: lazy-load existing history and movement form only after the unchanged session gate mounts private content; memoize existing product option rendering on stable products while quantity/reference/tracking inputs rerender. Prove cost before retaining useMemo; do not add artificial product features. No successful measurement claimed yet.
- Planned scope is isolated local verification only. No real `.env`, Supabase, email, VPS, dependency installation, production data or deployment. Final report must distinguish fixtures from authenticated real-system evidence.

L4 — Implementation launched:
- Backend worker `mvzp9zje-2-1xkc` and frontend worker `mvzp9zkb-3-s9qa` run concurrently on disjoint edit surfaces. Both must measure before changes, use focused RED/GREEN and report per spec.
- Baseline production frontend build: `env -i PATH="$PATH" HOME="$HOME" NEXT_TELEMETRY_DISABLED=1 npm --prefix uis/backoffice run build` passed exit 0 in 4 seconds, before source mutation; all four inventory routes generated. No backoffice-root `.env*` files exist. This is build evidence, not authenticated browser acceptance.

L5 — Frontend prerequisite blocked:
- Frontend worker returned blocked with no source edits: repository node_modules contains Next Playwright adapters but no runnable Playwright installation. Deferred browser tool discovery also returned no matches.
- Baseline browser/profile and implementation are not claimed. The temporary-install choice was cancelled; no installation occurred. Backend worker remains independent and active.

L6 — User correction and recovered browser context:
> cancele la pregunta porque no tenemos ya un entorno para probar con playwright y chromium en lugar de estar instalando temporal a cada rato? busca en las memorias si es necesario, sino mejor ya dejemoslo instalado y disponible para cuando sea necesario así no lo tenemos que estar instalando de manera temporal a cada rato demorando cada prueba

- Engram observations 24772 and 24778 record existing playwright-core 1.62.1 at `/home/lab/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core` and Chromium at `/home/lab/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`. These historical observations do not yet prove present availability.
- Earlier unavailable-tooling conclusion was premature: repository dependencies were checked but cached tooling memory was missed. Prefer reuse; no installation is currently necessary or performed.
- Historical successful launch used Playwright defaults (Chromium sandbox disabled). Before reading outside-project paths and reusing this configuration, request exact-path permission with the sandbox tradeoff disclosed. Scope remains local synthetic fixtures, no real credentials or external pages. Once authorized/validated, resume the existing frontend worker rather than duplicate implementation.

L7 — User confirmed persistent tooling intent:
> Cancele porque quiero que ya lo dejes instalado si hace falta, para que quede disponible cuando lo necesite como te dije y no voplver a pasar por esto

- Current exact-path checks passed: existing playwright-core 1.62.1 and Chromium 151.0.7922.34. No installation is needed; none performed. `TESTING.md` now records reusable paths and persistence/cache-cleanup limits so discovery does not repeat.
- A single sandbox-enabled launch (`chromiumSandbox:true`, local in-memory page only, timeout10s) failed exit1 with `No usable sandbox!`; process/profile cleanup completed. Did not retry or downgrade to no-sandbox. This is host isolation support, not a missing package; reinstall is not a fix. Frontend awaits explicit sandbox decision or a usable sandbox environment.
- Backend worker completed: caching tests RED5failed/3passed then GREEN9passed; affected regression59passed+3subtests; differential31HTTP responses identical. User+DB+filter scoped30s cache,128entries, shared RLock invalidation. Synthetic50/1000-row7repeat before/after list medians1.628/7.771→1.095/1.641ms; summary1.327/7.376→1.008/.966ms;7warm scans→0. These are TestClient wall timings, not production/middleware medians.
- Native assess unassessable because untracked candidate declaration is required; no review started. Explicit risk-item2 escalation requires independent backend verification. Verifier `mvzpno4a-4-j7cp` is running once over the scoped unit; no full-suite/browser repeats.

L8 — Independent backend finding, correction required:
- Verifier's authorized combined suite passed68+3subtests in11.53s. A focused EIO-at-fsync probe reproduces new stale list/filter/summary after both create and status writes: TinyDB can change bytes before raising500, and current invalidation occurs only after successful return. Candidate probes2pass/2fail, applicable baseline probes3pass. Pre-existing partial persistence is an advisory; stale cache is the new blocker.
- Parent read the exact retained probes and implementation. One bounded correction will reproduce these HTTP failures, conservatively invalidate within the existing RLock before attempting storage mutation, and retain current validation and sanitized500 behavior. No TinyDB transaction redesign, new infrastructure or full-suite repeat. Then verifier rechecks only this blocker.
- Frontend remains independently blocked on explicit sandbox decision; no browser downgrade or system security change performed.

L9 — Backend correction implemented:
- Worker `mvzpuloo-5-hbiu` moved invalidation before validated insert/update attempts under the unchanged RLock. Added HTTP POST/PATCH fsync-error regressions checking both users' warmed list/filter/summary against uncached details; docs disclose conservative invalidation and no rollback guarantee.
- `uv run --no-sync pytest -p no:cacheprovider tests/test_caching.py -k partial -q`: RED exit1,2failed/9deselected; GREEN exit0,2passed/9deselected. Full caching-only guard11passed9.85s exit0; scoped diff check passed. Existing2deprecation warnings remain. No broader tests or benchmark rerun.
- Parent inspected source diff and whitespace; bugfix persisted as Engram25259. Original verifier confirmed entire baseline/candidate OpenAPI JSON identical before correction. Native assess of corrected untracked candidate remains unavailable for undeclared untracked paths; no native authority started. Same verifier will recheck only partial-write invalidation/direct regressions on fresh corrected snapshot.

L10 — Backend blocker independently resolved:
- Same verifier continuation `mvzpxyo6-6-l3en` used a fresh corrected snapshot: exact selected original partial-write probes, committed POST/PATCH regression, successful-write invalidation and lock-contention guard passed6/6 in5.51s exit0. Exact sanitized500 preserved; both users' list/filter/summary reflect persisted state. Existing2dependency warnings remain.
- S1/S3/S4/backend-baselineS6 pass for the completed backend unit with prior evidence reused explicitly. No benchmark, broad suite, schema or browser rerun. Single-process and nontransactional persistence limitations remain; no native review/commit/publication claimed.
- Verifier-owned scratch cleanup requested for `/tmp/trackflow-cache-verifier.VWLTl8` and `/tmp/trackflow-cache-recheck.ytEiMD`; no application or user data there. Parent owns cleanup.
- T1 now blocked solely on frontend browser sandbox authorization; T2 can document actual backend outcomes and all-endpoint assessment while clearly leaving frontend and full assignment acceptance pending.

L11 — Report draft checked; remaining scope waits on frontend decision:
- Documentation worker `mvzq122m-7-z47e` added CACHING_REPORT.md and appended memory-bank/progress.md. Structural check confirmed31unique method/path rows against7routers and serialization audit,12local links/anchors, component paths and whitespace. No runtime checks or invented frontend evidence.
- Parent read report fully, confirmed partial status/provenance, and removed redundant closing learning bullets. Full `git diff --check` passed before this passive trimming; final scoped whitespace check follows. Native assess still reports unassessable due undeclared untracked files; no independent verifier needed for passive report, no native review approval claimed.
- Verifier-owned scratch roots were removed after ownership/symlink checks. Initial cleanup command used absent `python` (exit127, no deletion); corrected host `python3` cleaned both exact paths successfully. No application/user data touched.
- Split original T1 into completed backend T1 and blocked frontend T5 so tracking does not hide finished work. T2 remains pending T5 despite completed backend report draft; T3 final integration and T4 commits/review/delivery remain pending. No commits/push/PR/deploy performed.
- Required external decision remained whether to allow sandbox-disabled Chromium for local synthetic fixtures only; no reinstall was needed. Superseded by L12.

L12 — Frontend browser authorization and readiness:
> si, autorizo

- Explicit answer to parent question authorizes existing Chromium without sandbox only for local synthetic fixtures, no real credentials or external navigation. It does not authorize system security changes or production access.
- One readiness check with chromiumSandbox:false passed exit0: Chromium151.0.7922.34 rendered in-memory title/content with all browser network requests blocked; owned browser closed. No package download/install. Baseline frontend source remains unchanged (`git diff --name-only -- uis/backoffice` empty), so prior successful production build remains available for baseline checks.
- T5 unblocked and resumed; T2 awaits actual frontend evidence, T3 final checks and T4 review/commits follow. No task falsely marked complete.

L13 — Frontend baseline harness ready:
- Resumed worker `mvzqib40-8-k9tc` returned partial with only `uis/backoffice/tests/profile-inventory.mjs` added. Application source remains unchanged; baseline must precede optimization.
- Parent read the complete harness: owned loopback3397, explicit cached tools, sandbox:false authorization, synthetic auth/inventory intercepts, external request blocking, delayed validation chunk observation, 6/1000SKU scenarios, form prefill/submit/reset, and owned resource cleanup. Timing is script/task CPU and fill+frame latency, not isolated option creation or productionINP.
- Parent launched `node uis/backoffice/tests/profile-inventory.mjs` as background job2, log `/tmp/gpdH8goB/gentle-jobs-So7kGa/job-2.log`; no extra baseline build. Result below supersedes pending status.

L14 — Baseline observed and implementation resumed:
- Job2 passed exit0 in4s. Parent parsed complete JSON (read across50KB tool boundary, no discarded measurements). All4fixture scenarios returned200, hid private UI/data requests before validation, preserved prefill, synthetic submissions/reset, and had zero pageerrors/blocked requests; owned resources closed. No real authentication/API acceptance.
- History chunk3447bytes and form chunk5850bytes loaded BEFORE validation. On form routes, navigation also prefetched history AFTER validation; do not claim complete cross-route exclusion or confuse existing Next route splitting with deferred imports.
-30edits: inbound6SKU script10.833ms/task80.023ms/median fill+rAF16.681922ms; inbound1000 script84.109ms/task163.907ms/frame16.673833ms; outbound1000 script80.051ms/task156.589ms/frame16.684804ms. CPU totals include all script/task work; not isolated option creation or productionINP.
- Worker continuation `mvzqmyxz-9-awb2` now implements the two deferred components and existing-options useMemo with focused RED/GREEN, after which parent runs one fresh production build and identical fixture protocol. Baseline alone does not satisfy S2. T5 remains in_progress; T2/T3/T4 remain pending.

L15 — Frontend implementation and focused checks:
- Worker `mvzqmyxz-9-awb2` added `inventory-lazy.tsx` with separate React.lazy/Suspense wrappers for history and form, switched3orders routes to wrappers, and memoized existing option elements on `[products]`. Parent reviewed actual source diff/tests; gate/auth, fetch/effects, submission and business behavior remain unchanged.
- Focused caching test RED0/2 (missing lazy module/recreated option identity) → GREEN2/2; preserved client/form/host tests11/11; tsc --noEmit --incremental false passed; scoped whitespace passed. Controlled-hook tests are not actual React lifecycle/CPU profiling. Browser error/retry/keyboard/cancellation beyond the baseline script is not claimed.
- Parent assessment returns writer self-verification/no independent frontend verifier; native candidate assessment remains unassessable for undeclared untracked paths, no review approval claimed. Parent started fresh AFTER build job3 with the same sanitized build command; final browser/differential remains pending. No new numeric gain claimed at this point; L16 records observed AFTER comparison.

L16 — Frontend AFTER results and plan reconciliation:
- AFTER build job3 passed exit0 in3s. Identical1440px fixture protocol job4 passed exit0 in7s; parent parsed complete JSON and compared route/count/status/history text/full option text/POST payloads exactly for all4scenarios: identical public outputs.
- History3447byte chunk now AFTER validation; form5878byte chunk now AFTER validation. All observed private implementation chunks were deferred, no pageerrors/blocked requests. Baseline nav prefetch remains a caveat; not a universal cross-route fetch guarantee.
-30edits script CPU: inbound6SKU10.833→10.113ms; inbound1000SKU84.109→11.622ms; outbound1000SKU80.051→10.684ms. Task CPU80.023→82.282,163.907→113.173,156.589→91.551ms respectively. Median fill+rAF16.681922→16.693902,16.673833→17.020285,16.684804→16.696896ms: no meaningful frame/INP improvement claim. One local synthetic comparison, not production or isolated React Profiler time.
- T5 now done based on observed implementation/tests/build/browser evidence, not writer claim alone. T3 starts final bounded seam/mobile checks; T2 report completion follows their results. T4 review/commit/delivery still pending. Native assessments have been unavailable on undeclared untracked state; no native approval or commit claimed.

L17 — Final bounded functional checks passed:
- Parent seam command `env -u UV_ENV_FILE UV_NO_ENV_FILE=1 UV_NO_SYNC=1 UV_OFFLINE=1 PYTHONDONTWRITEBYTECODE=1 uv run --no-sync python -B -m pytest -p no:cacheprovider tests/test_caching.py -q && node --test uis/backoffice/tests/inventory-caching.test.mjs uis/backoffice/tests/inventory-client.test.mjs uis/backoffice/tests/inventory-form.test.mjs uis/backoffice/tests/next-host.test.mjs` passed exit0:11Python tests10.00s plus13Node tests297.9ms; no failures/skips. Existing2Python deprecations and Node module-type warnings remain. This is final changed-scope verification, not a whole-repo suite.
- Added only optional validated390/1440viewport input and overflow assertion to the existing profile helper; documented it in backofficeREADME. Application source unchanged after successful build/comparison. `node --check` and scoped whitespace passed. Desktop BEFORE/AFTER comparison used identical original measurement protocol; mobile is separate functional evidence.
- Job5 `TRACKFLOW_BROWSER_WIDTH=390 node uis/backoffice/tests/profile-inventory.mjs` passed exit0 in7s,4scenarios. Parent parsed full JSON: all outputs/posts match1440px AFTER, relevant private chunks deferred, overflow assertions passed, zero pageerrors/blocked requests. No new timing claim; no screenshots/real auth/live API or broader unchanged error/retry/cancellation/keyboard sweep. Full generic verify-trackflow-ui acceptance is not claimed beyond affected synthetic flows.
- T3 completed scoped checks; T2 now updates final implementation report and progress. Backend independent risk proof stands, no redundant reviewer/test sweep. T4 review/commits/publishing remains distinct and pending at this stage; L18 resolves local review shape.

L18 — Delivery shape selected and local commit plan:
- User selected `feature-branch-chain` (ordered menu option1). This does not authorize remote reads, push, PR creation or merge. Current local origin/HEAD records `origin/main`, matching the assignment's human-selected main target; fresh remote metadata will be required at publication. Existing baseline2ee31dd includes2prior documentation commits beyond local origin/main; do not rewrite them or claim remote integration verified.
- One honest slicing pass: tracker `feature/caching-optimisation` first holds this task/evidence document only (~180lines); child1 `perf/caching-api` adds cache/invalidation/timing,11tests and API guide (~371lines); child2 `perf/caching-ui` adds two lazy components/memo,tests/profile harness,UI guide and existing-tool guide (~390lines); child3 `docs/caching-report` adds synthetic backend profiler/guide,CACHING_REPORT,progress and closing task evidence (~350lines). Exact counts recorded after staging. No code-golf or test omission.
- Planned chain: main ← feature/caching-optimisation (future draft/no-merge tracker) ← perf/caching-api ← perf/caching-ui ← docs/caching-report. Each future child PR targets its immediate parent; all branches/commits initially local only. Tracker documentation records work observed in the shared worktree; source enters child commits, not the tracker commit.
- API guide's optional profiling link is deferred to child3 with its target section/script so child1 contains no new broken link. Frontend child includes TESTING.md so tool-location links resolve. Tests and direct behavior documentation stay with each implementation.
- Final report worker `mvzqyusa-a-2ife` completed local-implementation wording,31rows,18numeric values/28byte arithmetic and17links/anchors checks. Parent read report/progress, corrected overflow claim to narrow-only measurement, and `git diff --check` passed. No native approval/commits yet.
