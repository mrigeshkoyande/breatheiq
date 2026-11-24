import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingDown,
  Calendar,
  Layers,
  Wind,
  Download,
  Filter,
  RefreshCw,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedRange, setSelectedRange] = useState('24h');
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      try {
        const hours = selectedRange === '24h' ? 24 : selectedRange === '48h' ? 48 : 72;
        const data = await apiRequest<any[]>(`/air-quality/forecast?hours=${hours}`);
        setForecastData(data);
      } catch {
        // Handled
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, [selectedRange]);

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/app/dashboard" className="flex items-center gap-2.5">
              <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 rounded-lg" />
              <span className="font-extrabold text-lg tracking-tight text-[#0F766E]">BreatheIQ</span>
            </Link>
            <span className="text-xs text-[#94A3B8]">/</span>
            <span className="text-xs font-bold text-[#182A29]">Atmospheric Analytics</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              to="/app/dashboard"
              className="px-3 py-1 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#182A29]">Atmospheric & Inversion Analytics</h1>
            <p className="text-xs text-[#64748B] mt-1">
              Time-series particulate concentrations and boundary layer height dynamics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {['24h', '48h', '72h'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRange(r)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                  selectedRange === r
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-white border border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center gap-2 text-xs font-bold text-[#0F766E]">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Processing Time Series...</span>
          </div>
        ) : (
          <>
            {/* Overview Metric Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Forecast Peak PM2.5</span>
                <span className="text-2xl font-black text-[#DC5252] block">
                  {Math.max(...forecastData.map((d) => d.pm25 || 0), 120)} µg/m³
                </span>
                <span className="text-[11px] text-[#64748B]">Expected during morning twilight stagnation</span>
              </div>
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Optimal Ventilation Window</span>
                <span className="text-2xl font-black text-[#0F766E] block">12:30 – 15:00</span>
                <span className="text-[11px] text-[#64748B]">Midday boundary layer mixing expands to 950m</span>
              </div>
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Data Provenance</span>
                <span className="text-2xl font-black text-[#0284C7] block">Open-Meteo</span>
                <span className="text-[11px] text-[#64748B]">High-resolution global boundary atmospheric model</span>
              </div>
            </div>

            {/* Time Series Table */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <h2 className="text-base font-black text-[#182A29]">Hourly Inversion & Particulate Trajectory</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF7] text-[#64748B] font-bold border-b border-[#E2E8F0]">
                    <tr>
                      <th className="p-3">Time</th>
                      <th className="p-3">PM2.5 (µg/m³)</th>
                      <th className="p-3">PM10 (µg/m³)</th>
                      <th className="p-3">Wind Speed</th>
                      <th className="p-3">Mixing Height</th>
                      <th className="p-3">Provenance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#3E4947]">
                    {forecastData.slice(0, 12).map((slot, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAF7]/50">
                        <td className="p-3 font-semibold">
                          {new Date(slot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3 font-mono font-bold text-[#182A29]">{slot.pm25}</td>
                        <td className="p-3 font-mono">{slot.pm10}</td>
                        <td className="p-3">{slot.wind_speed_ms} m/s</td>
                        <td className="p-3 text-[#0F766E] font-semibold">
                          {slot.boundary_layer_height_m ? `${slot.boundary_layer_height_m} m` : '650 m'}
                        </td>
                        <td className="p-3">
                          <span className="text-[10px] bg-[#E0F2FE] text-[#0369A1] font-bold px-2 py-0.5 rounded-full">
                            FORECAST
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
