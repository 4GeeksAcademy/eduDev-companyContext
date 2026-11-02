# TrackFlow public-IP HTTPS and Tracker deployment

## Historical HTTPS cutover snapshot (before Tracker)

**HTTPS bootstrap and UI cutover complete; independently checked2026-11-01.** Ubuntu22.04, `162.243.69.7`:
Nginx `1.18.0-6ubuntu14.22`, Snap Certbot `5.9.0`. Staging/production issuance,
external ingress/trusted TLS and renewal dry-run with validated reload passed.
Certificate expires `2026-11-08T12:34:41Z`; `snap.certbot.renew.timer` enabled/active,
scheduled04:18/14:26UTC. Evidence: VPS `/var/log/trackflow-ip02-GDJuisrA/`,
local `/tmp/trackflow-ip02-bootstrap-GDJuisrA/`. Steps2–3 record completed bootstrap;
do not repeat issuance/dry-run for cutover. Exactly two application containers;
no API recreation, domain, HSTS/CSP, auth or cache-policy work.
UI at that cutover: `d0175efd667613e4796ca584a2daf0b0b4c0387ad2a74695f70b89114c466509`,
tag `trackflow-ui:ip-https-4ca733a`; API identity below is unchanged.
Independent website16/16,19 external HTTP checks and corporate375/1440 plus
anonymous backoffice browser checks passed. [Public HTTPS evidence](../../audit/after/HTTPS.md)
records scores and limits; authenticated backoffice acceptance remains **PENDING**.
Future deployment must retain the third `-f https.override.yml` after production
and resources files (full paths in step5); private environment stays unchanged.

## Tracker TPD-03 — deployed operator snapshot

Operator checks returned HTTP200/TLS verify0 for
`https://162.243.69.7/talent/login` (private entry `/talent`),
`https://162.243.69.7/uis/website/` and
`https://162.243.69.7/uis/backoffice/login.html`. Exactly two app containers:
- UI `ad71eb932d4d2d6d978d53ad4fe2d03f526312db6d60b9fc8e98848943825a96`,
  tag `trackflow-ui:talent-044fde0`, image
  `sha256:2f396a02c419ac5e8120e999a6a3a5e93c1e94bb1e52b133bac876809eccaaa6`.
- API `6ffa361b575408787ab4948024c64ad11804c4c783f3c994e577988bedd96545`,
  unchanged image `sha256:af504a8e775ccbab96ae8533b4aaecfe12f8fb0f485a1201027196fce644183e`.

Resolved API image was checked before apply. One approved UI and one API
recreation changed both identities; Nginx validation/reload passed, with no blind
repeat or rollback. Only API `FRONTEND_PUBLIC_URL` changed, through the nonsecret
HTTPS override, to `https://162.243.69.7/talent`. Other application config/env
invariants, mounts/network and private-env/base-Compose/resources hashes matched.
No direct user-data/business writes; preserved volumes are not DB-byte proof.
UI publications are loopback3000/3001/3003, API has no host port, and public legacy
redirects remain. Before Nginx exposure, the built UI proxy returned anonymous
GET401 for `/api/auth/me`, `/api/profiles/me`, `/api/users`, and unknown API404.

Local build/config-lifecycle21/21/proxy6/6 passed. Normal-bridge three-frontend
smoke observed138.2MiB/151MiB peak; the earlier internal-fixture publication issue
did not demonstrate an application defect; its root cause was not investigated further.
Operator VPS point: UI143.2MiB/512MiB, API72.36MiB/256MiB, zero OOM/restarts,
unchanged .75/.25CPU caps. Brief observations are not load/capacity guarantees.
Evidence: `/tmp/trackflow-tpd03-8xFtnx/{baseline.json,after-recreation.json,runtime-guard.py}`;
remote `/var/log/trackflow-tpd03-8xFtnx` holds nonsecret config backups and
UI/API/Nginx apply results. Final verification status belongs to the
[feature task](../../odd/tasks/talent-pipeline-deployment.md).

Rollback source is **pre-Tracker** `trackflow-ui:ip-https-4ca733a`, not PA-05.
Restore only the original nonsecret `https.override.yml` and installed Nginx
site; recreate UI/API only as needed with the same API image and old public
recovery URL `http://162.243.69.7:3000`, then validate/reload and recheck routes.
Never restore private env, use Compose down or remove volumes. Future deployment
must retain the third Compose file. Real HTTPS login/registration/profile writes,
email delivery and shared candidate CRUD remain unverified/not attempted;
correct recovery configuration is not delivery proof. No new Lighthouse run:
the corporate HTTPS scores above are historical pre-Tracker evidence.

## HISTORICAL FIRST ROLLOUT — steps1–6

The old-container preflight/bootstrap/cutover commands below record the first
rollout, **not instructions to blindly repeat** on the current deployment.
Re-baseline current identities and obtain authorization before future changes.
Never print private env values,
tokens, full container inspections or rendered Compose config into logs/artifacts.

## 1. Guard the existing deployment
Runtime directory: `/opt/trackflow-containerization`. Before any host changes:

