import test from 'node:test';
import assert from 'node:assert/strict';
import { enums, validate, branchHighlighted, nextStatuses, queryFor, createController, renderText, initialize } from '../incidents.js';

const valid = { title: 'Parcel', description: 'Missing parcel', category: 'lost_parcel', status: 'open', origin: 'customer', branch: 'central' };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function setup(fetcher) {
  const events = [];
  const controller = createController(fetcher, (type, data) => events.push({ type, data }));
  return { controller, events };
}
test('required trimmed fields, exact enums and always-required branch', () => {
  assert.deepEqual(validate(valid), {});
  for (const field of Object.keys(valid)) assert.ok(validate({ ...valid, [field]: '  ' })[field]);
  assert.ok(validate({ ...valid, branch: '' }).branch);
  assert.equal(branchHighlighted('branch'), true);
  assert.equal(branchHighlighted('internal'), false);
  assert.equal(enums.category.length, 9); assert.equal(enums.branch.length, 5);
});
test('only legal next states, including read-only terminal records', () => {
  assert.deepEqual(nextStatuses('open'), ['open', 'in_progress', 'discarded']);
  assert.deepEqual(nextStatuses('in_progress'), ['in_progress', 'resolved', 'discarded']);
  assert.deepEqual(nextStatuses('resolved'), ['resolved']);
  assert.deepEqual(nextStatuses('discarded'), ['discarded']);
});
test('POST loading, duplicate prevention, success reset and independent refresh', async () => {
  const pending = deferred(); const calls = [];
  const { controller, events } = setup(async (path, options) => {
    calls.push({ path, options });
    if (options?.method === 'POST') return pending.promise;
    return Response.json(path.endsWith('summary') ? {} : []);
  });
  const first = controller.submit(valid); await controller.submit(valid);
  assert.equal(calls.length, 1); assert.ok(events.some(e => e.type === 'saving' && e.data));
  pending.resolve(Response.json(valid, { status: 201 })); await first;
  assert.ok(events.some(e => e.type === 'reset'));
  assert.ok(events.some(e => e.type === 'saving' && !e.data));
  assert.ok(calls.some(c => c.path === '/api/incidents/summary'));
  assert.ok(calls.some(c => c.path === '/api/incidents'));
});
test('invalid submissions do not fetch; safe errors preserve input and map known keys only', async () => {
  let calls = 0;
  const { controller, events } = setup(async () => { calls++; return Response.json({ detail: '<stack>', errors: { title: '<script>', branch: 'private data', id: 'secret' } }, { status: 400 }); });
  await controller.submit({ ...valid, title: ' ' }); assert.equal(calls, 0);
  await controller.submit(valid);
  const error = events.filter(e => e.type === 'formError').at(-1).data;
  assert.ok(error.fields.title); assert.ok(error.fields.branch); assert.equal(error.fields.id, undefined);
  assert.doesNotMatch(JSON.stringify(events), /<stack>|<script>|private data|secret/);
  assert.equal(events.some(e => e.type === 'reset'), false);
});
test('filter query is allowlisted; stale requests cannot replace latest list', async () => {
  assert.equal(queryFor({ status: 'open', origin: 'branch', branch: 'central', category: 'other', id: 'no' }), '?status=open&origin=branch&branch=central&category=other');
  const old = deferred(); let count = 0;
  const { controller, events } = setup(async () => ++count === 1 ? old.promise : Response.json([{ title: 'new' }]));
  const first = controller.loadList({ status: 'open' }); await controller.loadList({ status: 'resolved' });
  old.resolve(Response.json([{ title: 'old' }])); await first;
  assert.deepEqual(events.filter(e => e.type === 'list').map(e => e.data), [[{ title: 'new' }]]);
});
test('list empty, error and retry; summary failure stays independent', async () => {
  let fail = true;
  const { controller, events } = setup(async path => {
    if (path.endsWith('summary') || fail) throw Error('raw secret');
    return Response.json([]);
  });
  await controller.loadList(); await controller.loadSummary(); fail = false; await controller.loadList();
  assert.ok(events.some(e => e.type === 'listError'));
  assert.ok(events.some(e => e.type === 'summaryError'));
  assert.deepEqual(events.filter(e => e.type === 'list').at(-1).data, []);
  assert.doesNotMatch(JSON.stringify(events), /raw secret/);
});
test('failed status update restores server baseline; duplicate and illegal changes blocked', async () => {
  const pending = deferred(); let calls = 0;
  const { controller, events } = setup(async () => { calls++; return pending.promise; });
  const row = { id: 'generated', status: 'open' };
  const first = controller.update(row, 'in_progress'); await controller.update(row, 'discarded');
  assert.equal(calls, 1);
  pending.resolve(new Response('', { status: 500 })); await first;
  assert.ok(events.some(e => e.type === 'rowError' && e.data.status === 'open'));
  await controller.update(row, 'resolved'); assert.equal(calls, 1);
});
test('successful status update refreshes filtered list and summary separately', async () => {
  const calls = [];
  const { controller, events } = setup(async (path, options) => {
    calls.push({ path, options });
    if (path.endsWith('summary')) throw Error('summary unavailable');
    return Response.json(options ? { id: 'one', status: 'in_progress' } : []);
  });
  await controller.loadList({ branch: 'central' });
  await controller.update({ id: 'one', status: 'open' }, 'in_progress');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.filter(c => c.path === '/api/incidents?branch=central').length, 2);
  assert.ok(events.some(e => e.type === 'summaryError'));
  assert.ok(events.some(e => e.type === 'list'));
});

