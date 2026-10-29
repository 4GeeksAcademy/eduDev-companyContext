# TrackFlow Public Website

The public logistics website now has a small Next.js App Router host. Content,
section anchors, responsive styles and the home URL `/uis/website/` are preserved.
The original static files remain unchanged and independently usable.

## Run the Next website

From the repository root:

```bash
npm --prefix uis/website install --no-audit --no-fund
npm --prefix uis/website run dev -- --hostname 127.0.0.1 --port 3310
```

Open `http://127.0.0.1:3310/uis/website/`. Choose an available port; do not stop
unrelated servers. Stop your own development server with Ctrl+C when finished.
Next/React versions match the backoffice pins; this host needs no API or login.

## Focused checks

With that server running, from another terminal at the repository root:

```bash
TRACKFLOW_WEBSITE_URL=http://127.0.0.1:3310/uis/website/ node --test uis/website/tests/site-smoke.test.mjs
```

The environment variable must point to the selected website origin and base path.
The Node tests check the Next configuration, rendered metadata and semantic
structure, three service cards, anchor targets, home/contact links, served CSS
and an unknown-route 404. Without the variable, only the structural test runs;
the HTTP test explicitly skips. HTTP smoke is not visual/browser acceptance.

## Preserved static host

`npm run serve` at the repository root still serves the unchanged `index.html`,
`components.js` and `styles.css` at `http://localhost:3000/uis/website/`, without a
build. It does not render the Next App Router. The React page imports the original
stylesheet; it does not load the custom-element script or inject raw HTML.

## Verification record — T1

- RED: the structural Node test failed because the website manifest did not exist;
  HTTP was explicitly skipped before a host existed.
- GREEN: both tests passed against an owned Next 16.4.3 dev server at the URL above,
  including HTTP 200, stylesheet 200 and unknown-route 404. The server was stopped
  and port availability was confirmed afterward.
- Next reported a multiple-lockfile workspace-root inference warning; no files
  outside this website were modified by startup.
- Independent verification repeated both tests successfully and used existing
  Playwright Core/Chromium (no installs) at 375px and 1280px. Content, responsive
  cards, navigation, keyboard focus and skip link passed; no horizontal overflow,
  console/page errors or failed resources were observed. Legacy static files
  remained unchanged. The owned browser and dev server were closed afterward.
- Production build, container integration and deployment are deferred to later
  monorepo-containerization tasks, not claimed by this dev smoke.
