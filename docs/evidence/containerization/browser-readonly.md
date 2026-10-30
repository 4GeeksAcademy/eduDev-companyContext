# Public browser evidence and pending read-only inventory check

**Bounded anonymous coverage: PASS. Full Next inventory skill: PENDING.**
External public-IP Playwright checks below are later than the UI-container API
postcheck in [runtime evidence](api-db-runtime.txt); neither proves authenticated
inventory acceptance. This guide records supplied verifier evidence, not a rerun.

## Tested public URLs — anonymous only

- Backoffice: http://162.243.69.7:3001/uis/backoffice/login.html
- Website: http://162.243.69.7:3000/uis/website/
- Both used 390x900 and 1440x900 viewports. **Do not send real credentials or
  tokens over these public HTTP URLs.** Database TLS does not secure browser HTTP.

## Observed external coverage

- Backoffice login returned 200 with visible, enabled email/password/Sign in,
  matching labels, email → password → submit tab order and 3px focus outlines.
  Document scroll widths were 390/1440; fresh storage and cookies were empty.
  Runtime API base was `/api`; `api-config.js` preceded the login module.
- At desktop width, all four routes below initially returned 200, then reached
  same-origin legacy login (200) with the exact decoded `next` route.
  Bounded commit/DOMContentLoaded/load/mutation samples found zero private
  inventory containers, tables or selects; this does not exclude every possible flash.
- Backoffice requests stayed on port 3001's origin; assets returned 200.
  Anonymous auth401 was the sole expected console error; no unexpected 500,
  page exceptions or failed requests. Historical favicon404 was not observed.
- Website returned 200 with TrackFlow logistics, LA/Zaragoza and three services;
  structure was one header, one main, four sections and one footer.
  Scroll widths stayed 390/1440 before and after anchors. Tab order covered
  skip link, brand and navigation with 3px focus; keyboard Contact and clicked
  Capability/Footprint/Contact targets were visible. `#main-content` worked,
  but focus transfer into main was **not established**.
- Website resources all returned 200 on its own origin; zero console warnings,
  errors, page exceptions or failed requests.

## Provenance, harness limitation and safety

Verifier `mvubg2cd-g-to2n` reused cached Playwright Core 1.62.1 at
`/home/lab/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core` and executable
`/home/lab/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`
(Chromium 151.0.7922.34). Three stdin Node runs: initial login run exited 1
solely on a harness `response.status()` versus browser Fetch `response.status`
property mistake after login-page checks; four-route and website runs exited 0.
Focused verifier `mvublyvu-h-qcad` ran one stdin Node follow-up, exit 0:
browser Fetch status401, network401/login200, zero page errors/blocked requests.
Complete scripts are in the agent tool transcript, not a checked-in runner.
No new screenshots or evidence artifacts were captured by those runs.

Same-origin GET/HEAD/OPTIONS, no-credential guards reported zero blocked requests.
No mocked/fabricated authentication, POST, account/inventory write, mail or external
action occurred. Browsers closed; Git status stayed unchanged. No installation,
rebuild, runtime edit or process change occurred. Existing startup `create_all`,
first-admin, HTTPS, sustained-load and formal fork/screenshot caveats remain in the
[evidence index](README.md); runtime DB TLS PASS is not browser inventory PASS.

## Manual check — pending prerequisites, not executed

Require a legitimate active account, authorization to view the intended inventory,
and an operator-approved origin with verified HTTPS (or separately authorized
encrypted access). Account/first-admin provisioning and secure access remain
pending operator prerequisites; this guide supplies no provisioning commands,
hostname or account. Stop if these prerequisites are missing. Confirm login and
inventory use the same intended identity/API service before sending credentials.

Use these root-relative paths only under that approved secure origin:

1. Open `/backoffice/inventory/products` anonymously; require same-origin
   `/uis/backoffice/login.html` with a safe `next`. Log in legitimately, confirm
   `/auth/me` returns 200 (proxy mode: `/api/auth/me`), safe return and no private
   content before validation. Never record passwords, tokens or identity payloads.
2. Products: inspect name, SKU, client, category, warehouse and current stock;
   verify low stock means <10 and receipt/exit row links prefill the selected SKU.
3. `/backoffice/inventory/orders/inbound`: inspect SKU, warehouse, quantity and
   reference controls. `/backoffice/inventory/orders/outbound`: select SKU and
   check fresh stock **before quantity entry**, warehouse and dispatch tracking
   versus loss controls. **Do not submit either form.**
4. `/backoffice/inventory/orders`: read SKU name, quantity, movement type, date,
   warehouse and user UUID without exporting personal data.
5. Across all four views at 390x900 and 1440x900, check keyboard focus, horizontal
   overflow and unexpected console/page/resource errors; record unavailable data
   or loading/empty/error states honestly rather than forcing failures.
6. Log out; refresh/revisit private routes and require the login guard again.

Mutation tests (receipt/exit submission, reset, duplicate protection, overstock400
and new history rows) are out of scope: require approved test data and separate
authorization. This read-only flow alone cannot complete the full Next skill.
