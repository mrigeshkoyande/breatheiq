import { describe, it, expect, beforeEach } from 'vitest';
import { setAccessToken, getAccessToken } from '../../src/services/api';

describe('BreatheIQ Auth Service Storage', () => {
  beforeEach(() => {
    setAccessToken(null);
  });

  it('initializes with null in-memory token', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('stores token in memory correctly', () => {
    setAccessToken('jwt.mock.access_token');
    expect(getAccessToken()).toBe('jwt.mock.access_token');
  });

  it('clears token on logout/expiration', () => {
    setAccessToken('jwt.mock.token');
    expect(getAccessToken()).toBe('jwt.mock.token');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it('does not leak token to localStorage or sessionStorage', () => {
    setAccessToken('secret.jwt.token');
    // Ensure tokens are NEVER stored in persistent browser storage per AGENTS.md constraint
    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    }
    if (typeof sessionStorage !== 'undefined') {
      expect(sessionStorage.getItem('access_token')).toBeNull();
      expect(sessionStorage.getItem('token')).toBeNull();
    }
  });
});
