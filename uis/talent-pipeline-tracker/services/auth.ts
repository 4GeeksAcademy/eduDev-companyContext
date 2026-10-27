// Identity requests only. Never use this client for the external candidate API.
const AUTH_API_URL = (process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const TOKEN_KEY = 'trackflow.auth.token';

export type ProfileUpdate = { name?: string | null; phone?: string | null; address?: string | null };
export type Profile = Required<ProfileUpdate> & { id: string; user_id: string };
export type User = {
  id: string;
  email: string;
  is_active: boolean;
  role: 'admin' | 'manager' | 'user';
  created_at: string;
};
export type CurrentUser = User & { profile: Profile };
export type Credentials = { email: string; password: string };
export type Registration = Credentials & ProfileUpdate;
export type Token = { access_token: string; token_type: 'bearer' };
export type ValidationDetail = { loc: (string | number)[]; msg: string; type?: string };

export class AuthApiError extends Error {
  status: number;
  fieldErrors: Record<string, string[]>;
  details: ValidationDetail[];
  accountCreated = false;

  constructor(message: string, status: number, details: ValidationDetail[] = [],
    fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.details = details;
    this.fieldErrors = fieldErrors;
  }
}

export function readToken(): string | null {
  return typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY);
}
export function saveToken(token: string): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
}
export function logout(): void {
  clearToken();
  // Framework-independent client: also usable outside React and during guard failures.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (typeof window !== 'undefined') window.location.assign('/login');
}

async function request<T>(path: string, options: RequestInit, protectedRequest = false): Promise<T> {
  const token = protectedRequest ? readToken() : null;
  if (protectedRequest && !token) {
    logout();
    throw new AuthApiError('Inicia sesión para continuar.', 401);
  }
  const headers = { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const response = await fetch(`${AUTH_API_URL}${path}`, { ...options, headers });
  if (protectedRequest && response.status === 401 && readToken() === token) logout();
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const details: ValidationDetail[] = Array.isArray(body?.detail) ? body.detail : [];
    const fieldErrors: Record<string, string[]> = {};
    for (const detail of details) {
      const field = String(detail.loc.at(-1) ?? 'form');
      (fieldErrors[field] ??= []).push(detail.msg);
    }
    if (response.status === 409) fieldErrors.email = ['Email already registered'];
    // Do not surface arbitrary response strings which might contain sensitive data.
    throw new AuthApiError(response.status === 401 ? 'Email o contraseña incorrectos.' :
      'No se pudo completar la solicitud.', response.status, details, fieldErrors);
  }
  return body as T;
}

export async function login(credentials: Credentials, signal?: AbortSignal): Promise<Token> {
  const result = await request<Token>('/auth/login', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(credentials).toString(),
  });
  if (!result || typeof result.access_token !== 'string' || !result.access_token.trim() ||
    result.token_type !== 'bearer') {
    throw new AuthApiError('Respuesta de acceso inválida.', 502);
  }
  saveToken(result.access_token);
  return result;
}

export async function register(input: Registration, signal?: AbortSignal): Promise<Token> {
  await request<User>('/users', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  try {
    return await login({ email: input.email, password: input.password }, signal);
  } catch (cause) {
    const error = new AuthApiError('Cuenta creada. Inicia sesión manualmente.',
      cause instanceof AuthApiError ? cause.status : 0);
    error.accountCreated = true;
    throw error;
  }
}

export function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  return request<CurrentUser>('/auth/me', { method: 'GET', signal }, true);
}
export function updateProfile(input: ProfileUpdate, signal?: AbortSignal): Promise<Profile> {
  return request<Profile>('/profiles/me', {
    method: 'PUT', signal,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  }, true);
}
