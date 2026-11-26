import React, { useState } from 'react';
import { BookOpen, Calculator, ShieldAlert } from 'lucide-react';
import { useNaqiBreakpoints } from '../api/hooks';
import { apiRequest } from '../services/api';
import { NAQIResult } from '../types/api';
import { PublicHeader } from '../components/layout/PublicHeader';
import { SkipLink } from '../components/layout/SkipLink';
import { NaqiFormulaCard } from '../components/methodology/NaqiFormulaCard';
import { AqiBadge } from '../components/ui/AqiBadge';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ErrorBanner } from '../components/ui/StatusBanner';
import { CpcbCategory } from '../utils/calculations';

/** Public methodology reference and interactive CPCB NAQI sub-index calculator. */
export const MethodologyPage: React.FC = () => {
  const { data: breakpointsTable } = useNaqiBreakpoints();
  const [pm25, setPm25] = useState('85');
  const [pm10, setPm10] = useState('140');
  const [no2, setNo2] = useState('48');
  const [so2, setSo2] = useState('16');
  const [co, setCo] = useState('1.2');
  const [o3, setO3] = useState('35');

  const [calcResult, setCalcResult] = useState<NAQIResult | null>(null);
  const [calcError, setCalcError] = useState('');
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);
    setCalcError('');
    try {
      const res = await apiRequest<NAQIResult>('/engines/naqi/calculate', {
        method: 'POST',
        body: JSON.stringify({
          readings: {
            pm25: Number(pm25),
            pm10: Number(pm10),
            no2: Number(no2),
            so2: Number(so2),
            co: Number(co),
            o3: Number(o3),
          },
        }),
      });
      setCalcResult(res);
    } catch (err: unknown) {
      setCalcResult(null);
      setCalcError(err instanceof Error ? err.message : 'Unable to evaluate CPCB NAQI.');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col">
      <SkipLink />
      <PublicHeader />

      <main
        id="main-content"
        className="flex-1 max-w-6xl w-full mx-auto px-4 lg:px-8 py-10 space-y-8"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            Statutory Atmospheric Methods
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            CPCB NAQI & Exposure Methodology
          </h1>
          <p className="text-sm text-[#475569] max-w-3xl">
            BreatheIQ computes composite NAQI-style air quality indices directly from raw pollutant
            concentrations using Central Pollution Control Board (CPCB) piecewise linear equations.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <NaqiFormulaCard categories={breakpointsTable?.categories} />

          <Card elevated className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Calculator className="w-5 h-5 text-[#0F766E]" aria-hidden="true" />
                <h2>Interactive NAQI Sandbox</h2>
              </div>
              <Badge badgeType="ESTIMATED" />
            </div>

            {calcError && <ErrorBanner message={calcError} />}

            <form onSubmit={(e) => void handleCalculate(e)} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input
                  label="PM2.5 (µg/m³)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={pm25}
                  onChange={(e) => setPm25(e.target.value)}
                />
                <Input
                  label="PM10 (µg/m³)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={pm10}
                  onChange={(e) => setPm10(e.target.value)}
                />
                <Input
                  label="NO2 (µg/m³)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={no2}
                  onChange={(e) => setNo2(e.target.value)}
                />
                <Input
                  label="SO2 (µg/m³)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={so2}
                  onChange={(e) => setSo2(e.target.value)}
                />
                <Input
                  label="CO (mg/m³)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={co}
                  onChange={(e) => setCo(e.target.value)}
                />
                <Input
                  label="O3 (µg/m³)"
                  type="number"
                  step="0.1"
                  min="0"
                  value={o3}
                  onChange={(e) => setO3(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={calculating} className="w-full">
                {calculating ? 'Computing CPCB Sub-Indices...' : 'Calculate CPCB NAQI'}
              </Button>
            </form>

            {calcResult && (
              <div
                className="p-4 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] space-y-3"
                aria-live="polite"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-base">
                    Composite Score: {calcResult.aqi ?? 'Insufficient Data'}
                  </span>
                  {calcResult.category && calcResult.category !== 'Incomplete Data' && (
                    <AqiBadge
                      aqi={calcResult.aqi ?? 0}
                      category={calcResult.category as CpcbCategory}
                    />
                  )}
                </div>
                <p className="text-xs text-[#475569]">{calcResult.health_advisory}</p>
                <div className="text-xs text-[#334155]">
                  Dominant Driver: <strong>{calcResult.dominant_pollutant ?? 'N/A'}</strong>
                </div>
              </div>
            )}

            <div className="text-xs text-[#475569] flex items-center gap-2 pt-1">
              <ShieldAlert className="w-4 h-4 text-[#0F766E] shrink-0" aria-hidden="true" />
              <span>
                Advisory only — follows public CPCB/WHO guidance and is not medical advice.
              </span>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};
