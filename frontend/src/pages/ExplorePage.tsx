import React, { useState } from 'react';
import { Compass, Droplets, Layers, Search, Thermometer, Wind } from 'lucide-react';
import { useAirQualityForecast, useCities, useCurrentAirQuality } from '../api/hooks';
import { PublicHeader } from '../components/layout/PublicHeader';
import { SkipLink } from '../components/layout/SkipLink';
import { AqiBadge } from '../components/ui/AqiBadge';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';
import { CpcbCategory } from '../utils/calculations';

export const ExplorePage: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: cities = [] } = useCities();
  const {
    data: currentAir,
    isLoading: airLoading,
    error: airError,
    refetch: refetchAir,
  } = useCurrentAirQuality(selectedCity);

  const activeLat = currentAir?.latitude ?? 19.076;
  const activeLon = currentAir?.longitude ?? 72.8777;
  const { data: forecast = [] } = useAirQualityForecast(activeLat, activeLon, 24);

  const filteredCities = cities.filter(
    (c) =>
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validCategory: CpcbCategory =
    currentAir?.naqi.category && currentAir.naqi.category !== 'Incomplete Data'
      ? currentAir.naqi.category
      : 'Moderate';

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col">
      <SkipLink />
      <PublicHeader />

      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-1">
              <Compass className="w-4 h-4" aria-hidden="true" />
              Metropolitan Air Explorer
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Indian Urban Air Quality Corridors
            </h1>
            <p className="text-sm text-[#475569] mt-1">
              Inspect CPCB NAQI sub-indices, raw pollutant concentrations, and 24-hour forecasts.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <label htmlFor="city-search" className="sr-only">
              Search monitoring cities
            </label>
            <Search className="w-4 h-4 text-[#475569] absolute left-3 top-3" aria-hidden="true" />
            <input
              id="city-search"
              type="text"
              placeholder="Filter city or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Select city corridor">
          {filteredCities.map((c) => (
            <button
              key={c.city}
              type="button"
              aria-pressed={selectedCity.toLowerCase() === c.city.toLowerCase()}
              onClick={() => setSelectedCity(c.city)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                selectedCity.toLowerCase() === c.city.toLowerCase()
                  ? 'bg-[#0F766E] text-white border-[#0F766E]'
                  : 'bg-white text-[#182A29] border-[#CBD5E1] hover:border-[#0F766E]'
              }`}
            >
              {c.city}
            </button>
          ))}
        </div>

        {airLoading && <LoadingSkeleton lines={4} label="Fetching metropolitan air telemetry..." />}
        {airError && (
          <ErrorBanner
            message={
              airError instanceof Error ? airError.message : 'Unable to fetch city telemetry.'
            }
            onRetry={() => void refetchAir()}
          />
        )}

        {currentAir && !airLoading && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card elevated className="lg:col-span-2 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">{currentAir.location_name}</h2>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Updated: {new Date(currentAir.timestamp_utc).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge badgeType={currentAir.source} />
                  <AqiBadge aqi={currentAir.naqi.aqi ?? 0} category={validCategory} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'PM2.5', value: `${currentAir.pm25} µg/m³` },
                  { label: 'PM10', value: `${currentAir.pm10} µg/m³` },
                  { label: 'NO2', value: `${currentAir.no2} µg/m³` },
                  { label: 'SO2', value: `${currentAir.so2} µg/m³` },
                  { label: 'CO', value: `${currentAir.co} mg/m³` },
                  { label: 'O3', value: `${currentAir.o3} µg/m³` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-3.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]"
                  >
                    <div className="text-xs font-bold text-[#475569]">{item.label}</div>
                    <div className="text-lg font-extrabold mt-1">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-[#EBF7F0] border border-[#A3E5BA] text-sm text-[#182A29]">
                <strong>Advisory:</strong> {currentAir.naqi.health_advisory}{' '}
                <span className="text-[#475569]">
                  (Public health guidance only — not medical advice.)
                </span>
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">Atmospheric Drivers</h2>
                <Badge badgeType="FORECAST" />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                  <span className="flex items-center gap-2 text-[#475569]">
                    <Wind className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                    Wind Speed
                  </span>
                  <span className="font-bold">{currentAir.wind_speed_ms} m/s</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                  <span className="flex items-center gap-2 text-[#475569]">
                    <Thermometer className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                    Temperature
                  </span>
                  <span className="font-bold">{currentAir.temperature_c} °C</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                  <span className="flex items-center gap-2 text-[#475569]">
                    <Droplets className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                    Humidity
                  </span>
                  <span className="font-bold">{currentAir.relative_humidity_pct}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                  <span className="flex items-center gap-2 text-[#475569]">
                    <Layers className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                    Mixing Height
                  </span>
                  <span className="font-bold">{currentAir.boundary_layer_height_m ?? 500} m</span>
                </div>
              </div>

              {forecast.length > 0 && (
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
                    Next 6 Hours PM2.5 Trend
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {forecast.slice(0, 6).map((slot) => (
                      <div
                        key={slot.time}
                        className="p-2 rounded-lg bg-[#F8FAF7] border border-[#E2E8F0] text-center"
                      >
                        <div className="text-[#475569]">
                          {slot.time.split('T')[1]?.slice(0, 5) || '--'}
                        </div>
                        <div className="font-bold text-[#182A29]">{slot.pm25}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};