// Only the nodes used by this page, not a general-purpose browser emulator.
function pageFixture() {
  class Node {
    constructor() { this.value = ''; this.textContent = ''; this.children = []; this.handlers = {}; this.attributes = {}; this.hidden = false; this.disabled = false; this.classes = new Set(); this.classList = { toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name) }; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(name, callback) { this.handlers[name] = callback; }
    focus() { this.focused = true; }
    set innerHTML(_) { throw Error('Unsafe HTML'); }
  }
  const nodes = new Map();
  const get = id => { if (!nodes.has(id)) nodes.set(id, new Node()); return nodes.get(id); };
  const form = get('incident-form');
  form.elements = { namedItem: get };
  form.reset = () => { for (const key of Object.keys(valid)) get(key).value = ''; };
  globalThis.document = { getElementById: get, createElement: () => new Node() };
  globalThis.Option = class extends Node { constructor(text, value) { super(); this.textContent = text; this.value = value; } };
  globalThis.window = { location: { protocol: 'http:', hostname: 'localhost', search: '' }, localStorage: { getItem: () => 'test-token' } };
  return { get, text: node => [node.textContent, ...node.children.map(child => typeof child === 'string' ? child : [child.textContent, ...child.children.map(c => c.textContent)].join(' '))].join(' ') };
}

test('page wiring: required feedback, branch highlight, disabled submit, reset, zero summary and safe cards', async () => {
  const previous = { document: globalThis.document, Option: globalThis.Option, window: globalThis.window, fetch: globalThis.fetch };
  try {
    const { get } = pageFixture(); const pending = deferred(); let created = false;
    globalThis.fetch = async (url, options) => {
      if (options.method === 'POST') { await pending.promise; created = true; return Response.json(valid, { status: 201 }); }
      return Response.json(url.endsWith('summary') ? {} : created ? [{ ...valid, title: '<script>unsafe</script>', description: '<img>', id: 'auto', created_at: 'now', updated_at: 'now' }] : []);
    };
    initialize(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(get('list-state').textContent, 'No incidents registered yet.');
    const summary = get('summary-content');
    assert.equal(summary.children[0].textContent, 'Total incidents: 0');
    assert.equal(summary.children.length, 5);
    const submit = () => get('incident-form').handlers.submit({ preventDefault() {} });
    submit(); assert.equal(get('title').attributes['aria-invalid'], 'true'); assert.equal(get('title').focused, true);
    for (const [key, value] of Object.entries(valid)) get(key).value = value;
    get('origin').value = 'branch'; get('origin').handlers.change();
    assert.equal(get('branch-field').classes.has('branch-highlight'), true);
    submit(); assert.equal(get('submit-incident').disabled, true);
    pending.resolve(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(get('submit-incident').disabled, false);
    assert.equal(get('title').value, ''); assert.equal(get('status').value, 'open');
    assert.equal(get('branch-field').classes.has('branch-highlight'), false);
    assert.equal(get('title').attributes['aria-invalid'], 'false');
    assert.equal(get('form-state').textContent, 'Incident registered successfully.');
    assert.equal(get('incident-list').children[0].children[0].textContent, '<script>unsafe</script>');
    globalThis.fetch = async () => { throw Error('offline'); };
    get('list-retry').handlers.click(); get('summary-retry').handlers.click();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(get('list-retry').hidden, false);
    assert.equal(get('summary-retry').hidden, false);
    assert.equal(get('form-state').textContent, 'Incident registered successfully.');
    submit();
    assert.equal(get('form-state').textContent, 'Check the highlighted fields.');
    for (const [key, value] of Object.entries(valid)) get(key).value = value;
    submit();
    assert.equal(get('form-state').textContent, 'Registering incident…');
    await new Promise(resolve => setImmediate(resolve));
    assert.match(get('form-state').textContent, /Unable to register/);
  } finally { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } }
});

test('safe text rendering never assigns HTML', () => {
  const node = { set innerHTML(_) { throw Error('unsafe'); } };
  renderText(node, '<img onerror=alert(1)>'); assert.equal(node.textContent, '<img onerror=alert(1)>');
});
