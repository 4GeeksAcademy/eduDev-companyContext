# After evidence — both production frontends

Corporate desktop/mobile accessibility improved **91 → 96** (contrast0 → 1);
authenticated inventory improved **95 → 100** (target-size0 → 1). Inventory
Performance changed97 → 96 in a single run, not a proven code-caused regression.
See [final report](../../REPORT.md), [analysis](../../AUDIT.md) and
[baseline index](../before/README.md).

Separate [IP-03 HTTPS follow-up](HTTPS.md): corporate100/96/100/100 on2026-11-01;
favicon/HTTP findings below are historical and resolved there. PA-05 evidence stays intact.

## Evidence index

| Profile | Lighthouse JSON | Visual report capture | Scores P / A / BP / SEO |
| --- | --- | --- | --- |
| Corporate desktop | [JSON](website-desktop.report.json) | [PNG](website-desktop.png) | 100 / 96 / 74 / 100 |
| Corporate mobile | [JSON](website-mobile.report.json) | [PNG](website-mobile.png) | 100 / 96 / 74 / 100 |
| Authenticated inventory desktop | [JSON](backoffice-desktop.report.json) | [PNG](backoffice-desktop.png) | 96 / 100 / 100 / 90 |

Parent copied the corporate pairs byte-for-byte from
`/tmp/trackflow-vps-after-pa02-LV3GGh/` and the sanitized inventory pair from
`/tmp/trackflow-backoffice-after-0eNe3E/`; original HTML/metadata remain there.
All three PNGs are genuine Lighthouse report captures, visually inspected for
legible target, four categories and metrics, not application screenshots.
Their1440×1100 dimensions are not the emulated page viewport.

Inventory copy SHA-256:

- JSON: `b57af399f597e0588ec0ea742a60037472132bbb495647c588680013dd416a62`
- PNG: `b7a8acf56e6e8b06547dea365fbfa4a55fc6957cea70991a2e858fc74e985cbb`

## Comparable conditions and privacy

- Lighthouse13.6.0, Playwright1.62.1, Chrome151.0.7922.34; full settings match each
  baseline exactly, including before/after inventory sanitization. No run warnings.
  [Canonical profiles, cache and throttling settings](../../AUDIT.md#repeatable-comparison-settings)
  apply to each matching pair. After captures (UTC, 2026-11-01): corporate desktop
  16:24:03.791, mobile 16:24:15.508; inventory 18:26:44.600.
- Corporate: same public `http://162.243.69.7:3000/uis/website/`, CLI navigation,
  fresh browsers/storage reset and approved no-sandbox. Final rollout confirmed
  unchanged deployed corporate CSS/page hashes; no additional audit was needed.
- Inventory: Node-channel navigation at
  `http://127.0.0.1:3311/backoffice/inventory/products`, owned SSH forward to
  existing production3001, real normal account, storage preserved/cache cleared;
  guarded routing disables HTTP cache. No mocks or business writes. Fresh auth/me
  and products200 in both phases; actual distinct audit page had six nonempty rows
  and zero alerts while alive.
- Only inventory application-image audits were disabled; corporate JSON includes
  public screenshots. Inventory private-value redaction preceded JSON/HTML delivery;
  parent privacy scans before copying, report PNG only. Accepted run:1login POST,
  1Lighthouse,0blocked,0failure codes. Earlier deliberate attempt stopped after
  login200 before auth validation/Lighthouse; metadata retained at
  `/tmp/trackflow-backoffice-after-rWCqSf/`. Total2logins/1Lighthouse, not two
  successful authenticated audits. Both attempts cleaned browsers/launchers/SSH
  and released3311. Temporary helpers are not deliverables.

## Deployment provenance

This records the accepted PA-05 audit snapshot, not current live runtime during
separate HTTPS work. Original baseline locations are in the [before index](../before/README.md).

Corporate correction `5fca72e` was measured on `trackflow-ui:pa02-5fca72e`, image
`sha256:02071294f77edc2ecf27a171bb2a76c8189ffdbf0b5de2250055fdbc3cee2a60`.
Its independent readiness15/15 is retained at
`/tmp/trackflow-pa02-rollout-7OGlCe/readiness.json`.

Final shared UI includes navigation `d1bfb26` and status extraction `947062f`:
`trackflow-ui:pa05-947062f`, image
`sha256:dc0479d18da7d3d133ccd94b7f669a9d2204dc5ac6b70bfcd2f736695582d263`,
container `91ce122753010a8fcc21dff7344774a0173bbbf9ce5af2f1144af3f6ead2be26`.
Preflight14/14 and build/transfer/apply passed; apply5.199s is command duration,
not outage. Independent readiness18/18 at
`/tmp/trackflow-pa05-rollout-947062f/readiness.json` confirmed API identity/start/
full-config digest/resources/data-volume/network, other containers and UI caps/
ports/mounts/network preserved; Compose/private configuration hashes unchanged,
seven app source hashes matched. Website/login200, anonymous auth401 and internal
OpenAPI200 passed. These are container/config checks, not database-byte equality.
The PA02 image above was retained for rollback. Future UI recreation must explicitly
select the intended image tag; the audit did not edit deployment configuration.

## Limits

Single runs do not prove causal performance changes, INP or field acceptance.
Corporate96 is not full accessibility; definition-list/name issues remain.
Favicon/HTTP findings describe this historical PA-05 snapshot (see HTTPS follow-up above). Inventory100 is automated accessibility evidence only; loopback best
practices100 is not public HTTPS proof. Meta description, unused/legacy JS and
render-blocking/network-tree findings remain deferred. Existing source/build/
browser results are reused; this documentation update reruns no runtime checks.
Final evidence commit: `0136526`. The [results report](../../REPORT.md)
summarizes verification and publication.
