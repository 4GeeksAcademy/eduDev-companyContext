# Error-handling audit — reviewer handoff

Functionally accepted on `feature/error-handling-audit`; native review `review-2fbaca21d66564d9` was approved and exactly acknowledged. Published in [PR #23](https://github.com/4GeeksAcademy/eduDev-companyContext/pull/23) against `main`; merge remains a separate decision.
This assignment improves existing failure boundaries, with no new features, technologies or dependencies.

- [Assignment](https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/projects/ai-eng-error-handling/README.md)
- [Task and historical evidence](../odd/tasks/error-handling-audit.md)
- [Progress](../memory-bank/progress.md) · [Tracker runbook](../uis/talent-pipeline-tracker/README.md)

## Scope and review order

Two inventory/inspection passes targeted asynchronous and error boundaries, not every source line.
Inspected root form/operations, website entry/Web Components, tracker candidate/profile/session/auth flows,
backoffice auth/supplier/analyzer/manager paths, API routes/storage/email adapter and Python CLIs.
Presentation-only tracker components were inventoried, not individually audited.
Root form submission is synchronous; root operations and backoffice overview use static sample data.
Website inspection found no fetch: do not invent network-recovery requirements for those samples.
Vendor/generated output, unrelated agent templates and skill scripts were excluded.

| Priority | Finding → minimum fix |
| --- | --- |
| P1 F1 | Arbitrary candidate upstream errors → fixed Spanish messages, network/JSON/shape checks; preserve AbortError. |
| P1 F3 | Inconsistent unexpected API failures → narrow expected storage/upload handling plus sanitized last-resort JSON500. |
| P2 F2 | Failed candidate loads lacked recovery → list/detail/edit retry, cleanup and stale/departure guards. |
| P2 F4 | Supplier seed could traceback on expected failures → fixed stderr and nonzero exit. |
| P2 F5 | Incident insert caught every exception → only OSError/JSONDecodeError; programmer defects propagate. |

Hostile CSV header reflection was reproduced and corrected in API and CLI diagnostics.
Earlier suspected analyzer disclosure was not treated as proven until that regression reproduced it.

## Rubric coverage

| Requirement | Changed or reused behavior and evidence |
| --- | --- |
| Frontend states / CTA | Changed candidate loading/error/retry and failed-write draft retention; reused profile/session and backoffice recovery. Node + fixture browser checks. |
| Optional fields / finally | Optional links/dates retain sensible fallbacks; required shapes fail explicitly, not as empty data. Touched async flows use finally and cancellation guards. |
| Scoped backend catches | Supplier/identity contexts normalize only OSError/JSONDecodeError; analyzer handles expected read/parse failures and attempts close in finally. Injected-failure API tests. |
| Last-resort JSON500 | Changed global fallback returns fixed Service unavailable; reused manager-local JSON500. Existing 400/401/403/404/415/422/503 contracts preserved. |
| Privacy / external service | Reused account-neutral recovery and existing Resend HTTPS adapter, 10-second timeout and safe provider-failure behavior; no new live email test. |
| Scripts I/O / validation | Fixed read/parse/write stderr and nonzero exits; reused CSV validation, aggregate-only exports and idempotent seeds. Narrow incident catches retain partial counts. |
| Safe logs | No raw exceptions added to routine application logs/responses; fixed diagnostics avoid submitted headers/internal paths. Do not log credentials, reset URLs, source rows or customer emails. |

## Accepted evidence (not rerun for this documentation)

- Independent isolated API **97/97 PASS**; shared analyzer/contract **15/15 PASS**.
- Tracker Node **32/32 PASS**; final lint and production build/TypeScript **PASS**.
- Earlier Chromium **7 fixture groups PASS**, list/detail/edit/create layouts at **390/1440 PASS**.
- Final focused detail-navigation **PASS**: keyboard retry, candidate-ID navigation during delayed loads,
  PATCH and note POST/DELETE, stale-mutation protection, draft retention and retry.
- Browser evidence used intercepted synthetic auth/candidate fixtures only: no external passthrough/writes;
  zero uncaught exceptions. Intentional injected HTTP/network errors are not unexpected failures.
- Historical API **96/97** registration assertion mismatch was corrected to sanitized500 with both
  no-orphan checks retained; final **97/97** supersedes it. Tracker lint failure was corrected, then **PASS**.
- Focused API9, supplier CLI3, incident seed11, registration8 and tracker API7 are subsets of totals,
  not extra tests to add. Writer RED evidence stays in task/progress; no independent RED is invented.

## Minimal repeatable checks

Run from repository root with installed dependencies; do not run the API suite against default stores.
The recorded TemporaryDirectory/subprocess pattern sets **all three overrides before child imports**:

```bash
uv run --no-sync python - <<'PY'
import os, subprocess, sys, tempfile
from pathlib import Path
with tempfile.TemporaryDirectory(prefix='trackflow-registration-check-') as directory:
    root = Path(directory)
    env = dict(os.environ)
    env.update(TRACKFLOW_USERS_DB_PATH=str(root / 'users.json'), TRACKFLOW_SUPPLIERS_DB_PATH=str(root / 'suppliers.json'), TRACKFLOW_INCIDENTS_DB_PATH=str(root / 'incidents.json'), JWT_SECRET_KEY='error-audit-test-only-secret', ACCESS_TOKEN_EXPIRE_MINUTES='30')
    result = subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', 'services/api/tests', '-v'], env=env)
    code = result.returncode
sys.exit(code)
PY
python3 -m unittest shared.test_incident_analysis shared.test_incident_contract -v
node --test uis/talent-pipeline-tracker/tests/*.test.mjs
npm --prefix uis/talent-pipeline-tracker run lint
npm --prefix uis/talent-pipeline-tracker run build
git diff --check
```

## Limits and next step

- Non-failing Node module-type and Starlette/httpx deprecation warnings remain.
- Two unattributed unclosed SpooledTemporaryFile ResourceWarnings were observed; no production leak is established.
- Live external candidate schema compatibility and exhaustive accessibility/repository behavior remain unverified.
- Existing edit-during-create draft clearing was not introduced here; delayed body parsing is Node-covered.
- Startup failures and streams already started cannot receive replacement JSON from the request fallback.
- TinyDB remains single-worker, nontransactional and not crash-safe; failure does not guarantee rollback.
- Native review left two nonblocking informational advisories (`R3-storage-decoding` and `R4-storage-decoding`, `scripts/seed_incidents.py:87`) for later follow-up; no correction was required.
- Only passive review-status documentation changed after acknowledgement; reviewed application/test code is unchanged.
- No new screenshots are needed. Delivery uses the user-approved single-PR workflow with separate work-unit commits; merge remains a separate decision.
