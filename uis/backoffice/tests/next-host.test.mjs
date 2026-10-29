import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../next.config.ts';

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
