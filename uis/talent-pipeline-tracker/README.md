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

The default example points to `https://playground.4geeks.com/tracker/api/v1`.

## Verification

```bash
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
- Direct browser API calls; no backend routes, authentication, or database are included.
