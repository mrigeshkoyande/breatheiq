import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../src/App';
import { AuthProvider } from '../../src/context/AuthContext';
import { LanguageProvider, useLanguage } from '../../src/i18n/translations';
import { AdminPage } from '../../src/pages/AdminPage';
import { CommunityPage } from '../../src/pages/CommunityPage';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { HomePage } from '../../src/pages/HomePage';
import { OnboardingPage } from '../../src/pages/OnboardingPage';
import { RoutinePage } from '../../src/pages/RoutinePage';
import { SettingsPage } from '../../src/pages/SettingsPage';
import { SESSION_HINT_KEY } from '../../src/services/api';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function jsonResp(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function buildFullWorkspaceFetch() {
  return vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (url.includes('/auth/refresh') || url.includes('/auth/me')) {
      if (init?.method === 'DELETE') return Promise.resolve(new Response(null, { status: 204 }));
      if (init?.method === 'PATCH') {
        return Promise.resolve(
          jsonResp({
            id: 1,
            email: 'user@breatheiq.org',
            full_name: 'Priya Updated',
            role: 'user',
            is_active: true,
            is_verified: true,
          })
        );
      }
      return Promise.resolve(
        jsonResp({
          access_token: 'tok-abc',
          user: {
            id: 1,
            email: 'user@breatheiq.org',
            full_name: 'Priya',
            role: 'user',
            is_active: true,
            is_verified: true,
          },
        })
      );
    }
    if (url.includes('/auth/change-password') || url.includes('/auth/logout')) {
      return Promise.resolve(jsonResp({ message: 'ok' }));
    }
    if (url.includes('/air-quality/cities')) {
      return Promise.resolve(
        jsonResp([
          { city: 'Mumbai', state: 'MH', latitude: 19.07, longitude: 72.87 },
          { city: 'Delhi', state: 'DL', latitude: 28.61, longitude: 77.2 },
        ])
      );
    }
    if (url.includes('/air-quality/current')) {
      return Promise.resolve(
        jsonResp({
          city: 'Mumbai',
          location_name: 'Mumbai Central',
          latitude: 19.07,
          longitude: 72.87,
          timestamp_utc: '2026-11-26T10:00:00Z',
          source: 'MODELED',
          confidence_score: 0.9,
          pm25: 112,
          pm10: 170,
          no2: 40,
          so2: 14,
          co: 1.0,
          o3: 35,
          temperature_c: 27,
          relative_humidity_pct: 60,
          wind_speed_ms: 2.5,
          boundary_layer_height_m: 450,
          naqi: {
            is_valid: true,
            aqi: 215,
            category: 'Poor',
            color: '#F28C28',
            dominant_pollutant: 'PM25',
            health_advisory: 'Caution',
            sub_indices: {},
            validity_notes: 'OK',
            provenance: 'CPCB',
          },
        })
      );
    }
    if (url.includes('/user/household')) {
      return Promise.resolve(
        jsonResp({
          id: 1,
          user_id: 1,
          name: 'Home',
          city: 'Mumbai',
          neighborhood: 'Andheri West',
          latitude: 19.07,
          longitude: 72.87,
          created_at: '2026-01-01T00:00:00Z',
        })
      );
    }
    if (url.includes('/user/members')) {
      return Promise.resolve(
        jsonResp(
          init?.method === 'POST'
            ? { id: 2 }
            : [
                {
                  id: 1,
                  user_id: 1,
                  name: 'Aarav',
                  age_category: 'child',
                  sensitivity: 'asthma',
                  vulnerability_score: 78,
                  created_at: '2026-01-01T00:00:00Z',
                },
              ]
        )
      );
    }
    if (url.includes('/user/rooms')) {
      if (init?.method === 'POST')
        return Promise.resolve(jsonResp({ id: 2, name: 'Kids Study' }, 201));
      return Promise.resolve(
        jsonResp([
          {
            id: 1,
            user_id: 1,
            name: 'Living Room',
            length_m: 5,
            width_m: 4,
            height_m: 2.7,
            has_purifier: true,
            purifier_cadr: 350,
            created_at: '2026-01-01T00:00:00Z',
          },
        ])
      );
    }
    if (url.includes('/user/routine')) {
      if (init?.method) return Promise.resolve(jsonResp({ id: 1, is_completed: true }));
      return Promise.resolve(
        jsonResp([
          {
            id: 1,
            user_id: 1,
            time_slot: 'morning',
            title: 'Close Windows',
            category: 'ventilation',
            is_completed: false,
            date_str: '2026-11-26',
            created_at: '2026-01-01T00:00:00Z',
          },
        ])
      );
    }
    if (url.includes('/user/alerts')) {
      return Promise.resolve(jsonResp({ rules: [], notifications: [] }));
    }
    if (url.includes('/user/impact')) {
      return Promise.resolve(
        jsonResp({
          total_averted_pm25_mg: 4.2,
          total_averted_co2_kg: 12.1,
          total_aqi_hours_avoided: 44,
          clean_air_streak_days: 6,
          history: [],
        })
      );
    }
    if (url.includes('/user/routes/navigate')) {
      return Promise.resolve(
        jsonResp({
          routes: [
            {
              id: 'm',
              name: 'Metro',
              recommended: true,
              inhaled_dose_ug: 18,
              travel_time_min: 28,
              co2_emissions_kg: 0.25,
            },
          ],
        })
      );
    }
    if (url.includes('/community/reports')) {
      if (init?.method === 'POST')
        return Promise.resolve(jsonResp({ id: 9, upvote_count: 1 }, 201));
      return Promise.resolve(
        jsonResp([
          {
            id: 1,
            user_id: 1,
            report_type: 'construction_dust',
            severity: 'severe',
            location_name: 'Link Road',
            latitude: 19.1,
            longitude: 72.8,
            description: 'Heavy dust',
            upvote_count: 3,
            status: 'UNVERIFIED',
            created_at: '2026-01-01T00:00:00Z',
          },
        ])
      );
    }
    if (url.includes('/admin/moderation/queue')) {
      return Promise.resolve(
        jsonResp([
          {
            id: 5,
            user_id: 2,
            report_type: 'waste_burning',
            severity: 'severe',
            location_name: 'Saki Naka',
            latitude: 19.1,
            longitude: 72.8,
            description: 'Smoke plume',
            upvote_count: 4,
            status: 'UNVERIFIED',
            created_at: '2026-01-01T00:00:00Z',
          },
        ])
      );
    }
    if (url.includes('/admin/users')) {
      return Promise.resolve(
        jsonResp([
          {
            id: 2,
            email: 'user@breatheiq.org',
            full_name: 'Priya',
            role: 'user',
            is_active: true,
            is_verified: true,
          },
        ])
      );
    }
    if (url.includes('/admin/ai-traces')) {
      return Promise.resolve(
        jsonResp([{ id: 1, intent: 'ventilation', model: 'gemini', status: 'OK', latency_ms: 140 }])
      );
    }
    if (url.includes('/admin/audit-logs')) {
      return Promise.resolve(jsonResp([{ id: 1, action: 'LOGIN_OK', details: 'ip=127.0.0.1' }]));
    }
    if (url.includes('/admin/integrations/health')) {
      return Promise.resolve(
        jsonResp([{ service: 'Open-Meteo', status: 'HEALTHY', mode: 'Grid', latency_ms: 15 }])
      );
    }
    if (url.includes('/engines/purifier-size')) {
      return Promise.resolve(
        jsonResp({
          required_cadr_m3h: 240,
          required_cadr_cfm: 141,
          time_to_50pct_min: 18,
          time_to_80pct_min: 42,
          recommended_device_class: 'Medium HEPA',
          limitations: 'Guidance only',
        })
      );
    }
    return Promise.resolve(
      jsonResp({
        best_window_start: '12:00',
        best_window_end: '15:00',
        current_action: 'PURIFY',
        is_forecast_driven: true,
        summary_advisory: 'OK',
        best_window_score: 70,
        hourly_slots: [],
        provenance_badge: 'FORECAST',
        methodology_note: 'OK',
      })
    );
  });
}