- Confirm UI container `91ce122753010a8fcc21dff7344774a0173bbbf9ce5af2f1144af3f6ead2be26`,
  tag `trackflow-ui:pa05-947062f`, image
  `sha256:dc0479d18da7d3d133ccd94b7f669a9d2204dc5ac6b70bfcd2f736695582d263`.
- Confirm API `561dab00b43e7793f53a29013bede70793cb2ed12931c9a0484d708e50aa71e3`.
  Privately baseline its image digest, configuration, mounts, network attachment,
  start time and restart count; compare these unchanged after every rollout.
- Retrieve `com.docker.compose.project` from **both** containers using formatted
  `docker inspect`; require identical nonempty values. Assign that value to
  `PROJECT`, not a guessed project name. Check service labels are `ui` and `api`.
- Confirm existing `deployment.env`, `docker-compose.production.yml` and
  `resources.override.yml` ownership and paths. Keep all three byte-identical;
  never inspect, copy or rewrite private env contents. Retain the old UI image.
  Require the new `https.override.yml` path absent before initial installation.
- Check `ss -ltnp`, Docker port mappings, available RAM/disk, time synchronization,
  existing Nginx sites and unrelated services. Record listener ownership.
  Stop on unexpected identities, ports or configuration; do not reclaim them.

## 2. Bootstrap ingress before issuance
Install host Nginx through the approved Ubuntu package workflow without upgrading
or restarting unrelated services. Install Certbot using the official Snap method:

```sh
sudo snap install --classic certbot
/snap/bin/certbot --version
```

Require **Certbot >=5.4**; Ubuntu APT 1.21 is insufficient. Use `/snap/bin/certbot`
explicitly. The `--nginx` plugin does **not** support IP issuance; use webroot.
Inspect default-site ownership before disabling any conflicting package default.
Create `/var/www/trackflow-acme/.well-known/acme-challenge` with public read/traverse
permissions; it must contain only disposable probes and ACME challenge files.

Initially install **only the port-80 server block** from `trackflow.conf` in an
owned site under `/etc/nginx/sites-available/`, enabled in `sites-enabled/`.
Do not load the TLS block until production certificate files exist. For the 443
reachability gate, temporarily add a second owned plaintext server:

```nginx
server {
    listen 443;
    server_name 162.243.69.7;
    location = /ip02-ingress { return 200 "trackflow-ip02-ingress\n"; }
    location / { return 404; }
}
```

Run `sudo nginx -t && sudo systemctl reload nginx` (start if not running).
Place a known nonsecret probe in the challenge directory. From outside the VPS,
require its exact body at `http://162.243.69.7/.well-known/acme-challenge/<probe>`
and the marker at `http://162.243.69.7:443/ip02-ingress`. Check HTTP80 redirects
other paths/queries to literal HTTPS IP. Plaintext443 proves ingress, **not TLS**.
Stop if either port is blocked; provider-firewall changes require separate approval.

## 3. Stage, then issue the trusted IP certificate

