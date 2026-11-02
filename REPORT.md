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

JSON is retained for exact audit values and settings even though the course requires
Markdown and screenshots. Its generated-file classification only simplifies GitHub
review presentation; no evidence is removed or changed.

## Method, privacy and deployment

[Canonical settings](AUDIT.md#repeatable-comparison-settings) define the matching
profiles, toolchain, transport and cache conditions. Only authenticated inventory
application-image audits were disabled for privacy; corporate JSON includes public
screenshots. The [after index](audit/after/README.md) records authenticated-page
validation, sanitization, copy hashes, original locations and rollout/rollback
identity. Deployment statements describe the accepted PA-05 snapshot, not current
runtime during the separate HTTPS work.

## Checks and limits

Accepted source reviews, focused regressions, production builds and bounded browser
checks passed. See [navigation checks](uis/backoffice/README.md#pa-03-local-navigation-target-correction)
and [status reuse checks](uis/backoffice/README.md#pa-04-shared-inventory-load-status)
for exact commands and limitations; [task history](odd/tasks/frontend-performance-audit.md)
retains the chronology. Full-document departure does not prove SPA unmount or server
cancellation. Broad suites and all-four-route business writes were not repeated.
This cleanup uses structural checks only, with no new runtime acceptance.

Deferred in PA-05: corporate definition-list semantics, visible-label/name mismatch, favicon404, public HTTP/no HTTPS redirect (96 is not full accessibility); inventory meta description, unused JavaScript (~27KiB), legacy JavaScript (~14KiB), network dependency tree and render blocking (~260ms). Estimated savings overlap and are not proven gains. Loopback best-practices100 is not public HTTPS proof. No infrastructure/domain/TLS/dependency/API changes were added.

Technical assignment evidence is complete. Verification and commit evidence are tracked in the [task](odd/tasks/frontend-performance-audit.md). The original audit was merged in [PR #29](https://github.com/4GeeksAcademy/eduDev-companyContext/pull/29). This documentation-only follow-up preserves its measurements and makes no new runtime acceptance claim.

## Separate IP-03 HTTPS follow-up — 2026-11-01

Favicon404 and public HTTP/no-redirect findings above are historical and resolved
by the deployed follow-up; original PA-05 tables and artifacts are unchanged.
[Separate HTTPS evidence](audit/after/HTTPS.md) records corporate desktop/mobile
100/96/100/100 versus100/96/74/100, exactly one run each with matching full settings.
Transport/origin and time changed; this is not controlled causal or security proof.
Independent website16/16,19 external HTTP checks and corporate/anonymous backoffice
browser checks passed. Authenticated backoffice acceptance remains **PENDING**
because the credential loader requires prohibited `.env` access; zero login POSTs,
business writes or backoffice Lighthouse runs. Semantic/name and JS/modern-HTTP/
render-blocking findings remain deferred. This documentation copies existing
public evidence only; no runtime, browser, build or Lighthouse reruns.

## Key Learnings

1. Small contrast and navigation-target corrections produced observed accessibility gains on both frontends.
2. Reusing status markup removed duplication without moving asynchronous lifecycle ownership.
3. Matching settings and transport makes comparisons useful, but one run cannot prove performance causality.
4. Authenticated audit evidence requires privacy-safe report captures and proof of the actual measured page.
