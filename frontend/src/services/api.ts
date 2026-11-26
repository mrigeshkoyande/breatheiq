import { AuthResponse } from '../types/auth';
import { removeStorage, writeStorage } from '../utils/storage';

let inMemoryToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const SESSION_HINT_KEY = 'breatheiq_has_session';
const REQUEST_TIMEOUT_MS = 15_000;
const NO_RETRY_ENDPOINTS = new Set(['/auth/login', '/auth/refresh', '/auth/signup']);

/** Typed HTTP error preserving backend status codes for UI error handling. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Store short-lived access JWT strictly in memory. */
export const setAccessToken = (token: string | null): void => {
  inMemoryToken = token;
};

/** Read current in-memory access JWT. */
export const getAccessToken = (): string | null => inMemoryToken;

function resolveApiBaseUrl(): string {
  const rawBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').trim().replace(/\/+$/, '');
  if (rawBase === '' || rawBase === '/api/v1') return '/api/v1';
  if (rawBase.endsWith('/api/v1')) return rawBase;
  return rawBase.endsWith('/api') ? `${rawBase}/v1` : `${rawBase}/api/v1`;
}

const BASE_URL = resolveApiBaseUrl();

function clearSessionState(): null {
  setAccessToken(null);
  removeStorage(SESSION_HINT_KEY);
  return null;
}

async function executeTokenRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!refreshRes.ok) return clearSessionState();
      const refreshData: AuthResponse = await refreshRes.json();
      setAccessToken(refreshData.access_token);
      writeStorage(SESSION_HINT_KEY, 'true');
      return refreshData.access_token;
    } catch {
      return clearSessionState();
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: options.signal ?? controller.signal });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your network connection.');
    }
    throw new Error(
      'Unable to connect to air quality server. Please verify your internet connection.'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  const fallback = `HTTP error! status: ${res.status}`;
  try {
    const errData: { detail?: string; message?: string } = await res.json();
    if (typeof errData.detail === 'string') return errData.detail;
    if (typeof errData.message === 'string') return errData.message;
  } catch {
    return res.statusText || fallback;
  }
  return fallback;
}

function buildRequestHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (inMemoryToken) {
    headers.set('Authorization', `Bearer ${inMemoryToken}`);
  }
  return headers;
}

/** Execute typed API request with single-flight token refresh and standardized error mapping. */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;
  const headers = buildRequestHeaders(options);
  const requestOpts: RequestInit = { ...options, credentials: 'include', headers };

  let res = await fetchWithTimeout(url, requestOpts);
  if (res.status === 401 && !NO_RETRY_ENDPOINTS.has(cleanEndpoint)) {
    const newToken = await executeTokenRefresh();
    if (newToken) {
      const retryHeaders = new Headers(headers);
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      res = await fetchWithTimeout(url, { ...requestOpts, headers: retryHeaders });
    }
  }

  if (!res.ok) {
    throw new ApiError(await parseErrorMessage(res), res.status);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
