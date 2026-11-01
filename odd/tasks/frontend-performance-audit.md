# Frontend performance audit

## Goal and scope

Complete the 4Geeks frontend performance assignment with the smallest evidence-based changes: measure both existing production frontends, explain findings, improve at least one Lighthouse category per frontend, extract one reusable component or hook after documenting at least two duplication candidates, and deliver before/after evidence in `AUDIT.md`, `REPORT.md`, and `audit/`.

Assignment: https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/projects/ai-eng-performance-web-vitals/README.md

Branch: `feat/frontend-performance-audit` (created from `c382dfa0eba3c4c342897f437a4eb94748c8a4a3`).

## Constraints

- Keep existing technologies and architecture; no new dependencies, domain, TLS deployment, authentication feature, business-data changes, or unrelated refactors.
- Preserve protected milestone/root application files, Tracker, backend/services, infra, data and dependency/lock files.
- Keep static and Next website behavior compatible when changing their shared stylesheet.
- Never include credentials, tokens, private account data or customer email addresses in artifacts. Private runtime configuration is not a deliverable.
- Use focused checks per change. Run one comparable Lighthouse measurement on each affected page after its correction; reserve broader checks for the final relevant UI slice only when needed.
- Keep each correction in a separate Conventional Commit with its applicable tests/docs. Generated evidence is not authored implementation scope; do not minify source or omit tests to reduce review size.
- Native review follows the user-owned RDD switch and per-candidate consent. Delivery follows repository policy and the current session's standing permission; no destructive Git or unrelated service operations.
- Do not report a predicted score gain as observed. Keep unresolved findings visible rather than attempting to reach 100 everywhere.

## Task checklist

- [x] **PA-01 — Preserve and explain the initial baseline** (done).
  - Copy privacy-checked original screenshots and JSON reports into `audit/before/`; retain original temporary HTML reports until final delivery.
  - Write `AUDIT.md` with measurement conditions, scores, root causes, at least two duplication candidates, planned corrections and deferred limitations.
  - Update project progress; verify artifacts/links, JSON scores, PNG structure and `git diff --check`.
  - Resolve relevant deployed/local source correspondence before code edits.
  - Commit evidence: `5e149c4c5b1233940cb63ae761cf138a6f0e0135` — `docs(audit): record production frontend baselines`.
- [ ] **PA-02 — Improve corporate contrast** (in progress).
  - Correct the failing eyebrow/CTA foreground-background combinations in `uis/website/styles.css`, preserving visual hierarchy and focus/hover behavior.
  - Add focused deterministic contrast regression coverage to the existing `uis/website/tests/site-smoke.test.mjs` runner before the fix; observe RED/GREEN with `node --test --test-name-pattern=contrast uis/website/tests/site-smoke.test.mjs`. Keep package/dependency files unchanged. Check both shared-host contexts.
  - Measure the same corporate production URL in desktop and mobile with the original Lighthouse version/settings; record the actual deltas.
  - Local evidence: valid RED (11 failing ratio assertions, 2 passing checks), then 13/13 contrast tests green. Website production build passed; HTTP-enabled smoke passed 15/15 without skips. Both static/Next hosts passed computed-color, hover, keyboard-focus and overflow checks at 390/1440 widths. Narrow-view console errors remain qualified: static root favicon 404 confirmed; Next error unattributed, so no clean-console claim.
  - Native consolidated review `review-10e93d78cd67a0ea` approved and exact acknowledgement completed; authority burned for its frozen candidate. Public after measurement passed: desktop/mobile each 100/96/74/100, accessibility +5 points, color contrast 0 → 1; evidence documentation is being finalized.
  - Commit evidence: `5fca72e998a3c0d462ad90a95ef6dcc434767e81` — `fix(website): improve text contrast`.
- [ ] **PA-03 — Improve backoffice navigation target sizing** (pending).
  - Style the actual skip and operations links outside `.inventory`, without suppressing the framework announcer or changing authentication.
  - Add focused regression coverage before behavior changes when meaningful; check keyboard focus, skip navigation, narrow/wide layout and target size.
  - Measure the authenticated products view through the same SSH transport, cache, storage and desktop settings.
  - Commit evidence: pending.
- [ ] **PA-04 — Extract one small reusable UI unit** (pending).
  - Confirm at least two documented duplication cases, then extract the smallest useful shared component or hook for products/history loading, retry or status behavior.
  - Preserve cancellation/stale-result protection and loading/error/empty/success states. No additional dependencies.
  - Add applicable deterministic regression coverage; a pure refactor with no meaningful new RED must document that exception and run focused before/after checks.
  - Commit evidence: pending.
- [ ] **PA-05 — Record final comparable results and deliverables** (pending).
  - Preserve final screenshots and JSON reports under `audit/after/`, write `REPORT.md`, and update `AUDIT.md`/progress with applied versus deferred findings.
  - Demonstrate an observed category gain for each frontend; retain measurement variability and environment caveats.
  - Run the smallest final affected-UI regression checks and validate all deliverable links/artifacts. Do not claim unrelated full-stack acceptance.
  - Commit evidence: pending.

## Baseline evidence already observed

| Frontend / mode | Performance | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Corporate / desktop | 100 | 91 | 74 | 100 |
| Corporate / mobile | 100 | 91 | 74 | 100 |
| Authenticated inventory / desktop | 97 | 95 | 100 | 90 |

