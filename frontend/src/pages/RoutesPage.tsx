import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Navigation,
  MapPin,
  Clock,
  ShieldCheck,
  Leaf,
  Train,
  Car,
  AlertTriangle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

interface RouteOption {
  id: string;
  name: string;
  travel_time_min: number;
  average_pm25: number;
  inhaled_dose_ug: number;
  co2_emissions_kg: number;
  exposure_rating: string;
  recommended: boolean;
  advisory: string;
}

export const RoutesPage: React.FC = () => {
  const { user } = useAuth();
  const [origin, setOrigin] = useState('Andheri West Station');
  const [destination, setDestination] = useState('Bandra Kurla Complex (BKC)');
  const [distanceKm, setDistanceKm] = useState(14.5);
  const [departureHour, setDepartureHour] = useState(9);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route_clean');
  const [loading, setLoading] = useState(false);
  const [maskActive, setMaskActive] = useState(true);

  const handleCalculateRoutes = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const data = await apiRequest<{ routes: RouteOption[] }>('/user/routes/navigate', {
        method: 'POST',
        body: JSON.stringify({
          origin,
          destination,
          distance_km: Number(distanceKm),
          departure_hour: Number(departureHour),
        }),
      });
      setRoutes(data.routes);
      if (data.routes.length > 0) {
        setSelectedRouteId(data.routes[0].id);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    handleCalculateRoutes();
  }, []);

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity" title="BreatheIQ Home">
              <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 rounded-lg" />
              <span className="font-extrabold text-lg tracking-tight text-[#0F766E]">BreatheIQ</span>
            </Link>
            <span className="text-xs text-[#94A3B8]">/</span>
            <span className="text-xs font-bold text-[#182A29]">CleanRoute Commute Navigator</span>
          </div>

          <Link
            to="/app/dashboard"
            className="text-xs px-3 py-1 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-[#182A29]">CleanRoute Commute Navigator</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Compare travel time against personal inhaled particulate dosage and vehicular tailpipe emissions.
          </p>
        </div>

        {/* Input Form Card */}
        <form
          onSubmit={handleCalculateRoutes}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="route-origin-input" className="text-[11px] font-bold text-[#64748B] block mb-1">Origin Landmark</label>
              <input
                id="route-origin-input"
                name="origin_landmark"
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
              />
            </div>
            <div>
              <label htmlFor="route-destination-input" className="text-[11px] font-bold text-[#64748B] block mb-1">Destination</label>
              <input
                id="route-destination-input"
                name="destination_landmark"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
              />
            </div>
            <div>
              <label htmlFor="route-departure-hour-select" className="text-[11px] font-bold text-[#64748B] block mb-1">Departure Hour</label>
              <select
                id="route-departure-hour-select"
                name="departure_hour"
                value={departureHour}
                onChange={(e) => setDepartureHour(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
              >
                <option value={8}>08:00 AM (Peak Rush)</option>
                <option value={9}>09:00 AM (Rush Hour)</option>
                <option value={12}>12:00 PM (Inversion Lifted)</option>
                <option value={18}>06:00 PM (Evening Twilight)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full text-xs font-bold py-2.5 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] flex items-center justify-center gap-1.5 transition"
              >
                <Navigation className="w-4 h-4" />
                <span>{loading ? 'Routing...' : 'Compute CleanRoute'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Comparative Route Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {routes.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedRouteId(r.id)}
              className={`bg-white rounded-2xl border p-6 cursor-pointer transition shadow-sm space-y-4 flex flex-col justify-between ${
                selectedRouteId === r.id
                  ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20'
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      r.recommended ? 'bg-[#DDF5EC] text-[#0F766E]' : 'bg-[#FEE2E2] text-[#DC5252]'
                    }`}
                  >
                    {r.exposure_rating}
                  </span>
                  <span className="text-xs font-bold text-[#182A29] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                    {r.travel_time_min} mins
                  </span>
                </div>

                <h3 className="text-base font-black text-[#182A29]">{r.name}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{r.advisory}</p>

                <div className="bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Roadside PM2.5:</span>
                    <span className="font-bold text-[#182A29]">{r.average_pm25} µg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Personal Inhaled Dose:</span>
                    <span className="font-bold text-[#0F766E]">
                      {maskActive ? Math.round(r.inhaled_dose_ug * 0.15) : r.inhaled_dose_ug} µg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">CO2 Footprint:</span>
                    <span className="font-bold text-[#182A29]">{r.co2_emissions_kg} kg</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#0F766E]">
                <span>{selectedRouteId === r.id ? 'Selected Route' : 'Select'}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>

        {/* N95 Respirator Impact Toggle Bar */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#0F766E] shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-[#182A29]">N95 Respirator Filtration Simulator</h3>
              <p className="text-xs text-[#64748B]">
                Properly fitted N95 masks filter ~95% of fine particulate matter, slashing transit inhaled dose.
              </p>
            </div>
          </div>

          <label htmlFor="route-n95-mask-mode" className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0F766E]">
            <span>N95 Mask Mode</span>
            <input
              id="route-n95-mask-mode"
              name="n95_mask_mode"
              type="checkbox"
              checked={maskActive}
              onChange={(e) => setMaskActive(e.target.checked)}
              className="w-4 h-4 text-[#0F766E] rounded accent-[#0F766E]"
            />
          </label>
        </div>
      </main>
    </div>
  );
};
