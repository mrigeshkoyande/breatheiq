import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useAirQualityForecast, useHousehold, useWindowOracle } from '../api/hooks';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';

export const AnalyticsPage: React.FC = () => {
  const { data: household } = useHousehold();
  const lat = household?.latitude ?? 19.076;
  const lon = household?.longitude ?? 72.8777;

  const { data: forecast = [], isLoading, error, refetch } = useAirQualityForecast(lat, lon, 24);
  const { data: oracle } = useWindowOracle(lat, lon);

  const maxPm25 = Math.max(100, ...forecast.map((f) => f.pm25));

  return (
    <AppShell title="Inversion & Diurnal Analytics">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
              24-Hour Inversion & Particulate Curves
            </h1>
            <p className="text-sm text-[#475569]">
              Boundary layer depth and hourly PM2.5 dispersion forecast for {household?.city || 'Mumbai'}.
            </p>
          </div>
          <Badge badgeType="FORECAST" />
        </div>

        {isLoading && <LoadingSkeleton lines={5} label="Loading forecast curves..." />}
        {error && (
          <ErrorBanner
            message={error instanceof Error ? error.message : 'Unable to fetch forecast series.'}
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && forecast.length > 0 && (
          <>
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <div className="text-xs font-bold uppercase text-[#475569]">Peak Forecast PM2.5</div>
                <div className="text-2xl font-extrabold mt-1">
                  {Math.max(...forecast.map((f) => f.pm25))} µg/m³
                </div>
              </Card>
              <Card>
                <div className="text-xs font-bold uppercase text-[#475569]">Optimal Aeration Window</div>
                <div className="text-2xl font-extrabold mt-1 text-[#0F766E]">
                  {oracle?.best_window_start
                    ? `${oracle.best_window_start} - ${oracle.best_window_end}`
                    : 'Calculating...'}
                </div>
              </Card>
              <Card>
                <div className="text-xs font-bold uppercase text-[#475569]">Peak Mixing Height</div>
                <div className="text-2xl font-extrabold mt-1">
                  {Math.max(...forecast.map((f) => f.boundary_layer_height_m))} m
                </div>
              </Card>
            </div>

            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">Hourly PM2.5 Trajectory (µg/m³)</h2>
                <span className="text-xs text-[#475569]">First 12 hours shown with mixing height</span>
              </div>
              <div className="space-y-2.5" role="list" aria-label="Hourly PM2.5 forecast breakdown">
                {forecast.slice(0, 12).map((slot) => {
                  const pct = Math.min(100, Math.round((slot.pm25 / maxPm25) * 100));
                  const hourLabel = slot.time.split('T')[1]?.slice(0, 5) || slot.time.slice(0, 5);
                  return (
                    <div key={slot.time} role="listitem" className="grid grid-cols-12 items-center gap-3 text-xs">
                      <span className="col-span-2 sm:col-span-1 font-bold text-[#334155]">
                        {hourLabel}
                      </span>
                      <div className="col-span-6 sm:col-span-8 bg-[#F1F5F9] h-4 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0F766E] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="col-span-4 sm:col-span-3 text-right font-semibold text-[#182A29]">
                        {slot.pm25} µg/m³ · BL {slot.boundary_layer_height_m}m
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
};
