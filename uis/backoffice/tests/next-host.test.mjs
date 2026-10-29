import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../next.config.ts';

delete process.env.TRACKFLOW_API_PROXY;
delete process.env.TRACKFLOW_API_ORIGIN;

test('opt-in proxy exposes exactly four fixed API families and validates origins', async () => {
  try {
    process.env.TRACKFLOW_API_PROXY = '1';
    process.env.TRACKFLOW_API_ORIGIN = 'http://api:8000/';
    const rules = await config.rewrites();
    assert.deepEqual(rules.filter(r => r.source.startsWith('/api/')), [
      { source: '/api/auth/:path*', destination: 'http://api:8000/auth/:path*' },
      { source: '/api/suppliers/:path*', destination: 'http://api:8000/suppliers/:path*' },
      { source: '/api/inventory/:path*', destination: 'http://api:8000/inventory/:path*' },
      { source: '/api/api/incidents/:path*', destination: 'http://api:8000/api/incidents/:path*' },
    ]);
    assert.ok(!rules.some(r => r.source === '/uis/backoffice/api-config.js'));
    for (const origin of [undefined, '', 'not-url', 'ftp://api', 'http://user:pass@api',
      'http://api/path', 'http://api/path/..', 'http://api?', 'http://api#',
      'http://api?key=value', 'http://api#fragment']) {
      if (origin === undefined) delete process.env.TRACKFLOW_API_ORIGIN;
      else process.env.TRACKFLOW_API_ORIGIN = origin;
      await assert.rejects(() => config.rewrites(), /TRACKFLOW_API_ORIGIN/);
    }
    process.env.TRACKFLOW_API_ORIGIN = 'https://api.example.test';
    assert.equal((await config.rewrites()).at(-1).destination, 'https://api.example.test/api/incidents/:path*');
    process.env.TRACKFLOW_API_PROXY = '0';
    process.env.TRACKFLOW_API_ORIGIN = 'invalid-but-disabled';
    assert.ok((await config.rewrites()).every(r => !r.source.startsWith('/api/')));
  } finally {
    delete process.env.TRACKFLOW_API_PROXY;
    delete process.env.TRACKFLOW_API_ORIGIN;
  }
});

test('legacy port is configurable and rejects invalid values', async () => {
  const previous = process.env.BACKOFFICE_LEGACY_PORT;
  try {
    process.env.BACKOFFICE_LEGACY_PORT = '3002';
    assert.ok((await config.rewrites()).every(rule => new URL(rule.destination).port === '3002'));
    for (const port of ['', '0', '65536', '3002/path', 'http://example.com', '3.2']) {
      process.env.BACKOFFICE_LEGACY_PORT = port;
      await assert.rejects(() => config.rewrites(), /BACKOFFICE_LEGACY_PORT/);
    }
  } finally {
    if (previous === undefined) delete process.env.BACKOFFICE_LEGACY_PORT;
    else process.env.BACKOFFICE_LEGACY_PORT = previous;
  }
});

test('dev host preserves project-owned agent instructions', () => {
  assert.equal(config.agentRules, false);
});

test('legacy rewrites expose only backoffice pages and required assets', async () => {
  const rules = await config.rewrites();
  for (const file of ['index.html', 'login.html', 'incidents.html', 'suppliers.html',
    'incident-analysis.html', 'auth.js', 'session-guard.js', 'styles.css']) {
    assert.ok(rules.some(rule => rule.source === `/uis/backoffice/${file}`));
  }
  assert.deepEqual(await config.redirects(), [{
    source: '/uis/backoffice', destination: '/uis/backoffice/index.html', permanent: false,
  }]);
  for (const rule of rules) {
    assert.ok(rule.source.startsWith('/uis/backoffice/'));
    assert.ok(!rule.source.includes(':path'));
    assert.equal(new URL(rule.destination).origin, 'http://127.0.0.1:3001');
    assert.ok(!/env|package|config/.test(rule.source));
  }
});
