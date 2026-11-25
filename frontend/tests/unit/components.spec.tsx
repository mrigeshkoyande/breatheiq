import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AqiBadge } from '../../src/components/ui/AqiBadge';
import { Badge } from '../../src/components/ui/Badge';
import { ConfirmModal } from '../../src/components/ui/ConfirmModal';
import { Input } from '../../src/components/ui/Input';
import { AuthProvider } from '../../src/context/AuthContext';
import { LanguageProvider } from '../../src/i18n/translations';
import { LoginPage } from '../../src/pages/LoginPage';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { setAccessToken } from '../../src/services/api';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  setAccessToken(null);
});

function renderWithProviders(ui: React.ReactElement) {
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

describe('Accessible UI Primitives & Pages', () => {
  it('renders AqiBadge and provenance Badge with accessible text', () => {
    render(
      <div>
        <AqiBadge aqi={245} category="Poor" />
        <Badge badgeType="MODELED" />
      </div>
    );
    expect(screen.getByText('Poor')).toBeTruthy();
    expect(screen.getByText('(245 AQI)')).toBeTruthy();
    expect(screen.getByText('MODELED')).toBeTruthy();
  });

  it('links Input errors via aria-invalid and aria-describedby', () => {
    render(<Input label="Corridor" error="City name required" />);
    const input = screen.getByLabelText('Corridor');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const errEl = screen.getByRole('alert');
    expect(input.getAttribute('aria-describedby')).toBe(errEl.id);
  });

  it('handles ConfirmModal Escape cancel and confirm callback', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        isOpen
        title="Delete Member"
        description="Are you sure?"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows demo quick-fill on LoginPage only when demo_mode is true', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/auth/config')) {
          return Promise.resolve(
            new Response(JSON.stringify({ demo_mode: false, environment: 'production' }), { status: 200 })
          );
        }
        return Promise.resolve(new Response('{}', { status: 200 }));
      })
    );

    renderWithProviders(<LoginPage />);
    await waitFor(() => {
      expect(screen.queryByText(/Demo Mode Quick-Fill/i)).toBeNull();
    });

    cleanup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/auth/config')) {
          return Promise.resolve(
            new Response(JSON.stringify({ demo_mode: true, environment: 'development' }), { status: 200 })
          );
        }
        return Promise.resolve(new Response('{}', { status: 200 }));
      })
    );

    renderWithProviders(<LoginPage />);
    await waitFor(() => {
      expect(screen.getByText(/Demo Mode Quick-Fill/i)).toBeTruthy();
    });
  });

  it('renders DashboardPage from real API telemetry and switches html lang cleanly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/air-quality/cities')) {
          return Promise.resolve(
            new Response(JSON.stringify([{ city: 'Delhi', state: 'DL', latitude: 28.61, longitude: 77.2 }]), { status: 200 })
          );
        }
        if (url.includes('/user/household')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ id: 1, user_id: 1, name: 'Home', city: 'Delhi', neighborhood: 'Rohini', latitude: 28.61, longitude: 77.2, created_at: '2026-01-01T00:00:00Z' }),
              { status: 200 }
            )
          );
        }
        if (url.includes('/air-quality/current')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                city: 'Delhi',
                location_name: 'Delhi Central Corridor',
                latitude: 28.61,
                longitude: 77.2,
                timestamp_utc: '2026-11-25T10:00:00Z',
                source: 'DEMO',
                confidence_score: 0.85,
                pm25: 245,
                pm10: 340,
                no2: 78,
                so2: 24,
                co: 2.8,
                o3: 44,
                temperature_c: 19,
                relative_humidity_pct: 78,
                wind_speed_ms: 1.8,
                boundary_layer_height_m: 280,
                naqi: {
                  is_valid: true,
                  aqi: 397,
                  category: 'Very Poor',
                  color: '#DC5252',
                  dominant_pollutant: 'PM25',
                  health_advisory: 'Avoid prolonged outdoor exposure.',
                  sub_indices: {},
                  validity_notes: 'OK',
                  provenance: 'COMPUTED_CPCB_NAQI',
                },
              }),
              { status: 200 }
            )
          );
        }
        if (url.includes('/engines/window-oracle')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                is_forecast_driven: true,
                summary_advisory: 'Ventilate briefly 13:00-15:00.',
                best_window_start: '13:00',
                best_window_end: '15:00',
                best_window_score: 62,
                current_action: 'PURIFY',
                hourly_slots: [],
                provenance_badge: 'FORECAST',
                methodology_note: 'Forecast driven',
              }),
              { status: 200 }
            )
          );
        }
        if (url.includes('/user/routine')) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                { id: 7, user_id: 1, time_slot: 'morning', title: 'Seal Bedroom Windows', category: 'ventilation', is_completed: false, date_str: '2026-11-25', created_at: '2026-01-01T00:00:00Z' },
              ]),
              { status: 200 }
            )
          );
        }
        if (url.includes('/user/impact')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ total_averted_pm25_mg: 4.1, total_averted_co2_kg: 18.2, total_aqi_hours_avoided: 1200, clean_air_streak_days: 7, history: [] }),
              { status: 200 }
            )
          );
        }
        if (url.includes('/user/members')) {
          return Promise.resolve(
            new Response(JSON.stringify([{ id: 1, user_id: 1, name: 'Aarav', age_category: 'child', sensitivity: 'asthma', vulnerability_score: 80, created_at: '2026-01-01T00:00:00Z' }]), { status: 200 })
          );
        }
        if (url.includes('/user/alerts')) {
          return Promise.resolve(new Response(JSON.stringify({ rules: [], notifications: [] }), { status: 200 }));
        }
        return Promise.resolve(new Response('{}', { status: 200 }));
      })
    );

    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('397')).toBeTruthy();
      expect(screen.getByText('Seal Bedroom Windows')).toBeTruthy();
      expect(screen.getByText('13:00 - 15:00')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'hi' }));
    expect(document.documentElement.lang).toBe('hi');
    expect(
      screen.getByRole('heading', { level: 1, name: 'परिवार वायु गुणवत्ता कमांड सेंटर' })
    ).toBeTruthy();
  });
});
