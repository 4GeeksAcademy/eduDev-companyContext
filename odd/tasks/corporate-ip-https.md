# Corporate IP HTTPS follow-up

## Goal and constraints
Resolve the corporate favicon 404, missing HTTPS and missing HTTP-to-HTTPS redirects using the existing IP and exactly two application containers. Preserve architecture, API identity/configuration, data, mounts, network, dependencies and unrelated work. No domain purchase or HSTS/CSP project.

## Authority and delivery
The user authorized the scoped VPS work, generated website build output, ACME accounts without contact email and acceptance of LE v1.8 terms, and the nonsecret Compose override instead of credential-file access. After final checks, the user explicitly authorized commit and push to `fix/corporate-ip-https`, without opening a PR or merging.
- Delivery base: `94dae36ce1a9f2c3ee1cf0617cd61b1c52fda6bf`.
- Published work unit for IP-01, IP-02 and IP-03: `aeac112ae28aec5f5d89b3f12e71f763502aeb23` — `fix(website): serve favicon over trusted IP HTTPS`.
- Push to `origin/fix/corporate-ip-https` succeeded. No PR created for this follow-up.
- Earlier PR29 and PA06 documentation PR30 were already merged. Their cleanup and twelve original JSON/PNG artifacts were preserved.
- Unrelated untracked `odd/tasks/auth-frontend.md` and `odd/tasks/centralized-incident-manager.md` remain excluded.

## Tasks
- [x] **IP-01 — Shared corporate favicon.** Test-first source change and independent Next/static HTTP/browser checks passed; included in the published work unit.
- [x] **IP-02 — Trusted IP HTTPS and UI-only cutover.** Host Nginx/Certbot, automatic renewal, nonsecret override and all legacy-port redirects deployed and independently verified; included in the published work unit.
- [x] **IP-03 — Corporate measurement and evidence.** One desktop and one mobile Lighthouse run, separate exact artifact copies and independent structural checks passed; included in the published work unit.
- [ ] **IP-04 — Authenticated backoffice HTTPS check.** Blocked awaiting an operator or sanctioned credential mechanism. The available loader requires prohibited credential-file access; no login was attempted.
- [x] **IP-05 — Commit and push.** The verified work unit was committed and pushed with explicit authorization. No PR or merge.

## Observed results
| Profile | Previous HTTP scores | HTTPS scores |
| --- | --- | --- |
| Corporate desktop | 100 / 96 / 74 / 100 | 100 / 96 / 100 / 100 |
| Corporate mobile | 100 / 96 / 74 / 100 | 100 / 96 / 100 / 100 |

Order: Performance / Accessibility / Best practices / SEO. Lighthouse 13.6.0, Chrome 151.0.7922.34; fetch times 2026-11-01T21:56:30.361Z and 21:56:42.381Z. Exactly one run per profile, no audit retries. Full settings match historical profiles, but HTTP:3000 to HTTPS:443 changes transport/origin and measurement time. Single samples are not controlled causal proof or security certification.
`is-on-https` and `errors-in-console` passed; `redirects-http` is null/notApplicable, not a pass. Independent HTTP checks established query-preserving 308 redirects on ports 80, 3000 and 3001. Remaining semantic/accessibility and performance findings are deferred.

## Verified checks and limitations
- Favicon worker observed missing-asset RED then GREEN. Shared 174-byte SVG works under Next and static hosting; independent 16/16 production HTTP checks and four local browser combinations passed.
- Local production build and UI Docker build passed. Corporate HTTPS browser checks at 375/1440 widths passed with no unexpected console/page/request errors, mixed HTTP content or horizontal overflow.
- Nginx validation, external ingress before issuance, one staging and one production issuance, trusted IP SAN, and renewal dry-run with validated reload passed. Renewal timer is active/enabled twice daily.
- Nonsecret three-file Compose merge passed synthetic validation. One UI recreation and one cutover Nginx reload succeeded; no mutation retry or rollback. The 3.289-second apply command is not measured outage duration.
- Independent runtime verification and 19 external HTTP checks passed. API identity/configuration/start/restarts, private deployment files, mounts/network/resources and 23 service identities were preserved. Exactly two application containers remain.
- Anonymous backoffice routing and same-origin API checks passed. Authenticated login, full business acceptance, business writes and backoffice Lighthouse were not performed.
- Native source reviews `review-b16558a17bef51f2` and `review-313fd819c377f678` approved; exact acknowledgements completed and authority was burned. Final passive-document ASSESS was unassessable due to untracked declaration; independent verification supplied the required fallback.
- Final independent structural checks passed: four exact artifact copies/hashes, PNG 1440×1100 dimensions, scores/settings/audit semantics, 62 local links, twelve original artifacts and prior progress history preserved. Privacy pattern scans found no candidates, not universal secret proof. Parent visually inspected both report PNGs.
- Fresh pre-commit HTTP smoke passed 16/16 with no skips; exact 17-path staging, secret-pattern checks and whitespace checks passed. Two stale task-state phrases were corrected before commit. Earlier probe/fixture assertion errors were corrected without extra issuance, cutover or Lighthouse attempts.

## Runtime recovery
- Public website: <https://162.243.69.7/uis/website/>.
- UI: `d0175efd667613e4796ca584a2daf0b0b4c0387ad2a74695f70b89114c466509`, image `trackflow-ui:ip-https-4ca733a` / `sha256:7f58a8cfce6396a4cffaffd45d60b3e85e311897d94777db1240da1fe5680c0f`.
- API remains `561dab00b43e7793f53a29013bede70793cb2ed12931c9a0484d708e50aa71e3`; Config+HostConfig hash `0992cc8f542eaa3ad6ee9331b1c29c4743c9ed762dcf16fbbea936357e6d8432`.
- UI ports bind only 127.0.0.1; Nginx owns public redirects. Future deployments must include `/opt/trackflow-containerization/https.override.yml` as the third Compose file. Private `deployment.env` stayed byte-identical.
- Nginx 1.18.0; Certbot Snap 5.9.0; certificate lineage `/etc/letsencrypt/live/trackflow-ip`, observed expiry 2026-11-08T12:34:41Z. Renewal schedules 04:18/14:26 UTC; monitor renewal before expiry.
- Old UI image `trackflow-ui:pa05-947062f` remains available. Rollback disables owned legacy Nginx listeners first, then explicitly pins the old image/public ports through a nonsecret fourth override. Never recreate API, use Compose down or change data.
- Runbook: `infra/nginx/README.md`. Evidence: `audit/after/HTTPS.md` and `website-https-*` artifacts. Detailed temporary evidence: `/tmp/trackflow-ip03-cfofof/`; remote private bootstrap/cutover evidence under `/var/log/trackflow-ip02-GDJuisrA/` and `/var/log/trackflow-ip02-cutover-BNegRNpj/`.

## Next step
Obtain an operator/sanctioned authenticated HTTPS check for IP-04. PR creation and merge remain separate human decisions; the published corporate correction and its evidence do not claim full backoffice acceptance.
