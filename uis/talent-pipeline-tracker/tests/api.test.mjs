import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../services/api.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const candidate = { id: '1', full_name: 'Ana', email: 'ana@example.test', phone: '123',
  position: 'Assistant', experience_years: 2, status: 'received', stage: 'pending',
  notes_count: 0, applied_at: '2026-01-01', updated_at: '2026-01-01' };
const json = value => new Response(JSON.stringify(value));

test('network and invalid JSON have fixed safe messages', async () => {
  globalThis.fetch = async () => { throw new TypeError('private network detail'); };
  await assert.rejects(api.getCandidate('1'), { message: 'No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.' });
  globalThis.fetch = async () => new Response('<private broken JSON>');
  await assert.rejects(api.getCandidate('1'), { message: 'La respuesta no es válida. Inténtalo de nuevo.' });
});

test('HTTP errors ignore hostile bodies and use fixed status messages', async () => {
  for (const [status, message] of [[400, 'Revisa los datos e inténtalo de nuevo.'],
    [401, 'No tienes permiso para realizar esta solicitud.'], [403, 'No tienes permiso para realizar esta solicitud.'],
    [404, 'No se encontró la candidatura o la nota.'], [409, 'Los datos han cambiado o ya existen. Revisa e inténtalo de nuevo.'],
    [422, 'Revisa los datos e inténtalo de nuevo.'], [429, 'Hay demasiadas solicitudes. Espera un momento e inténtalo de nuevo.'],
    [500, 'El servicio no está disponible. Inténtalo de nuevo más tarde.']]) {
    for (const body of ['{"detail":"private technical data","message":"hostile"}', '<html>private</html>']) {
      globalThis.fetch = async () => new Response(body, { status });
      await assert.rejects(api.getCandidate('1'), { message });
    }
  }
});

test('successful candidate, mutations, notes and delete 204 preserve contracts', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url, ...init }); return json(candidate); };
  assert.deepEqual(await api.getCandidate('a/b'), candidate);
  assert.match(calls[0].url, /a%2Fb$/);
  assert.deepEqual(await api.createCandidate({ full_name: 'Ana' }), candidate);
  assert.equal(calls[1].method, 'POST');
  assert.deepEqual(await api.updateCandidate('1', {}), candidate);
  assert.deepEqual(await api.patchCandidate('1', { status: 'received' }), candidate);
  const note = { id: 'n', record_id: '1', content: 'Context', created_at: '2026-01-01' };
  globalThis.fetch = async () => json(note);
  assert.deepEqual(await api.createNote('1', 'Context'), note);
  globalThis.fetch = async () => json({ data: [note], meta: { total: 1 } });
  assert.equal((await api.getNotes('1')).data.length, 1);
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await api.deleteNote('1', 'n'), undefined);
  await assert.rejects(api.getCandidate('1'), /respuesta no es válida/);
});

test('pagination preserves filters and rejects malformed required data', async () => {
  let page = 0;
  globalThis.fetch = async url => {
    assert.match(url, /status=received/); assert.match(url, /search=Ana/);
    return json({ total: 2, data: [{ ...candidate, id: String(++page) }] });
  };
  assert.equal((await api.getCandidates({ status: 'received', search: 'Ana' })).data.length, 2);
  for (const value of [null, {}, { total: 1, data: null }, { total: '1', data: [] }, { total: 1, data: [null] }]) {
    globalThis.fetch = async () => json(value);
    await assert.rejects(api.getCandidates({}), /respuesta no es válida/);
  }
  globalThis.fetch = async () => json({ total: 1, data: [] });
  await assert.rejects(api.getCandidates({}), /todas las candidaturas/);
  globalThis.fetch = async () => json({ data: null });
  await assert.rejects(api.getNotes('1'), /respuesta no es válida/);
});

test('invalid entities fail safely and unknown errors never become UI messages', async () => {
  for (const value of [null, {}, { ...candidate, status: 'unknown' }, { ...candidate, cv_url: {} }]) {
    globalThis.fetch = async () => json(value);
    await assert.rejects(api.getCandidate('1'), /respuesta no es válida/);
  }
  globalThis.fetch = async () => json({ content: 'missing required ID' });
  await assert.rejects(api.createNote('1', 'Context'), /respuesta no es válida/);
  assert.equal(api.candidateErrorMessage(new Error('private'), 'Safe fallback'), 'Safe fallback');
});

test('already canceled and body-delayed requests remain cancellation', async () => {
  const controller = new AbortController();
  controller.abort();
  globalThis.fetch = async () => assert.fail('must not fetch');
  await assert.rejects(api.getCandidate('1', controller.signal), { name: 'AbortError' });
  const delayed = new AbortController();
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => {
    delayed.abort(); return candidate;
  } });
  await assert.rejects(api.getCandidate('1', delayed.signal), { name: 'AbortError' });
});

test('AbortError identity and optional signals survive fetch and body parsing', async () => {
  const abort = new DOMException('Canceled', 'AbortError');
  globalThis.fetch = async () => { throw abort; };
  await assert.rejects(api.getCandidate('1'), error => error === abort);
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => { throw abort; } });
  await assert.rejects(api.getCandidate('1'), error => error === abort);
  const controller = new AbortController();
  globalThis.fetch = async (_url, init) => {
    assert.equal(init.signal, controller.signal);
    controller.abort();
    return json(candidate);
  };
  await assert.rejects(api.getCandidate('1', controller.signal), { name: 'AbortError' });
});
