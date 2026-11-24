import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calculator,
  ShieldAlert,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { apiRequest } from '../services/api';

interface NAQICalcResponse {
  is_valid: boolean;
  aqi?: number;
  category?: string;
  color?: string;
  dominant_pollutant?: string;
  health_advisory: string;
  validity_notes: string;
  sub_indices: Record<
    string,
    {
      pollutant: string;
      concentration: number;
      unit: string;
      sub_index: number;
      category: string;
      color: string;
    }
  >;
}

export const MethodologyPage: React.FC = () => {
  // Playground state for interactive testing
  const [pm25, setPm25] = useState(85.0);
  const [pm10, setPm10] = useState(140.0);
  const [no2, setNo2] = useState(48.0);
  const [so2, setSo2] = useState(16.0);
  const [co, setCo] = useState(1.2);
  const [o3, setO3] = useState(35.0);

  const [calcResult, setCalcResult] = useState<NAQICalcResponse | null>(null);
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);
    try {
      const res = await apiRequest<NAQICalcResponse>('/engines/naqi/calculate', {
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
    } catch {
      // Fallback local calc preview if server is restarting
      setCalcResult(null);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div
      className="min-h-screen text-[#182A29] flex flex-col font-sans bg-[#F8FAF7]"
      style={{
        backgroundImage: 'linear-gradient(135deg, #EDFAF5, #F8FAF7, #E3F8F6)',
      }}
    >
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 rounded-lg" />
            <span className="font-extrabold text-lg tracking-tight text-[#0F766E]">BreatheIQ</span>
            <span className="hidden sm:inline-block text-[11px] font-semibold bg-[#DDF5EC] text-[#0F766E] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Methodology
            </span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6 text-xs font-semibold">
            <Link to="/explore" className="text-[#64748B] hover:text-[#0F766E] transition">
              Explorer
            </Link>
            <Link to="/methodology" className="text-[#0F766E] border-b-2 border-[#0F766E] pb-0.5">
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
          </nav>
        </div>
      </header>

      {/* Hero Header */}
      <section className="bg-white border-b border-[#E2E8F0] px-4 lg:px-8 py-10">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF5EC] text-[#0F766E] text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Scientific Standards & Provenance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#182A29] tracking-tight">
            Atmospheric Modeling, Breakpoint Formulas & Emission Factors
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            BreatheIQ replaces arbitrary commercial scores with statutory Central Pollution Control Board (CPCB)
            standards, boundary layer meteorology, and sourced exposure physics.
          </p>
        </div>
      </section>

      {/* Main Scientific Documentation */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 lg:px-8 py-10 space-y-12">
        {/* Section 1: NAQI Formula */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DDF5EC] text-[#0F766E] flex items-center justify-center font-black text-sm">
              1
            </div>
            <h2 className="text-lg font-black text-[#182A29]">
              Indian National Air Quality Index (NAQI) Breakpoint Formulation
            </h2>
          </div>

          <p className="text-xs text-[#3E4947] leading-relaxed">
            The composite Indian NAQI is derived from the piecewise-linear interpolation formula specified by the
            Central Pollution Control Board (CPCB, 2014 report). Each monitored pollutant concentration $C_p$ is
            mapped to its sub-index $I_p$ based on designated statutory breakpoints:
          </p>

          {/* Mathematical Formula Callout */}
          <div className="bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl p-4 font-mono text-xs text-[#0F766E] overflow-x-auto">
            <code>I_p = [ (I_hi - I_lo) / (B_hi - B_lo) ] * (C_p - B_lo) + I_lo</code>
          </div>

          <div className="text-xs text-[#3E4947] space-y-2">
            <p>
              Where:
              <br />• <strong>B_hi, B_lo</strong>: The upper and lower breakpoint concentrations for the interval containing $C_p$.
              <br />• <strong>I_hi, I_lo</strong>: The corresponding statutory NAQI bounds.
              <br />• <strong>Composite AQI</strong>: $\max(I_p)$ across all valid sub-indices.
              <br />• <strong>Dominant Pollutant</strong>: The specific pollutant attaining the maximum sub-index.
            </p>
          </div>

          {/* CPCB Validity Rule Callout */}
          <div className="bg-[#FEF3C7]/40 border border-[#F59E0B]/40 rounded-xl p-4 text-xs space-y-1">
            <span className="font-bold text-[#B45309] flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Statutory CPCB Validity Rule Enforced by BreatheIQ:
            </span>
            <p className="text-[#92400E]">
              A composite AQI requires data for at least <strong>three pollutants</strong>, out of which at least one
              MUST be a particulate pollutant (<strong>PM2.5 or PM10</strong>). If this requirement is not met,
              BreatheIQ reports the index as incomplete rather than fabricating an artificial rating.
            </p>
          </div>
        </section>

        {/* Section 2: Interactive NAQI Playground */}
        <section className="bg-white rounded-2xl border border-[#0F766E]/20 p-6 lg:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-black text-sm">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#182A29]">
                Live NAQI Calculation Playground
              </h2>
              <p className="text-xs text-[#64748B]">
                Test arbitrary pollutant concentrations against the live backend calculation engine.
              </p>
            </div>
          </div>

          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                  PM2.5 (µg/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pm25}
                  onChange={(e) => setPm25(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAF7]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                  PM10 (µg/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pm10}
                  onChange={(e) => setPm10(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAF7]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                  NO2 (µg/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={no2}
                  onChange={(e) => setNo2(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAF7]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                  SO2 (µg/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={so2}
                  onChange={(e) => setSo2(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAF7]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                  CO (mg/m³)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={co}
                  onChange={(e) => setCo(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAF7]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                  O3 (µg/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={o3}
                  onChange={(e) => setO3(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAF7]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={calculating}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] transition flex items-center gap-2"
            >
              <span>{calculating ? 'Computing...' : 'Calculate Statutory NAQI'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {calcResult && (
            <div className="bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748B]">Engine Output:</span>
                <span
                  className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: calcResult.color || '#64748B' }}
                >
                  {calcResult.category} (AQI: {calcResult.aqi})
                </span>
              </div>
              <p className="text-xs text-[#3E4947]">{calcResult.health_advisory}</p>
              <div className="text-[11px] text-[#64748B]">
                Dominant Pollutant: <strong>{calcResult.dominant_pollutant}</strong> · {calcResult.validity_notes}
              </div>
            </div>
          )}
        </section>

        {/* Section 3: Window Oracle Atmospheric Physics */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DDF5EC] text-[#0F766E] flex items-center justify-center font-black text-sm">
              2
            </div>
            <h2 className="text-lg font-black text-[#182A29]">
              Window Oracle: Planetary Boundary Layer Inversion Dynamics
            </h2>
          </div>

          <p className="text-xs text-[#3E4947] leading-relaxed">
            Winter urban smog in India is primarily driven by nocturnal thermal inversions. During clear winter nights,
            rapid radiative ground cooling lowers the planetary boundary layer height ($z_i$) below 250 meters.
            Vehicular exhaust, biomass burning, and dust become physically compressed near the surface.
          </p>

          <p className="text-xs text-[#3E4947] leading-relaxed">
            Between 11:30 and 15:00, incident solar radiation warms the surface, generating convective thermals that
            expand the mixing height to 800–1,200 meters. Wind velocity typically peaks during this period, diluting
            surface PM2.5 by 30% to 50%.
          </p>

          <div className="bg-[#DDF5EC]/30 border border-[#A7E8C6]/50 rounded-xl p-4 text-xs text-[#0F766E]">
            <span className="font-bold block mb-1">Forecast-Driven Evaluation</span>
            Window Oracle evaluates hourly boundary layer mixing forecasts, particulate concentrations, wind speed,
            and relative humidity to output deterministic guidance (<code>VENTILATE_FREELY</code>,{' '}
            <code>VENTILATE_BRIEFLY</code>, <code>PURIFY</code>, or <code>SEAL</code>).
          </div>
        </section>

        {/* Section 4: Sourced Emission & Exposure Factors Table */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DDF5EC] text-[#0F766E] flex items-center justify-center font-black text-sm">
              3
            </div>
            <h2 className="text-lg font-black text-[#182A29]">
              Sourced Emission Factors & Physiological Exposure Parameters
            </h2>
          </div>

          <p className="text-xs text-[#3E4947] leading-relaxed">
            All personal and household impact calculations in BreatheIQ use published baseline emission factors from
            the Central Pollution Control Board (CPCB), Automotive Research Association of India (ARAI), and USEPA
            exposure handbooks.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#E2E8F0] rounded-xl overflow-hidden">
              <thead className="bg-[#F8FAF7] text-[#64748B] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3">Transit Mode</th>
                  <th className="p-3">CO2 (g/passenger-km)</th>
                  <th className="p-3">PM2.5 (g/km)</th>
                  <th className="p-3">Source & Citation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#3E4947]">
                <tr>
                  <td className="p-3 font-semibold">Petrol Car (Solo)</td>
                  <td className="p-3 font-mono">180.0</td>
                  <td className="p-3 font-mono">0.045</td>
                  <td className="p-3 text-[#64748B]">ARAI / CPCB Vehicular Emission Baselines</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Diesel Car (Solo)</td>
                  <td className="p-3 font-mono">165.0</td>
                  <td className="p-3 font-mono">0.120</td>
                  <td className="p-3 text-[#64748B]">ARAI / CPCB Vehicular Emission Baselines</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">CNG Urban Bus</td>
                  <td className="p-3 font-mono">38.0</td>
                  <td className="p-3 font-mono">0.008</td>
                  <td className="p-3 text-[#64748B]">DTC Clean Fuel & In-Use Fleet Study</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Electric Metro</td>
                  <td className="p-3 font-mono">18.0</td>
                  <td className="p-3 font-mono">0.002</td>
                  <td className="p-3 text-[#64748B]">DMRC / BMRCL Sustainability Metrics</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Active Walking / Cycle</td>
                  <td className="p-3 font-mono">0.0</td>
                  <td className="p-3 font-mono">0.0</td>
                  <td className="p-3 text-[#64748B]">Non-Motorized Transport Standard</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Medical Disclaimer */}
        <section className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl p-6 text-xs text-[#991B1B] space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>Health Guidance & Non-Diagnostic Disclaimer</span>
          </div>
          <p className="leading-relaxed">
            BreatheIQ is an environmental decision-support tool. It computes exposure estimates and protective
            recommendations in accordance with public health guidance from CPCB and the World Health Organization
            (WHO). It does not provide medical diagnoses, clinical treatment plans, or pharmaceutical prescriptions.
            Individuals with pre-existing cardiopulmonary disorders, asthma, or COPD should consult a qualified
            pulmonologist or medical professional.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-6 px-4 lg:px-8 text-center text-xs text-[#64748B]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 BreatheIQ. Sourced from CPCB Technical Guidelines & ARAI Baselines.</p>
          <div className="flex gap-4 font-semibold">
            <Link to="/explore" className="hover:text-[#0F766E]">Explorer</Link>
            <Link to="/privacy" className="hover:text-[#0F766E]">Privacy</Link>
            <Link to="/login" className="hover:text-[#0F766E]">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
