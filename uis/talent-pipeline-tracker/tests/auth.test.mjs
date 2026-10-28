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
  auth.saveToken('keep');
  responses.push([401, { detail: 'Invalid credentials' }]);
  await assert.rejects(auth.login(credentials), { status: 401 });
  assert.equal(auth.readToken(), 'keep');
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

test('already-aborted auth submissions never start a request or change the session', async () => {
  auth.saveToken('keep');
  const controller = new AbortController();
  controller.abort();
  for (const submit of [auth.login, auth.register]) {
    await assert.rejects(submit(credentials, controller.signal), { name: 'AbortError' });
  }
  assert.equal(calls.length, 0);
  assert.equal(auth.readToken(), 'keep');
});

test('password endpoints use exact JSON payloads, public isolation and protected bearer', async () => {
  auth.saveToken('keep');
  const signal = new AbortController().signal;
  const cases = [
    [auth.forgotPassword, '/auth/forgot-password', { email: 'a@example.test' }, false],
    [auth.resetPassword, '/auth/reset-password', { token: 'reset-only', new_password: 'new' }, false],
    [auth.changePassword, '/auth/change-password', { current_password: 'old', new_password: 'new' }, true],
  ];
  for (const [submit, path, payload, protectedCall] of cases) {
    responses.push([200, { message: 'ok', access_token: 'must-not-save' }]);
    await submit(payload, signal);
    const call = calls.at(-1);
    assert.equal(call.url, `http://localhost:8000${path}`);
    assert.equal(call.method, 'POST');
    assert.equal(call.headers['Content-Type'], 'application/json');
    assert.equal(call.headers.Authorization, protectedCall ? 'Bearer keep' : undefined);
    assert.deepEqual(JSON.parse(call.body), payload);
    assert.equal(call.signal, signal);
    assert.equal(auth.readToken(), 'keep');
    responses.push([400, { detail: 'sensitive arbitrary response' }]);
    await assert.rejects(submit(payload), error => error.status === 400 && !error.message.includes('sensitive'));
    const controller = new AbortController(); controller.abort();
    const count = calls.length;
    await assert.rejects(submit(payload, controller.signal), { name: 'AbortError' });
    assert.equal(calls.length, count);
  }
  responses.push([401, {}]);
  await assert.rejects(auth.resetPassword({ token: 'bad', new_password: 'new' }), { status: 401 });
  assert.equal(auth.readToken(), 'keep');
  responses.push([401, {}]);
  await assert.rejects(auth.changePassword({ current_password: 'old', new_password: 'new' }), { status: 401 });
  assert.equal(auth.readToken(), null);
});

test('password requests preserve sessions on transport errors and reject late cancellation', async () => {
  auth.saveToken('keep');
  for (const [submit, payload] of [
    [auth.forgotPassword, { email: 'a@example.test' }],
    [auth.resetPassword, { token: 'reset', new_password: 'new' }],
    [auth.changePassword, { current_password: 'old', new_password: 'new' }],
  ]) {
    globalThis.fetch = async () => { throw new TypeError('offline'); };
    await assert.rejects(submit(payload), TypeError);
    const controller = new AbortController();
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => {
      controller.abort(); return { access_token: 'never-save' };
    } });
    await assert.rejects(submit(payload, controller.signal), { name: 'AbortError' });
    assert.equal(auth.readToken(), 'keep');
    assert.deepEqual(redirects, []);
  }
});

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

test('late aborted login cannot persist a token even when fetch ignores abort', async () => {
  for (const phase of ['fetch', 'json']) {
    const controller = new AbortController();
    const started = deferred();
    const finish = deferred();
    globalThis.fetch = async (_url, options) => {
      assert.equal(options.signal, controller.signal);
      if (phase === 'fetch') {
        started.resolve();
        await finish.promise;
      }
      return { ok: true, status: 200, json: async () => {
        started.resolve();
        if (phase === 'json') await finish.promise;
        return token;
      } };
    };
    const pending = auth.login(credentials, controller.signal);
    await started.promise;
    controller.abort();
    auth.saveToken('newer-session');
    finish.resolve();
    await assert.rejects(pending, { name: 'AbortError' });
    assert.equal(auth.readToken(), 'newer-session');
    assert.deepEqual(redirects, []);
  }
});

test('registration canceled after account creation never starts automatic login', async () => {
  const controller = new AbortController();
  globalThis.fetch = async () => {
    calls.push('users');
    return { ok: true, status: 201, json: async () => {
      controller.abort();
      return user;
    } };
  };
  auth.saveToken('keep');
  await assert.rejects(auth.register(credentials, controller.signal), { name: 'AbortError' });
  assert.deepEqual(calls, ['users']);
  assert.equal(auth.readToken(), 'keep');
});

test('aborted automatic login is not reported as a manual-login failure', async () => {
  const controller = new AbortController();
  responses.push([201, user]);
  const createUser = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/users')) return createUser(url, options);
    controller.abort();
    throw new DOMException('Aborted', 'AbortError');
  };
  await assert.rejects(auth.register(credentials, controller.signal), { name: 'AbortError' });
});

test('storage functions are safe without a browser', () => {
  delete globalThis.window;
  assert.equal(auth.readToken(), null);
  auth.saveToken('ignored'); auth.clearToken(); auth.logout();
});
