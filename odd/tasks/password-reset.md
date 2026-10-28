# AUTH-03 — Password recovery and change

## Objective and scope
Implement the required password recovery and authenticated password-change flows
in the existing Identity API and Tracker, using Resend and the current stack.

Assignment: https://github.com/4GeeksAcademy/ai-engineering-syllabus/blob/main/content/projects/ai-eng-user-authentication-restore/README.md

- API: FastAPI, TinyDB, bcrypt and existing JWT support.
- Tracker: existing Next.js/React, authentication client and session guard.
- Three API endpoints and three frontend pages, with tests and documentation.
- No backoffice changes, new dependencies, optional rate limiting or audit system.
- Secrets remain in ignored local environment files. Never publish recipient
  addresses, credentials, reset URLs or private test-network configuration.
- Preserve the unrelated, pre-existing `odd/tasks/auth-frontend.md`.

## Design decisions
- Forgot-password returns the same generic 200 for known/unknown accounts and
  delivery failures; this response is not proof of delivery.
- Reset JWTs have a distinct purpose, a default 30-minute expiry (15–60 allowed),
  and a persistent unused identifier. Session/reset credentials are not interchangeable.
- Password replacement and recovery-state consumption share one locked user update.
  Successful authenticated and existing PUT password updates revoke pending links.
- TinyDB requires one process/worker; it is not a crash-safe transactional database.
- The Resend request uses the standard library, a 10-second timeout and the honest
  `User-Agent: TrackFlow/1.0`. No new SDK or permission expansion was introduced.
- Existing access-token lifetime is unchanged. Optional hardening is not part of this work.

## Tasks
- [x] PR-1: Implement forgot/reset API, Resend delivery and configuration documentation.
- [x] PR-2: Implement authenticated password change and stale-link invalidation.
- [x] PR-3: Implement public recovery/reset and protected change pages, links and feedback.
- [x] PR-4: Complete automated verification and record user-reported live-flow acceptance.
- [x] PR-5: Diagnose the delivery rejection, add explicit application identification,
  regression-test the request contract, and confirm the user's successful retry.
- [ ] PR-6 (in progress): Complete pre-commit audit, create coherent commits, push
  child branches and open the selected feature-branch PR chain without merging.

## Verification evidence

| Check | Observed outcome |
| --- | --- |
| Recovery test-first | Initial missing-route RED, then GREEN; later missing-UA RED, then 8/8 GREEN |
| Password-change test-first | Missing-route and stale-link RED, then 7/7 GREEN |
| Full API suite | 56/56 passed, independently verified |
| Frontend test-first | Missing helper/service RED, then 25/25 GREEN |
| Tracker lint and production build | Passed; all required routes generated |
| Mocked browser scenarios | Public/private access, validation, failures, duplicate prevention, cancellation, payload/header isolation and narrow/wide layout passed |
| Native source review | Approved and acknowledged after the User-Agent correction |
| Diff whitespace check | Passed after implementation and closing documentation |
| Real mailbox and live flow | Confirmed by the user; not independently observed by the agent |

Exact commands:

```bash
uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_auth_password_recovery.py' -v
uv run --no-sync python -m unittest discover -s services/api/tests -p 'test_auth_password_change.py' -v
uv run --no-sync python -m unittest discover -s services/api/tests -v
(cd uis/talent-pipeline-tracker && node --test tests/*.test.mjs)
(cd uis/talent-pipeline-tracker && npm run lint)
(cd uis/talent-pipeline-tracker && npm run build)
git diff --check
```

The user confirmed email receipt, delivered-link reset, rejection of the old
password, login with the new password, rejection of the reused link, and password
change with wrong/correct current credentials. Expiry has deterministic API
coverage, not a live 30-minute wait. No exhaustive visual/accessibility audit is
claimed. Existing Starlette/httpx and Node module-type warnings are non-failing.
Detailed observed checks are recorded in `memory-bank/progress.md`.

## Delivery authorization and strategy
- The user explicitly authorized commits, non-force push and PR creation.
- Verified destination: `4GeeksAcademy/eduDev-companyContext`, default branch `main`.
- Selected strategy: `chain_strategy=feature-branch-chain`.
- The tracker PR remains draft/no-merge. Implementation lives in the child branches
  until reviewed and integrated; this tracking document is not a claim that its
  baseline branch already contains all implementation files.
- Proposed units: API behavior with its tests/docs; Tracker behavior with its
  tests/docs; final progress and delivery evidence. Keep each child based on its
  immediate predecessor. Report any cohesive slice above the advisory 400 lines;
  do not remove tests or compress code to meet that heuristic.
- Final audit passed: 56/56 API tests,25/25 frontend tests,lint/build and whitespace checks. No publication-sensitive values identified in the selected diff; both environment files are ignored/untracked.
- Planned chain: `feature/password-reset` (draft tracker) -> `feat/password-reset-01-api` (572 changed lines) -> `feat/password-reset-02-ui` (300 changed lines) -> `docs/password-reset-03-evidence` (progress and commit evidence).
- Local work-unit commits:
  - Tracker baseline: `55870a02e905d9ef45cfbe999d9cdfbf77294f62`.
  - PR-1/PR-2/PR-5 API behavior, tests and docs: `1b0cbd32fa936d9cc1007c9804f1672c4656ace0`.
  - PR-3 Tracker behavior, tests and docs: `48a986f687d4d190b9b8fc78e5aaea13ec7c25f8`.
  - PR-4 verification evidence: the documentation work unit on `docs/password-reset-03-evidence`.
- PR links and publication confirmation: pending.
- Merge, service shutdown and temporary test-data deletion are not authorized.

## Pre-push checklist
- [x] Re-read repository policy and applicable local docs/rules.
- [x] Confirm final intended diff and exact checks.
- [x] Confirm both local environment files are ignored and untracked.
- [x] Exclude unrelated task files, secrets and private runtime/network details.
- [x] Remind the user about temporary Tailscale configuration. Ignored `.env`
  does not need reverting just to push; deployment needs its own valid URLs.

## Next step
The independent delivery/privacy audit passed. Local tracker/API/UI commits are
recorded above. Commit the evidence unit, then push the four branches and open
one draft tracker plus its dependent child PRs. Do not merge. Test-service ownership
and cleanup details remain in private session memory rather than published files.
