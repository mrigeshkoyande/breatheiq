import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Navigation } from 'lucide-react';
import { useHousehold } from '../api/hooks';
import { apiRequest } from '../services/api';
import { CleanRouteResponse } from '../types/api';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ErrorBanner } from '../components/ui/StatusBanner';

export const RoutesPage: React.FC = () => {
  const { data: household } = useHousehold();
  const city = household?.city || 'Mumbai';

  const [origin, setOrigin] = useState('Andheri West Station');
  const [destination, setDestination] = useState('Bandra Kurla Complex (BKC)');
  const [distanceKm, setDistanceKm] = useState('14.5');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route_metro');
  const [routeResult, setRouteResult] = useState<CleanRouteResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const navigateMutation = useMutation({
    mutationFn: () =>
      apiRequest<CleanRouteResponse>('/user/routes/navigate', {
        method: 'POST',
        body: JSON.stringify({
          origin: origin.trim(),
          destination: destination.trim(),
          city,
          distance_km: Number(distanceKm),
          departure_hour: new Date().getHours(),
        }),
      }),
    onSuccess: (data) => {
      setErrorMsg('');
      setRouteResult(data);
    },
    onError: (err: unknown) => {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to compute route comparison.');
    },
  });

  const activeRoute =
    routeResult?.routes.find((r) => r.id === selectedRouteId) ?? routeResult?.routes[0];

  return (
    <AppShell title="CleanRoute Commute Navigator">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Navigation className="w-6 h-6 text-brand" aria-hidden="true" />
              CleanRoute Multimodal Exposure Navigator
            </h1>
            <p className="text-sm text-ink-secondary">
              Compare inhaled PM2.5 dosage and ARAI/DMRC CO2 savings across {city} transit
              corridors.
            </p>
          </div>
          <Badge badgeType={routeResult?.source || 'ESTIMATED'} />
        </div>

        {errorMsg && <ErrorBanner message={errorMsg} />}

        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigateMutation.mutate();
            }}
            className="grid sm:grid-cols-12 gap-3 items-end"
          >
            <div className="sm:col-span-4">
              <Input
                label="Origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-4">
              <Input
                label="Destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Distance (km)"
                type="number"
                step="0.5"
                min="1"
                max="150"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={navigateMutation.isPending} className="w-full h-10">
                {navigateMutation.isPending ? 'Comparing...' : 'Compare'}
              </Button>
            </div>
          </form>
        </Card>

        {routeResult && (
          <div className="space-y-4">
            <div
              className="grid md:grid-cols-3 gap-4"
              role="radiogroup"
              aria-label="Commute route options"
            >
              {routeResult.routes.map((route) => {
                const selected = activeRoute?.id === route.id;
                return (
                  <button
                    key={route.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`text-left p-5 rounded-2xl border transition-all space-y-2 ${
                      selected
                        ? 'bg-[#EBF7F0] border-brand ring-2 ring-[#0F766E]/25'
                        : 'bg-white border-edge-strong hover:border-brand'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm">{route.name}</span>
                      {route.recommended && <Badge badgeType="ESTIMATED" />}
                    </div>
                    <div className="text-2xl font-extrabold text-brand">
                      {route.inhaled_dose_ug} µg
                    </div>
                    <div className="text-xs text-ink-secondary">
                      {route.travel_time_min} min · {route.average_pm25} µg/m³ ·{' '}
                      {route.co2_emissions_kg} kg CO2
                    </div>
                    <p className="text-xs text-ink-strong pt-1">{route.advisory}</p>
                  </button>
                );
              })}
            </div>

            {activeRoute && (
              <Card className="bg-canvas">
                <div className="text-xs font-bold uppercase text-brand">Selected Option</div>
                <div className="font-bold text-base mt-0.5">{activeRoute.name}</div>
                <p className="text-sm text-ink-secondary mt-1">
                  Rating: <strong>{activeRoute.exposure_rating}</strong> — {activeRoute.advisory}
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
};
