# Frontend performance audit — baseline and corporate after evidence

**PA-02: corporate contrast deployed and measured; accessibility 91 → 96 on both
profiles.** PA-01 baselines remain below. Inventory navigation target sizing and
one reusable loading abstraction are still pending; the overall assignment and
final `REPORT.md` are not complete.

- [4Geeks assignment](https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/projects/ai-eng-performance-web-vitals/README.md)
- [Task and staged plan](odd/tasks/frontend-performance-audit.md)
- [Before evidence index](audit/before/README.md)
- [Corporate after evidence index](audit/after/README.md)

## Scope and measurement method

These are single Lighthouse navigation runs, not field Core Web Vitals, sustained
load tests or complete accessibility/security acceptance. TBT does not establish
INP; no INP result is claimed. All three baseline and both corporate after runs had no run warnings.

| Case | Production target and capture time (UTC) | Access |
| --- | --- | --- |
| Corporate desktop | `http://162.243.69.7:3000/uis/website/`, 2026-10-30 12:55:05.839 | Anonymous public HTTP |
| Corporate mobile | Same URL, 2026-10-30 12:55:17.458 | Anonymous public HTTP |
| Inventory desktop | `/backoffice/inventory/products`, 2026-11-01 15:04:51.693 | Authenticated production through encrypted SSH forward, measured at `http://127.0.0.1:3311/backoffice/inventory/products` |

Both applications were production builds, not dev servers. Local baseline HEAD
`c382dfa` alone is not deployment proof. A separate read-only comparison confirmed
identical local/deployed SHA-256 hashes for exactly these six files under `uis/`:

- `website/styles.css` and `website/app/page.jsx`;
- `backoffice/components/inventory-session-gate.tsx`;
- `backoffice/app/backoffice/inventory/inventory.css`;
- `backoffice/components/inventory-products.tsx` and `inventory-history.tsx`.

This does not prove all-source or exact deployed-image identity.

### Repeatable comparison settings

Use Lighthouse **13.6.0**, Playwright **1.62.1**, and Chrome for Testing
**151.0.7922.34**. Baseline browser sandbox was disabled with prior authorization.
All runs use simulated throttling, `en-US`, and performance/accessibility/best
practices/SEO categories. The JSON `configSettings` preserve the full settings,
including emulated user agents (which differ from the actual Chrome version).

| Setting | Desktop (both frontends) | Corporate mobile |
| --- | --- | --- |
| Emulated viewport / device scale | 1350 × 940 / 1 | 412 × 823 / 1.75 |
| Mobile emulation | false | true |
| RTT / throughput | 40 ms / 10240 Kbps | 150 ms / 1638.4 Kbps |
| CPU slowdown | 1× | 4× |
| Request latency / download / upload | 0 / 0 / 0 | 562.5 ms / 1474.5600000000002 Kbps / 675 Kbps |

Common timing: FCP wait 30000 ms, load wait 45000 ms, post-FCP/post-load pauses
1000 ms each, network/CPU quiet thresholds 1000 ms each.

- Corporate: CLI channel, `disableStorageReset=false`, normal screenshot audits.
- Inventory: Node channel, `disableStorageReset=true` to preserve authentication
  storage; browser cache explicitly cleared. The same-origin read-only request
  guard allowed one login POST; routing also disables HTTP cache. Repeat this
  exact authentication, cache and transport arrangement for the after run.
- Inventory showed six real product rows; session/products responses were HTTP
  200 during preflight and audit. No inventory writes, mocks or seeding occurred.
- Inventory application-image capture was disabled (`disableFullPageScreenshot`,
  skipped `screenshot-thumbnails` and `final-screenshot`); private values were
  scrubbed. The saved PNG is a genuine Lighthouse **report** capture.

Compare each page only against its own matching profile and conditions. Inventory
best-practices 100 reflects loopback secure-context behavior, **not public HTTPS
or a security improvement**. The public and tunneled scores are not equivalent
transport measurements. Record changed data volume or environmental conditions
rather than attributing every later delta to code.

## Baseline scores and metrics

