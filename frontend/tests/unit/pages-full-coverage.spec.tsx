import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/context/AuthContext';
import { LanguageProvider } from '../../src/i18n/translations';
import { AirQualityPage } from '../../src/pages/AirQualityPage';
import { AnalyticsPage } from '../../src/pages/AnalyticsPage';
import { DevUiPage } from '../../src/pages/DevUiPage';
import { FamilyPage } from '../../src/pages/FamilyPage';
import { ImpactPage } from '../../src/pages/ImpactPage';
import { LandingPage } from '../../src/pages/LandingPage';
import { NotFoundPage } from '../../src/pages/NotFoundPage';
import { NotificationsPage } from '../../src/pages/NotificationsPage';
import { PrivacyPage } from '../../src/pages/PrivacyPage';
import { RoutesPage } from '../../src/pages/RoutesPage';
import { WhatIfPage } from '../../src/pages/WhatIfPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function jsonResp(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function buildPageFetch(failEndpoint?: string) {
  return vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (failEndpoint && url.includes(failEndpoint)) {
      return Promise.resolve(jsonResp({ detail: 'Simulated upstream error' }, 502));
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
      const isDelhi = url.includes('Delhi');
      return Promise.resolve(
        jsonResp({
          city: isDelhi ? 'Delhi' : 'Mumbai',
          location_name: isDelhi ? 'Delhi Anand Vihar' : 'Mumbai Central',
          latitude: isDelhi ? 28.61 : 19.07,
          longitude: isDelhi ? 77.2 : 72.87,
          timestamp_utc: '2026-11-26T10:00:00Z',
          source: 'MODELED',
          confidence_score: 0.9,
          pm25: isDelhi ? 210 : 95,
          pm10: 155,
          no2: 44,
          so2: 14,
          co: 1.1,
          o3: 36,
          temperature_c: 26,
          relative_humidity_pct: 58,
          wind_speed_ms: 2.8,
          boundary_layer_height_m: 480,
          naqi: {
            is_valid: true,
            aqi: isDelhi ? 360 : 195,
            category: isDelhi ? 'Very Poor' : 'Moderate',
            color: '#F2B705',
            dominant_pollutant: 'PM25',
            health_advisory: 'Reduce prolonged outdoor exertion.',
            sub_indices: {
              pm25: {
                pollutant: 'PM2.5',
                concentration: 95,
                unit: 'µg/m³',
                sub_index: 195,
                category: 'Moderate',
                color: '#F2B705',
              },
            },
            validity_notes: 'Valid >= 3 pollutants',
            provenance: 'CPCB NAQI',
          },
        })
      );
    }
    if (url.includes('/air-quality/forecast')) {
      return Promise.resolve(
        jsonResp([
          {
            time: '2026-11-26T13:00:00Z',
            pm25: 62,
            pm10: 98,
            wind_speed_ms: 3.4,
            temperature_c: 28,
            relative_humidity_pct: 52,
            boundary_layer_height_m: 920,
            badge: 'FORECAST',
          },
        ])
      );
    }
    if (url.includes('/engines/window-oracle')) {
      return Promise.resolve(
        jsonResp({
          is_forecast_driven: true,
          summary_advisory: 'Ventilate briefly midday.',
          best_window_start: '12:00',
          best_window_end: '15:00',
          best_window_score: 76,
          current_action: 'PURIFY',
          hourly_slots: [],
          provenance_badge: 'FORECAST',
          methodology_note: 'Derived from Open-Meteo boundary layer depth.',
        })
      );
    }
    if (url.includes('/engines/impact/calculate')) {
      return Promise.resolve(
        jsonResp({
          daily_averted_pm25_dose_ug: 810,
          daily_co2_averted_kg: 4.86,
          aqi_hours_avoided: 38.4,
          equivalent_unfiltered_cigarettes_avoided: 1.8,
          inhalation_detail: {
            activity_type: 'adult_resting',
            inhalation_rate_m3h: 0.5,
            exposure_duration_hours: 12,
            outdoor_pm25_ugm3: 160,
            effective_pm25_ugm3: 25,
            unprotected_inhaled_dose_ug: 960,
            actual_inhaled_dose_ug: 150,
            averted_inhaled_dose_ug: 810,
            protection_efficiency_pct: 84.4,
            citation: 'USEPA',
          },
          transit_detail: null,
          methodology: 'Deterministic inhalation & emission delta.',
          limitations: 'Guidance estimate only.',
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
      if (init?.method === 'POST') {
        return Promise.resolve(
          jsonResp(
            {
              id: 2,
              user_id: 1,
              name: 'Dadi',
              age_category: 'senior',
              sensitivity: 'asthma',
              vulnerability_score: 88,
              created_at: '2026-01-01T00:00:00Z',
            },
            201
          )
        );
      }
      if (init?.method === 'DELETE') return Promise.resolve(jsonResp({ ok: true }));
      return Promise.resolve(
        jsonResp([
          {
            id: 1,
            user_id: 1,
            name: 'Aarav',
            age_category: 'child',
            sensitivity: 'asthma',
            vulnerability_score: 78,
            created_at: '2026-01-01T00:00:00Z',
          },
        ])
      );
    }
    if (url.includes('/user/routes/navigate')) {
      return Promise.resolve(
        jsonResp({
          origin: 'Andheri West Station',
          destination: 'Bandra Kurla Complex',
          source: 'ESTIMATED',
          routes: [
            {
              id: 'route_metro',
              name: 'Mumbai Metro Line',
              transport_mode: 'electric_metro',
              travel_time_min: 28,
              distance_km: 14.5,
              average_pm25: 42,
              inhaled_dose_ug: 18,
              co2_emissions_kg: 0.26,
              recommended: true,
              exposure_rating: 'Low Exposure',
              advisory: 'Lowest inhaled particulate dose.',
            },
            {
              id: 'route_green',
              name: 'Green Residential Corridor',
              transport_mode: 'bus',
              travel_time_min: 39,
              distance_km: 15.1,
              average_pm25: 88,
              inhaled_dose_ug: 52,
              co2_emissions_kg: 0.57,
              recommended: false,
              exposure_rating: 'Moderate Exposure',
              advisory: 'Avoids expressway intersections.',
            },
          ],
          comparison_note: 'Metro reduces exposure vs road arterial.',
        })
      );
    }
    if (url.includes('/user/impact')) {
      return Promise.resolve(
        jsonResp({
          total_averted_pm25_mg: 12.4,
          total_averted_co2_kg: 18.6,
          total_aqi_hours_avoided: 52,
          clean_air_streak_days: 7,
          history: [
            {
              id: 1,
              user_id: 1,
              date_str: '2026-11-25',
              averted_pm25_dose_ug: 850,
              averted_co2_kg: 2.1,
              aqi_hours_avoided: 12,
              notes: 'Window Oracle + Metro',
              created_at: '2026-11-25T10:00:00Z',
            },
          ],
        })
      );
    }
    if (url.includes('/user/alerts')) {
      if (init?.method === 'POST' || init?.method === 'PATCH' || init?.method === 'DELETE') {
        return Promise.resolve(jsonResp({ ok: true }));
      }
      return Promise.resolve(
        jsonResp({
          rules: [
            {
              id: 1,
              user_id: 1,
              aqi_threshold: 200,
              target_member: 'All Members',
              quiet_hours_start: '22:00',
              quiet_hours_end: '07:00',
              is_enabled: true,
              channels: 'in_app',
            },
          ],
          notifications: [
            {
              id: 10,
              user_id: 1,
              title: 'Twilight Smog Surge',
              message: 'PM2.5 elevated across Andheri West.',
              aqi_at_trigger: 245,
              pollutant_driver: 'PM2.5',
              reason_why: 'Inversion trapping emissions.',
              is_read: false,
              created_at: '2026-11-25T18:00:00Z',
            },
          ],
        })
      );
    }
    return Promise.resolve(jsonResp({ ok: true }));
  });
}

