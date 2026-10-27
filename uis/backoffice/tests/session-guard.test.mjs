import { test } from 'node:test';
import assert from 'node:assert/strict';

function element() {
  return { hidden: false, textContent: '', listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; } };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('gate validates, retries once, cancels departure and revalidates restored pages', async () => {
  const shell = element();
  const status = element();
  const retry = element();
  const panel = element();
  const signout = element();
  const events = {};
  let token = 'session';
  let response = 503;
  let starts = 0;
  let redirect = 0;
  let pending;
  globalThis.window = {
    location: { protocol: 'http:', hostname: 'localhost', search: '', pathname: '/uis/backoffice/',
      replace() { redirect++; } },
    localStorage: { getItem: () => token, removeItem() { token = null; } },
    addEventListener(type, fn) { events[type] = fn; },
  };
  globalThis.document = {
    querySelector: selector => ({ '#session-state': status, '#session-retry': retry,
      '#session-panel': panel })[selector],
    querySelectorAll: selector => selector === '[data-protected]' ? [shell]
      : selector === '[data-logout]' ? [signout] : [],
  };
  globalThis.fetch = async (_url, options) => {
    if (pending) return pending(options.signal);
    return new Response('{}', { status: response });
  };
  const { guardSession } = await import('../session-guard.js');
  guardSession(() => { starts++; });
  await tick();
  assert.equal(shell.hidden, true);
  assert.equal(starts, 0);
  assert.equal(retry.hidden, false);
  assert.equal(token, 'session');
  response = 200;
  retry.listeners.click();
  await tick();
  assert.equal(shell.hidden, false);
  assert.equal(starts, 1);
  events.pagehide();
  assert.equal(shell.hidden, true);
  let signal;
  let resolve;
  pending = s => { signal = s; return new Promise(r => { resolve = r; }); };
  events.pageshow({ persisted: true });
  events.pagehide();
  assert.equal(signal.aborted, true);
  resolve(new Response('{}'));
  await tick();
  assert.equal(shell.hidden, true);
  pending = null;
  events.pageshow({ persisted: true });
  await tick();
  assert.equal(shell.hidden, false);
  assert.equal(starts, 1);
  response = 401;
  events.storage({ key: 'trackflow.auth.token' });
  await tick();
  assert.equal(shell.hidden, true);
  assert.equal(starts, 1);
  assert.equal(redirect, 1);
  events.pageshow({ persisted: true });
  await tick();
  assert.equal(shell.hidden, true);
  assert.equal(starts, 1);
  assert.equal(redirect, 2);
});
