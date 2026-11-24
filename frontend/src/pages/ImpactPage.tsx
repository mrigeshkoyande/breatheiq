import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Leaf,
  ShieldCheck,
  Download,
  Calendar,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

export const ImpactPage: React.FC = () => {
  const { user } = useAuth();
  const [impactData, setImpactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImpact = async () => {
      setLoading(true);
      try {
        const data = await apiRequest('/user/impact');
        setImpactData(data);
      } catch {
        // Handled
      } finally {
        setLoading(false);
      }
    };
    fetchImpact();
  }, []);

  const handleExport = () => {
    if (!impactData) return;
    const blob = new Blob([JSON.stringify(impactData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breatheiq_impact_ledger_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <span className="text-xs font-bold text-[#182A29]">Impact Ledger</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              to="/app/impact/what-if"
              className="text-[#0F766E] font-bold hover:underline"
            >
              What-If Simulator →
            </Link>
            <Link
              to="/app/dashboard"
              className="px-3 py-1 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#182A29]">Personal & Household Impact Ledger</h1>
            <p className="text-xs text-[#64748B] mt-1">
              Verifiable inhaled particulate dosage averted and carbon emissions mitigated through active choices.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="text-xs font-bold px-4 py-2 rounded-xl border border-[#0F766E] text-[#0F766E] hover:bg-[#DDF5EC]/40 flex items-center gap-2 transition self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Export Impact Data (JSON)</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center gap-2 text-xs font-bold text-[#0F766E]">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Calculating Inhaled Dosages...</span>
          </div>
        ) : impactData ? (
          <>
            {/* Bento Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Averted PM2.5 Inhaled</span>
                <span className="text-3xl font-black text-[#0F766E] block">
                  {impactData.total_averted_pm25_mg} mg
                </span>
                <span className="text-[11px] text-[#64748B]">Saved across indoor filtration & transit</span>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Averted Vehicular CO2</span>
                <span className="text-3xl font-black text-[#2F9E62] block">
                  {impactData.total_averted_co2_kg} kg
                </span>
                <span className="text-[11px] text-[#64748B]">Via electric metro & clean commuting</span>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">AQI-Hours Avoided</span>
                <span className="text-3xl font-black text-[#0284C7] block">
                  {impactData.total_aqi_hours_avoided}
                </span>
                <span className="text-[11px] text-[#64748B]">Cumulative exposure score reduction</span>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Clean-Air Active Streak</span>
                <span className="text-3xl font-black text-[#D97706] block">
                  {impactData.clean_air_streak_days} Days
                </span>
                <span className="text-[11px] text-[#64748B]">Consecutive days following daily routine</span>
              </div>
            </div>

            {/* Time Series History Table */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <h2 className="text-base font-black text-[#182A29]">Daily Impact Log History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF7] text-[#64748B] font-bold border-b border-[#E2E8F0]">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Averted PM2.5 (µg)</th>
                      <th className="p-3">CO2 Averted (kg)</th>
                      <th className="p-3">AQI-Hours</th>
                      <th className="p-3">Action Details</th>
                      <th className="p-3">Provenance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[#3E4947]">
                    {impactData.history.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#F8FAF7]/50">
                        <td className="p-3 font-semibold">{log.date_str}</td>
                        <td className="p-3 font-mono font-bold text-[#0F766E]">{log.averted_pm25_dose_ug} µg</td>
                        <td className="p-3 font-mono">{log.averted_co2_kg} kg</td>
                        <td className="p-3">{log.aqi_hours_avoided}</td>
                        <td className="p-3 text-[#64748B]">{log.notes || 'Routine adherence'}</td>
                        <td className="p-3">
                          <span className="text-[10px] bg-[#DDF5EC] text-[#0F766E] font-bold px-2 py-0.5 rounded-full">
                            ESTIMATED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sourced Methodology Callout */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-2 text-xs">
              <span className="font-bold text-[#0F766E] block">Sourced Calculation Methodology</span>
              <p className="text-[#64748B] leading-relaxed">
                Inhaled particulate dosage is derived from USEPA Exposure Factors Handbook Chapter 6 (Adult resting volume: 0.50 m³/h; active transit volume: 0.83 m³/h).
                Transit emission baselines follow ARAI vehicular factors (180 g CO2/km for solo car travel vs 18 g CO2/km for metro rail).
              </p>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};
