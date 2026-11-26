import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, ShieldCheck, Wind } from 'lucide-react';
import { AirDataPayload, CityInfo } from '../../types/api';
import { CpcbCategory } from '../../utils/calculations';
import { AqiBadge } from '../ui/AqiBadge';
import { Badge } from '../ui/Badge';
import { buttonStyles } from '../ui/Button';
import { Card } from '../ui/Card';

interface HeroSectionProps {
  cities: CityInfo[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  airPayload?: AirDataPayload;
  isLoading: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  cities,
  selectedCity,
  onSelectCity,
  airPayload,
  isLoading,
}) => {
  const category: CpcbCategory =
    airPayload?.naqi.category && airPayload.naqi.category !== 'Incomplete Data'
      ? airPayload.naqi.category
      : 'Moderate';

  return (
    <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-8 pb-14 grid lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-7 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-mint text-brand text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          Breathe Smarter · Live Healthier
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-ink">
          Turn Raw Winter Smog Numbers Into Hourly Family Decisions.
        </h1>

        <p className="text-base sm:text-lg text-ink-secondary leading-relaxed max-w-2xl">
          Generic weather apps report a single AQI index and stop there. BreatheIQ pairs CPCB NAQI
          telemetry with boundary-layer aeration windows, CADR purifier sizing, and CleanRoute
          commute comparisons backed by Google Gemini 2.5 Flash.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link to="/signup" className={buttonStyles({ size: 'lg' })}>
            Start Family Defense
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link to="/explore" className={buttonStyles({ variant: 'outline', size: 'lg' })}>
            Explore Indian Cities
          </Link>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 pt-2"
          role="group"
          aria-label="Preview city corridor"
        >
          {(cities.length > 0
            ? cities.map((c) => c.city)
            : ['Mumbai', 'Delhi', 'Bengaluru', 'Kolkata', 'Pune']
          ).map((city) => (
            <button
              key={city}
              type="button"
              aria-pressed={selectedCity.toLowerCase() === city.toLowerCase()}
              onClick={() => onSelectCity(city)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                selectedCity.toLowerCase() === city.toLowerCase()
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-ink-strong border-edge-strong hover:border-brand'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-5">
        <Card elevated className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-secondary">
                <MapPin className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                {airPayload?.city || selectedCity} Corridor
              </div>
              <p className="text-xs text-ink-secondary mt-0.5">
                {airPayload?.location_name || 'Synchronizing telemetry...'}
              </p>
            </div>
            <Badge badgeType={airPayload?.source || 'DEMO'} />
          </div>

          {isLoading ? (
            <div className="h-28 rounded-xl bg-[#F1F5F9] animate-pulse motion-reduce:animate-none" />
          ) : (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-canvas border border-edge">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Computed CPCB NAQI
                </div>
                <div className="text-4xl font-extrabold mt-1">{airPayload?.naqi.aqi ?? '--'}</div>
              </div>
              <div className="text-right space-y-2">
                <AqiBadge aqi={airPayload?.naqi.aqi ?? 0} category={category} showAqi={false} />
                <div className="text-xs text-ink-secondary">
                  PM2.5: <strong>{airPayload?.pm25 ?? '--'} µg/m³</strong>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-canvas border border-edge">
              <div className="text-ink-secondary">Wind</div>
              <div className="font-bold mt-0.5 flex items-center justify-center gap-1">
                <Wind className="w-3 h-3 text-brand" aria-hidden="true" />
                {airPayload?.wind_speed_ms ?? '--'} m/s
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-canvas border border-edge">
              <div className="text-ink-secondary">Humidity</div>
              <div className="font-bold mt-0.5">{airPayload?.relative_humidity_pct ?? '--'}%</div>
            </div>
            <div className="p-2.5 rounded-xl bg-canvas border border-edge">
              <div className="text-ink-secondary">Dominant</div>
              <div className="font-bold mt-0.5">
                {airPayload?.naqi.dominant_pollutant ?? 'PM25'}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-ink-secondary">
            {airPayload?.timestamp_utc
              ? `Timestamp: ${new Date(airPayload.timestamp_utc).toLocaleTimeString()}`
              : 'Connecting to backend telemetry service'}{' '}
            · Guidance only, not medical advice.
          </p>
        </Card>
      </div>
    </section>
  );
};
