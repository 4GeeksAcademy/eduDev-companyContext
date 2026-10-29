import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../next.config.ts';

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
