import React, { useState } from 'react';
import { Activity, Droplets, Layers, Thermometer, Wind } from 'lucide-react';
import { useCities, useCurrentAirQuality, useHousehold } from '../api/hooks';
import { AppShell } from '../components/layout/AppShell';
import { AqiBadge } from '../components/ui/AqiBadge';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';
import { CpcbCategory } from '../utils/calculations';

export const AirQualityPage: React.FC = () => {
  const { data: household } = useHousehold();
  const { data: cities = [] } = useCities();
  const [cityOverride, setCityOverride] = useState<string | null>(null);
  const selectedCity = cityOverride ?? household?.city ?? 'Mumbai';

  const {
    data: airData,
    isLoading,
    error,
    refetch,
  } = useCurrentAirQuality(selectedCity);

  const category: CpcbCategory =
    airData?.naqi.category && airData.naqi.category !== 'Incomplete Data'
      ? airData.naqi.category
      : 'Moderate';

  return (
    <AppShell title="Atmospheric Command Center">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
              Multi-Pollutant Atmospheric Readings
            </h1>
            <p className="text-sm text-[#475569]">
              Station and modeled particulate readings with statutory CPCB NAQI sub-indices.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select city">
            {(cities.length > 0 ? cities.map((c) => c.city) : ['Mumbai', 'Delhi', 'Bengaluru', 'Kolkata', 'Pune']).map(
              (c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={selectedCity.toLowerCase() === c.toLowerCase()}
                  onClick={() => setCityOverride(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    selectedCity.toLowerCase() === c.toLowerCase()
                      ? 'bg-[#0F766E] text-white border-[#0F766E]'
                      : 'bg-white text-[#334155] border-[#CBD5E1]'
                  }`}
                >
                  {c}
                </button>
              )
            )}
          </div>
        </div>

        {isLoading && <LoadingSkeleton lines={5} label="Loading atmospheric pollutant telemetry..." />}
        {error && (
          <ErrorBanner
            message={error instanceof Error ? error.message : 'Unable to fetch air telemetry.'}
            onRetry={() => void refetch()}
          />
        )}

        {airData && !isLoading && (
          <>
            <Card elevated className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{airData.location_name}</h2>
                  <p className="text-xs text-[#475569]">
                    Timestamp: {new Date(airData.timestamp_utc).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge badgeType={airData.source} />
                  <AqiBadge aqi={airData.naqi.aqi ?? 0} category={category} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                  { label: 'PM2.5', value: `${airData.pm25} µg/m³` },
                  { label: 'PM10', value: `${airData.pm10} µg/m³` },
                  { label: 'NO2', value: `${airData.no2} µg/m³` },
                  { label: 'SO2', value: `${airData.so2} µg/m³` },
                  { label: 'CO', value: `${airData.co} mg/m³` },
                  { label: 'O3', value: `${airData.o3} µg/m³` },
                ].map((p) => (
                  <div key={p.label} className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <div className="text-xs font-bold text-[#475569]">{p.label}</div>
                    <div className="text-base font-extrabold mt-1">{p.value}</div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="space-y-3">
                <h2 className="font-bold text-lg">Meteorological Dispersion Vectors</h2>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <span className="flex items-center gap-2 text-[#475569]">
                      <Wind className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                      Wind Speed
                    </span>
                    <strong>{airData.wind_speed_ms} m/s</strong>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <span className="flex items-center gap-2 text-[#475569]">
                      <Thermometer className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                      Temperature
                    </span>
                    <strong>{airData.temperature_c} °C</strong>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <span className="flex items-center gap-2 text-[#475569]">
                      <Droplets className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                      Relative Humidity
                    </span>
                    <strong>{airData.relative_humidity_pct}%</strong>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <span className="flex items-center gap-2 text-[#475569]">
                      <Layers className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                      Mixing Height
                    </span>
                    <strong>{airData.boundary_layer_height_m ?? 450} m</strong>
                  </div>
                </div>
              </Card>

              <Card className="space-y-3">
                <h2 className="font-bold text-lg">CPCB Sub-Index Breakdown</h2>
                <div className="space-y-2.5">
                  {Object.values(airData.naqi.sub_indices).map((sub) => (
                    <div
                      key={sub.pollutant}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] text-sm"
                    >
                      <div>
                        <span className="font-bold">{sub.pollutant}</span>{' '}
                        <span className="text-xs text-[#475569]">
                          ({sub.concentration} {sub.unit})
                        </span>
                      </div>
                      <span className="font-bold text-[#0F766E]">
                        {sub.sub_index} · {sub.category}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};
