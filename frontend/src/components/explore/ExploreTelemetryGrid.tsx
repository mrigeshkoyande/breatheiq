import React from 'react';
import { Droplets, Layers, Thermometer, Wind } from 'lucide-react';
import { AirDataPayload, ForecastSlot } from '../../types/api';
import { AqiBadge } from '../ui/AqiBadge';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { CpcbCategory } from '../../utils/calculations';

interface ExploreTelemetryGridProps {
  currentAir: AirDataPayload;
  forecast: ForecastSlot[];
}

/** Detailed pollutant breakdown and 6-hour atmospheric driver outlook for ExplorePage. */
export const ExploreTelemetryGrid: React.FC<ExploreTelemetryGridProps> = ({
  currentAir,
  forecast,
}) => {
  const validCategory: CpcbCategory =
    currentAir.naqi.category && currentAir.naqi.category !== 'Incomplete Data'
      ? currentAir.naqi.category
      : 'Moderate';

  const pollutantMap: Record<string, string> = {
    'PM2.5': `${currentAir.pm25} µg/m³`,
    PM10: `${currentAir.pm10} µg/m³`,
    NO2: `${currentAir.no2} µg/m³`,
    SO2: `${currentAir.so2} µg/m³`,
    CO: `${currentAir.co} mg/m³`,
    O3: `${currentAir.o3} µg/m³`,
  };
  const pollutants = Object.entries(pollutantMap).map(([label, value]) => ({ label, value }));

  return (
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
          {pollutants.map((item) => (
            <div key={item.label} className="p-3.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
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
  );
};
