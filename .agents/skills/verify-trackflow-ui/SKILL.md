---
name: verify-trackflow-ui
description: "Trigger: verify TrackFlow UI, UI delivery check. Verify one TrackFlow UI before delivery."
license: Apache-2.0
metadata:
  author: "4GeeksAcademy"
  version: "1.0"
---

# Verify TrackFlow UI

## Activation Contract

Use this skill to verify one TrackFlow UI before delivery.

**Inputs:** the UI folder (`uis/website` or `uis/backoffice`) and its local URL under `http://localhost:3000/uis/`.

## Hard Rules

- Verify one UI per run.
- Do not install packages, edit files, or substitute another server command.
- Stop the server started by this run, including when a check fails.
- Report observed results; do not infer success.

## Decision Gates

| Condition | Action |
| --- | --- |
| Server is not running | Run `npm run serve` in a dedicated terminal and mark it as started by this run. |
| Server is already running | Use it without stopping it later. |
| Any check fails | Stop the server started by this run, then report the failed criterion. |

## Execution Steps

1. Confirm the input folder contains `index.html` and `README.md`.
2. If needed, start `npm run serve` from the repository root in a dedicated terminal and keep it attached.
3. Run `curl -fsS -o /tmp/trackflow-ui.html -w '%{http_code}\n' <URL>` and require status `200`.
4. Run `grep -q 'TrackFlow' /tmp/trackflow-ui.html` and require success.
5. Inspect the UI's HTML and component source together and require rendered `header`, `main`, at least one `section`, and `footer` elements.
6. Open the URL in a browser, confirm company content is visible, test the page at narrow and wide widths, and confirm the browser console shows no obvious errors.
7. If this run started the server, return to its terminal, press `Ctrl+C`, and confirm the command exits. Remove `/tmp/trackflow-ui.html`.

## Output Contract

Return the UI folder, URL, HTTP status, content and structure results, manual smoke result, server cleanup result, and an overall `PASS` or `FAIL`.

## Acceptance Criteria

- The URL returns HTTP 200.
- Visible content identifies TrackFlow and its logistics operation.
- The required page structure is present.
- The manual browser smoke check finds no obvious rendering, interaction, or console error.

## References

- `../../../memory-bank/techContext.md`
