# Corporate IP HTTPS follow-up

## Goal and constraints
Fix the corporate favicon 404, missing HTTPS and HTTP-to-HTTPS redirects using the existing IP and exactly two application containers. Preserve architecture, API identity/configuration, data, mounts, network, dependency files and unrelated work. No domain purchase, HSTS/CSP project, PR creation or merge is authorized. Commit and push of this verified follow-up to fix/corporate-ip-https were explicitly authorized after final checks.

## Authorization and repository state
- User authorized scoped host Nginx/Certbot installation, IP certificate issuance, automatic renewal, UI-only recreation with rollback, redirects, bounded checks and corporate desktop/mobile Lighthouse.
- Explicit additional approvals: generated website .next output; ACME staging/production accounts without email and acceptance of published LE v1.8 July 6 2026 terms; nonsecret https.override.yml instead of reading/editing deployment.env.
- Workspace: fix/corporate-ip-https, created from delivery base94dae36ce1a9f2c3ee1cf0617cd61b1c52fda6bf after peer PA06 documentation commits. PR29 was merged; peer published PA06 separately in PR30. Preserve that cleanup and all twelve original JSON/PNG artifacts.
- Peer documentation/index reservations are released. Preserve unrelated untracked auth-frontend and centralized-incident-manager task notes.

## Tasks
- [x] IP-01 — Add the shared corporate favicon and verify Next/static hosts. Local outcome verified; commit pending authorized delivery.
- [x] IP-02 — Configure trusted IP HTTPS, automatic renewal, nonsecret Compose override and guarded UI-only cutover. Deployed and writer runtime checks passed; commit pending authorized delivery.
- [x] IP-03 — Verify final corporate deployment/browser behavior, measure desktop/mobile once each, and record separate HTTPS evidence. Independent functional and structural verification passed; commit pending authorized delivery.
- [ ] IP-04 — Confirm authenticated backoffice access over HTTPS through an operator or sanctioned credential mechanism. Blocked / awaiting operator: automated credential-file access is prohibited; no login was attempted. This is not a missing corporate Lighthouse measurement.
- [ ] IP-05 — Commit and push the verified follow-up to fix/corporate-ip-https without opening a PR. Authorized; in progress.

## Acceptance checks
- Next and static favicon links resolve to the same valid SVG with correct MIME/body.
- Trusted TLS certificate contains IP SAN162.243.69.7; staging issuance and renewal dry-run with validated Nginx reload pass; renewal timer enabled.
- HTTP80 and old public3000/3001 redirect to HTTPS443 preserving path/query; ACME challenges remain reachable on80.
- Nginx routes website /uis/website prefix to loopback3000 and remaining backoffice/assets/API routes to loopback3001, preserving Next allowlisting.
- Only UI recreated; retain old UI image and explicit rollback configuration. API/container configuration, mounts, network and unrelated services remain unchanged.
- Use a small third Compose file for UI image and replacement loopback port mappings; keep private deployment.env byte-identical and never inspect/print secrets.
- Browser checks cover actual favicon, mixed content, console errors, assets and navigation. Authenticated read-only check uses an existing sanctioned credential mechanism only; otherwise disclose pending.
- Lighthouse13.6.0/Chrome151 baseline settings, one desktop and one mobile run. HTTPS transport/origin changes must be explicit; never promise scores or overwrite prior evidence.
- No real business writes or broad suites. Functional checks remain separate from native source review.

## Verified evidence
### IP-01
One174-byte SVG in uis/website/public/favicon.svg; Next URL /uis/website/favicon.svg, static URL /uis/website/public/favicon.svg. Worker observed missing-asset RED, then GREEN. Independent production HTTP16/16 and four Next/static browser combinations at375/1440 widths passed, with zero unexpected errors/overflow. Local production build passed; owned3310/3312 listeners released. Existing Next workspace-root warning remains.

### Source review and image
Native source review review-b16558a17bef51f2 approved the initial favicon/Nginx slice; exact acknowledgement completed and authority burned. Subsequent nonsecret override is a new configuration delta to verify.
Local image trackflow-ui:ip-https-4ca733a, idsha256:7f58a8cfce6396a4cffaffd45d60b3e85e311897d94777db1240da1fe5680c0f, size1462859972, built once. Log: /tmp/trackflow-ui-ip-https-4ca733a-x54l5x54.log. Peer changed passive README content later, not executable UI source; no rebuild solely for documentation.

### VPS bootstrap
Nginx1.18.0-6ubuntu14.22 and CertbotSnap5.9.0 installed. External80/443 ingress passed before issuance. One staging and one production issuance succeeded; trusted IP certificate expires2026-11-08T12:34:41UTC. Production lineage /etc/letsencrypt/live/trackflow-ip.
Renewal dry-run with deploy hook passed; snap.certbot.renew.timer active/enabled, schedules04:18/14:26UTC. Hook runs nginx -t before reload. Website/loginHTTPS200, anonymous API401 and unknownAPI404; parent externalHTTPS200/trust0 and query-preserving HTTP308 spotcheck passed.
Both application identities/configuration/mounts/networks, deployment-file hashes and22 baseline service identities remained unchanged. Legacy ports remain publicly served by old UI until cutover.
Remote private evidence: /var/log/trackflow-ip02-GDJuisrA. Local: /tmp/trackflow-ip02-bootstrap-GDJuisrA.

