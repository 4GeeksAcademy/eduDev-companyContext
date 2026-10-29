import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('dynamic config returns constant public JavaScript only in opt-in mode', async () => {
  const { GET, dynamic } = await import('../app/uis/backoffice/api-config.js/route.ts');
  assert.equal(dynamic, 'force-dynamic');
  const previous = process.env.TRACKFLOW_API_PROXY;
  try {
    for (const mode of [undefined, '', '0', 'true', '1']) {
      if (mode === undefined) delete process.env.TRACKFLOW_API_PROXY;
      else process.env.TRACKFLOW_API_PROXY = mode;
      const response = GET();
      assert.equal(response.status, 200);
      assert.match(response.headers.get('Content-Type'), /javascript/);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      const body = await response.text();
      const context = { window: { TRACKFLOW_API_BASE_URL: 'https://manual.test' } };
      vm.runInNewContext(body, context);
      assert.equal(context.window.TRACKFLOW_API_BASE_URL, mode === '1' ? '/api' : 'https://manual.test');
      if (mode === '1') assert.equal(body, "window.TRACKFLOW_API_BASE_URL='/api';");
      else assert.doesNotMatch(body, /https?:|process|env/);
    }
  } finally {
    if (previous === undefined) delete process.env.TRACKFLOW_API_PROXY;
    else process.env.TRACKFLOW_API_PROXY = previous;
  }
});

test('static fallback preserves manual overrides and pages load config before modules', () => {
  const source = readFileSync('uis/backoffice/api-config.js', 'utf8');
  const context = { window: { TRACKFLOW_API_BASE_URL: 'https://manual.test' } };
  vm.runInNewContext(source, context);
  assert.equal(context.window.TRACKFLOW_API_BASE_URL, 'https://manual.test');
  for (const page of ['index', 'login', 'incidents', 'suppliers', 'incident-analysis']) {
    const html = readFileSync(`uis/backoffice/${page}.html`, 'utf8');
    const config = html.indexOf('<script src="api-config.js"></script>');
    assert.ok(config >= 0 && config < html.indexOf('<script type="module"'), page);
  }
  const layout = readFileSync('uis/backoffice/app/layout.tsx', 'utf8');
  assert.match(layout, /import Script from 'next\/script'/);
  assert.match(layout, /<Script src="\/uis\/backoffice\/api-config.js" strategy="beforeInteractive"/);
  assert.ok(layout.indexOf('<Script') < layout.indexOf('{children}</body>'));
});
