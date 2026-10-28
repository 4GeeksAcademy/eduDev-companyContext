import { isCandidateStatus, isCandidateStage } from '../lib/labels';
import { candidateErrorMessage, isCandidateAbort, getCandidate } from '../services/api';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  jest.restoreAllMocks();
});

test('status accepts only declared statuses, not unknown or absent filters', () => {
  for (const value of ['received', 'in_progress', 'selected', 'discarded']) {
    expect(isCandidateStatus(value)).toBe(true);
  }
  for (const value of [null, '', 'unknown']) expect(isCandidateStatus(value)).toBe(false);
});

test('stage accepts only declared stages, not unknown or absent filters', () => {
  for (const value of ['pending', 'review', 'personal_interview', 'technical_interview', 'offer_presented']) {
    expect(isCandidateStage(value)).toBe(true);
  }
  for (const value of [null, '', 'unknown']) expect(isCandidateStage(value)).toBe(false);
});

test.each(['toString', 'constructor', '__proto__'])('status rejects inherited key %s', value => {
  expect(isCandidateStatus(value)).toBe(false);
});

test.each(['toString', 'constructor', '__proto__'])('stage rejects inherited key %s', value => {
  expect(isCandidateStage(value)).toBe(false);
});

test('candidate errors expose mapped guidance, never upstream details', async () => {
  globalThis.fetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>().mockResolvedValue(new Response('private upstream detail', { status: 404 }));
  const error = await getCandidate('synthetic-id').catch(error => error);
  expect(candidateErrorMessage(error, 'fallback')).toBe('No se encontró la candidatura o la nota.');
  for (const unknown of [new Error('private detail'), 'private detail', null]) {
    expect(candidateErrorMessage(unknown, 'fallback')).toBe('fallback');
  }
});

test('built-in errors and application subclasses retain Error inheritance', () => {
  class ApplicationError extends Error {}
  for (const error of [new Error(), new EvalError(), new RangeError(),
    new ReferenceError(), new SyntaxError(), new TypeError(), new URIError(),
    new AggregateError([]), new ApplicationError()]) {
    expect(error).toBeInstanceOf(Error);
    expect(isCandidateAbort(error)).toBe(false);
    expect(candidateErrorMessage(error, 'fallback')).toBe('fallback');
    error.name = 'AbortError';
    expect(isCandidateAbort(error)).toBe(true);
  }
});

test.each(['fetch', 'body'])('native DOMException cancellation preserves identity through %s', async phase => {
  const abort = new DOMException('Canceled', 'AbortError');
  globalThis.fetch = phase === 'fetch'
    ? jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>().mockRejectedValue(abort)
    : jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>().mockResolvedValue(Object.assign(new Response('{}'), {
      json: async () => { throw abort; },
    }));
  await expect(getCandidate('synthetic-id')).rejects.toBe(abort);
});

test('abort classifier distinguishes cancellation from arbitrary values', () => {
  expect(isCandidateAbort(new DOMException('Canceled', 'AbortError'))).toBe(true);
  for (const value of [new Error('AbortError'), new TypeError('AbortError'),
    new DOMException('Failed', 'NetworkError'), { name: 'AbortError' }, null]) {
    expect(isCandidateAbort(value)).toBe(false);
  }
});
