import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, getAccessToken, setAccessToken } from '../../src/services/api';

describe('API Client & In-Memory Auth Token Handling', () => {
  beforeEach(() => {
    setAccessToken(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores and retrieves JWT token strictly in memory', () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken('jwt-sample-token-123');
    expect(getAccessToken()).toBe('jwt-sample-token-123');
  });

  it('clears in-memory token cleanly when passed null', () => {
    setAccessToken('temporary-jwt');
    expect(getAccessToken()).toBe('temporary-jwt');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it('does not expose tokens on global window/localStorage', () => {
    setAccessToken('secret-access-jwt');
    expect(typeof window.localStorage).toBe('object');
    expect(window.localStorage.getItem('access_token')).toBeNull();
  });

  it('attaches Bearer Authorization header and returns parsed JSON on 200', async () => {
    setAccessToken('bearer-xyz');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await apiRequest<{ status: string }>('/healthz');
    expect(res.status).toBe('ok');
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer bearer-xyz');
  });

  it('refreshes expired token on 401 and retries once with new token', async () => {
    setAccessToken('expired-jwt');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'Expired' }), { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: 'fresh-jwt',
            token_type: 'bearer',
            expires_in: 900,
            user: { id: 1, email: 'a@b.com', role: 'user', is_active: true, is_verified: true },
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const res = await apiRequest<{ ok: boolean }>('/user/household');
    expect(res.ok).toBe(true);
    expect(getAccessToken()).toBe('fresh-jwt');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('handles 204 No Content cleanly and throws ApiError on failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'Forbidden role' }), { status: 403 })
      );
    vi.stubGlobal('fetch', fetchMock);

    const empty = await apiRequest<void>('/user/routine/1', { method: 'DELETE' });
    expect(empty).toBeUndefined();

    await expect(apiRequest('/admin/users')).rejects.toEqual(new ApiError('Forbidden role', 403));
  });

  it('throws clear timeout message on AbortError', async () => {
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortErr));

    await expect(apiRequest('/air-quality/cities')).rejects.toThrow(/timed out/i);
  });

  it('clears session when 401 refresh fails and handles non-JSON errors', async () => {
    setAccessToken('old-jwt');
    window.localStorage.setItem('breatheiq_has_session', 'true');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' })
      )
      .mockResolvedValueOnce(new Response('Expired', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/user/household')).rejects.toEqual(new ApiError('Unauthorized', 401));
    expect(getAccessToken()).toBeNull();
    expect(window.localStorage.getItem('breatheiq_has_session')).toBeNull();
  });

  it('throws connection error on network rejection and preserves FormData content type', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/air-quality/cities')).rejects.toThrow(/Unable to connect/i);

    const form = new FormData();
    form.append('note', 'smoke');
    const res = await apiRequest<{ ok: boolean }>('/community/reports', {
      method: 'POST',
      body: form,
    });
    expect(res.ok).toBe(true);
    const [, init] = fetchMock.mock.calls[1];
    expect((init.headers as Headers).has('Content-Type')).toBe(false);
  });
});
