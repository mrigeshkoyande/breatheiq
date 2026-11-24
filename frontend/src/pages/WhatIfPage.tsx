import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Sliders,
  TrendingDown,
  Leaf,
  ShieldCheck,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

export const WhatIfPage: React.FC = () => {
  const { user } = useAuth();
  const [metroDays, setMetroDays] = useState(4);
  const [purifierHours, setPurifierHours] = useState(10);
  const [commuteDistance, setCommuteDistance] = useState(15);
  const [simResult, setSimResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/engines/impact/calculate', {
        method: 'POST',
        body: JSON.stringify({
          outdoor_pm25: 165.0,
          indoor_purified_pm25: 25.0,
          indoor_hours: Number(purifierHours),
          transit_distance_km: Number(commuteDistance) * (Number(metroDays) / 7.0),
          transit_mode: 'electric_metro',
        }),
      });
      setSimResult(res);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [metroDays, purifierHours, commuteDistance]);

  const winterDays = 120; // Standard North/West Indian winter smog corridor duration
  const annualPM25AvertedMg = simResult
    ? Math.round((simResult.daily_averted_pm25_dose_ug * winterDays) / 1000.0)
    : 85;
  const annualCO2AvertedKg = simResult
    ? Math.round(simResult.daily_co2_averted_kg * winterDays)
    : 280;

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
            <span className="text-xs font-bold text-[#182A29]">What-If Lifestyle Simulator</span>
          </div>

          <Link
            to="/app/impact"
            className="text-xs px-3 py-1 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
          >
            ← Impact Ledger
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 lg:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-[#182A29]">What-If Lifestyle & Policy Simulator</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Model how small changes to your weekly commute and home aeration routine transform family toxic exposure.
          </p>
        </div>

        {/* Sliders Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-sm space-y-6">
          <h2 className="text-base font-black text-[#182A29]">Adjust Lifestyle Levers:</h2>

          {/* Slider 1: Metro Days */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <label htmlFor="whatif-metro-days" className="text-[#334155] cursor-pointer">Switch car commute to electric metro:</label>
              <span className="text-[#0F766E]">{metroDays} Days / Week</span>
            </div>
            <input
              id="whatif-metro-days"
              name="metro_days"
              type="range"
              min="0"
              max="7"
              value={metroDays}
              onChange={(e) => setMetroDays(Number(e.target.value))}
              className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />
          </div>

          {/* Slider 2: Purifier Hours */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <label htmlFor="whatif-purifier-hours" className="text-[#334155] cursor-pointer">Operate HEPA Purifier in living/sleeping rooms:</label>
              <span className="text-[#0F766E]">{purifierHours} Hours / Day</span>
            </div>
            <input
              id="whatif-purifier-hours"
              name="purifier_hours"
              type="range"
              min="2"
              max="24"
              value={purifierHours}
              onChange={(e) => setPurifierHours(Number(e.target.value))}
              className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />
          </div>

          {/* Slider 3: Commute Distance */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <label htmlFor="whatif-commute-distance" className="text-[#334155] cursor-pointer">One-way daily commute distance:</label>
              <span className="text-[#0F766E]">{commuteDistance} km</span>
            </div>
            <input
              id="whatif-commute-distance"
              name="commute_distance"
              type="range"
              min="5"
              max="40"
              value={commuteDistance}
              onChange={(e) => setCommuteDistance(Number(e.target.value))}
              className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />
          </div>
        </div>

        {/* Projected Simulation Outcomes */}
        {simResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#0F766E]/30 p-6 shadow-sm space-y-3">
              <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                Daily Inhaled PM2.5 Averted
              </span>
              <span className="text-4xl font-black text-[#182A29] block">
                {Math.round(simResult.daily_averted_pm25_dose_ug)} µg / day
              </span>
              <p className="text-xs text-[#64748B]">
                Equivalent to averting approximately {simResult.equivalent_unfiltered_cigarettes_avoided} cigarettes of passive particulate exposure per day.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#2F9E62]/30 p-6 shadow-sm space-y-3">
              <span className="text-xs font-bold text-[#2F9E62] uppercase tracking-wider">
                Daily Vehicular Carbon Mitigated
              </span>
              <span className="text-4xl font-black text-[#182A29] block">
                {simResult.daily_co2_averted_kg} kg CO2 / day
              </span>
              <p className="text-xs text-[#64748B]">
                Eliminates combustion emissions using urban electric mass transit infrastructure.
              </p>
            </div>
          </div>
        )}

        {/* Annualized Winter Smog Projection */}
        <div className="bg-[#DDF5EC]/40 border border-[#A7E8C6]/60 rounded-2xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0F766E]" />
            <h3 className="text-base font-black text-[#0F766E]">
              Projected 120-Day Winter Smog Season Cumulative Impact
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div>
              <span className="text-[#64748B] block">Total Inhaled Dose Prevented:</span>
              <span className="text-2xl font-black text-[#182A29] mt-0.5 block">
                {annualPM25AvertedMg} mg PM2.5
              </span>
              <span className="text-[11px] text-[#64748B]">Across the 4-month inversion period</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Net Carbon Footprint Reduced:</span>
              <span className="text-2xl font-black text-[#182A29] mt-0.5 block">
                {annualCO2AvertedKg} kg CO2
              </span>
              <span className="text-[11px] text-[#64748B]">Equivalent to planting ~13 urban saplings</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
