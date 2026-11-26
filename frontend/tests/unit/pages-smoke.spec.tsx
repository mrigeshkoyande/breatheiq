import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/context/AuthContext';
import { LanguageProvider } from '../../src/i18n/translations';
import { OnboardingPage } from '../../src/pages/OnboardingPage';
import { HomePage } from '../../src/pages/HomePage';
import { ExplorePage } from '../../src/pages/ExplorePage';
import { MethodologyPage } from '../../src/pages/MethodologyPage';
import { RoutinePage } from '../../src/pages/RoutinePage';
import { CommunityPage } from '../../src/pages/CommunityPage';
import { AdminPage } from '../../src/pages/AdminPage';
import { AssistantPage } from '../../src/pages/AssistantPage';
import { SettingsPage } from '../../src/pages/SettingsPage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function buildMockFetch() {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes('/air-quality/cities')) {
      return Promise.resolve(
        new Response(
          JSON.stringify([{ city: 'Mumbai', state: 'MH', latitude: 19.07, longitude: 72.87 }]),
          { status: 200 }
        )
      );
    }
    if (url.includes('/air-quality/current')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            city: 'Mumbai',
            location_name: 'Mumbai Central',
            latitude: 19.07,
            longitude: 72.87,
            timestamp_utc: '2026-11-25T10:00:00Z',
            source: 'DEMO',
            confidence_score: 0.85,
            pm25: 112,
            pm10: 180,
            no2: 42,
            so2: 14,
            co: 1.1,
            o3: 38,
            temperature_c: 28,
            relative_humidity_pct: 64,
            wind_speed_ms: 2.5,
            boundary_layer_height_m: 450,
            naqi: {
              is_valid: true,
              aqi: 215,
              category: 'Poor',
              color: '#F28C28',
              dominant_pollutant: 'PM25',
              health_advisory: 'Reduce exertion.',
              sub_indices: {},
              validity_notes: 'OK',
              provenance: 'CPCB',
            },
          }),
          { status: 200 }
        )
      );
    }
    if (url.includes('/air-quality/forecast')) {
      return Promise.resolve(
        new Response(
          JSON.stringify([
            {
              time: '2026-11-25T12:00:00Z',
              pm25: 75,
              pm10: 110,
              wind_speed_ms: 3.1,
              temperature_c: 29,
              relative_humidity_pct: 55,
              boundary_layer_height_m: 850,
              badge: 'FORECAST',
            },
          ]),
          { status: 200 }
        )
      );
    }
    if (url.includes('/engines/naqi/breakpoints')) {
      return Promise.resolve(
        new Response(JSON.stringify({ categories: [{ category: 'Good', min: 0, max: 50 }] }), {
          status: 200,
        })
      );
    }
    if (url.includes('/engines/purifier-size')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            required_cadr_m3h: 240,
            required_cadr_cfm: 141,
            time_to_50pct_min: 18,
            time_to_80pct_min: 42,
            recommended_device_class: 'Medium HEPA',
            limitations: 'Guidance only',
          }),
          { status: 200 }
        )
      );
    }
    if (url.includes('/engines/naqi/calculate')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            is_valid: true,
            aqi: 180,
            category: 'Moderate',
            color: '#F2B705',
            dominant_pollutant: 'PM25',
            health_advisory: 'Moderate caution.',
            sub_indices: {},
            validity_notes: 'OK',
            provenance: 'CPCB',
          }),
          { status: 200 }
        )
      );
    }
    if (url.includes('/user/household')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: 1,
            user_id: 1,
            name: 'Home',
            city: 'Mumbai',
            neighborhood: 'Andheri',
            latitude: 19.07,
            longitude: 72.87,
            created_at: '2026-01-01T00:00:00Z',
          }),
          { status: 200 }
        )
      );
    }
    if (url.includes('/user/rooms')) {
      return Promise.resolve(
        new Response(
          JSON.stringify([
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
          ]),
          { status: 200 }
        )
      );
    }
    if (url.includes('/user/routine')) {
      return Promise.resolve(
        new Response(
          JSON.stringify([
            {
              id: 1,
              user_id: 1,
              time_slot: 'morning',
              title: 'Close Windows',
              category: 'ventilation',
              is_completed: false,
              date_str: '2026-11-25',
              created_at: '2026-01-01T00:00:00Z',
            },
          ]),
          { status: 200 }
        )
      );
    }
    if (url.includes('/user/impact')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            total_averted_pm25_mg: 2.5,
            total_averted_co2_kg: 11.2,
            total_aqi_hours_avoided: 45,
            clean_air_streak_days: 7,
            history: [],
          }),
          { status: 200 }
        )
      );
    }
    if (url.includes('/user/alerts')) {
      return Promise.resolve(
        new Response(JSON.stringify({ rules: [], notifications: [] }), { status: 200 })
      );
    }
    if (url.includes('/community/reports')) {
      return Promise.resolve(
        new Response(
          JSON.stringify([
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
          ]),
          { status: 200 }
        )
      );
    }
    if (url.includes('/admin/')) {
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    }
    if (url.includes('/assistant/chat')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            reply: 'Keep windows closed until 12:00.',
            intent: 'ventilation',
            source_badge: 'MODELED',
            validator_flags: ['SOURCE_CITED'],
            why_this_advice: 'High PM2.5',
            suggested_prompts: [],
          }),
          { status: 200 }
        )
      );
    }
    return Promise.resolve(
      new Response(
        JSON.stringify({
          best_window_start: '12:00',
          best_window_end: '15:00',
          current_action: 'PURIFY',
          is_forecast_driven: true,
          summary_advisory: 'OK',
          best_window_score: 70,
          hourly_slots: [],
          provenance_badge: 'FORECAST',
          methodology_note: 'OK',
        }),
        { status: 200 }
      )
    );
  });
}

