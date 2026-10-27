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

All other routes validate `/auth/me` before mounting private content, including
candidate components. Transient failures preserve the token and offer retry/logout.
Private navigation includes logout; profile UI/navigation is deferred. This is a
client-side access gate, not authorization for the separate external candidate API.

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
- Identity login/registration, guarded candidate screens and logout; profile and
  backoffice integration remain deferred. The separate public website is unchanged.
- Node tests cover identity requests and form validation. JSX has no configured
  deterministic UI runner; lint/build do not replace browser or live API checks.
  No integrated browser or real API verification is claimed.
