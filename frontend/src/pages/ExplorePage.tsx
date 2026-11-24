import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wind,
  Search,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  Thermometer,
  Droplets
} from 'lucide-react';
import { apiRequest } from '../services/api';

interface PollutantSubIndex {
  pollutant: string;
  concentration: number;
  unit: string;
  sub_index: number;
  category: string;
  color: string;
}

interface AirDataResponse {
  city: string;
  location_name: string;
  latitude: number;
  longitude: number;
  timestamp_utc: string;
  source: 'LIVE' | 'MODELED' | 'FORECAST' | 'DEMO';
  confidence_score: number;
  station_id?: string;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  temperature_c: number;
  relative_humidity_pct: number;
  wind_speed_ms: number;
  boundary_layer_height_m?: number;
  naqi: {
    is_valid: boolean;
    aqi: number;
    category: string;
    color: string;
    dominant_pollutant: string;
    health_advisory: string;
    sub_indices: Record<string, PollutantSubIndex>;
    validity_notes: string;
  };
}

interface ForecastSlot {
  time: string;
  pm25: number;
  pm10: number;
  wind_speed_ms: number;
  temperature_c: number;
  relative_humidity_pct: number;
  boundary_layer_height_m?: number;
  badge: string;
}

const PRECONFIGURED = [
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
];

