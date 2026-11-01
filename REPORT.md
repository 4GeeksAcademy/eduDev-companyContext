# Frontend audit — results

Both production frontends gained **5 accessibility points** after small, targeted fixes. Corporate desktop/mobile improved from 91 to 96; authenticated inventory improved from 95 to 100. Performance was already strong: inventory changed 97 → 96, not a demonstrated performance optimization or a proven code-caused regression.

## Changes and rationale

| Change | Why / boundary | Source commit |
| --- | --- | --- |
| Darker corporate eyebrow and CTA colors | Fix measured text-contrast failures without changing layout or decorative colors; shared CSS serves static and Next hosts. | `5fca72e` |
| Padded inventory navigation links | Baseline links were 19px high and outside `.inventory`; dedicated classes provide 44px minimum height and visible focus without changing authentication. | `d1bfb26` |
| Shared `InventoryLoadStatus` | Products/history reuse error, Retry and loading markup; effects, stale guards, empty states and tables remain unchanged. No loader hook or dependency added. | `947062f` |

[Duplication analysis](AUDIT.md#duplication-analysis-and-extraction) compares products/history status handling with separate static/Next corporate content. Only the useful, small status component was extracted; cross-host unification was deferred to preserve independent hosts.

## Measured before / after

Scores are Performance / Accessibility / Best practices / SEO. Each row compares its own matching URL, profile and full Lighthouse settings, not the two frontends against each other.

| Profile | Before | After | Selected audit |
| --- | --- | --- | --- |
| Corporate desktop | 100 / 91 / 74 / 100 | 100 / 96 / 74 / 100 | Contrast 0 → 1 |
| Corporate mobile | 100 / 91 / 74 / 100 | 100 / 96 / 74 / 100 | Contrast 0 → 1 |
| Authenticated inventory desktop | 97 / 95 / 100 / 90 | 96 / 100 / 100 / 90 | Target size 0 → 1 |

Inventory timings below use milliseconds rounded to three decimals; CLS uses five decimals. Raw precision remains in JSON.

| Metric | Before | After |
| --- | ---: | ---: |
| FCP | 595.476 | 639.512 |
| LCP | 1193.214 | 1259.268 |
| Speed Index | 1021.544 | 1071.973 |
| TBT | 0 | 0 |
| CLS | 0.01880 | 0.01930 |
| Root response | 171 | 186 |

The inventory Performance −1 and timing changes were observed in single runs; these measurements cannot distinguish run-to-run variability from a code-caused regression. Corporate performance stayed 100 in both profiles. No field Core Web Vitals, INP, complete accessibility or security acceptance is inferred; even accessibility 100 is bounded automated evidence.

### Screenshots and JSON

All PNGs are genuine rendered Lighthouse reports, not application screenshots; the verifier inspected legible target, categories and metrics. Capture size is 1440×1100, distinct from page emulation.

| Profile | Before JSON / screenshot | After JSON / screenshot |
| --- | --- | --- |
| Corporate desktop | [JSON](audit/before/website-desktop.report.json) / [PNG](audit/before/website-desktop.png) | [JSON](audit/after/website-desktop.report.json) / [PNG](audit/after/website-desktop.png) |
| Corporate mobile | [JSON](audit/before/website-mobile.report.json) / [PNG](audit/before/website-mobile.png) | [JSON](audit/after/website-mobile.report.json) / [PNG](audit/after/website-mobile.png) |
| Inventory desktop | [JSON](audit/before/backoffice-desktop.report.json) / [PNG](audit/before/backoffice-desktop.png) | [JSON](audit/after/backoffice-desktop.report.json) / [PNG](audit/after/backoffice-desktop.png) |

## Method, privacy and deployment

- Lighthouse 13.6.0, Playwright 1.62.1 and Chrome 151.0.7922.34; exact baseline/after settings equality, simulated throttling and no run warnings. [AUDIT settings](AUDIT.md#repeatable-comparison-settings) preserve viewport, cache and throttling details.
- Corporate used the same public HTTP URL. Its source stylesheet/page hashes remained unchanged in the final rollout, so its accepted desktop/mobile after measurements were reused.
- Inventory used `http://127.0.0.1:3311/backoffice/inventory/products` through an owned encrypted SSH forward to existing production port3001. Real normal-account authentication, preserved storage, explicitly cleared cache and routing-disabled HTTP cache; no business writes or mocks. Fresh auth/me and products returned200 in preflight and audit; the distinct measured page showed six nonempty rows and zero alerts while alive.
- Application-image audits were disabled for privacy. Private values were redacted before JSON/HTML delivery; only report PNGs were captured. Parent privacy checks and byte-for-byte copy hashes passed. Accepted run: one login POST, one Lighthouse, zero blocked requests/failure codes. Across two deliberate attempts: two logins, one Lighthouse; the earlier attempt stopped after login200 before authentication validation or Lighthouse. Both attempts cleaned owned browsers/launchers/SSH and released3311. Git-status equality is not byte-equivalence proof.
- Final UI source `947062f` is deployed as `trackflow-ui:pa05-947062f`, image `sha256:dc0479d18da7d3d133ccd94b7f669a9d2204dc5ac6b70bfcd2f736695582d263`. Preflight14/14, build/transfer/apply and independent readiness18/18 passed. The 5.199s apply duration is not measured outage. API identity/configuration/resources/data-volume/network, other containers and UI boundaries were preserved; Compose/private configuration fingerprints were unchanged and seven source hashes matched. This is not database-byte proof. PA02 rollback image remains retained; future recreation must explicitly select the new tag because deployment configuration was not edited. [Evidence provenance](audit/after/README.md) records original locations.

## Checks and limits

Accepted source reviews were approved and acknowledged. Corporate contrast RED/GREEN ended13/13, HTTP smoke15/15 and production build passed; static/Next browser checks covered390/1440. Inventory navigation RED/GREEN ended4/4, combined host8/8; local browser checks confirmed44px targets, Tab/skip behavior and3px link focus (Sign out1px auto).

For the behavior-preserving extraction, client/form7/7 passed before/after, new structural checks2/2, independent tests17/17 and simulated browser groups8/8 passed, with exact effects/tables unchanged and production build passing. Full-document departure to about:blank does not prove SPA unmount or server cancellation. Existing Node module-type/Next workspace-root warnings and two intentional fixture503 messages remain disclosed, not production failures. Broad suites and all-four-route business writes were not repeated by design. This documentation slice performs only passive structural verification; no functional reruns.

Deferred: corporate definition-list semantics, visible-label/name mismatch, favicon404, public HTTP/no HTTPS redirect (96 is not full accessibility); inventory meta description, unused JavaScript (~27KiB), legacy JavaScript (~14KiB), network dependency tree and render blocking (~260ms). Estimated savings overlap and are not proven gains. Loopback best-practices100 is not public HTTPS proof. No infrastructure/domain/TLS/dependency/API changes were added.

Technical assignment evidence is complete. Verification and commit evidence are tracked in the [task](odd/tasks/frontend-performance-audit.md). No push or PR has been performed.

## Key Learnings

1. Small contrast and navigation-target corrections produced observed accessibility gains on both frontends.
2. Reusing status markup removed duplication without moving asynchronous lifecycle ownership.
3. Matching settings and transport makes comparisons useful, but one run cannot prove performance causality.
4. Authenticated audit evidence requires privacy-safe report captures and proof of the actual measured page.