User explicitly approved no-email accounts and [LE v1.8 terms](https://letsencrypt.org/documents/LE-SA-v1.8-July-06-2026.pdf).
Verify both ACME directories still offer that exact terms URL; stop on change.
Staging uses separate directories and must never serve production TLS:

```sh
sudo /snap/bin/certbot certonly --staging --webroot -w /var/www/trackflow-acme \
  --ip-address 162.243.69.7 --preferred-profile shortlived --cert-name trackflow-ip-staging \
  --config-dir /etc/letsencrypt-staging --work-dir /var/lib/letsencrypt-staging \
  --logs-dir /var/log/letsencrypt-staging \
  --non-interactive --agree-tos --register-unsafely-without-email
sudo /snap/bin/certbot certonly --webroot -w /var/www/trackflow-acme \
  --ip-address 162.243.69.7 --preferred-profile shortlived --cert-name trackflow-ip \
  --non-interactive --agree-tos --register-unsafely-without-email
sudo /snap/bin/certbot certificates
```

Proceed to production only after successful staging. Confirm actual production
fullchain/key paths for the installed version; adjust the two TLS paths if needed.
Inspect the public certificate's issuer, IP SAN and validity (~six days).
Replace the temporary plaintext443 block with the checked-in TLS server; retain
HTTP80 ACME handling. Keep legacy3000/3001 commented until step 5.
Validate/reload, then externally verify trusted HTTPS without `-k`.
At this stage existing wildcard Docker bindings still accept loopback proxy traffic.

Install an executable root-owned deploy hook at
`/etc/letsencrypt/renewal-hooks/deploy/trackflow-nginx` containing:

```sh
#!/bin/sh
set -eu
/usr/sbin/nginx -t && /usr/bin/systemctl reload nginx
```

Confirm the installed Snap renewal timer is enabled and scheduled using
`systemctl list-timers --all`; check its actual unit (normally
`snap.certbot.renew.timer`) rather than creating duplicate cron/timer jobs.
Run `sudo /snap/bin/certbot renew --cert-name trackflow-ip --dry-run --run-deploy-hooks`;
require success including the reload hook. Keep port80 challenges reachable.
Monitor renewal failures and remaining lifetime well before the six-day expiry.
Reference: [Let's Encrypt IP/short-lived Certbot guidance](https://letsencrypt.org/2026/03/11/shorter-certs-certbot).

## 4. Transfer only the verified UI (local workstation)

Reuse built `trackflow-ui:ip-https-4ca733a`, image
`sha256:7f58a8cfce6396a4cffaffd45d60b3e85e311897d94777db1240da1fe5680c0f`
(size1462859972); do not rebuild. Check local identity and VPS headroom first.
Stream `docker save` of only this tag through approved strict-key SSH to `docker load`
with pipeline failure checking; compare remote identity before apply. No pulls,
API image transfer, pruning or dependency changes; retain rollback images.

## 5. Rebind and recreate only UI, then activate legacy redirects

Leave `deployment.env` **untouched**. Install the reviewed nonsecret
[`https.override.yml`](https.override.yml) at `/opt/trackflow-containerization/https.override.yml`.
Its `ports: !override` replaces, rather than appends to, public mappings; require
Compose supporting `!override` (VPS5.6.1). **Future rollouts must include this third
file** after production/resources overrides; update its explicit image pin deliberately.
Use this Bash function with the label-derived `PROJECT` from step1:

```bash
compose_ui() {
  env -i PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    HOME=/root COMPOSE_DISABLE_ENV_FILE=1 \
    docker compose --project-directory /opt/trackflow-containerization \
    --project-name "${PROJECT:?require matching container project labels}" \
    --env-file /opt/trackflow-containerization/deployment.env \
    -f /opt/trackflow-containerization/docker-compose.production.yml \
    -f /opt/trackflow-containerization/resources.override.yml \
    -f /opt/trackflow-containerization/https.override.yml "$@"
}
compose_ui config --quiet
compose_ui up -d --no-deps --no-build --pull never --force-recreate ui
```

Require config validation success before `up`. The clean environment and explicit
files prevent ambient image, secret, Compose override or project-name leakage.
Confirm exactly two project containers, UI readiness, both Docker publications
on `127.0.0.1` only, and public3000/3001 free using Docker inspection **and** socket
ownership (Docker may use NAT without a userspace listener). Only then uncomment
the final legacy block in the installed site. Its listeners must be exactly
`162.243.69.7:3000` and `162.243.69.7:3001`, never wildcard or loopback.
Run `sudo nginx -t && sudo systemctl reload nginx`; recheck listener ownership.

## 6. Accept or roll back
- Verify HTTP80 and both legacy ports redirect with path/query intact; ACME stays200.
- Verify trusted TLS IP SAN/expiry, `/` query-preserving redirect and `/favicon.ico`
  redirect to `/uis/website/favicon.svg` (200, `image/svg+xml`, expected174-byte SVG).
- Check website base and slash descendants/assets on3000; backoffice `/backoffice`,
  `/uis/backoffice`, root `/_next` and remaining paths go to3001 unchanged.
  Next alone allowlists `/api/auth`, `/api/suppliers`, `/api/inventory`,
  `/api/api/incidents`; check anonymous401 and unknown404, not business writes.
- Check browser mixed content/favicon errors and origin-local session behavior;
  real authentication only over verified TLS with the approved credential mechanism.
- Compare API identity/image/configuration/network/mounts/start/restarts unchanged;
  preserve unrelated services. IP retention remains a provider assumption.

On failed cutover, **first comment out only the owned legacy Nginx server block**,
validate/reload and confirm public3000/3001 released. Create an exclusive owned
nonsecret `/opt/trackflow-containerization/https.rollback.yml`:
```yaml
services:
  ui:
    image: trackflow-ui:pa05-947062f
    ports: !override
      - "0.0.0.0:3000:3000"
      - "0.0.0.0:3001:3001"
```
Append `-f /opt/trackflow-containerization/https.rollback.yml` to `compose_ui`
**before** `config --quiet`, then before the same UI-only `up` arguments above.
This fourth file explicitly overrides the HTTPS pin/ports, not a stale env tag.
Never `down`, recreate API, remove volumes or alter deployment.env. Recheck old UI
readiness/API invariants; TLS80/443 may remain.

## Historical HTTPS completion — 2026-11-01

One UI recreation/one Nginx cutover reload completed; old image retained, no rollback.
Apply3.289s is command duration, not measured outage. Two application containers,
API configuration, private env/resources, mounts/network and23 service identities
were preserved. HTTP80/3000/3001 return308 with path/query; trusted IP TLS, ACME,
favicon and anonymous routing passed. No API/data writes. Prior renewal dry-run
hook verification and active twice-daily timer remain the renewal evidence.
Authenticated backoffice remains pending (credential loader requires prohibited
`.env` access): zero login POSTs/business writes/backoffice Lighthouse runs.
This is bounded pre-Tracker verification, not complete business acceptance or a future guarantee.