## Current cutover plan and known limitations
Worker cannot read/rewrite credential files; respect that restriction. User selected a nonsecret /opt/trackflow-containerization/https.override.yml instead. Remote Compose5.6.1 supports ports !override; project labels match trackflow-production; candidate override path is absent. Local synthetic three-file merge passed replacement ports/image and preserved resource limits. Production config --quiet and one UI-only recreation passed.
Use existing production Compose + resources override + HTTPS override, and normal Compose configuration consumption without exposing private values. Transfer only the verified UI image; perform one guarded UI-only recreation, then enable Nginx listeners bound specifically to162.243.69.7:3000/3001 after wildcard Docker bindings are gone.
Rollback must first disable those Nginx legacy listeners, then restore original public ports and explicitly pin trackflow-ui:pa05-947062f; do not rely on a possibly stale private-env image tag. Never docker compose down.
Tooling failures were limited to expected package-absence handling and one omitted SSH identity option; neither caused mutation. The known key transport works. Cutover and both corporate Lighthouse runs completed; authenticated backoffice verification remains pending.
Baseline UI id91ce122753010a8fcc21dff7344774a0173bbbf9ce5af2f1144af3f6ead2be26; API id561dab00b43e7793f53a29013bede70793cb2ed12931c9a0484d708e50aa71e3. API Config+HostConfig SHA2560992cc8f542eaa3ad6ee9331b1c29c4743c9ed762dcf16fbbea936357e6d8432. Old UI image sha256:dc0479d18da7d3d133ccd94b7f669a9d2204dc5ac6b70bfcd2f736695582d263.
Nonsecret override is prepared and synthetic native Compose validation passed, preserving resources/API/network/volumes. Native source review review-313fd819c377f678 approved and exact acknowledgement completed (authority burned). Runtime-only worker completed the authorized cutover without private-file inspection/mutation. Next: independent runtime/browser acceptance and one Lighthouse run per corporate profile. Commit identities for this follow-up: none yet; delivery is now explicitly authorized.

Cutover evidence: /tmp/trackflow-ip02-cutover-BNegRNpj and remote /var/log/trackflow-ip02-cutover-BNegRNpj. New UI d0175efd667613e4796ca584a2daf0b0b4c0387ad2a74695f70b89114c466509 on approved image, loopback-only ports, restart0/OOMfalse. HTTP80/3000/3001 redirects, trusted HTTPS, exactSVG/favicon, assets, anonymousAPI and ACME checks passed. API identity/configuration, privateenv/baseCompose/resources, mounts/network and23service identities preserved. No mutation retry or rollback; image-size metadata discrepancy resolved by exact content IDs/layers; listener visibility checked after asynchronous reload. Apply duration3.289s is not outage duration.

Independent IP-03 result: website16/16,19externalHTTP checks, corporate375/1440browser and separate anonymous backoffice routing passed. Runtime preservation and renewal timer/evidence confirmed without reissuing. Exactly one Lighthouse desktop and one mobile run each measured100/96/100/100 at2026-11-01T21:56:30.361Z and21:56:42.381Z. is-on-https/errors-in-console pass; redirects-http is null/notApplicable, with redirect success established independently. Full settings/tool versions match prior profiles; HTTP3000→HTTPS443 transport/origin and time differ, so no controlled causal claim. Evidence /tmp/trackflow-ip03-cfofof; parent inspected both genuine reportPNGs. Documentation/copy verification in progress; original12artifacts preserved. Authenticated login is a separate pending item, not claimed passed.

IP-03 documentation closed: four exact new copies under audit/after/website-https-* plus HTTPS.md; REPORT/after-index/website README/runtime runbook/progress updated without replacing historical evidence. Independent structural PASS: four source/destination hashes, two PNG1440x1100 signatures, JSON scores/settings/version/audit semantics,62relative links,12originalartifacts equalHEAD,113673bytepriorprogressprefix and accepted source/config preserved. Privacy patterns zero (not exhaustive). gitdiff--check clean. No runtime/Lighthouse reruns. Final ASSESS remained unassessable because of untracked declaration; independent verification supplied the required fallback, without inventing new native review authority.

Delivery authorized: after final independent verification passed, user explicitly authorized commit and push to new fix/corporate-ip-https, without opening a PR. Parent liveGitHub check confirmed PR29 and PR30 both MERGED; localHEAD remains94dae36ce1a9f2c3ee1cf0617cd61b1c52fda6bf. Pre-commit checks passed for the 17-path candidate; publication is tracked by IP-05. Next: scoped commit/push (IP-05), preserving separate operator/sanctioned authenticated HTTPS check (IP-04).