export const ExplorePage: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [searchQuery, setSearchQuery] = useState('');
  const [airData, setAirData] = useState<AirDataResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastSlot[]>([]);
  const [selectedHourIdx, setSelectedHourIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCityData = async (cityName: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<AirDataResponse>(`/air-quality/current?city=${encodeURIComponent(cityName)}`);
      setAirData(data);
      const forecastData = await apiRequest<ForecastSlot[]>(
        `/air-quality/forecast?lat=${data.latitude}&lon=${data.longitude}&hours=24`
      );
      setForecast(forecastData);
      setSelectedHourIdx(0);
    } catch (err: any) {
      setError(err?.message || 'Failed to synchronize atmospheric telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCityData(selectedCity);
  }, [selectedCity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = PRECONFIGURED.find((c) =>
      c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
    if (match) {
      setSelectedCity(match.name);
      setSearchQuery('');
    } else {
      setSelectedCity(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const activeForecastSlot = forecast[selectedHourIdx];

  return (
    <div
      className="min-h-screen text-[#182A29] flex flex-col font-sans bg-[#F8FAF7]"
      style={{
        backgroundImage: 'linear-gradient(135deg, #EDFAF5, #F8FAF7, #E3F8F6)',
      }}
    >
      {/* Top Navigation (Floating Glass Navbar) */}
      <div className="sticky top-2.5 z-40 px-4 lg:px-8">
        <header className="max-w-7xl mx-auto glass-nav rounded-2xl px-4 lg:px-8 py-3 flex items-center justify-between shadow-md">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 rounded-lg" />
            <span className="font-extrabold text-lg tracking-tight text-[#0F766E]">BreatheIQ</span>
            <span className="hidden sm:inline-block text-[11px] font-semibold bg-[#DDF5EC] text-[#0F766E] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Explorer
            </span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6 text-xs font-semibold">
            <Link to="/explore" className="text-[#0F766E] border-b-2 border-[#0F766E] pb-0.5">
              Explorer
            </Link>
            <Link to="/methodology" className="text-[#64748B] hover:text-[#0F766E] transition">
              Methodology
            </Link>
            <Link to="/privacy" className="text-[#64748B] hover:text-[#0F766E] transition">
              Privacy
            </Link>
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-lg border border-[#0F766E] text-[#0F766E] hover:bg-[#DDF5EC]/50 transition"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] transition"
            >
              Get Started
            </Link>
          </nav>
        </header>
      </div>

      {/* Hero Search & City Bar */}
      <section className="bg-white border-b border-[#E2E8F0] px-4 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#182A29] tracking-tight">
                Urban Air Quality & Atmospheric Telemetry Explorer
              </h1>
              <p className="text-xs text-[#64748B] mt-1">
                Continuous ground station observations paired with hourly boundary-layer meteorological models.
              </p>
            </div>

            {/* City Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <label htmlFor="explore-city-search" className="sr-only">
                Search Indian city
              </label>
              <input
                id="explore-city-search"
                name="city_search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city (e.g. Mumbai, Delhi)..."
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:bg-white transition"
              />
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
            </form>
          </div>

          {/* Quick Filter City Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mr-1">
              Corridors:
            </span>
            {PRECONFIGURED.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedCity(c.name)}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition flex items-center gap-1.5 ${
                  selectedCity.toLowerCase() === c.name.toLowerCase()
                    ? 'bg-[#0F766E] text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                }`}
              >
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8">
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#0F766E] animate-spin" />
            <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
              Querying Atmospheric Monitoring Grid...
            </span>
          </div>
        )}

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-4 flex items-center justify-between text-xs text-[#DC5252]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchCityData(selectedCity)}
              className="font-bold underline ml-4 hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {airData && !loading && (
          <>
            {/* Primary Live Telemetry Banner */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 lg:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-6">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl font-black text-[#182A29]">{airData.city}</h2>
                    {/* Provenance Badge */}
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider ${
                        airData.source === 'LIVE'
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : airData.source === 'MODELED'
                          ? 'bg-[#E0F2FE] text-[#0369A1]'
                          : 'bg-[#FEF3C7] text-[#B45309]'
                      }`}
                    >
                      {airData.source} DATA
                    </span>
                    <span className="text-xs text-[#64748B] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(airData.timestamp_utc).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      UTC
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">{airData.location_name}</p>
                </div>

                {/* Composite AQI Badge */}
                <div className="flex items-center gap-4 bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl p-4">
                  <div
                    className="w-14 h-14 rounded-xl flex flex-col items-center justify-center font-black text-white shadow-sm"
                    style={{ backgroundColor: airData.naqi.color }}
                  >
                    <span className="text-xl leading-none">{airData.naqi.aqi}</span>
                    <span className="text-[9px] uppercase tracking-tighter">NAQI</span>
                  </div>
                  <div>
                    <span
                      className="text-xs font-black uppercase tracking-wide block"
                      style={{ color: airData.naqi.color }}
                    >
                      {airData.naqi.category}
                    </span>
                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                      Dominant: <strong>{airData.naqi.dominant_pollutant}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Health Advisory Note */}
              <div className="bg-[#DDF5EC]/30 border border-[#A7E8C6]/50 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-[#0F766E] block mb-0.5">Official CPCB Public Guidance</span>
                  <p className="text-[#3E4947]">{airData.naqi.health_advisory}</p>
                </div>
              </div>

              {/* Meteorological Context Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#F8FAF7] rounded-xl p-3 border border-[#E2E8F0]/80">
                  <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-[#0F766E]" /> Temperature
                  </span>
                  <span className="text-base font-bold text-[#182A29] block mt-1">
                    {airData.temperature_c}°C
                  </span>
                </div>
                <div className="bg-[#F8FAF7] rounded-xl p-3 border border-[#E2E8F0]/80">
                  <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-[#0F766E]" /> Humidity
                  </span>
                  <span className="text-base font-bold text-[#182A29] block mt-1">
                    {airData.relative_humidity_pct}%
                  </span>
                </div>
                <div className="bg-[#F8FAF7] rounded-xl p-3 border border-[#E2E8F0]/80">
                  <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-[#0F766E]" /> Wind Dispersion
                  </span>
                  <span className="text-base font-bold text-[#182A29] block mt-1">
                    {airData.wind_speed_ms} m/s
                  </span>
                </div>
                <div className="bg-[#F8FAF7] rounded-xl p-3 border border-[#E2E8F0]/80">
                  <span className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#0F766E]" /> Boundary Layer
                  </span>
                  <span className="text-base font-bold text-[#182A29] block mt-1">
                    {airData.boundary_layer_height_m ? `${airData.boundary_layer_height_m} m` : 'Estimated'}
                  </span>
                </div>
              </div>
            </div>

            {/* Statutory Pollutants Decomposition Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-[#182A29]">
                  Statutory Pollutants Decomposition (CPCB Sub-indices)
                </h3>
                <span className="text-xs text-[#64748B]">All concentrations in µg/m³ (CO in mg/m³)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(airData.naqi.sub_indices).map(([key, poll]) => (
                  <div
                    key={key}
                    className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3 hover:border-[#0F766E]/40 transition shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#182A29]">{poll.pollutant}</span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: poll.color }}
                      >
                        {poll.category}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-[#182A29]">
                        {poll.concentration}{' '}
                        <span className="text-xs font-normal text-[#64748B]">{poll.unit}</span>
                      </span>
                      <span className="text-xs font-bold text-[#64748B]">
                        Sub-index: <strong>{poll.sub_index}</strong>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (poll.sub_index / 500) * 100)}%`,
                          backgroundColor: poll.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly Forecast Scrubber Slider */}
            {forecast.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-[#182A29]">
                      24-Hour Diurnal Inversion Scrubber
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Simulates particulate rise and dispersal through midday thermal boundary layer expansion.
                    </p>
                  </div>

                  {activeForecastSlot && (
                    <div className="bg-[#DDF5EC] px-3 py-1.5 rounded-xl text-xs font-bold text-[#0F766E] flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        Hour {selectedHourIdx + 1} of 24 · PM2.5: {activeForecastSlot.pm25} µg/m³
                      </span>
                    </div>
                  )}
                </div>

                {/* Slider Input */}
                <div className="space-y-2">
                  <label htmlFor="forecast-hour-slider" className="sr-only">
                    Select forecast hour
                  </label>
                  <input
                    id="forecast-hour-slider"
                    name="forecast_hour"
                    type="range"
                    min="0"
                    max={Math.max(0, forecast.length - 1)}
                    value={selectedHourIdx}
                    onChange={(e) => setSelectedHourIdx(Number(e.target.value))}
                    className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
                  />
                  <div className="flex justify-between text-[11px] font-semibold text-[#64748B]">
                    <span>Now (0h)</span>
                    <span>+6 Hours</span>
                    <span>+12 Hours (Midday Flush)</span>
                    <span>+18 Hours (Twilight Inversion)</span>
                    <span>+24 Hours</span>
                  </div>
                </div>

                {/* Active Hour Snapshot Card */}
                {activeForecastSlot && (
                  <div className="bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[#64748B] block">Timestamp</span>
                      <span className="font-bold text-[#182A29] mt-0.5 block">
                        {new Date(activeForecastSlot.time).toLocaleString([], {
                          weekday: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block">Modeled PM2.5</span>
                      <span className="font-bold text-[#182A29] mt-0.5 block">
                        {activeForecastSlot.pm25} µg/m³
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block">Wind Speed</span>
                      <span className="font-bold text-[#182A29] mt-0.5 block">
                        {activeForecastSlot.wind_speed_ms} m/s
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block">Boundary Mixing</span>
                      <span className="font-bold text-[#0F766E] mt-0.5 block">
                        {activeForecastSlot.boundary_layer_height_m
                          ? `${activeForecastSlot.boundary_layer_height_m} m`
                          : 'Deep Mixing'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-6 px-4 lg:px-8 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 BreatheIQ. Environmental telemetry grounded in CPCB standards and Open-Meteo forecasts.</p>
          <div className="flex gap-4 font-semibold">
            <Link to="/methodology" className="hover:text-[#0F766E]">Methodology</Link>
            <Link to="/privacy" className="hover:text-[#0F766E]">Privacy</Link>
            <Link to="/login" className="hover:text-[#0F766E]">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
