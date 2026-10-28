# TrackFlow Talent Pipeline Tracker

Internal frontend for the TrackFlow People & Talent team to manage the Zaragoza Executive Assistant recruitment campaign.

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Public base URL for direct browser requests to the candidate tracker API. |

The candidate example points to `https://playground.4geeks.com/tracker/api/v1`.
`NEXT_PUBLIC_AUTH_API_URL` separately configures the identity API (default
`http://localhost:8000`); trailing slashes are removed. Identity JWTs must never
be sent to the candidate API. Configure API CORS for the frontend origin.

`services/auth.ts` provides browser localStorage session helpers, login,
registration followed by login, current identity/profile read, profile update,
and logout. Protected identity 401s clear the matching session and redirect to
`/login`; other failures preserve it. A registration error with `accountCreated`
means the account exists: offer manual login, do not repeat registration.
`AuthApiError` exposes status, validation details and field errors for forms.
The token is browser-readable: avoid untrusted scripts and use HTTPS in production.
Public `/login` and `/register` forms support field errors and optional registration
contacts. Passwords accept 1–72 UTF-8 bytes, without extra strength requirements.
If registration succeeds but automatic login fails, use the manual login link;
another registration stays disabled until inputs are deliberately changed.

Protected routes `/`, `/candidates/new`, `/candidates/[id]`,
`/candidates/[id]/edit` and `/account/profile` validate `/auth/me` before mounting
private content, including candidate components. Transient failures preserve the token and offer retry/logout.
Private navigation includes Perfil (`/account/profile`) and logout. The profile
page loads `/auth/me` before showing editable name, phone and address; email is
read-only. Saving sends only profile fields to `PUT /profiles/me`, clears blank
fields with null, and displays the returned profile. Loading failures offer retry;
save failures preserve edits. Pending saves disable editing and duplicate submits;
unmount aborts requests and ignores stale completions. This is a client-side access
gate, not authorization for the separate external candidate API.

## Password recovery and change

- Login links to public `/forgot-password`. A valid email submits JSON to the
  identity API; every outcome shows the same account-neutral confirmation and
  locks the form. If delivery fails, reload to make a deliberate new request.
- Public `/reset-password?token=…` accepts a matching new password/confirmation.
  Missing, invalid, expired or used links offer recovery. Success replaces the
  route with `/login?reset=success`, displaying fixed feedback without a token.
- Perfil links to protected `/account/change-password`; current password and
  matching new passwords are required. Wrong-current-password errors are explicit.
- Passwords retain the 1–72 UTF-8 byte policy. Public recovery/reset requests never
  attach bearer credentials or save session tokens. Reset tokens stay in the URL
  and request memory, never localStorage; avoid sharing or logging recovery URLs.
- No new public environment variable is needed. Resend configuration belongs only
  to the API server; see `services/api/README.md` from the repository root.

### Local browser verification checklist

This is a repeatable runbook, not an open-task status list. Use a locally
configured identity API and Tracker origin allowed by its CORS:

- [ ] Logged out: recovery/reset are accessible; change-password redirects to login.
- [ ] Login/register still work; profile exposes change-password.
- [ ] Invalid email and missing/mismatched/>72-byte passwords never submit.
- [ ] Known/unknown email and injected network/server errors show identical confirmation;
      rapid double submit sends once and the recovery form stays disabled.
- [ ] Reset from a real delivered link redirects with visible login success;
      old password fails and new password logs in. Missing/expired/used links offer recovery.
- [ ] Change success, wrong current password and transient errors show safe feedback.
- [ ] Departure during pending requests prevents stale feedback/navigation; verify
      keyboard, narrow/wide layout and console. Public calls contain no Authorization;
      change calls use the existing bearer. Neither flow replaces stored sessions.

Node service/helper tests and the structural guard assertion are not browser E2E.
Recorded AUTH-03 evidence: 25/25 Node tests, lint and build passed; independent
mocked-browser checks covered forms, access, failures, cancellation, duplicate
submits, headers and narrow/wide layouts. The user separately confirmed real email
receipt, delivered-link reset, old/new password login, reused-link rejection and
authenticated change with wrong/correct current passwords. Mailbox results are
human-reported; expiry is covered by API tests, not a live 30-minute wait.
See `memory-bank/progress.md` for details and remaining delivery steps.

## Candidate error recovery (EH-02)

Candidate requests use fixed Spanish messages for connection, invalid-response and
HTTP failures; upstream error bodies are never displayed. Required candidate/note
shapes fail explicitly instead of becoming empty results. Optional links retain
“No informado”; invalid dates retain “No disponible”. List, detail (including notes)
and edit loads offer **Reintentar** with the current filters/ID. Failed mutations
retain the previous data or draft for deliberate retry; no automatic write retry
is performed. Loading/saving cleanup uses `finally`. Departure aborts requests and
ignores late completions, but cannot undo a write already accepted by the server.
Candidate requests remain separate from identity and never attach identity JWTs.

Focused service check from the repository root:
`node --test uis/talent-pipeline-tracker/tests/api.test.mjs`.
Node mocked-fetch tests cover safe failures, required shapes, pagination, success,
204 deletion and cancellation; they do not exercise JSX interactions.

