# Centralized Incident Manager delivery guide

Persistent registration, lifecycle management, filtering and summary metrics extend the authenticated TrackFlow backoffice using only Python, FastAPI, Pydantic, TinyDB and static HTML/CSS/JavaScript. T1–T4 behavior and final combined checks passed; the parent accepted documentation/screenshots. Native review is **approved and acknowledged**; delivery has not been performed.

Sources: [official assignment](https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/projects/ai-eng-centralized-incident-manager/README.md), [TrackFlow briefing](https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/contexts/centralized-incident-manager/trackflow-BRIEFING.es.md).

## Quick path

Use the existing uv `.venv` and installed root npm dependencies; no new technology or installation is needed for this delivery. Configure private `JWT_SECRET_KEY` in the ignored local environment as described in the [API setup](../services/api/README.md#run-locally); never put secrets in browser configuration or Git.

1. Stop the API before the separate historical seed process. From the repository root:

   ```bash
   uv run --no-sync --env-file .env python scripts/seed_incidents.py scripts/incidents-trackflow.csv
   ```

2. Start one API worker, then the existing static server in separate terminals:

   ```bash
   uv run --no-sync --env-file .env uvicorn services.api.main:app --host 127.0.0.1 --port 8000 --workers 1
   npm run serve
   ```

3. Open [Incident Manager](http://localhost:3000/uis/backoffice/incidents.html) and sign in using the existing identity flow. See [UI setup and alternate API port](../uis/backoffice/README.md#run-locally) and [login contract](../services/api/README.md#login-and-current-user).

Seed and API both load the same ignored `.env`, so a custom `TRACKFLOW_INCIDENTS_DB_PATH` targets the same store. Historical incidents are **never seeded automatically at startup**. Existing supplier startup bootstrap is separate. TinyDB requires one worker; stop the API before any separate seed targeting the same store.

For tests or experiments, isolate **all three** stores with distinct disposable paths: `TRACKFLOW_USERS_DB_PATH`, `TRACKFLOW_SUPPLIERS_DB_PATH`, and `TRACKFLOW_INCIDENTS_DB_PATH`. Supplier startup writes make incident-only isolation insufficient. Use synthetic identities/secrets; never ordinary data.

## Contract and seed interpretation

Use the [API model, enums, lifecycle and exact HTTP contracts](../services/api/README.md#incident-management-api-t3) and [UI request/state contracts](../uis/backoffice/README.md#incident-manager--t4-source-implementation), rather than parallel model tables. IDs/timestamps are generated; branch is always required. The shared [validation modules](../packages/shared/README.md) serve analyzer, seed and API without conflating legacy uppercase and manager lowercase enums.

Historical identity uses stdlib UUID5 with a fixed namespace and trimmed validated source `incident_id`, retaining distinct IDs even for equal titles/dates without persisting the source ID. Only missing/blank IDs use tagged compact JSON `["title+created_at", transformed_title, utc_timestamp]` in the same namespace. This interprets the briefing's title/date deduplication as a fallback, preserving stronger source identity. Present malformed IDs are rejected; only seed validation opts into missing IDs, while analyzer defaults remain strict. See [exact seed policy and mapping implementation](../scripts/README.md#historical-incident-manager-seed) and [seed code](../scripts/seed_incidents.py).

Titles are the first 120 raw description characters trimmed; descriptions remain literal. Dates become UTC midnight and both initial timestamps match. US maps to `la_office`, ES to `zaragoza_office`, origin to customer. Existing records/statuses/timestamps are not overwritten on rerun.

Official source expectations: **95 inserted / 5 invalid**, then **0 inserted / 95 existing**. Status: open29, resolved52, discarded14, in_progress0. Categories: lost_parcel14, carrier_issue45, delivery_failure19, returns_issue17; all others zero. Customer95; offices Los Angeles50/Zaragoza45, other branches zero. Invalid-row reporting uses locations/reason codes, not raw rows or customer emails.

## Verification evidence

These are recorded prior observations, **not reruns by the documentation writer**. Historical RED belongs to implementation writers; independent GREEN is separate evidence. Commands run from repository root.

| Exact command | Recorded result |
| --- | --- |
| `python3 -m unittest shared.test_incident_analysis shared.test_incident_contract -v` | Writer initial missing-module RED; corrected fallback GREEN independently 13/13 |
| `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incident_models.py' -v` | Writer import RED; independent GREEN 6/6 |
| `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incident_store.py' -v` | Writer import RED; independent GREEN 4/4 |
| `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incident_seed.py' -v` | Writer missing-script/fallback RED; corrected independent GREEN 8/8, official95/5 and rerun0 |
| `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incident_management.py' -v` | Writer 8 tests, 27 failures/1 error RED (legacy assertion corrected); independent GREEN 8/8 |
| `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_incidents.py' -v` | Independent regression GREEN 8/8 |
| `uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_auth_operational.py' -v` | Independent regression GREEN 5/5 |
| `python3 -m unittest shared.test_incident_contract -v` | Independent GREEN 6/6 |
| `node --test uis/backoffice/tests/incidents.test.mjs` | Writer missing-module RED; success-feedback regression RED9/10 then GREEN10/10; independent GREEN10/10 |
| `node --test uis/backoffice/tests/auth.test.mjs uis/backoffice/tests/session-guard.test.mjs` | Writer RED9/10; independent GREEN10/10 |
| `node --check uis/backoffice/incidents.js` / `node --check uis/backoffice/auth.js` | Independent syntax checks passed |
| `git diff --check` | Prior writer/independent checks passed; documentation structural check reported separately at handoff |

### Latest combined verification

Independent verifier `mvrjcv4b-h-37pg` subsequently passed the following (no failures, errors or skips; existing Starlette/httpx deprecation only):

| Exact command | Latest result |
| --- | --- |
| `uv run --no-sync python -m unittest discover -s services/api/tests -v` | 82/82 PASS |
| `python3 -m unittest shared.test_incident_analysis shared.test_incident_contract -v` | 13/13 PASS |
| `node --test uis/backoffice/tests/*.test.mjs` | 20/20 PASS |
| `node --check uis/backoffice/incidents.js` | PASS |
| `node --check uis/backoffice/auth.js` | PASS |
| `git diff --check` | PASS |

The verifier also checked20 links, PNG dimensions/hashes and unchanged copies; no accidental paths, whitespace or obvious secret markers were found. The parent accepted documentation/screenshots. No browser rerun occurred; the earlier actual Chromium evidence below is reused.

Actual incidents-page Chromium checks passed at **1440px and 390px**: authenticated entry, required validation/branch guidance, disabled loading/duplicate prevention, successful create/reset/confirmation, populated list, all four filters and empty results, lifecycle update and failed-update rollback, list/summary errors and independent retry, safe failure feedback. Isolated real API started at95 and reached96 after one synthetic create. Intentional failure-injection console events are not unexpected application errors. Existing Starlette/httpx deprecation and optional favicon404 are non-blocking observations.

**Overall `verify-trackflow-ui`: FAIL.** The pre-existing overview `index.html` overflows at390: baseline/current both513px at390 and both1440px at1440, confirmed with the same Chromium. The incident manager page passes; no source CSS was modified to hide/fix the unrelated overview limitation.

Verification-owned servers and temporary databases were cleaned. The previously manually retained tracker was stopped with user approval; this guide does not claim any test service remains live.

## Submission screenshots

Inspected sanitized PNGs copied byte-for-byte, with no credentials or emails visible:

- [Form validation](screenshots/centralized-incident-manager/form-validation.png): recaptured using real page validation plus fixture auth/list/summary responses to clear stale feedback; not a real-API screenshot.
- [Incident list](screenshots/centralized-incident-manager/incident-list.png): isolated real API; four filters select the one synthetic incident.
- [Incident summary](screenshots/centralized-incident-manager/incident-summary.png): isolated real API, **96 includes one synthetic create**. Official seed expectation remains **95**, not96.

## Review and delivery

- Final combined functional checks passed; documentation/screenshots are accepted.
- Native review `review-d01e45fb968ac84a` was approved and acknowledged with four non-blocking advisory findings. The overview limitation remains disclosed.
- This passive status update followed review; application and test code are unchanged.
- Delivery has not been performed: no commit, staging, push or PR.