function renderWithAppProviders(ui: React.ReactElement, initialEntries: string[] = ['/']) {
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

describe('Remaining Public and Workspace Pages Coverage', () => {
  it('renders LandingPage with city selector, What-If sliders, and audience tabs', async () => {
    vi.stubGlobal('fetch', buildPageFetch());
    renderWithAppProviders(<LandingPage />);

    await waitFor(() => expect(screen.getByText('Mumbai Central')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Delhi' }));
    await waitFor(() => expect(screen.getByText('Delhi Anand Vihar')).toBeTruthy());

    fireEvent.change(screen.getByLabelText(/Metro Commute Days/i), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText(/One-Way Distance/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/HEPA Filtration Hours/i), { target: { value: '12' } });
    expect(screen.getByText(/6 days/)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'seniors' }));
    expect(screen.getByText('Seniors & Respiratory Conditions')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'commuters' }));
    expect(screen.getByText('Daily Urban Commuters')).toBeTruthy();
  });

  it('renders AirQualityPage and AnalyticsPage with telemetry and error retry', async () => {
    vi.stubGlobal('fetch', buildPageFetch());
    renderWithAppProviders(<AirQualityPage />);
    await waitFor(() => expect(screen.getByText('Mumbai Central')).toBeTruthy());
    expect(screen.getByText(/Meteorological Dispersion Vectors/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delhi' }));
    await waitFor(() => expect(screen.getByText('Delhi Anand Vihar')).toBeTruthy());

    cleanup();
    renderWithAppProviders(<AnalyticsPage />);
    await waitFor(() => expect(screen.getByText(/Hourly PM2.5 Trajectory/i)).toBeTruthy());
    expect(screen.getByText(/12:00 - 15:00/)).toBeTruthy();

    cleanup();
    vi.stubGlobal('fetch', buildPageFetch('/air-quality/forecast'));
    renderWithAppProviders(<AnalyticsPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Retry/i })).toBeTruthy());
  });

  it('supports FamilyPage add/remove modal and RoutesPage route radio selection', async () => {
    vi.stubGlobal('fetch', buildPageFetch());
    renderWithAppProviders(<FamilyPage />);
    await waitFor(() => expect(screen.getByText('Aarav')).toBeTruthy());

    fireEvent.change(screen.getByLabelText(/Family Member Name/i), { target: { value: 'Dadi' } });
    fireEvent.change(screen.getByLabelText(/Age Tier/i), { target: { value: 'senior' } });
    fireEvent.change(screen.getByLabelText(/Sensitivity/i), { target: { value: 'asthma' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    fireEvent.click(screen.getByRole('button', { name: /Remove Aarav from family profile/i }));
    expect(screen.getByText('Remove Family Member')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Member' }));

    cleanup();
    renderWithAppProviders(<RoutesPage />);
    fireEvent.click(screen.getByRole('button', { name: /Compare/i }));
    await waitFor(() => expect(screen.getAllByText('Mumbai Metro Line').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('radio', { name: /Green Residential Corridor/i }));
    expect(screen.getByText(/Moderate Exposure/i)).toBeTruthy();
  });

  it('renders ImpactPage, WhatIfPage simulation, NotificationsPage, PrivacyPage, DevUiPage, NotFoundPage', async () => {
    const fetchMock = buildPageFetch();
    vi.stubGlobal('fetch', fetchMock);

    renderWithAppProviders(<ImpactPage />);
    await waitFor(() => expect(screen.getByText('12.4 mg')).toBeTruthy());
    expect(screen.getByText('Window Oracle + Metro')).toBeTruthy();

    cleanup();
    renderWithAppProviders(<WhatIfPage />);
    fireEvent.change(screen.getByLabelText(/Indoor Purified Target/i), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText(/Commute Mode Replacing Solo Car/i), {
      target: { value: 'cng_bus' },
    });
    await waitFor(() => expect(screen.getByText(/810 µg/)).toBeTruthy(), { timeout: 2000 });

    cleanup();
    renderWithAppProviders(<NotificationsPage />);
    await waitFor(() => expect(screen.getByText('Twilight Smog Surge')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Add Alert Rule/i }));
    fireEvent.click(screen.getByRole('button', { name: /Mark Read/i }));
    fireEvent.click(screen.getByRole('button', { name: /Delete alert rule for All Members/i }));

    cleanup();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue('blob:test'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderWithAppProviders(<PrivacyPage />);
    fireEvent.click(screen.getByRole('button', { name: /Export JSON Data/i }));
    await waitFor(() => expect(screen.getByText('Exported JSON')).toBeTruthy());
    expect(clickSpy).toHaveBeenCalled();

    cleanup();
    renderWithAppProviders(<DevUiPage />);
    expect(screen.getByText('BreatheIQ Design System Primitives')).toBeTruthy();

    cleanup();
    renderWithAppProviders(<NotFoundPage />);
    const searchInput = screen.getByLabelText(/Search BreatheIQ destination/i);
    for (const q of ['mumbai', 'naqi', 'privacy', 'unknown']) {
      fireEvent.change(searchInput, { target: { value: q } });
      fireEvent.click(screen.getByRole('button', { name: /Go to matching section/i }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Go Back/i }));
  });
});
