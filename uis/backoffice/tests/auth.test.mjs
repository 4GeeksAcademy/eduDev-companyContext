import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as auth from '../auth.js';

let stored, redirects, calls;
beforeEach(() => {
  stored = new Map(); redirects = []; calls = [];
  globalThis.window = {
    location: { protocol: 'http:', hostname: 'localhost', origin: 'http://localhost:3000',
      pathname: '/uis/backoffice/suppliers.html', search: '?apiPort=8001',
      replace: target => redirects.push(target) },
    localStorage: { getItem: key => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) },
  };
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json({ access_token: 'valid', token_type: 'bearer' });
  };
});

test('module imports without browser globals', async () => {
  delete globalThis.window;
  await import('../auth.js?server-safe');
});

test('login form encoding and token persistence', async () => {
  await auth.login('a+b@example.test', 'p&= word');
  assert.equal(calls[0].url, 'http://localhost:8001/auth/login');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(new Headers(calls[0].options.headers).get('Content-Type'), 'application/x-www-form-urlencoded');
  assert.equal(calls[0].options.body.get('email'), 'a+b@example.test');
  assert.equal(calls[0].options.body.get('password'), 'p&= word');
  assert.equal(auth.getToken(), 'valid');
});

test('bad credentials and malformed tokens never redirect or overwrite sessions', async () => {
  auth.setToken('old');
  for (const response of [new Response('', { status: 401 }),
    Response.json({ access_token: '', token_type: 'bearer' }),
    Response.json({ access_token: 'bad token', token_type: 'bearer' }),
    Response.json({ access_token: 'valid', token_type: 'basic' })]) {
    globalThis.fetch = async () => response;
    await assert.rejects(auth.login('a', 'b'));
    assert.equal(auth.getToken(), 'old');
  }
  assert.deepEqual(redirects, []);
});

test('GET, JSON, multipart and export preserve headers, bodies and readable responses', async () => {
  const multipart = new FormData(); multipart.set('file', new Blob(['csv']), 'test.csv');
  for (const options of [{}, { method: 'POST', body: '{}', headers: new Headers({ 'Content-Type': 'application/json' }) },
    { method: 'POST', body: multipart }, {}]) {
    auth.setToken('current');
    globalThis.fetch = async (url, init) => {
      assert.equal(init.headers.get('Authorization'), 'Bearer current');
      assert.equal(init.headers.get('Content-Type'), options.body === '{}' ? 'application/json' : null);
      assert.equal(init.body, options.body);
      return new Response('csv');
    };
    const response = await auth.protectedFetch('/suppliers', options);
    assert.equal(await (await response.blob()).text(), 'csv');
  }
});

test('missing and rejected sessions redirect preserving return query; stale 401 preserves newer session', async () => {
  await assert.rejects(auth.protectedFetch('/suppliers'));
  assert.equal(calls.length, 0);
  const target = new URL(redirects[0], window.location.origin + '/uis/backoffice/');
  assert.equal(target.pathname, '/uis/backoffice/login.html');
  assert.equal(target.searchParams.get('apiPort'), '8001');
  assert.equal(target.searchParams.get('next'), 'suppliers.html?apiPort=8001');
  auth.setToken('invalid');
  globalThis.fetch = async () => new Response('', { status: 401 });
  await assert.rejects(auth.getCurrentUser());
  assert.equal(auth.getToken(), null);
  const count = redirects.length;
  auth.setToken('old');
  globalThis.fetch = async () => { auth.setToken('new'); return new Response('', { status: 401 }); };
  await assert.rejects(auth.getCurrentUser());
  assert.equal(auth.getToken(), 'new');
  assert.equal(redirects.length, count);
});

test('me and transient failures preserve sessions; logout clears', async () => {
  auth.setToken('keep');
  globalThis.fetch = async url => { assert.ok(url.endsWith('/auth/me')); return Response.json({ id: 'user' }); };
  assert.deepEqual(await auth.getCurrentUser(), { id: 'user' });
  globalThis.fetch = async () => new Response('', { status: 503 });
  await assert.rejects(auth.getCurrentUser());
  globalThis.fetch = async () => { throw new TypeError('offline'); };
  await assert.rejects(auth.getCurrentUser());
  assert.equal(auth.getToken(), 'keep');
  assert.deepEqual(redirects, []);
  auth.logout(); assert.equal(auth.getToken(), null); assert.equal(redirects.length, 1);
});

test('abort before request and during body parsing prevents late persistence', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(auth.login('a', 'b', { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(calls.length, 0);
  const pending = new AbortController();
  globalThis.fetch = async () => ({ ok: true, json: async () => {
    pending.abort(); return { access_token: 'late', token_type: 'bearer' };
  } });
  await assert.rejects(auth.login('a', 'b', { signal: pending.signal }), { name: 'AbortError' });
  assert.equal(auth.getToken(), null);
});

test('API configuration preserves deployment defaults and validates ports', () => {
  for (const port of ['0', '65536', '-1', '1e3', '8001evil', '']) {
    window.location.search = `?apiPort=${port}`;
    assert.equal(auth.getApiBase(), 'http://localhost:8000');
  }
  window.location.search = '?apiPort=65535';
  window.location.protocol = 'https:'; window.location.hostname = 'example.test';
  assert.equal(auth.getApiBase(), 'https://example.test:65535');
  window.TRACKFLOW_API_BASE_URL = 'https://api.example.test/';
  assert.equal(auth.getApiBase(), 'https://api.example.test');
});

test('return targets allow only local backoffice pages, preserving apiPort', () => {
  for (const target of ['https://evil.test/suppliers.html', '//evil.test', '/uis/backoffice/suppliers.html',
    '../suppliers.html', 'javascript:alert(1)', 'login.html', 'suppliers.html#fragment', 'suppliers.html\\evil']) {
    assert.equal(auth.safeReturnTarget(target), 'index.html?apiPort=8001');
  }
  assert.equal(auth.safeReturnTarget('incident-analysis.html?filter=open'), 'incident-analysis.html?filter=open&apiPort=8001');
  assert.equal(auth.safeReturnTarget('suppliers.html?apiPort=9000'), 'suppliers.html?apiPort=8001');
  assert.equal(auth.safeReturnTarget('./'), 'index.html?apiPort=8001');
  assert.equal(auth.safeReturnTarget('incidents.html?apiPort=9000'), 'incidents.html?apiPort=8001');
  for (const target of ['https://evil.test/incidents.html', '../incidents.html', 'incidents.html#bad']) {
    assert.equal(auth.safeReturnTarget(target), 'index.html?apiPort=8001');
  }
});
