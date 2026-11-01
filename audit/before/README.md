# Before evidence — production baseline

Three unchanged, privacy-checked JSON/report-PNG pairs support the
[baseline analysis](../../AUDIT.md). See [measured outcomes](../../REPORT.md)
and [after provenance](../after/README.md) for the completed comparison.
Temporary HTML reports are omitted from Git as duplicate output.

## Evidence index

| Profile | Machine-readable Lighthouse report | Visual report capture |
| --- | --- | --- |
| Corporate desktop | [website-desktop.report.json](website-desktop.report.json) | [website-desktop.png](website-desktop.png) |
| Corporate mobile | [website-mobile.report.json](website-mobile.report.json) | [website-mobile.png](website-mobile.png) |
| Authenticated inventory desktop | [backoffice-desktop.report.json](backoffice-desktop.report.json) | [backoffice-desktop.png](backoffice-desktop.png) |

JSON preserves exact scores, metrics, findings and settings (mobile TBT is 81 ms,
though displayed as 80 ms). All PNGs are genuine, visually checked 1440 × 1100
Lighthouse report captures, not application screenshots or emulated viewport sizes.

## Comparison conditions and privacy

Corporate production baselines were captured on 2026-10-30 at public HTTP
`/uis/website/`; authenticated inventory on 2026-11-01 at
`/backoffice/inventory/products`, with six real rows and no business writes or mocks.
Original evidence: `/tmp/trackflow-vps-before-Atofdp/` and
`/tmp/trackflow-backoffice-before-dF5qrn/`.

[Canonical settings](../../AUDIT.md#repeatable-comparison-settings) specify versions,
profiles and the preserved inventory authentication/cache/SSH arrangement. Only
inventory application-image audits were disabled and private values scrubbed;
corporate JSON includes public screenshots. Loopback best-practices 100 is not
public HTTPS proof, and cross-frontend transports are not directly comparable.
Six relevant deployed/local source hashes matched, not all-source/image identity.
Single navigation runs do not establish INP, field performance or full acceptance.
