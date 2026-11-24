import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wind,
  Layers,
  Thermometer,
  Droplets,
  ShieldCheck,
  RefreshCw,
  Clock,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

export const AirQualityPage: React.FC = () => {
  const { user } = useAuth();
  const [airData, setAirData] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [loading, setLoading] = useState(true);

  const fetchAQI = async (city: string) => {
    setLoading(true);
    try {
      const data = await apiRequest(`/air-quality/current?city=${encodeURIComponent(city)}`);
      setAirData(data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAQI(selectedCity);
  }, [selectedCity]);

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
            <span className="text-xs font-bold text-[#182A29]">Air Quality Deep Dive</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-[#F8FAF7] border border-[#CBD5E1] rounded-lg px-2.5 py-1 font-semibold"
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Pune">Pune</option>
            </select>
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
        <div>
          <h1 className="text-2xl font-black text-[#182A29]">Air Quality & Ground Station Telemetry</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Verified Central Pollution Control Board (CPCB) statutory breakpoints and sub-indices.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center gap-2 text-xs font-bold text-[#0F766E]">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Updating Telemetry...</span>
          </div>
        ) : airData ? (
          <>
            {/* Overview Dial Banner */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#DDF5EC] text-[#0F766E]">
                  {airData.source} OBSERVATION
                </span>
                <h2 className="text-xl font-black text-[#182A29]">{airData.location_name}</h2>
                <p className="text-xs text-[#64748B]">
                  Dominant Driver: <strong>{airData.naqi.dominant_pollutant}</strong> · Monitored Parameters: 6
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-md"
                  style={{ backgroundColor: airData.naqi.color }}
                >
                  <span className="text-3xl leading-none">{airData.naqi.aqi}</span>
                  <span className="text-[10px] uppercase">NAQI</span>
                </div>
                <div>
                  <span className="text-base font-black uppercase" style={{ color: airData.naqi.color }}>
                    {airData.naqi.category}
                  </span>
                  <span className="text-xs text-[#64748B] block mt-0.5">
                    Updated {new Date(airData.timestamp_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                  </span>
                </div>
              </div>
            </div>

            {/* Pollutant Sub-index Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(airData.naqi.sub_indices).map(([key, item]: [string, any]) => (
                <div key={key} className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-[#182A29]">{item.pollutant}</span>
                    <span
                      className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-[#182A29]">
                      {item.concentration} <span className="text-xs font-normal text-[#64748B]">{item.unit}</span>
                    </span>
                    <span className="text-xs font-bold text-[#64748B]">Sub-index: {item.sub_index}</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (item.sub_index / 500) * 100)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Health Advisory */}
            <div className="bg-[#DDF5EC]/30 border border-[#A7E8C6]/50 rounded-2xl p-6 flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#0F766E] block mb-1">Official CPCB Health Advisory</span>
                <p className="text-[#3E4947] leading-relaxed">{airData.naqi.health_advisory}</p>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};
