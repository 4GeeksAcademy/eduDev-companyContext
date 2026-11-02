# Deployed VPS serialization evidence — automated pass

Three actual deployed Swagger GET operations returned **200**, and the public
HTTPS backoffice rendered **15 supplier rows** with matching API names and zero
recorded browser errors. This is automated Playwright evidence, **not human manual
Swagger acceptance**; T8 remains pending.

## Source and runtime

[Sanitized runtime record](runtime-sanitized.json) supplies the capture timestamp
`2026-11-02T13:40:56.904Z`, field sets, counts, PNG SHA-256 hashes and cleanup proof.
The browser used Playwright **1.62.1** / Chromium **151.0.7922.34**.

- API release: `7a2fc656dc6fb70914dec79c37d89126a96790c3`.
- Image: `sha256:1747959ceeb82c206b63c44c4b9ba2ad6c86d75289cca6c706be6a62f34553f0`.
- Swagger used an owned loopback SSH forward to the **actual deployed VPS API**,
  not a locally started API or substituted response fixture.
- The supplier UI used public HTTPS at `https://162.243.69.7` with authentication;
  “public” describes the origin, not anonymous access to supplier data.

## Captured results

| Surface | Status | Observed count | Capture |
|---|---|---|---|
| Swagger `GET /auth/me` | 200 | 1 synthetic identity/profile | [Current user](01-current-user.png) |
| Swagger `GET /suppliers` | 200 | 15 rows | [Suppliers](02-suppliers.png) |
| Swagger `GET /inventory/products` | 200 | 6 rows | [Products](03-inventory-products.png) |
| Public `/uis/backoffice/suppliers.html` | 200 | 15 visible rows; names match API | [Supplier table](04-backoffice-suppliers.png) |

Exact observed top-level field sets are in `checks[].fields` in the runtime record.
The current-user capture also shows the shallow profile fields
`id, user_id, name, phone, address`. List screenshots show only the visible part
of the scrollable response; full response counts come from the automated record.

## Privacy and cleanup

Swagger captures include only the live **Server response** table (body and response
headers), excluding request curl, authorization controls and authorization headers.
The UI capture includes only the supplier table, excluding session/account controls.
Only a synthetic profile appears; no password or JWT values are retained. The
runtime record reports a passed credential scan; token-related cleanup fields
contain HTTP status codes, not credentials.

Cleanup passed at `2026-11-02T13:42:25.416480+00:00`: ownership was verified,
self-deletion returned **204**, and the old token returned **401** internally and
publicly. Original record counts, canonical/byte hashes and supplier byte hash
were unchanged. The owned tunnel and browser were closed and private credential
files removed. These are recorded parent-run results, not fresh remote checks by
this documentation pass.

## Attempt history and limits

The first authorization locator used visible text rather than the distinct
accessible name and timed out before capture; its account and tunnel were cleaned.
The corrected rerun used a CSS locator and produced these successful captures;
no application change was required.

This bounded automated run is not human manual T8 completion, full live endpoint
coverage, sustained-load testing or proof of mail delivery. This documentation
pass only reads sanitized evidence; it starts no browser, API or SSH connection,
changes no runtime/data, and performs no deployment or full-suite rerun.
See the [complete audit](../../serialization-audit.md) for earlier test and rollout
history. Commit and publication remain separate parent-owned decisions.
