export const TOKEN_KEY: string;
export function getToken(): string | null;
export function setToken(token: string): void;
export function getApiBase(): string;
export function safeReturnTarget(next: string): string;
export function logout(): void;
export function protectedFetch(path: string, options?: RequestInit, apiBase?: string): Promise<Response>;
export function getCurrentUser(options?: RequestInit): Promise<unknown>;
export function login(email: string, password: string, options?: { signal?: AbortSignal }): Promise<void>;
