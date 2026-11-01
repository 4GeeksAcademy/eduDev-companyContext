# Corporate HTTPS follow-up — IP-03

Latest verification: **2026-11-01**, not a future availability guarantee.
Public URL: <https://162.243.69.7/uis/website/>. Favicon and trusted IP HTTPS
are deployed; the [PA-05 snapshot](README.md) and its twelve original artifacts remain unchanged.

## Results and method

Scores are Performance / Accessibility / Best practices / SEO.

| Profile | Previous HTTP | HTTPS | Evidence | Fetch time (UTC, 2026-11-01) |
| --- | --- | --- | --- | --- |
| Desktop | 100 / 96 / 74 / 100 | 100 / 96 / 100 / 100 | [JSON](website-https-desktop.report.json) / [PNG](website-https-desktop.png) | 21:56:30.361 |
| Mobile | 100 / 96 / 74 / 100 | 100 / 96 / 100 / 100 | [JSON](website-https-mobile.report.json) / [PNG](website-https-mobile.png) | 21:56:42.381 |

Exactly one run per profile, no reruns: Lighthouse13.6.0, Chrome151.0.7922.34,
fresh public profiles, CLI navigation/storage reset. Full JSON settings match
both previous corresponding profiles. HTTP3000 → HTTPS443 changes transport/origin
and measurement time: these single runs are not controlled causal proof.
No runtime errors or audit/run warnings. `is-on-https` and `errors-in-console`
score1; `redirects-http` is null/`notApplicable`, **not a pass**. Independent
HTTP80/3000/3001 checks establish308 redirects preserving path/query instead.
Parent visually inspected both genuine report PNGs:1440×1100 capture, distinct
from desktop1350×940/mobile412×823 device emulation.

## Runtime evidence and limits

Independent website16/16,19 external HTTP checks, corporate375/1440 browser
and anonymous backoffice checks passed. Trusted TLS has IP SAN162.243.69.7;
Nginx1.18.0/Certbot5.9.0, expiry2026-11-08T12:34:41Z. Renewal timer active twice
daily; prior renewal dry-run and validated reload hook passed.
One UI recreation and one Nginx cutover reload; old image retained. The3.289s
apply command duration is **not outage duration**. Two application containers,
API identity/configuration, private env, resources, mounts, network and23 service
identities preserved. No API/data writes. [Deployment details](../../infra/nginx/README.md).

**Authenticated backoffice acceptance remains PENDING**: the credential loader
requires prohibited `.env` access. Zero login POSTs, business writes or backoffice
Lighthouse runs in this follow-up; no complete business acceptance claim.
Definition-list/name mismatch, unused/legacy JS, modern HTTP, network-tree and
render-blocking findings remain deferred. Accessibility96 is not full accessibility;
best-practices100 is not security certification or field/INP acceptance.

## Public evidence and copy integrity

Only four public files copied byte-for-byte from `/tmp/trackflow-ip03-cfofof/`;
no HTML/private evidence copied. Existing `measurement.json`, `privacy-scan.json`,
`preservation.json` and runtime/external/browser logs retain detailed provenance.
Public-report privacy scan found zero unexpected emails, JWTs, private keys,
bearer tokens or credential values; pattern scanning is not universal secret proof.

| Copied file | SHA-256 (source = destination) |
| --- | --- |
| Desktop JSON | `74efde6b26254865e092f16056fa3c908f0fe8ac5cc74f146daab8a03370469a` |
| Desktop PNG | `590a81924e262a9d01e87355e1ebb1cede0971b450103b577f83942ca076ad14` |
| Mobile JSON | `34ccb0b8e05bb3f4c58b3eb8986e6e2f00ee653e20ac3d0ab23d65cb197688c7` |
| Mobile PNG | `15eeedf397e4020f1ef1034088fe27ed44ca136ad37dc4311569508cb6321c52` |

This passive evidence update uses structural checks only; no runtime or audit reruns.