function mountWithProviders(ui: React.ReactElement, initialEntries: string[] = ['/']) {
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

describe('Deep Interactive Flows Across Settings, Routine, Community, Dashboard, Admin, Home & Onboarding', () => {
  it('handles SettingsPage profile update, password validation/change, language switch, and account deletion', async () => {
    localStorage.setItem(SESSION_HINT_KEY, 'true');
    vi.stubGlobal('fetch', buildFullWorkspaceFetch());

    mountWithProviders(<SettingsPage />);
    await waitFor(() => expect(screen.getByDisplayValue('user@breatheiq.org')).toBeTruthy());

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Priya Updated' } });
    fireEvent.submit(
      screen.getByRole('button', { name: /Save Profile Changes/i }).closest('form')!
    );
    await waitFor(() => expect(screen.getByText(/Profile saved to database/i)).toBeTruthy());

    fireEvent.change(screen.getByLabelText(/Current Password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: 'short' } });
    fireEvent.submit(screen.getByRole('button', { name: /Update Password/i }).closest('form')!);
    expect(screen.getByText(/New password must be at least 8 characters/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/New Password/i), {
      target: { value: 'NewStrongPass99!' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /Update Password/i }).closest('form')!);
    await waitFor(() =>
      expect(screen.getByText(/Password updated and active sessions rotated/i)).toBeTruthy()
    );

    fireEvent.click(screen.getByRole('button', { name: 'हिन्दी' }));
    expect(document.documentElement.lang).toBe('hi');

    fireEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Permanent Deletion/i }));
  });

  it('exercises RoutinePage add/toggle/delete, CommunityPage report & upvote, and HomePage room creation', async () => {
    vi.stubGlobal('fetch', buildFullWorkspaceFetch());
    mountWithProviders(<RoutinePage />);
    await waitFor(() => expect(screen.getByText('Close Windows')).toBeTruthy());

    fireEvent.change(screen.getByLabelText(/New Routine Action/i), {
      target: { value: 'Run Bedroom HEPA' },
    });
    fireEvent.change(screen.getByLabelText(/Time Slot/i), { target: { value: 'evening' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'purifier' } });
    fireEvent.submit(screen.getByRole('button', { name: /^Add$/i }).closest('form')!);
    fireEvent.click(screen.getByRole('button', { name: /Mark "Close Windows" complete/i }));
    fireEvent.click(screen.getByRole('button', { name: /Delete task "Close Windows"/i }));

    cleanup();
    mountWithProviders(<CommunityPage />);
    await waitFor(() => expect(screen.getByText('Link Road')).toBeTruthy());
    fireEvent.change(screen.getByLabelText(/Filter reports by severity/i), {
      target: { value: 'severe' },
    });
    fireEvent.change(screen.getByLabelText(/Corridor \/ Junction/i), {
      target: { value: 'Bandra Kurla' },
    });
    fireEvent.change(screen.getByLabelText(/Observation Note/i), {
      target: { value: 'Heavy diesel smoke' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: /Submit Citizen Report/i }).closest('form')!
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Confirm \(3\)/i })).toBeTruthy()
    );
    fireEvent.click(screen.getByRole('button', { name: /Confirm \(3\)/i }));

    cleanup();
    mountWithProviders(<HomePage />);
    await waitFor(() => expect(screen.getByText('Living Room')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Size CADR/i }));
    fireEvent.change(screen.getByLabelText(/New room name/i), { target: { value: 'Kids Study' } });
    fireEvent.submit(screen.getByRole('button', { name: /Save/i }).closest('form')!);
  });

  it('exercises DashboardPage corridor switch & routine toggle, AdminPage all tabs, and full OnboardingPage completion', async () => {
    vi.stubGlobal('fetch', buildFullWorkspaceFetch());
    mountWithProviders(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Close Windows')).toBeTruthy());
    fireEvent.click(screen.getByTestId('routine-task-toggle'));
    fireEvent.click(screen.getByRole('button', { name: 'Delhi' }));

    cleanup();
    mountWithProviders(<AdminPage />);
    await waitFor(() => expect(screen.getByText('Saki Naka')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

    fireEvent.click(screen.getByRole('tab', { name: 'Users' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Suspend' })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));
    fireEvent.change(screen.getByLabelText(/Filter accounts/i), { target: { value: 'priya' } });

    fireEvent.click(screen.getByRole('tab', { name: /AI Traces/i }));
    await waitFor(() => expect(screen.getByText(/ventilation/)).toBeTruthy());
    fireEvent.click(screen.getByRole('tab', { name: /Audit Logs/i }));
    await waitFor(() => expect(screen.getByText('LOGIN_OK')).toBeTruthy());
    fireEvent.click(screen.getByRole('tab', { name: 'Integrations' }));
    await waitFor(() => expect(screen.getByText('Open-Meteo')).toBeTruthy());

    cleanup();
    mountWithProviders(<OnboardingPage />);
    fireEvent.click(screen.getByRole('button', { name: /Next: Family AirTwin/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next: Alert Thresholds/i }));
    fireEvent.change(screen.getByLabelText(/Trigger High-Priority Smog Alert At/i), {
      target: { value: '250' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Finish & Open Dashboard/i }));
  });

  it('resolves App lazy routes cleanly across public and auth paths plus fallback language hook', async () => {
    function LangOutside() {
      const { t, lang, setLang } = useLanguage();
      setLang('en');
      return <span>{`${lang}:${t('nav.dashboard')}`}</span>;
    }
    render(<LangOutside />);
    expect(screen.getByText('en:Dashboard')).toBeTruthy();
    cleanup();

    vi.stubGlobal('fetch', buildFullWorkspaceFetch());
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    for (const p of [
      '/privacy',
      '/explore',
      '/methodology',
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
      '/404',
    ]) {
      window.history.pushState({}, '', p);
      render(
        <QueryClientProvider client={qc}>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </QueryClientProvider>
      );
      await waitFor(() => expect(document.querySelector('h1')).toBeTruthy());
      cleanup();
    }
  });
});
