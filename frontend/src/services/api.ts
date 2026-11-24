import { AuthResponse } from '../types/auth';

let inMemoryToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

// Compute canonical API base URL
const rawBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').trim().replace(/\/+$/, '');
const BASE_URL = rawBase === '' || rawBase === '/api/v1'
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
        localStorage.setItem('breatheiq_has_session', 'true');
        return refreshData.access_token;
      } else {
        setAccessToken(null);
        localStorage.removeItem('breatheiq_has_session');
        return null;
      }
    } catch {
      setAccessToken(null);
      localStorage.removeItem('breatheiq_has_session');
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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

  options.credentials = 'include'; // Required to transmit HttpOnly session cookies
  options.headers = headers;

  // Add 15-second request timeout controller if none provided
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  if (!options.signal) {
    options.signal = controller.signal;
  }

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your network connection.');
    }
    throw new Error('Unable to connect to air quality server. Please verify your internet connection.');
  } finally {
    clearTimeout(timeoutId);
  }

  // Graceful silent refresh on 401 Unauthorized for protected endpoints
  if (
    res.status === 401 &&
    cleanEndpoint !== '/auth/login' &&
    cleanEndpoint !== '/auth/refresh' &&
    cleanEndpoint !== '/auth/signup'
  ) {
    const newToken = await executeTokenRefresh();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      options.headers = headers;
      try {
        res = await fetch(url, options);
      } catch {
        throw new Error('Session renewal failed during request retry.');
      }
    }
  }

  if (!res.ok) {
    let errorDetail = 'Request failed';
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch {
      // fallback to status text
      errorDetail = res.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}