| Case / JSON evidence | Performance | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| [Corporate desktop](audit/before/website-desktop.report.json) | 100 | 91 | 74 | 100 |
| [Corporate mobile](audit/before/website-mobile.report.json) | 100 | 91 | 74 | 100 |
| [Inventory desktop](audit/before/backoffice-desktop.report.json) | 97 | 95 | 100 | 90 |

Numeric values below retain the report precision; timings are milliseconds and
CLS is unitless. Display strings round more aggressively (mobile TBT shows 80 ms).

| Case | FCP | LCP | Speed Index | TBT | CLS | Root response |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Corporate desktop | 274.709 | 274.709 | 459.93795832867227 | 0 | 0 | 168 |
| Corporate mobile | 779.1970000000001 | 779.1970000000001 | 1078.2809440434457 | 81 | 0 | 168 |
| Inventory desktop | 595.4760000000001 | 1193.2140000000002 | 1021.5443907536685 | 0 | 0.018795496096104126 | 171 |

## PA-02 observed corporate comparison

The deployed correction is commit `5fca72e`. One desktop and one mobile after run
used the same public URL, Lighthouse version and deeply equal full `configSettings`
as their respective baselines. See the [after guide](audit/after/README.md) for
provenance, rollout identity, privacy checks and report captures.

| Profile / after JSON | Performance before → after | Accessibility before → after | Best practices before → after | SEO before → after | Contrast score before → after |
| --- | --- | --- | --- | --- | --- |
| [Desktop](audit/after/website-desktop.report.json) | 100 → 100 | 91 → 96 | 74 → 74 | 100 → 100 | 0 → 1 |
| [Mobile](audit/after/website-mobile.report.json) | 100 → 100 | 91 → 96 | 74 → 74 | 100 → 100 | 0 → 1 |

After timings below are milliseconds, rounded to three decimals; CLS is unitless.

| Profile | FCP | LCP | Speed Index | TBT | CLS | Root response |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop | 318.764 | 318.764 | 479.482 | 0 | 0 | 187 |
| Mobile | 816.070 | 816.070 | 1100.144 | 51 | 0 | 186 |

Accessibility improved **5 points** in each profile; 96 is not complete accessibility.
LCP varied by about +44 ms desktop / +37 ms mobile and mobile TBT by −30 ms.
Single before/after runs do not establish causal performance improvement or INP.
Invalid definition lists, visible-label/name mismatches, eight HTTP requests,
no HTTPS redirect and favicon404 remain unresolved. No inventory after run exists.

## Findings and root causes

Audit IDs below identify entries in the linked JSON, not predicted gains.

### Corporate: selected contrast correction

