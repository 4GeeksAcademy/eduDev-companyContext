import {
  AuthApiError, readToken, saveToken, clearToken, logout, login, register,
  getCurrentUser, updateProfile, forgotPassword, resetPassword, changePassword,
} from '../services/auth';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalFetch = globalThis.fetch;
const credentials = { email: 'test@example.invalid', password: ' synthetic ' };
const token = { access_token: 'new-session', token_type: 'bearer' };
let fetchMock: jest.MockedFunction<typeof fetch>;
let redirect: jest.Mock;

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  const storage = new Map<string, string>();
  redirect = jest.fn();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    },
    location: { assign: redirect },
  } });
  fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
  globalThis.fetch = fetchMock;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
  jest.restoreAllMocks();
});

test('session roundtrip, idempotent clear and logout redirect', () => {
  expect(readToken()).toBeNull();
  saveToken('session');
  expect(readToken()).toBe('session');
  clearToken();
  clearToken();
  expect(readToken()).toBeNull();
  saveToken('replacement');
  logout();
  expect(readToken()).toBeNull();
  expect(redirect).toHaveBeenCalledWith('/login');
});

test('session functions safely do nothing during SSR without window', () => {
  Reflect.deleteProperty(globalThis, 'window');
  saveToken('ignored');
  clearToken();
  logout();
  expect(readToken()).toBeNull();
  expect(redirect).not.toHaveBeenCalled();
});

test('login saves a valid bearer token without sending an existing session', async () => {
  saveToken('old-session');
  fetchMock.mockResolvedValue(response(token));
  await expect(login(credentials)).resolves.toEqual(token);
  expect(readToken()).toBe(token.access_token);
  expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has('Authorization')).toBe(false);
});

test.each([null, {}, { ...token, access_token: '' }, { ...token, access_token: ' ' },
  { ...token, access_token: 123 }, { ...token, token_type: 'other' }])(
  'login rejects malformed token %j without replacing session', async body => {
    saveToken('old-session');
    fetchMock.mockResolvedValue(response(body));
    await expect(login(credentials)).rejects.toMatchObject({ status: 502 });
    expect(readToken()).toBe('old-session');
  },
);

test('login invalid JSON fails safely and preserves session', async () => {
  saveToken('old-session');
  fetchMock.mockResolvedValue(new Response('not JSON'));
  await expect(login(credentials)).rejects.toMatchObject({ status: 502 });
  expect(readToken()).toBe('old-session');
});

test('login 401 hides arbitrary server detail and preserves session', async () => {
  saveToken('old-session');
  fetchMock.mockResolvedValue(response({ detail: 'private upstream diagnostic' }, 401));
  await expect(login(credentials)).rejects.toMatchObject({
    message: 'Email o contraseña incorrectos.', status: 401, accountCreated: false,
  });
  expect(readToken()).toBe('old-session');
  expect(redirect).not.toHaveBeenCalled();
});

test('registration succeeds through automatic login', async () => {
  fetchMock.mockResolvedValueOnce(response({ id: 'user' }, 201)).mockResolvedValueOnce(response(token));
  await expect(register({ ...credentials, name: 'Name' })).resolves.toEqual(token);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(readToken()).toBe(token.access_token);
});

