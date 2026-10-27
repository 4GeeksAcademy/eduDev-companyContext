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
Auth pages, client guards and navigation are forthcoming in AUTH-FE-02; this
unit does not yet protect candidate screens.

## Verification

```bash
# Node 24 native TypeScript stripping; no additional test dependencies
node --test tests/auth.test.mjs
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
- Standalone identity/session client only; authentication UI integration is pending.
