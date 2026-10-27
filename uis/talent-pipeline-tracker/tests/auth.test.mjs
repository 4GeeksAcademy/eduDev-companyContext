import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as auth from '../services/auth.ts';

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
let calls, redirects, storage, responses;
const token = { access_token: 'test-token', token_type: 'bearer' };
const profile = { id: 'p', user_id: 'u', name: null, phone: null, address: null };
const user = { id: 'u', email: 'person@example.test', role: 'user', is_active: true,
  created_at: '2026-01-01T00:00:00Z', profile };
const credentials = { email: 'person+tag@example.test', password: 'a& b=ñ' };
beforeEach(() => {
  calls = []; redirects = []; storage = new Map(); responses = [];
  globalThis.window = {
    localStorage: { getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    location: { assign: path => redirects.push(path) },
  };
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify(next?.[1]), { status: next?.[0] ?? 200 });
  };
});
afterEach(() => { globalThis.fetch = originalFetch; globalThis.window = originalWindow; });

test('login encodes public form and saves only a valid bearer token', async () => {
  auth.saveToken('old'); responses.push([200, token]);
  assert.deepEqual(await auth.login(credentials), token);
  assert.equal(auth.readToken(), token.access_token);
  assert.equal(calls[0].url, 'http://localhost:8000/auth/login');
  assert.equal(calls[0].headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.equal(calls[0].headers.Authorization, undefined);
  assert.deepEqual(Object.fromEntries(new URLSearchParams(calls[0].body)), credentials);
  responses.push([200, { access_token: '', token_type: 'bearer' }]);
  await assert.rejects(auth.login(credentials), auth.AuthApiError);
  assert.equal(auth.readToken(), token.access_token);
});

test('registration sends optional nullable fields then logs in exactly once', async () => {
  auth.saveToken('old'); responses.push([201, user], [200, token]);
  const input = { ...credentials, name: 'Ana', phone: null, address: 'Zaragoza' };
  await auth.register(input);
  assert.equal(calls[0].url, 'http://localhost:8000/users');
  assert.deepEqual(JSON.parse(calls[0].body), input);
  assert.equal(calls[0].headers.Authorization, undefined);
  assert.equal(calls[1].headers.Authorization, undefined);
  assert.equal(calls.length, 2);
  assert.equal(auth.readToken(), token.access_token);
});

test('post-registration login failure explicitly reports account creation', async () => {
  responses.push([201, user], [401, { detail: 'Invalid credentials' }]);
  await assert.rejects(auth.register(credentials), error => {
    assert.equal(error.accountCreated, true);
    assert.match(error.message, /creada.*manualmente/);
    return true;
  });
  assert.equal(calls.length, 2); assert.deepEqual(redirects, []);
});

test('protected identity calls use latest token, nested profile, JSON and abort signal', async () => {
  auth.saveToken('first'); responses.push([200, user], [200, profile]);
  const signal = new AbortController().signal;
  assert.deepEqual(await auth.getCurrentUser(signal), user);
  auth.saveToken('second');
  assert.deepEqual(await auth.updateProfile({ name: null }, signal), profile);
  assert.equal(calls[0].headers.Authorization, 'Bearer first');
  assert.equal(calls[1].headers.Authorization, 'Bearer second');
  assert.equal(calls[1].url, 'http://localhost:8000/profiles/me');
  assert.equal(calls[1].method, 'PUT');
  assert.equal(calls[1].body, '{"name":null}');
  assert.equal(calls[0].signal, signal);
  assert.ok(calls.every(call => call.url.startsWith('http://localhost:8000/')));
});

test('422 retains field detail arrays and 409 identifies email', async () => {
  const detail = [{ loc: ['body', 'password'], msg: 'Invalid password', type: 'value_error' }];
  responses.push([422, { detail }], [409, { detail: 'Email already registered' }]);
  await assert.rejects(auth.register(credentials), error => {
    assert.deepEqual(error.details, detail);
    assert.deepEqual(error.fieldErrors.password, ['Invalid password']);
    assert.equal(error.status, 422); return true;
  });
  await assert.rejects(auth.register(credentials), error => {
    assert.deepEqual(error.fieldErrors.email, ['Email already registered']); return true;
  });
});

test('missing or rejected protected token clears and redirects, login 401 does not', async () => {
  await assert.rejects(auth.getCurrentUser(), { status: 401 });
  assert.equal(calls.length, 0); assert.deepEqual(redirects, ['/login']);
  for (const value of ['invalid', 'expired']) {
    auth.saveToken(value); responses.push([401, { detail: 'Invalid credentials' }]);
    await assert.rejects(auth.getCurrentUser(), { status: 401 });
    assert.equal(auth.readToken(), null);
  }
  redirects.length = 0;
  responses.push([401, { detail: 'Invalid credentials' }]);
  await assert.rejects(auth.login(credentials), { status: 401 });
  assert.deepEqual(redirects, []);
});

test('non-401 and network failures preserve session; logout clears it', async () => {
  auth.saveToken('keep');
  for (const response of [[500, { detail: 'Unavailable' }], new TypeError('offline')]) {
    responses.push(response); await assert.rejects(auth.getCurrentUser());
    assert.equal(auth.readToken(), 'keep'); assert.deepEqual(redirects, []);
  }
  auth.logout(); assert.equal(auth.readToken(), null); assert.deepEqual(redirects, ['/login']);
});

test('stale in-flight 401 cannot clear a newer session', async () => {
  auth.saveToken('old');
  let finish;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  const pending = auth.getCurrentUser();
  auth.saveToken('new'); finish(new Response('{}', { status: 401 }));
  await assert.rejects(pending);
  assert.equal(auth.readToken(), 'new'); assert.deepEqual(redirects, []);
});

test('storage functions are safe without a browser', () => {
  delete globalThis.window;
  assert.equal(auth.readToken(), null);
  auth.saveToken('ignored'); auth.clearToken(); auth.logout();
});
