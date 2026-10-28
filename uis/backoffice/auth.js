export const TOKEN_KEY = 'trackflow.auth.token';
export const getToken = () => window.localStorage.getItem(TOKEN_KEY);
export const setToken = token => window.localStorage.setItem(TOKEN_KEY, token);

function apiPort(search) {
  const value = new URLSearchParams(search).get('apiPort');
  const port = /^\d+$/.test(value ?? '') ? Number(value) : 0;
  return port >= 1 && port <= 65535 ? String(port) : null;
}

export function getApiBase() {
  const { protocol, hostname, search } = window.location;
  return (window.TRACKFLOW_API_BASE_URL ??
    `${['http:', 'https:'].includes(protocol) ? protocol : 'http:'}//${hostname || 'localhost'}:${apiPort(search) ?? 8000}`
  ).replace(/\/$/, '');
}

// Deliberately accept relative page names, never arbitrary URL destinations.
export function safeReturnTarget(next) {
  const match = /^(?:\.\/)?(index\.html|suppliers\.html|incident-analysis\.html|incidents\.html)(\?[^#\\]*)?$/.exec(next ?? '');
  const page = match ? match[1] : 'index.html';
  const query = new URLSearchParams(match?.[2] ?? '');
  const port = apiPort(window.location.search) ?? apiPort(query.toString());
  query.delete('apiPort');
  if (port) query.set('apiPort', port);
  return page + (query.size ? `?${query}` : '');
}

function redirectToLogin() {
  const { pathname, search } = window.location;
  const page = pathname.endsWith('/') ? 'index.html' : pathname.split('/').pop();
  const query = new URLSearchParams({ next: safeReturnTarget(page + search) });
  const port = apiPort(search);
  if (port) query.set('apiPort', port);
  window.location.replace(`login.html?${query}`);
}

export function logout() {
  window.localStorage.removeItem(TOKEN_KEY);
  redirectToLogin();
}

function unauthorized(token) {
  // A late response must not revoke a replacement session.
  if (getToken() === token) logout();
  throw new Error('Please sign in to continue.');
}

export async function protectedFetch(path, options = {}) {
  if (!/^\/(?!\/)/.test(path)) throw new Error('Expected an API-relative path.');
  const token = getToken();
  if (!token) unauthorized(token);
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${getApiBase()}${path}`, { ...options, headers });
  if (response.status === 401) unauthorized(token);
  return response;
}

export async function getCurrentUser(options = {}) {
  const response = await protectedFetch('/auth/me', { ...options, method: 'GET' });
  if (!response.ok) throw new Error('Unable to validate your session. Please retry or sign out.');
  return response.json();
}

export async function login(email, password, { signal } = {}) {
  signal?.throwIfAborted();
  const response = await fetch(`${getApiBase()}/auth/login`, {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password }),
  });
  if (!response.ok) throw new Error(response.status === 401
    ? 'Email or password is incorrect.' : 'Sign in failed. Please try again.');
  const data = await response.json();
  if (typeof data.access_token !== 'string' || !/^[A-Za-z0-9._~+\/-]+=*$/.test(data.access_token)
    || typeof data.token_type !== 'string' || data.token_type.toLowerCase() !== 'bearer') {
    throw new Error('The server returned an invalid session.');
  }
  signal?.throwIfAborted();
  setToken(data.access_token);
}
