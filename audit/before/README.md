# Before evidence — production baseline

Three original privacy-checked JSON/report-PNG pairs support the
[baseline analysis and correction plan](../../AUDIT.md). No after gains are
recorded. The copied artifacts are unchanged; temporary HTML reports are omitted
from Git as duplicate output.

## Evidence index

| Profile | Machine-readable Lighthouse report | Visual report capture |
| --- | --- | --- |
| Corporate desktop | [website-desktop.report.json](website-desktop.report.json) | [website-desktop.png](website-desktop.png) |
| Corporate mobile | [website-mobile.report.json](website-mobile.report.json) | [website-mobile.png](website-mobile.png) |
| Authenticated inventory desktop | [backoffice-desktop.report.json](backoffice-desktop.report.json) | [backoffice-desktop.png](backoffice-desktop.png) |

JSON contains category scores, precise metric values, findings and `configSettings`.
The genuine PNGs show rendered Lighthouse reports, **not application screenshots**.
All three PNGs are 1440 × 1100; that report-capture size is not the tested viewport.
Screenshots were visually checked before copying. Structural checks alone do not
prove visual correctness or runtime behavior.

## Comparison conditions and privacy

- Both frontends were production builds. Corporate captures are from 2026-10-30
  at the public HTTP `/uis/website/` endpoint; inventory is from 2026-11-01 at
  `/backoffice/inventory/products`, authenticated with six actual rows.
- Toolchain: Lighthouse 13.6.0, Playwright 1.62.1, Chrome 151.0.7922.34.
  Simulated desktop profile: 1350 × 940, scale 1, 40 ms RTT, 10240 Kbps, CPU 1×.
  Corporate mobile: 412 × 823, scale 1.75, 150 ms RTT, 1638.4 Kbps, CPU 4×.
  See the JSON and AUDIT for complete settings; all accepted runs had no warnings.
- Corporate storage reset was enabled. Inventory authentication storage was
  preserved (`disableStorageReset=true`), browser cache explicitly cleared, and
  request routing disabled HTTP cache. The guard allowed same-origin reads and
  one login POST. No inventory writes, mock data or seeding occurred.
- Inventory used an encrypted SSH forward to production, measured through
  `127.0.0.1:3311`. Repeat that transport/auth/cache arrangement for after results.
  Best-practices 100 on loopback is **not** evidence of public HTTPS or improved
  security. Public HTTP remains a deployment limitation; cross-frontend transport
  scores are not directly comparable.
- Inventory application-image audits were disabled and private values scrubbed;
  the report PNG remains genuine. No credentials, account identifiers or access
  commands are included in this guide. Do not add private runtime configuration.
- Six relevant source files were confirmed identical locally and deployed; this
  is scoped source correspondence, not all-source or exact image-identity proof.

Use the JSON as the numeric source of truth (for example, mobile TBT is 81 ms,
although displayed as 80 ms). These single navigation runs do not measure INP or
field performance. Final after evidence and `REPORT.md` remain pending.
