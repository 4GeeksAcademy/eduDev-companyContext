---
name: verify-trackflow-ui
description: "Trigger: verify TrackFlow UI, UI delivery check. Verify one TrackFlow UI before delivery."
license: Apache-2.0
metadata:
  author: "4GeeksAcademy"
  version: "1.0"
---

# Verify TrackFlow UI

## Inputs and boundaries

Verify **one selected UI per run**. Record its folder (`uis/website` or
`uis/backoffice`), exact browser URL, **static or Next inventory** hosting choice,
API URL/apiPort where applicable, and ownership of each existing process.

- Do not install packages, edit files, silently rebuild, or substitute server commands.
- Reuse compatible existing processes; never restart or stop unrelated servers.
- Start only missing authorized processes in dedicated attached terminals. Stop only
  processes started by this run (Ctrl+C and confirm exit), even after failure.
- Use only run-owned temporary HTML/check logs; remove only those on cleanup.
- Report observations, failures and skipped checks, not inferred success.

## Choose the host

| Mode | Startup when needed (repository root) | Browser URL |
| --- | --- | --- |
| Static website/legacy backoffice | `npm run serve` | `http://localhost:3000/uis/website/` or `/uis/backoffice/` |
| Next inventory | `npm --prefix uis/backoffice run legacy`, then `npm --prefix uis/backoffice run start -- --hostname 127.0.0.1 --port 3300` in separate terminals | `http://localhost:3300/backoffice/inventory/products` |

For Next, prefer an existing successful production build matching the source and
intended public API configuration. If unavailable/incompatible, stop and report the
prerequisite; do not build or switch to dev silently. Dev can regenerate type imports.
Choose an explicit available browser-facing port (3300 above is an example).
The allowlisted legacy proxy upstream remains **127.0.0.1:3001**, never public;
its port cannot equal the Next port. Confirm an existing upstream is compatible.
`npm run serve` does **not** render App Router routes.

## Static branch — preserve the original checks

1. Confirm the selected folder contains `index.html` and `README.md`.
2. Use the selected static URL and root server above. Fetch with
   `curl -fsS -o <run-owned-html-path> -w '%{http_code}\n' <URL>`; require 200.
3. Run `grep -q 'TrackFlow' <run-owned-html-path>`; require success.
4. Inspect HTML/component source together and rendered `header`, `main`, at least
   one `section`, and `footer`. For private shells, validate via real login first.
5. In a browser, confirm TrackFlow logistics content, test narrow/wide layouts and
   interactions, and inspect the console for unexpected errors.

## Next inventory branch

1. Confirm `uis/backoffice/package.json` and its README. Use the selected Next URL;
   HTTP 200 for a validation shell alone is not authenticated acceptance.
2. Confirm authorized API/test data and exact API CORS browser origin. Legacy login,
   `/auth/me` gate and inventory must use the same identity service/store. Match
   `apiPort` on login and inventory links, including when
   `NEXT_PUBLIC_INVENTORY_API_URL` is configured. That build-time URL does not
   configure auth; `window.TRACKFLOW_API_BASE_URL` must be consistent on all pages.
3. Visit all four private routes without a session: require redirect to same-origin
   legacy login with a safe return. Perform real login; verify private content is
   not revealed before validation, return navigation and sign-out/session rejection.
4. Products: verify domain fields, current stock, low-stock threshold (<10), and row
   links prefilling receipt/exit SKU. Receipt: submit authorized data, confirm reset
   and success feedback; check errors and duplicate-submit protection.
5. Exit: change SKU and observe fresh stock **before quantity entry**; check dispatch
   tracking versus loss, overstock warning and backend HTTP 400 beside quantity.
   Check successful reset, delayed selection/departure cancellation and fresh stock.
6. History: verify read-only SKU name, quantity, type, date, warehouse and user UUID;
   confirm new authorized movements appear. Across all four routes, check loading,
   empty/error/retry states, mobile/desktop layout, keyboard access/visible focus
   and no unexpected console errors. Disclose intentional injected failures.

## Evidence and cleanup

Identify whether results use an **isolated local API with explicit inventory-session
 override/test storage** or **live configured Supabase/PostgreSQL**. Record real login
versus simulated auth and any intercepted requests separately. Local tests cannot
prove live connectivity or PostgreSQL locking. No hidden fallback, fake production
data, remote schema/seed changes or unapproved mutations. Missing `DATABASE_URL`
means live inventory verification remains pending, not successful.

On failure, clean owned resources and report the failed criterion. Return folder,
mode, exact URL, API target category (no secrets), HTTP/content/structure results,
route/browser results, widths, console findings, skipped/pending checks and owned
process/artifact cleanup. Overall **PASS** requires every applicable selected-branch
criterion; otherwise report **FAIL** or **PENDING**, retaining partial evidence.
Historical checks are not a fresh run.

## References

- [Technical context](../../../memory-bank/techContext.md)
- [Backoffice host, API configuration and focused checks](../../../uis/backoffice/README.md)
- [Inventory API setup and test boundaries](../../../services/api/README.md#inventory-api-t1)
