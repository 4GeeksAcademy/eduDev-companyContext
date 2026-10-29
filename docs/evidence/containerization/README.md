# Limited initial VPS rollout

The two verified production images are running and live infrastructure checks
passed independently. **T5 remains in progress** for private SQL/operator setup;
this is a limited initial deployment, not full business acceptance.

- Website: http://162.243.69.7:3000/uis/website/
- Backoffice login: http://162.243.69.7:3001/uis/backoffice/login.html
- HTTP only, no TLS: do not send real credentials or tokens over these URLs.

## Capture context

[VPS evidence](vps-initial.txt) records anonymous readiness and a short resource
smoke, not sustained-load acceptance. Capture time from VPS: 2026-10-29T18:37:50Z.
[Recorded local Compose output](local-compose-ps.txt) and
[local browser image](local-backoffice.png) are reused T5b synthetic-fixture
artifacts, not current VPS authenticated screenshots. The image contains only
synthetic supplier fixture data; no credentials or customer records are shown.
[Recorded local container image](local-containers.png) is a faithful rendering
of that exact saved Compose output, produced with existing Chromium tooling.
It is visibly labelled as recorded output, not a fresh terminal/live-state capture.

## Artifact identity

Source packaging commit: `b57dfb08d2e982a524d6da051548aecc5893d8d8`.
Retained artifacts were built before that commit; their exact identities, rather
than a claim of a new commit-built image, govern this deployment. Both are amd64.

| Tag | Image ID |
| --- | --- |
| `trackflow-t5b-verify-0552b97-0622-ui:production` | `sha256:720b393714f3ca2ebf56c8ba7a3e04b5f00ca0a84a5ddfdcef39be87c8a12b21` |
| `trackflow-t5b-verify-0552b97-0622-api:production` | `sha256:af504a8e775ccbab96ae8533b4aaecfe12f8fb0f485a1201027196fce644183e` |

Images were streamed with Docker save/gzip/SSH/load, without rebuilding,
registry publication or remote archive. All local/remote pipeline stages exited0.
Local and remote image IDs match. Production Compose bytes match committed source
(SHA256 `371237433e81ff5f7a372e8a5224a729d148ac292ba81bd6b0f8ee5c57a3bf0c`).

## Owned deployment and retained state

Only new `/opt/trackflow-containerization/` was provisioned, containing:
`docker-compose.production.yml`, `resources.override.yml`,
`deployment-marker.json`, empty `docker-config/`, and private `deployment.env`.
The private file was exclusive-created root:root0600 with a fresh server-CSPRNG
JWT; never printed, read back, hashed or copied. Only native Compose consumed it.
Public settings name project/images, bind0.0.0.0, ports3000/3001, both public UI
CORS origins, blank DATABASE_URL and blank optional mail settings. UI receives
only the committed public allowlist, not backend secrets.

Project `trackflow-production` owns exactly UI/API containers, network
`trackflow-production_network` and retained volume
`trackflow-production_production_api_data`. API alone mounts that volume at
`/app/data`; API8000 and private legacy3002 are unpublished. No host source binds.
Override caps: UI512MiB/.75CPU; API256MiB/.25CPU, verified in Docker accounting.
Startup used native Compose `config --quiet`, then `up -d --no-build --pull never`.
No schema/migration/mail calls, account creation, admin tokens or authenticated
public HTTP were performed. Existing supplier startup bootstrap uses only the
new owned volume. No pre-existing workload, data or package was modified. Docker managed the planned
port publishing; no manual firewall-rule changes were made.

## Limits and next step

Blank SQL means inventory503 by existing contract; current unauthenticated smoke
did not assert an authenticated inventory response. No full inventory/business
acceptance. First administrator remains operator-owned/out-of-band and unconfigured.
Independent live checks confirmed exact image IDs, two running containers with
zero restarts/OOM, caps/mounts/internal API200, and current expected listeners.
Parent external checks returned website/login200 and anonymous API proxy401.
Available RAM was282MiB, free swap1754MiB and free disk8031506432bytes; containers
used146.1/72.38MiB during the final check. Historical service-identity preservation
remains writer-recorded. Known favicon404 remains; no clean-console claim.
SQL/schema/RLS, first administrator, TLS/security hardening and sustained load
remain unverified. Keep private configuration, volume and images on partial failure.
