# After evidence — deployed corporate contrast

PA-02 improves corporate accessibility **91 → 96** on desktop and mobile; contrast
score **0 → 1**. Performance/best practices/SEO remain **100/74/100**. Only the
corporate artifacts below exist here; authenticated backoffice after evidence and
final `REPORT.md` remain pending. See [analysis and comparison](../../AUDIT.md) and
[baseline evidence](../before/README.md).

## Evidence index

| Profile | Machine-readable Lighthouse report | Visual report capture |
| --- | --- | --- |
| Corporate desktop | [website-desktop.report.json](website-desktop.report.json) | [website-desktop.png](website-desktop.png) |
| Corporate mobile | [website-mobile.report.json](website-mobile.report.json) | [website-mobile.png](website-mobile.png) |

The parent copied these four original files byte-for-byte from
`/tmp/trackflow-vps-after-pa02-LV3GGh/` and confirmed exact hashes. Original HTML
reports and metadata remain there, omitted from Git as duplicate/supporting output.
Both PNGs are genuine rendered Lighthouse reports, not application screenshots;
a verifier opened them and confirmed visible URL, scores and metrics. Their
1440 × 1100 capture size is not the emulated page viewport.

## Comparable conditions

- Same public production URL: `http://162.243.69.7:3000/uis/website/`.
  One accepted desktop-preset and one default-mobile CLI navigation audit, fresh
  browsers, storage reset enabled, simulated throttling and approved no-sandbox.
- Lighthouse **13.6.0**, Playwright **1.62.1**, Chrome **151.0.7922.34**.
  Full `configSettings` and Lighthouse version match each corresponding baseline;
  both after runs have no warnings. JSON retains capture timestamps and precision.
- Desktop: 1350 × 940, DPR 1, RTT 40 ms, bandwidth 10240 Kbps, CPU 1×.
  Mobile: 412 × 823, DPR 1.75, RTT 150 ms, bandwidth 1638.4 Kbps, CPU 4×.
  See [AUDIT measurement settings](../../AUDIT.md#repeatable-comparison-settings)
  for the remaining timing and throttling values.
- Before copying, the parent verified absence of private audit email/password
  values and credential-bearing headers. No credentials or private runtime
  configuration are included in this guide; no authenticated capture is included.

## Deployment provenance and boundaries

The correction from `5fca72e` was deployed as `trackflow-ui:pa02-5fca72e`, image
`sha256:02071294f77edc2ecf27a171bb2a76c8189ffdbf0b5de2250055fdbc3cee2a60`.
Independent readiness passed **15/15** in
`/tmp/trackflow-pa02-rollout-7OGlCe/readiness.json`: new UI image and unchanged
inspected API identity/configuration, resource limits, network and mounts.
This is not database byte-equivalence proof. The old UI image is retained for
rollback. Deployment configuration files were unchanged; future UI recreation
requires explicit selection of the new image tag.

Existing local production-build, HTTP smoke **15/15**, and static/Next browser
checks are reused; no deployment, readiness, browser or Lighthouse rerun was needed
for this documentation. The accepted evidence follows a corrected stable runner;
an earlier transcription failure occurred before any browser execution.

## Limits and remaining work

- Single-run LCP changes (+44 ms desktop, +37 ms mobile) and mobile TBT −30 ms do
  not prove causal performance improvement. No field performance or INP inferred.
- Accessibility 96 is not complete accessibility: invalid definition-list markup
  and visible-label/name mismatches remain. HTTP (eight requests), no HTTPS
  redirect and root favicon404 remain; no security or clean-console claim.
- Backoffice correction, comparable authenticated after evidence, reusable-unit
  extraction and final assignment delivery are still pending. Its later capture
  must preserve the baseline SSH transport/authentication/cache/privacy conditions;
  corporate HTTP scores are not directly comparable to loopback inventory scores.