function mountPage(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <LanguageProvider>
        <MemoryRouter>
          <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

describe('Modular Page & Sub-Component Integration', () => {
  it('navigates 3-step OnboardingPage and submits wizard', async () => {
    vi.stubGlobal('fetch', buildMockFetch());
    mountPage(<OnboardingPage />);
    expect(screen.getByText(/Setup Step 1 of 3/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Next: Family AirTwin/i }));
    expect(screen.getByText(/Setup Step 2 of 3/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Member Name/i), { target: { value: 'Aarav' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Family Member/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next: Alert Thresholds/i }));
    expect(screen.getByText(/Setup Step 3 of 3/i)).toBeTruthy();
  });

  it('renders ExplorePage, HomePage CADR, MethodologyPage NAQI, and RoutinePage', async () => {
    vi.stubGlobal('fetch', buildMockFetch());
    mountPage(<ExplorePage />);
    await waitFor(() => expect(screen.getByText('Mumbai Central')).toBeTruthy());

    cleanup();
    mountPage(<HomePage />);
    await waitFor(() => expect(screen.getByText('Living Room')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Calculate Required CADR/i }));
    await waitFor(() => expect(screen.getByText(/240 m³\/h/)).toBeTruthy());

    cleanup();
    mountPage(<MethodologyPage />);
    fireEvent.click(screen.getByRole('button', { name: /Calculate CPCB NAQI/i }));
    await waitFor(() => expect(screen.getByText(/Composite Score: 180/)).toBeTruthy());

    cleanup();
    mountPage(<RoutinePage />);
    await waitFor(() => expect(screen.getByText('Close Windows')).toBeTruthy());
  });

  it('renders CommunityPage, AdminPage tabs, AssistantPage, and SettingsPage', async () => {
    vi.stubGlobal('fetch', buildMockFetch());
    mountPage(<CommunityPage />);
    await waitFor(() => expect(screen.getByText('Link Road')).toBeTruthy());

    cleanup();
    mountPage(<AdminPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Users' }));
    await waitFor(() => expect(screen.getByText('Registered Accounts')).toBeTruthy());
    fireEvent.click(screen.getByRole('tab', { name: 'Integrations' }));
    await waitFor(() => expect(screen.getByText(/Integration Health/i)).toBeTruthy());

    cleanup();
    Element.prototype.scrollIntoView = vi.fn();
    mountPage(<AssistantPage />);
    fireEvent.click(screen.getByText(/When is the safest window to ventilate today\?/i));
    await waitFor(() => expect(screen.getByText(/Keep windows closed/i)).toBeTruthy());

    cleanup();
    mountPage(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
    expect(screen.getByText(/Permanently Delete Account\?/i)).toBeTruthy();
  });
});
