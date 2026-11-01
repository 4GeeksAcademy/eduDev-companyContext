# TrackFlow Public Website

The public logistics website now has a small Next.js App Router host. Content,
section anchors, responsive styles and the home URL `/uis/website/` are preserved.
The original static host remains independently usable; both hosts share the
contrast-corrected stylesheet.

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
and an unknown-route 404. Without the variable, structural and contrast tests run;
the HTTP test explicitly skips. HTTP smoke is not visual/browser acceptance.

Run only the deterministic contrast checks without a server:

```bash
node --test --test-name-pattern=contrast uis/website/tests/site-smoke.test.mjs
```

These read actual shared CSS declarations and require 4.5:1 for eyebrow text,
service numbers, navigation/text-link hover and focus, and white CTA text in all
three states. They cover paper, warm-white, composited header and dark footprint
contexts. This narrow source calculation is not a CSS cascade engine, computed
browser-style check or Lighthouse result. PA-02 local RED (11 ratio failures) and
GREEN (13 passing tests) are recorded; browser/production comparison is pending.

## Preserved static host

`npm run serve` at the repository root still serves the preserved `index.html`,
`components.js` and shared `styles.css` at `http://localhost:3000/uis/website/`, without a
build. It does not render the Next App Router. The React page imports the original
stylesheet; it does not load the custom-element script or inject raw HTML.

## HTTPS deployment — observed 2026-11-01

Public URL: <https://162.243.69.7/uis/website/>. Favicon/TLS/redirect deployment
and independent website16/16,19 external HTTP checks and375/1440 browser checks
passed. Desktop/mobile each measured100/96/100/100 once, not security certification.
See [deployment guide](../../infra/nginx/README.md) and [HTTPS evidence/limits](../../audit/after/HTTPS.md).
Authenticated backoffice remains pending; no complete business acceptance claim.
The local-only pending statements below are historical, superseded by this follow-up.

## Corporate favicon — IP-01 local verification

One 174-byte `public/favicon.svg` (white T on a dark green tile) is shared:

- Next metadata explicitly links `/uis/website/favicon.svg`, including basePath.
- Static HTML links `public/favicon.svg`, resolving to
  `/uis/website/public/favicon.svg` when served from the repository root, or
  `/public/favicon.svg` when the website folder itself is the server root.
- Future Nginx root `/favicon.ico` handling should map to the corporate
  `/uis/website/favicon.svg` upstream with SVG content type (or redirect there).
  No ICO file, root alias, TLS or deployment change is included here.

Observed on 2026-11-01:

- `node --test uis/website/tests/site-smoke.test.mjs`: RED 14 pass, one intended
  ENOENT failure for the missing SVG, one HTTP skip; GREEN 15 pass, one HTTP skip.
- `npm --prefix uis/website run build`: successful production build; existing
  multiple-lockfile/workspace-root warning remains.
- `TRACKFLOW_WEBSITE_URL=http://127.0.0.1:3310/uis/website/ node --test uis/website/tests/site-smoke.test.mjs`:
  16/16 passed against the owned production server, including rendered icon URL,
  HTTP200, SVG MIME/body equality, CSS and unknown-route404.
- `node /tmp/trackflow-ip01-check.mjs`: local verification helper using existing
  Playwright/Chromium151, no installs. Next3310 and static3312 passed at375×900
  and1440×900: semantic sections/logistics copy, capabilities navigation, no
  horizontal overflow, SVG decoding, exact HTTP content/type and zero console/
  page/request errors. Static folder-root hosting also passed in the first run;
  the final run used repository-root hosting at `/uis/website/`.
- Both owned servers and browser were stopped after each run. No API was needed;
  no Docker, remote operation or Lighthouse was run. Deployment and Nginx/TLS
  verification remain pending; these results do not establish a production fix.

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
