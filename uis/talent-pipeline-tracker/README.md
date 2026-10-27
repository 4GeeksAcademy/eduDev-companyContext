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

## Verification

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
