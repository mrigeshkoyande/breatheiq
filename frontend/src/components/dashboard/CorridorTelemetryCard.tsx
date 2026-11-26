import React from 'react';
import { Droplets, Layers, MapPin, Thermometer, Wind } from 'lucide-react';
import { AirDataPayload } from '../../types/api';
import { CpcbCategory } from '../../utils/calculations';
import { AqiBadge } from '../ui/AqiBadge';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface CorridorTelemetryCardProps {
  airData: AirDataPayload;
  neighborhood?: string;
}

export const CorridorTelemetryCard: React.FC<CorridorTelemetryCardProps> = ({
  airData,
  neighborhood,
}) => {
  const category: CpcbCategory =
    airData.naqi.category && airData.naqi.category !== 'Incomplete Data'
      ? airData.naqi.category
      : 'Moderate';

  return (
    <Card elevated className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            {neighborhood ? `${neighborhood}, ${airData.city}` : airData.location_name}
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            {airData.station_id ? `Source ID: ${airData.station_id}` : airData.location_name} ·{' '}
            {new Date(airData.timestamp_utc).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge badgeType={airData.source} />
          <AqiBadge aqi={airData.naqi.aqi ?? 0} category={category} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-canvas border border-edge">
          <div className="text-xs font-bold text-ink-secondary">CPCB NAQI</div>
          <div className="text-3xl font-extrabold mt-1">{airData.naqi.aqi ?? '--'}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-canvas border border-edge">
          <div className="text-xs font-bold text-ink-secondary">PM2.5</div>
          <div className="text-2xl font-extrabold mt-1">{airData.pm25} µg/m³</div>
        </div>
        <div className="p-3.5 rounded-xl bg-canvas border border-edge">
          <div className="text-xs font-bold text-ink-secondary">PM10</div>
          <div className="text-2xl font-extrabold mt-1">{airData.pm10} µg/m³</div>
        </div>
        <div className="p-3.5 rounded-xl bg-canvas border border-edge">
          <div className="text-xs font-bold text-ink-secondary">Dominant</div>
          <div className="text-2xl font-extrabold mt-1 text-brand">
            {airData.naqi.dominant_pollutant ?? 'PM25'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-canvas border border-edge">
          <Wind className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
          <span>Wind: {airData.wind_speed_ms} m/s</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-canvas border border-edge">
          <Thermometer className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
          <span>Temp: {airData.temperature_c} °C</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-canvas border border-edge">
          <Droplets className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
          <span>Humidity: {airData.relative_humidity_pct}%</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-canvas border border-edge">
          <Layers className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
          <span>Boundary: {airData.boundary_layer_height_m ?? 450} m</span>
        </div>
      </div>
    </Card>
  );
};