test('registration conflict never attempts login and supplies email guidance', async () => {
  fetchMock.mockResolvedValue(response({ detail: 'private diagnostic' }, 409));
  await expect(register(credentials)).rejects.toMatchObject({
    status: 409, accountCreated: false, fieldErrors: { email: ['Email already registered'] },
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('validation details retain multiple field messages', async () => {
  const details = [
    { loc: ['body', 'email'], msg: 'Invalid email' },
    { loc: ['body', 'email'], msg: 'Required email' },
  ];
  fetchMock.mockResolvedValue(response({ detail: details }, 422));
  await expect(register(credentials)).rejects.toMatchObject({
    details, fieldErrors: { email: ['Invalid email', 'Required email'] }, accountCreated: false,
  });
});

test.each([401, 500, 0])('registration partial success reports manual login after failure %i', async status => {
  saveToken('old-session');
  fetchMock.mockResolvedValueOnce(response({ id: 'user' }, 201));
  if (status) fetchMock.mockResolvedValueOnce(response({ detail: 'private diagnostic' }, status));
  else fetchMock.mockRejectedValueOnce(new TypeError('private network diagnostic'));
  await expect(register(credentials)).rejects.toMatchObject({
    status, accountCreated: true, message: 'Cuenta creada. Inicia sesión manualmente.',
  });
  expect(readToken()).toBe('old-session');
});

const protectedCalls = [
  { name: 'current user', call: (signal?: AbortSignal) => getCurrentUser(signal), method: 'GET' },
  { name: 'profile', call: (signal?: AbortSignal) => updateProfile({ name: null }, signal), method: 'PUT' },
  { name: 'password change', call: (signal?: AbortSignal) => changePassword({ current_password: 'old', new_password: 'new' }, signal), method: 'POST' },
];

describe.each(protectedCalls)('$name protected operation', ({ call, method }) => {
  test('uses bearer session and returns success without changing it', async () => {
    saveToken('session');
    fetchMock.mockResolvedValue(response({ name: null }));
    const result = await call();
    expect(result).toEqual(method === 'POST' ? undefined : { name: null });
    const options = fetchMock.mock.calls[0][1];
    expect(options?.method).toBe(method);
    if (method === 'PUT') expect(JSON.parse(String(options?.body))).toEqual({ name: null });
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer session');
    expect(readToken()).toBe('session');
  });
  test('missing token redirects without fetch', async () => {
    await expect(call()).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/login');
  });
  test('current 401 clears token and redirects', async () => {
    saveToken('session');
    fetchMock.mockResolvedValue(response({}, 401));
    await expect(call()).rejects.toBeInstanceOf(AuthApiError);
    expect(readToken()).toBeNull();
    expect(redirect).toHaveBeenCalledWith('/login');
  });
  test('stale 401 preserves replacement session', async () => {
    saveToken('old');
    fetchMock.mockImplementation(async () => {
      saveToken('replacement');
      return response({}, 401);
    });
    await expect(call()).rejects.toMatchObject({ status: 401 });
    expect(readToken()).toBe('replacement');
    expect(redirect).not.toHaveBeenCalled();
  });
  test.each(['http', 'network'])('%s failure preserves session', async kind => {
    saveToken('session');
    if (kind === 'http') fetchMock.mockResolvedValue(response({ detail: 'private' }, 500));
    else fetchMock.mockRejectedValue(new TypeError('network'));
    await expect(call()).rejects.toBeInstanceOf(Error);
    expect(readToken()).toBe('session');
    expect(redirect).not.toHaveBeenCalled();
  });
  test('fetch cancellation retains actual DOMException identity', async () => {
    saveToken('session');
    const aborted = new DOMException('Canceled', 'AbortError');
    fetchMock.mockRejectedValue(aborted);
    await expect(call(new AbortController().signal)).rejects.toBe(aborted);
    expect(readToken()).toBe('session');
  });
});

const publicCalls = [
  { name: 'forgot', call: (signal?: AbortSignal) => forgotPassword({ email: credentials.email }, signal) },
  { name: 'reset', call: (signal?: AbortSignal) => resetPassword({ token: 'reset-link', new_password: 'new' }, signal) },
];
describe.each(publicCalls)('$name public operation', ({ call }) => {
  test('never attaches bearer or changes session', async () => {
    saveToken('session');
    fetchMock.mockResolvedValue(response({ message: 'ok' }));
    await expect(call()).resolves.toBeUndefined();
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has('Authorization')).toBe(false);
    expect(readToken()).toBe('session');
  });
  test.each(['http', 'network'])('%s failure preserves session without redirect', async kind => {
    saveToken('session');
    if (kind === 'http') fetchMock.mockResolvedValue(response({ detail: 'private' }, 401));
    else fetchMock.mockRejectedValue(new TypeError('network'));
    await expect(call()).rejects.toBeInstanceOf(Error);
    expect(readToken()).toBe('session');
    expect(redirect).not.toHaveBeenCalled();
  });
});

const cancellableCalls = [
  { name: 'login', call: (signal: AbortSignal) => login(credentials, signal) },
  { name: 'register', call: (signal: AbortSignal) => register(credentials, signal) },
  ...publicCalls, protectedCalls[2],
];
describe.each(cancellableCalls)('$name cancellation checkpoints', ({ call }) => {
  test('pre-abort prevents request', async () => {
    saveToken('session');
    const controller = new AbortController();
    controller.abort();
    await expect(call(controller.signal)).rejects.toBe(controller.signal.reason);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(readToken()).toBe('session');
  });
  test('abort during body parsing prevents stale completion or follow-up login', async () => {
    saveToken('session');
    const controller = new AbortController();
    const aborted = new DOMException('Canceled during body parsing', 'AbortError');
    const reply = response(token);
    jest.spyOn(reply, 'json').mockImplementation(async () => {
      controller.abort(aborted);
      return token;
    });
    fetchMock.mockResolvedValue(reply);
    await expect(call(controller.signal)).rejects.toBe(aborted);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(readToken()).toBe('session');
  });
});

test('registration propagates actual automatic-login AbortError, not partial-success guidance', async () => {
  const aborted = new DOMException('Canceled', 'AbortError');
  fetchMock.mockResolvedValueOnce(response({ id: 'user' }, 201)).mockRejectedValueOnce(aborted);
  await expect(register(credentials)).rejects.toBe(aborted);
  expect(readToken()).toBeNull();
});
