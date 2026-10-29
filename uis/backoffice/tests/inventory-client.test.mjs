import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { listProducts, getProduct, listOrders, createMovement, InventoryError } from '../lib/inventory.ts';
import { setToken, getToken } from '../auth.js';
let calls, redirects;
beforeEach(() => {
  const store = new Map(); calls = []; redirects = [];
  globalThis.window = { location: { protocol: 'http:', hostname: 'warehouse.test', search: '?apiPort=8001', pathname: '/backoffice/inventory/products', replace: x => redirects.push(x) }, localStorage: { getItem: x => store.get(x) ?? null, setItem: (x,y) => store.set(x,y), removeItem: x => store.delete(x) } };
  setToken('current'); delete process.env.NEXT_PUBLIC_INVENTORY_API_URL;
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json([]); };
});
test('all inventory operations use current bearer, configured base, signals and exact JSON', async () => {
  const signal = new AbortController().signal;
  await listProducts(signal); await getProduct(3, signal); await listOrders(signal);
  process.env.NEXT_PUBLIC_INVENTORY_API_URL = 'https://inventory.example.test/';
  setToken('replacement');
  const payload = { sku_id: 3, warehouse: 'LA', quantity: 2, exit_type: 'loss', tracking_number: null };
  await createMovement('outbound', payload, signal);
  assert.deepEqual(calls.map(x => x.url), ['http://warehouse.test:8001/inventory/products', 'http://warehouse.test:8001/inventory/products/3', 'http://warehouse.test:8001/inventory/orders', 'https://inventory.example.test/inventory/orders/outbound']);
  assert.ok(calls.every(x => x.options.signal === signal));
  assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer current');
  assert.equal(calls[3].options.headers.get('Authorization'), 'Bearer replacement');
  assert.equal(calls[3].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[3].options.body), payload);
  assert.equal(calls[3].options.headers.get('Content-Type'), 'application/json');
  await createMovement('inbound', { sku_id: 3, warehouse: 'LA', quantity: 1, reference: 'receipt' }, signal);
  assert.ok(calls[4].url.endsWith('/orders/inbound'));
});
test('FastAPI errors are readable, carry status and have robust fallbacks', async () => {
  for (const [body, expected] of [[JSON.stringify({detail:'Insufficient stock'}), /Insufficient stock/], [JSON.stringify({detail:[{loc:['body','quantity'],msg:'Must be positive'}]}), /quantity: Must be positive/], ['not JSON', /failed.*400/i], ['', /failed.*400/i], [JSON.stringify({detail:{private:'object'}}), /failed.*400/i]]) {
    globalThis.fetch = async () => new Response(body, {status:400});
    await assert.rejects(listProducts(new AbortController().signal), e => e instanceof InventoryError && e.status === 400 && expected.test(e.message));
  }
  globalThis.fetch = async () => new Response('', {status:503});
  await assert.rejects(listOrders(new AbortController().signal), /503/);
  globalThis.fetch = async () => { throw new TypeError('internal transport'); };
  await assert.rejects(listProducts(new AbortController().signal), /network/i);
  globalThis.fetch = async () => new Response('invalid');
  await assert.rejects(listProducts(new AbortController().signal), /invalid response/i);
});
test('abort is separate, and late 401 never revokes a replacement session', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(listProducts(controller.signal), {name:'AbortError'});
  assert.equal(calls.length, 0);
  globalThis.fetch = async () => { setToken('new'); return new Response('', {status:401}); };
  await assert.rejects(listProducts(new AbortController().signal));
  assert.equal(getToken(), 'new'); assert.deepEqual(redirects, []);
  globalThis.fetch = async () => ({ok:true, json:async () => { controller.abort(); return []; }});
  const pending = new AbortController();
  globalThis.fetch = async () => ({ok:true, json:async () => { pending.abort(); return []; }});
  await assert.rejects(listProducts(pending.signal), {name:'AbortError'});
});
