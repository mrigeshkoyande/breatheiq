import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { App } from '../../src/App';
import { ConfirmModal } from '../../src/components/ui/ConfirmModal';
import { AuthProvider } from '../../src/context/AuthContext';
import { LanguageProvider } from '../../src/i18n/translations';
import { ForgotPasswordPage } from '../../src/pages/ForgotPasswordPage';
import { LoginPage } from '../../src/pages/LoginPage';
import { ResetPasswordPage } from '../../src/pages/ResetPasswordPage';
import { SignupPage } from '../../src/pages/SignupPage';
import { VerifyEmailPage } from '../../src/pages/VerifyEmailPage';
import { ProtectedRoute } from '../../src/routes/ProtectedRoute';
import { SESSION_HINT_KEY, setAccessToken } from '../../src/services/api';
import { isCpcbCategory, toCpcbCategory, toProvenanceSource } from '../../src/utils/calculations';
import { readStorage, removeStorage, writeStorage } from '../../src/utils/storage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  setAccessToken(null);
});

function jsonResp(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function mountMemory(ui: React.ReactElement, initialEntries: string[] = ['/']) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <LanguageProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

describe('Auth Pages, Routing Guards, Modal A11y, and Storage Utilities', () => {
  it('handles storage read/write/remove normally and under Storage exceptions', () => {
    expect(writeStorage('k1', 'v1')).toBe(true);
    expect(readStorage('k1')).toBe('v1');
    removeStorage('k1');
    expect(readStorage('k1')).toBeNull();

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readStorage('k1')).toBeNull();
    expect(writeStorage('k1', 'v1')).toBe(false);
    expect(() => removeStorage('k1')).not.toThrow();
  });

  it('narrows CpcbCategory and ProvenanceSource safely without unsafe assertions', () => {
    expect(isCpcbCategory('Good')).toBe(true);
    expect(isCpcbCategory('Unknown')).toBe(false);
    expect(toCpcbCategory('Severe')).toBe('Severe');
    expect(toCpcbCategory('Incomplete Data')).toBe('Moderate');
    expect(toProvenanceSource('LIVE')).toBe('LIVE');
    expect(toProvenanceSource('INVALID')).toBe('MODELED');
  });

  it('exercises ConfirmModal Escape, Tab focus wrapping, and backdrop click', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        isOpen
        title="Delete Item"
        description="Confirm action?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    const closeBtn = screen.getByRole('button', { name: 'Close dialog' });
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    confirmBtn.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);
    closeBtn.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirmBtn);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    const backdrop = screen.getByRole('presentation');
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(2);
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('enforces ProtectedRoute states for loading, unauthenticated, standard user, and admin', async () => {
    localStorage.setItem(SESSION_HINT_KEY, 'true');
    let resolveRefresh: (r: Response) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolveRefresh = resolve;
          })
      )
    );

    mountMemory(
      <Routes>
        <Route path="/login" element={<div>LOGIN_VIEW</div>} />
        <Route path="/app/dashboard" element={<div>DASH_VIEW</div>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <div>ADMIN_SECRET</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      ['/admin']
    );

    expect(screen.getByText(/Synchronizing Air Telemetry/i)).toBeTruthy();
    resolveRefresh(
      jsonResp({
        access_token: 'tok',
        user: { id: 1, email: 'u@b.org', role: 'user', is_active: true, is_verified: true },
      })
    );
    await waitFor(() => expect(screen.getByText('DASH_VIEW')).toBeTruthy());

    cleanup();
    localStorage.clear();
    mountMemory(
      <Routes>
        <Route path="/login" element={<div>LOGIN_VIEW</div>} />
        <Route
          path="/app/private"
          element={
            <ProtectedRoute>
              <div>PRIVATE_DATA</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      ['/app/private']
    );
    await waitFor(() => expect(screen.getByText('LOGIN_VIEW')).toBeTruthy());
  });

  it('exercises LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage, and VerifyEmailPage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/auth/config')) {
          return Promise.resolve(jsonResp({ demo_mode: true, environment: 'demo' }));
        }
        if (url.includes('/auth/login') || url.includes('/auth/signup')) {
          return Promise.resolve(
            jsonResp({
              access_token: 'jwt-123',
              user: {
                id: 1,
                email: 'user@breatheiq.org',
                role: 'user',
                is_active: true,
                is_verified: true,
              },
            })
          );
        }
        return Promise.resolve(jsonResp({ message: 'ok' }));
      })
    );

    mountMemory(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app/dashboard" element={<div>LOGGED_IN_DASH</div>} />
      </Routes>,
      ['/login']
    );
    fireEvent.submit(screen.getByRole('button', { name: /^Sign In$/i }).closest('form')!);
    expect(screen.getByRole('alert')).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Demo User' })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Demo User' }));
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));
    await waitFor(() => expect(screen.getByText('LOGGED_IN_DASH')).toBeTruthy());

    cleanup();
    mountMemory(
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/onboarding" element={<div>ONBOARDING_VIEW</div>} />
      </Routes>,
      ['/signup']
    );
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Priya' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'p@b.org' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'short' } });
    fireEvent.submit(screen.getByRole('button', { name: /Create Account/i }).closest('form')!);
    expect(screen.getByText(/at least 8 characters/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'StrongPass123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Other' } });
    fireEvent.submit(screen.getByRole('button', { name: /Create Account/i }).closest('form')!);
    expect(screen.getByText(/do not match/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'StrongPass123' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /Create Account/i }).closest('form')!);
    await waitFor(() => expect(screen.getByText('ONBOARDING_VIEW')).toBeTruthy());

    cleanup();
    mountMemory(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText(/Registered Email/i), { target: { value: 'a@b.org' } });
    fireEvent.submit(screen.getByRole('button', { name: /Request Reset/i }).closest('form')!);
    await waitFor(() => expect(screen.getByText('Check Recovery Status')).toBeTruthy());

    cleanup();
    mountMemory(<ResetPasswordPage />, ['/reset-password?token=reset-jwt']);
    fireEvent.change(screen.getByLabelText(/^New Password$/i), {
      target: { value: 'NewStrong123!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'NewStrong123!' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /Reset Password/i }).closest('form')!);
    await waitFor(() => expect(screen.getByText('Password Updated')).toBeTruthy());

    cleanup();
    mountMemory(<VerifyEmailPage />, ['/verify-email']);
    expect(screen.getByText('Verification Failed')).toBeTruthy();
    cleanup();
    mountMemory(<VerifyEmailPage />, ['/verify-email?token=ok-tok']);
    await waitFor(() => expect(screen.getByText('Email Verified')).toBeTruthy());
  });

  it('mounts App root with lazy route suspense for /404 and /dev/ui', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResp({ ok: true })));
    window.history.pushState({}, '', '/dev/ui');
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </QueryClientProvider>
    );
    await waitFor(() =>
      expect(screen.getByText('BreatheIQ Design System Primitives')).toBeTruthy()
    );
  });
});
