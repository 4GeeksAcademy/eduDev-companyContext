import test from 'node:test';
import assert from 'node:assert/strict';

for (const prefix of ['', '/talent']) {
  test(`deployment routing with ${prefix || 'bare'} paths`, async () => {
    const previous = { ...process.env };
    const oldWindow = globalThis.window;
    const oldFetch = globalThis.fetch;
    const oldDir = globalThis.__dirname;
    try {
      process.env.NEXT_PUBLIC_TRACKER_BASE_PATH = prefix;
      process.env.NEXT_PUBLIC_AUTH_API_URL = '/api';
      globalThis.__dirname = new URL('..', import.meta.url).pathname;
      const { default: config } = await import(`../next.config.ts?prefix=${prefix}`);
      const auth = await import(`../services/auth.ts?prefix=${prefix}`);
      const storage = new Map();
      const redirects = [];
      globalThis.window = {
        localStorage: { getItem: k => storage.get(k) ?? null,
          setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
        location: { pathname: `${prefix}/account/profile`, search: '?source=test',
          assign: url => redirects.push(url) },
      };
      globalThis.fetch = async (url, options) => {
        assert.equal(url, '/api/auth/me');
        assert.equal(options.headers.Authorization, 'Bearer fixture');
        return new Response('{}', { status: 401 });
      };
      auth.saveToken('fixture');
      await assert.rejects(auth.getCurrentUser(), { status: 401 });
      assert.equal(auth.readToken(), null);
      assert.deepEqual(redirects, [`${prefix}/login`]); // Existing query-dropping behavior.
      auth.logout();
      assert.equal(redirects.at(-1), `${prefix}/login`);
      assert.equal(config.basePath, prefix);
      assert.equal(config.agentRules, false);
    } finally {
      process.env = previous;
      globalThis.window = oldWindow;
      globalThis.fetch = oldFetch;
      globalThis.__dirname = oldDir;
    }
  });
}