Evidence: desktop and mobile JSON above, `color-contrast`.
Eyebrow text measures **3.75:1 / 4.12:1** and white CTA text **3.02:1**, below
**4.5:1** for these text sizes. Shared color tokens and eyebrow/button rules in
[styles.css](uis/website/styles.css#L7) (lines 7, 62, 76, 126) cause the failures.
PA-02 darkens `--orange-dark` from `#d84d1d` to `#b83d15` and the
primary button background from `var(--orange)` (`#f26b3a`) to `#c4471b`.
Decorative orange, focus outlines and interaction geometry remain unchanged.
Source-derived checks now measure 5.048:1 on paper/header, 5.555:1 on warm-white,
and white CTA text at 4.925:1 default / 5.651:1 hover and focus. Shared-token
service-number/link usages and the unchanged light eyebrow override are covered.
The focused runner observed 11 ratio failures before CSS changes, then 13 passes.
The production build and HTTP-enabled smoke passed (15/15); static/Next computed
colors, hover, keyboard focus and overflow checks passed at 390/1440 widths.
Those local checks are reused, not rerun for this documentation. Static favicon404
and an unattributed narrow-view Next console error prevent a clean-console claim.
The deployed desktop/mobile Lighthouse contrast audit now passes as recorded above.

### Inventory: selected navigation target correction

Evidence: [inventory JSON](audit/before/backoffice-desktop.report.json), `target-size`.
Adjacent skip and operations links are only **19 px high**. They are rendered in
[the session gate](uis/backoffice/components/inventory-session-gate.tsx#L54)
(lines 54–56), outside `.inventory`; the scoped rules at
[inventory.css:1–5](uis/backoffice/app/backoffice/inventory/inventory.css#L1)
therefore do not style them. PA-03 will size/space the actual links and preserve
keyboard focus, skip navigation and narrow/wide layouts. No authentication change
or framework-announcer suppression is needed.

### Follow-ups, not fixes already applied

| Finding / evidence ID | Cause and bounded follow-up |
| --- | --- |
| Corporate `definition-list` | `dl.metrics` uses `div > span` instead of valid term/description groups in [Next page:96–100](uis/website/app/page.jsx#L96) and [static page:96–100](uis/website/index.html#L96). Correct semantics in both hosts in a later scoped change. |
| Corporate `label-content-name-mismatch` | `aria-label="TrackFlow home"` does not contain the full visible TF plus brand text in [Next page:7–12](uis/website/app/page.jsx#L7); [static components](uis/website/components.js) have equivalents. Align the accessible name with visible content. |
| Corporate `errors-in-console` | The observed error is specifically root `/favicon.ico` HTTP 404. Routing correction is not selected yet; do not describe this as a generic JavaScript crash. |
| Corporate `is-on-https`, `redirects-http` | Eight insecure requests and no HTTP-to-HTTPS redirect on existing public deployment. TLS/domain changes are outside the agreed minimal correction scope. |
| Inventory `meta-description` | [Root layout:4](uis/backoffice/app/layout.tsx#L4) supplies title only. A description is a follow-up; do not remove private indexing safeguards for a score. |
| Both: `unused-javascript`, `legacy-javascript-insight`, `render-blocking-insight`, `network-dependency-tree-insight` | Diagnostic estimates, not proven exact code fixes. Corporate unused/legacy estimates are 55/14 KiB; inventory 26/14 KiB. Render-blocking estimates are 60 ms desktop, 140 ms mobile and 240 ms inventory. Savings overlap and are not guaranteed or additive. |

## Duplication analysis and planned extraction

| Concrete case | Why it matters | Smallest useful option / decision |
| --- | --- | --- |
| [Products:11–19](uis/backoffice/components/inventory-products.tsx#L11) and [history:7–15](uis/backoffice/components/inventory-history.tsx#L7) | Repeated abortable load, stale-result guard, error handling, reset and retry lifecycle can drift when maintained separately. | **PA-04 planned:** one small stable loader hook or shared loading-state component, selected after checking dependencies. Preserve cancellation, stale guards and loading/error/empty/success behavior; no new dependency. |
| [Static Web Components](uis/website/components.js) and [Next page](uis/website/app/page.jsx) (brand/services), plus [static metrics](uis/website/index.html#L96) and Next metrics | Brand, service content and metrics markup duplicate across independent hosts; fixes can diverge, as the semantic/name issues illustrate. | Shared content definitions could reduce drift, but cross-host unification would complicate independently usable static and Next entry points. Prefer paired small corrections; no architecture rewrite or extraction selected here. |

PA-01 introduced no application corrections. PA-02 contrast is now applied and
measured; PA-03 target sizing and PA-04 extraction remain deferred. Performance is
already strong; observed accessibility causes justify bounded changes rather than
speculative bundle optimization. The category gain is proven for corporate only,
not yet for inventory.

## Next steps and limits

1. Finish the parent-owned PA-02 evidence commit, then apply PA-03 with focused
   regression coverage and a matching authenticated after measurement.
2. Extract the bounded PA-04 reusable unit with behavior-preserving checks.
3. Add inventory after JSON/report PNGs and final `REPORT.md` in PA-05; corporate
   artifacts are already preserved. No future score or delivery is promised here.

This evidence update is passive documentation: no meaningful RED/GREEN applies.
Structural checks cover score sets, JSON runtime errors, PNG signatures/dimensions,
local document links and whitespace; they do not repeat browser execution or
establish full application acceptance. Existing deployment/authentication history
is retained in [project progress](memory-bank/progress.md).
