import { AuthResponse } from '../types/auth';

let inMemoryToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const SESSION_HINT_KEY = 'breatheiq_has_session';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const setAccessToken = (token: string | null) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

const rawBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').trim().replace(/\/+$/, '');
const BASE_URL =
  rawBase === '' || rawBase === '/api/v1'
    ? '/api/v1'
    : rawBase.endsWith('/api/v1')
    ? rawBase
    : rawBase.endsWith('/api')
    ? `${rawBase}/v1`
    : `${rawBase}/api/v1`;

async function executeTokenRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData: AuthResponse = await refreshRes.json();
        setAccessToken(refreshData.access_token);
        localStorage.setItem(SESSION_HINT_KEY, 'true');
        return refreshData.access_token;
      }
      setAccessToken(null);
      localStorage.removeItem(SESSION_HINT_KEY);
      return null;
    } catch {
      setAccessToken(null);
      localStorage.removeItem(SESSION_HINT_KEY);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(url, {
      ...options,
      signal: options.signal ?? controller.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your network connection.');
    }
    throw new Error('Unable to connect to air quality server. Please verify your internet connection.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (inMemoryToken) {
    headers.set('Authorization', `Bearer ${inMemoryToken}`);
  }

  const requestOpts: RequestInit = {
    ...options,
    credentials: 'include',
    headers,
  };

  let res = await fetchWithTimeout(url, requestOpts);

  if (
    res.status === 401 &&
    cleanEndpoint !== '/auth/login' &&
    cleanEndpoint !== '/auth/refresh' &&
    cleanEndpoint !== '/auth/signup'
  ) {
    const newToken = await executeTokenRefresh();
    if (newToken) {
      const retryHeaders = new Headers(headers);
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      res = await fetchWithTimeout(url, { ...requestOpts, headers: retryHeaders });
    }
  }

  if (!res.ok) {
    let errorMessage = `HTTP error! status: ${res.status}`;
    try {
      const errData: { detail?: string; message?: string } = await res.json();
      if (typeof errData.detail === 'string') {
        errorMessage = errData.detail;
      } else if (typeof errData.message === 'string') {
        errorMessage = errData.message;
      }
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new ApiError(errorMessage, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}