- Corporate: `/tmp/trackflow-vps-before-Atofdp/`; public production URL on the existing VPS; Lighthouse 13.6.0, Chrome 151.0.7922.34. Desktop LCP 274.709 ms / TBT 0 / CLS 0; mobile LCP 779.197 ms / TBT 81 ms / CLS 0. Both runs completed without warnings.
- Backoffice: `/tmp/trackflow-backoffice-before-dF5qrn/`; measured `http://127.0.0.1:3311/backoffice/inventory/products` through an agent-owned encrypted SSH forward to existing production. Real normal-account login, six inventory rows, fresh session/products HTTP 200 during audit, no business writes. LCP 1.2 s / TBT 0 / CLS 0.019; no Lighthouse warnings.
- Backoffice authentication storage was preserved and browser cache explicitly cleared; the read-only request guard also disabled HTTP cache. Application-image audits were disabled for privacy; report screenshots are genuine Lighthouse captures. Repeat these conditions for the after comparison.
- Backoffice best-practices 100 reflects loopback secure-context behavior and is not evidence of public HTTPS. Do not compare frontend scores as if their transports were identical.
- Browser sandbox-disabled runs were explicitly authorized. Owned browser and SSH cleanup completed in the accepted run, the loopback port was released, and Git/diff checks passed.
- Earlier tooling failures produced no accepted scores. A broad alert guard was corrected after identifying the empty, clipped Next route announcer; no application code was changed to bypass it.
- Read-only SSH comparison confirmed exact SHA-256 matches for six relevant deployed/local files: website stylesheet/page, backoffice session gate/inventory stylesheet, and products/history components. No mismatch was observed in that scoped set; unexamined files and exact image identity remain unverified.

## Findings and bounded plan

Selected: corporate contrast and backoffice target sizing provide direct, narrowly scoped accessibility improvements while performance is already healthy. Products/history duplicate async loading/retry logic and are the primary extraction candidate.

Documented follow-ups unless evidence requires reprioritization: corporate invalid definition-list children, brand accessible-name mismatch, root favicon 404, HTTP deployment limitations, private-page meta description, unused/legacy JavaScript and render-blocking estimates. Estimated savings are not proven gains. Cross-host corporate duplication and legacy sidebar duplication should be analyzed but not unified through an architecture rewrite.

## Progress and next step

Both initial audits and bounded source analysis are complete. The corporate contrast correction is implemented and committed locally; its comparable public-production measurement confirms accessibility 91 → 96 on desktop and mobile. The after artifacts have been preserved; their documentation and evidence commit are pending. The account-access prerequisite is verified; no recovery UI or extra infrastructure was added.

PA-01: three original Lighthouse JSON reports and three PNGs were copied into `audit/before/` after private-value/token scans, JSON score assertions and PNG signature checks; all six destination files matched their sources byte-for-byte. The documentation worker completed `AUDIT.md`, `audit/before/README.md` and the project progress entry. Writer checks passed: `git diff --check`, three JSON score sets, three PNG dimensions/signatures, local audit-document links and scoped Git status. Parent readback/diff checks passed. Native ASSESS was unassessable because of undeclared unrelated untracked notes; independent structural verification passed all artifact hashes, scores/settings, links and progress-history checks. A parent task-log edit during verification was reconciled with a stable two-hash readback (no audit rerun). PA-01 was committed as `5e149c4` after the exact staged paths and whitespace were checked. Original HTML/metadata remain in the documented temporary directories.

PA-02 remains in progress only for evidence documentation and its commit; matching production measurement has passed: the two CSS declarations, 13 deterministic contrast cases and related documentation were committed as `5fca72e` after native review and focused local verification. Runtime evidence is retained in `/tmp/trackflow-contrast-runtime-RJZEIH/`; parent inspected the post-build Git state and committed only the intended six paths. The existing UI-only rollout recipe has been mapped read-only: build a distinctly tagged production UI image locally with existing lockfiles, stream it through the configured SSH transport, and select it via `TRACKFLOW_UI_IMAGE` with the existing Compose/resource files and `up -d --no-build --pull never --no-deps ui`. The UI-specific adaptation was executed exactly once after the explicit approval and guarded preflight below. The user explicitly authorized replacing only the shared UI container after being informed of a brief interruption to both frontends. Fresh bounded preflight and local production-image build passed. Tag `trackflow-ui:pa02-5fca72e` (image `sha256:02071294f77edc2ecf27a171bb2a76c8189ffdbf0b5de2250055fdbc3cee2a60`) was streamed and loaded, then one guarded UI-only Compose recreation returned exit 0 (4.238 seconds command duration, not measured outage). Evidence is in `/tmp/trackflow-pa02-rollout-7OGlCe/`; independent readiness and preservation passed all 15 checks: new UI identity/image, unchanged API identity/start/configuration, resource limits, mounts, ports, network, rollback image and Compose hashes; website/login 200, anonymous auth 401 and internal OpenAPI 200. The first after-audit command had a verifier transcription SyntaxError before execution, so no browser or Lighthouse ran. The corrected file-based runner passed syntax/hash checks and executed once successfully. Desktop and mobile each measured 100/96/74/100 (accessibility +5); color contrast passed, warnings were empty, and configuration settings matched the baselines exactly. Both real report PNGs were visually inspected. Original after evidence: `/tmp/trackflow-vps-after-pa02-LV3GGh/`; two JSON reports and two 1440×1100 PNGs were copied byte-for-byte into `audit/after/` after private-value/header scans. Single-run timing variations do not prove causal performance effects. Semantic/name/favicon/HTTP findings remain open. No deployment/readiness rerun was performed. Existing configuration files were not edited; future UI recreation commands must explicitly select the new image tag. API, data, volumes, network and unrelated services must remain untouched. Keep the old UI image for rollback. The observed corporate accessibility gain is +5 points in each profile; backoffice after measurement remains pending. Task transitions are updated only when no verifier is reading this document.