### Completed fixture browser checks and remaining limits

Independent Chromium checks passed seven fixture groups: list/detail/edit recovery,
network/HTTP/malformed-response failures, empty/multi-page lists, stale filters,
failed mutations with draft retention, retry and departure cancellation. Layouts
passed at 390/1440 for list/detail/edit/create. Final focused detail checks passed
keyboard retry and real-route candidate-ID navigation during delayed loads, PATCH
and note POST/DELETE, preserving new-ID data/drafts/feedback. Navigation remounts
private content through pathname-keyed SessionGuard; no same-component proof is claimed.

All auth/candidate responses were intercepted synthetic fixtures; no real external
API passthrough or writes occurred. Zero uncaught browser exceptions; deliberate
HTTP/network failures produced expected console resource errors. Independent Node
32/32 and final lint/build passed. Earlier lint failure is corrected, not outstanding.

Delayed body parsing is covered by Node, not browser interaction. Live upstream
schema compatibility and exhaustive accessibility remain unverified. Existing
edit-during-create draft clearing is unchanged/out of scope. No permanent E2E suite
or new screenshots were added. See the [audit handoff](../../docs/error-handling-audit.md)
for evidence, warnings and safe API check commands. Native review was approved and exactly acknowledged.
The static `verify-trackflow-ui` skill targets website/backoffice, not this Next.js tracker.

## Verification

See the root [testing guide](../../TESTING.md) for the R1–R4 case plan, focused
results, safety and limitations. Final integrated coverage/history will be recorded
after all review slices. From this Tracker directory:

```bash
npm ci
npm exec -- jest --coverage
# Or: npm run test:jest:coverage
```

Jest covers auth services/forms and selected frontend helpers with local fakes;
no `.env`, real secrets or external API is needed. It does not replace the legacy
Node checks or the browser/manual instructions above.

```bash
# Node 24 native TypeScript stripping; no additional test dependencies
node --test tests/*.test.mjs
npm run lint
npm run build
```

To run the production build locally:

```bash
npm run start
```

## Scope

- Candidate listing, URL-based filters, and search.
- Candidate creation and full editing.
- Status and stage updates from the detail view.
- Candidate-only notes with add and delete actions.
- Direct browser candidate API calls; no backend routes or database are included.
- Identity login/registration, guarded candidate screens, profile editing and logout.
  Static backoffice now has its own login/logout and three-page gate; see
  [backoffice acceptance](../backoffice/README.md#runtime-acceptance--auth-bo-03).
  Credentials share the identity API, but localStorage sessions are separate by
  origin (including port), not SSO. Tracker owns login/register/profile pages;
  the public website and public lead intake remain unchanged.
- Node tests cover identity requests and form validation. JSX has no configured
  deterministic UI runner; lint/build do not replace browser or live API checks.
  AUTH-FE-04 checks: `node --test tests/*.test.mjs` passed 20/20 (16 existing,
  four profile conversion cases); `npm run lint`, `npm run build` and repository
  `git diff --check` passed. Node's module-type warning remains non-failing.
  Those checks preceded runtime acceptance; lint/build were not rerun during it.

### AUTH-FE-03 runtime acceptance

Initial tracker scope is implemented and runtime verified at `dd0bd71` by verifier
`mvr8xgvw-b-rbem`. After user/admin installation of Chromium system libraries,
`ldd` was clean and cached Playwright Chromium launched/closed `about:blank`.
All eight ephemeral browser groups passed (no permanent E2E suite added):

1. Public login/register hide private navigation; all five private routes redirect missing tokens before candidate fetching.
2. Real isolated FastAPI registration with contacts, login and localStorage; client required/email/UTF-8 >72-byte checks, duplicate email 409 and wrong password 401.
3. Real profile read-only email, updates and null clearing persist after reload; injected save delays/errors preserve edits/session and prevent duplicate submits.
4. Logout, storage, refresh, back navigation and private access.
5. Real invalid/expired signed JWT 401 cleanup; injected protected 401 and guard network/500 failures with retry.
6. Delayed login/register/profile departure cancellation prevents stale token/UI/navigation; server writes may still complete.
7. Real registration plus injected login failure shows account-created guidance; real manual login succeeds without repeat auto-registration.
8. Candidate list/status-stage-search/detail/notes display uses mocked external API GETs only: no Authorization, no playground requests, no candidate mutations tested.

`node --test tests/*.test.mjs` passed again, 20/20. Earlier lint/build passed and
code was unchanged; optional public-website browser smoke was not run (code untouched).
Backoffice was deferred during this tracker run; its subsequent acceptance is
linked above. Tracker tests/lint/build were not rerun during backoffice checks.
Global all-application compliance is not claimed: legacy root `operations.html`
remains outside the authorized scope, with no private/public or superseded status
established. All work is on ONE `feature/auth-frontend` branch as sequential local
commits. A feature-branch PR-chain strategy was selected, but no slice branches,
PRs or publication have been created; merge is not authorized.

After receiving live Tailscale URLs, the user reported “listo, probado” with no
issues described (USER-REPORTED, not independently observed manual assertions).
Manual servers remain running; see backoffice README for simultaneous local use.
