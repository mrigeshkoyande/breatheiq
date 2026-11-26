import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { LanguageProvider, useLanguage } from '../../src/i18n/translations';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { getAccessToken, SESSION_HINT_KEY, setAccessToken } from '../../src/services/api';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  setAccessToken(null);
});

const AuthProbe: React.FC = () => {
  const { user, loading, login, signup, logout, refreshAuth, setUserProfile } = useAuth();
  return (
    <div>
      <span data-testid="auth-state">{loading ? 'loading' : user?.email || 'anon'}</span>
      <span data-testid="auth-name">{user?.full_name || 'none'}</span>
      <button type="button" onClick={() => void login('a@b.com', 'Password123!')}>
        DoLogin
      </button>
      <button type="button" onClick={() => void signup('c@d.com', 'Password123!', 'New User')}>
        DoSignup
      </button>
      <button type="button" onClick={() => void refreshAuth()}>
        DoRefresh
      </button>
      <button type="button" onClick={() => void logout()}>
        DoLogout
      </button>
      <button
        type="button"
        onClick={() => {
          if (user) setUserProfile({ ...user, full_name: 'Updated Name' });
        }}
      >
        Rename
      </button>
    </div>
  );
};

const ThrowingChild: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) throw new Error('Simulated UI Crash');
  return <div>Safe Child</div>;
};

const LangProbe: React.FC = () => {
  const { lang, setLang } = useLanguage();
  return (
    <div>
      <span data-testid="lang-val">{lang}</span>
      <button type="button" onClick={() => setLang('mr')}>
        SetMR
      </button>
    </div>
  );
};

describe('AuthProvider, LanguageProvider, and ErrorBoundary', () => {
  it('throws when useAuth is invoked outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthProbe />)).toThrow(/must be used within an AuthProvider/i);
    spy.mockRestore();
  });

  it('handles session hint boot refresh, login, profile update, signup, and logout', async () => {
    localStorage.setItem(SESSION_HINT_KEY, 'true');
    const authPayload = (email: string, name: string) =>
      new Response(
        JSON.stringify({
          access_token: `tok-${email}`,
          token_type: 'bearer',
          expires_in: 900,
          user: { id: 1, email, full_name: name, role: 'user', is_active: true, is_verified: true },
        }),
        { status: 200 }
      );

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(authPayload('boot@b.com', 'Boot User'))
        .mockResolvedValueOnce(authPayload('a@b.com', 'Logged User'))
        .mockResolvedValueOnce(authPayload('c@d.com', 'New User'))
        .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'ok' }), { status: 200 }))
    );

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByTestId('auth-state').textContent).toBe('boot@b.com'));

    fireEvent.click(screen.getByText('DoLogin'));
    await waitFor(() => expect(screen.getByTestId('auth-state').textContent).toBe('a@b.com'));
    fireEvent.click(screen.getByText('Rename'));
    expect(screen.getByTestId('auth-name').textContent).toBe('Updated Name');

    fireEvent.click(screen.getByText('DoSignup'));
    await waitFor(() => expect(screen.getByTestId('auth-state').textContent).toBe('c@d.com'));
    expect(getAccessToken()).toBe('tok-c@d.com');

    fireEvent.click(screen.getByText('DoLogout'));
    await waitFor(() => expect(screen.getByTestId('auth-state').textContent).toBe('anon'));
    expect(getAccessToken()).toBeNull();
  });

  it('restores persisted language and handles ErrorBoundary exceptions gracefully', () => {
    localStorage.setItem('breatheiq_lang', 'hi');
    render(
      <LanguageProvider>
        <LangProbe />
      </LanguageProvider>
    );
    expect(screen.getByTestId('lang-val').textContent).toBe('hi');
    fireEvent.click(screen.getByText('SetMR'));
    expect(screen.getByTestId('lang-val').textContent).toBe('mr');

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Something went wrong/i)).toBeTruthy();
    spy.mockRestore();
  });
});
