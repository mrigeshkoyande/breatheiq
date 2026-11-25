import React, { useEffect, useState } from 'react';
import { Sliders } from 'lucide-react';
import { useCurrentAirQuality, useHousehold } from '../api/hooks';
import { apiRequest } from '../services/api';
import { HouseholdImpactSummary } from '../types/api';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ErrorBanner } from '../components/ui/StatusBanner';

export const WhatIfPage: React.FC = () => {
  const { data: household } = useHousehold();
  const { data: airData } = useCurrentAirQuality(household?.city || 'Mumbai');
  const outdoorPm25 = airData?.pm25 ?? 160;

  const [indoorPm25, setIndoorPm25] = useState(25);
  const [indoorHours, setIndoorHours] = useState(12);
  const [transitKm, setTransitKm] = useState(15);
  const [transitMode, setTransitMode] = useState('electric_metro');
  const [simResult, setSimResult] = useState<HouseholdImpactSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        try {
          setErrorMsg('');
          const res = await apiRequest<HouseholdImpactSummary>('/engines/impact/calculate', {
            method: 'POST',
            body: JSON.stringify({
              outdoor_pm25: outdoorPm25,
              indoor_purified_pm25: indoorPm25,
              indoor_hours: indoorHours,
              transit_distance_km: transitKm,
              transit_mode: transitMode,
            }),
          });
          setSimResult(res);
        } catch (err: unknown) {
          setErrorMsg(err instanceof Error ? err.message : 'Unable to evaluate scenario.');
        }
      })();
    }, 200);
    return () => clearTimeout(timer);
  }, [outdoorPm25, indoorPm25, indoorHours, transitKm, transitMode]);

  return (
    <AppShell title="What-If Impact Scenario Builder">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Sliders className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
              Seasonal Lifestyle Impact Simulator
            </h1>
            <p className="text-sm text-[#475569]">
              Evaluating against current {household?.city || 'Mumbai'} PM2.5 ({outdoorPm25} µg/m³).
            </p>
          </div>
          <Badge badgeType="ESTIMATED" />
        </div>

        {errorMsg && <ErrorBanner message={errorMsg} />}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="space-y-5">
            <h2 className="font-bold text-lg">Adjust Daily Habits</h2>
            <div>
              <label htmlFor="wi-indoor-pm" className="flex justify-between text-xs font-bold mb-1">
                <span>Indoor Purified Target PM2.5</span>
                <span>{indoorPm25} µg/m³</span>
              </label>
              <input
                id="wi-indoor-pm"
                type="range"
                min={5}
                max={100}
                value={indoorPm25}
                onChange={(e) => setIndoorPm25(Number(e.target.value))}
                className="w-full accent-[#0F766E]"
              />
            </div>
            <div>
              <label htmlFor="wi-hours" className="flex justify-between text-xs font-bold mb-1">
                <span>Protected Indoor Hours / Day</span>
                <span>{indoorHours} hrs</span>
              </label>
              <input
                id="wi-hours"
                type="range"
                min={2}
                max={24}
                value={indoorHours}
                onChange={(e) => setIndoorHours(Number(e.target.value))}
                className="w-full accent-[#0F766E]"
              />
            </div>
            <div>
              <label htmlFor="wi-km" className="flex justify-between text-xs font-bold mb-1">
                <span>Daily Transit Switch Distance</span>
                <span>{transitKm} km</span>
              </label>
              <input
                id="wi-km"
                type="range"
                min={0}
                max={60}
                value={transitKm}
                onChange={(e) => setTransitKm(Number(e.target.value))}
                className="w-full accent-[#0F766E]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="wi-mode" className="text-xs font-bold uppercase text-[#334155]">
                Commute Mode Replacing Solo Car
              </label>
              <select
                id="wi-mode"
                value={transitMode}
                onChange={(e) => setTransitMode(e.target.value)}
                className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="electric_metro">Electric Metro</option>
                <option value="cng_bus">CNG Public Bus</option>
                <option value="cycling_walking">Cycling / Walking</option>
              </select>
            </div>
          </Card>

          <Card elevated className="space-y-4">
            <h2 className="font-bold text-lg">Estimated Daily & 90-Day Winter Impact</h2>
            {simResult ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#EBF7F0] border border-[#A3E5BA]">
                  <div className="text-xs font-bold text-[#0F766E]">Daily Averted PM2.5 Intake</div>
                  <div className="text-3xl font-extrabold mt-1">
                    {simResult.daily_averted_pm25_dose_ug} µg
                  </div>
                  <div className="text-xs text-[#475569] mt-1">
                    {simResult.inhalation_detail.protection_efficiency_pct}% reduction vs unfiltered air
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <div className="text-xs font-bold text-[#475569]">Daily CO2 Saved</div>
                    <div className="text-xl font-extrabold mt-1">{simResult.daily_co2_averted_kg} kg</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <div className="text-xs font-bold text-[#475569]">90-Day CO2 Saved</div>
                    <div className="text-xl font-extrabold mt-1">
                      {(simResult.daily_co2_averted_kg * 90).toFixed(1)} kg
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">{simResult.methodology}</p>
              </div>
            ) : (
              <p className="text-sm text-[#475569]">Adjust sliders to evaluate scenario...</p>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
};
