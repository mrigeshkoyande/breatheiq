import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Wind,
  Activity,
  Compass,
  Home,
  Users,
  CheckCircle2,
  ChevronDown,
  Info,
  Calendar,
  Layers,
  Search,
} from 'lucide-react';

interface CityOption {
  name: string;
  station: string;
  aqi: number;
  category: string;
  pm25: number;
  pm10: number;
  wind: string;
}

const CITIES: CityOption[] = [
  {
    name: 'Andheri West, Mumbai',
    station: 'MPCB Station #18',
    aqi: 168,
    category: 'Moderate',
    pm25: 78,
    pm10: 142,
    wind: 'WSW 11 km/h (Marine)',
  },
  {
    name: 'Connaught Place, Delhi',
    station: 'CPCB DPCC Station #04',
    aqi: 342,
    category: 'Very Poor',
    pm25: 184,
    pm10: 310,
    wind: 'NW 4 km/h (Calm Inversion)',
  },
  {
    name: 'Shivajinagar, Pune',
    station: 'MPCB Station #09',
    aqi: 124,
    category: 'Moderate',
    pm25: 48,
    pm10: 96,
    wind: 'W 8 km/h',
  },
  {
    name: 'Indiranagar, Bengaluru',
    station: 'KSPCB Station #03',
    aqi: 64,
    category: 'Satisfactory',
    pm25: 22,
    pm10: 54,
    wind: 'E 14 km/h',
  },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState<CityOption>(CITIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState<'EN' | 'HI' | 'MR'>('EN');
  const [audienceTab, setAudienceTab] = useState<'families' | 'schools' | 'communities'>('families');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // What-If interactive simulator state
  const [metroDays, setMetroDays] = useState(4);
  const [carpoolTrips, setCarpoolTrips] = useState(3);
  const [inductionStove, setInductionStove] = useState(true);

  // Dynamic calculation for What-If simulator
  const avoidedPM = metroDays * 45 + carpoolTrips * 30 + (inductionStove ? 40 : 0);

  const filteredCities = CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.station.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] antialiased flex flex-col font-sans selection:bg-[#DDF5EC] selection:text-[#0F766E]">
      {/* 0. ANNOUNCEMENT BAR */}
      <section className="w-full bg-[#115E59] text-white px-4 lg:px-10 py-2 text-center shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-center flex-wrap gap-2 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#A8ECE5] text-[#266D68] text-[10px] uppercase font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] animate-pulse"></span>
            Winter Smog Alert
          </span>
          <span>Diurnal thermal inversion forecasting is now active across 42 Indian municipal corridors.</span>
          <a
            href="#what-if"
            className="underline text-[#9CF2E8] hover:text-white transition-colors ml-1 inline-flex items-center gap-1 font-semibold"
          >
            Explore What-If Simulator <ArrowRight className="w-3 h-3 inline" />
          </a>
        </div>
      </section>

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-[#F8FAF7]/90 backdrop-blur-xl border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto h-20 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo-mark.webp" alt="BreatheIQ Logo" className="w-9 h-9 rounded-lg shadow-sm" />
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-xl text-[#182A29] leading-none tracking-tight">
                  Breathe<span className="text-[#0F766E]">IQ</span>
                </span>
                <span className="text-[10px] font-bold text-[#64748B] tracking-wider uppercase leading-none mt-0.5">
                  Urban Air Quality Assistant
                </span>
              </div>
            </Link>

            <nav className="hidden xl:flex items-center gap-1 pl-4">
              <a
                href="#features"
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#182A29] hover:bg-[#DDF2F0] transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#182A29] hover:bg-[#DDF2F0] transition-colors"
              >
                How It Works
              </a>
              <a
                href="#what-if"
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#182A29] hover:bg-[#DDF2F0] transition-colors"
              >
                What-If Simulator
              </a>
              <a
                href="#transparency"
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#182A29] hover:bg-[#DDF2F0] transition-colors"
              >
                Data Provenance
              </a>
              <a
                href="#faq"
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#182A29] hover:bg-[#DDF2F0] transition-colors"
              >
                FAQ
              </a>
              <Link
                to="/dev/ui"
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#0F766E] hover:bg-[#DDF5EC] transition-colors"
              >
                Design Sandbox (/dev/ui)
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-[#E3F8F6] rounded-lg p-0.5 border border-[#BDC9C6]">
              {(['EN', 'HI', 'MR'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                    language === lang
                      ? 'bg-white text-[#182A29] shadow-sm'
                      : 'text-[#64748B] hover:text-[#182A29]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {user ? (
              <Link
                to="/app/dashboard"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] text-xs font-bold transition-colors shadow-sm"
              >
                Dashboard
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#182A29] hover:bg-[#DDF2F0] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] text-xs font-bold transition-colors shadow-sm"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION WITH MUMBAI COASTAL SKYLINE & LIVE AIR CARD */}
      <section className="relative w-full px-4 lg:px-8 py-16 lg:py-24 overflow-hidden bg-gradient-to-b from-[#E9FEFB] via-[#E3F8F6] to-[#F8FAF7]">
        {/* Mumbai Coastal Skyline & Bandra-Worli Sea Link SVG background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          <div className="absolute -right-20 -top-16 w-[600px] h-[400px] bg-gradient-to-br from-[#A8ECE5]/30 to-transparent rounded-full filter blur-3xl opacity-60"></div>
          <div className="absolute -left-12 top-10 w-[450px] h-[300px] bg-[#DDF5EC]/50 filter blur-3xl opacity-50"></div>
          <svg
            className="absolute bottom-0 right-0 w-full lg:w-[60%] h-[320px] opacity-30"
            fill="none"
            viewBox="0 0 1000 420"
            preserveAspectRatio="xMaxYMin meet"
          >
            <path
              d="M0 380 C180 340, 360 410, 580 370 C760 340, 880 395, 1000 365 L1000 420 L0 420 Z"
              fill="#0F766E"
              opacity="0.08"
            />
            {/* Sea Link Main Pylon 1 */}
            <polygon fill="#115E59" opacity="0.3" points="570,370 592,110 598,110 620,370 608,370 595,150 582,370" />
            <line x1="595" y1="125" x2="480" y2="345" stroke="#0F766E" strokeWidth="1" opacity="0.4" />
            <line x1="595" y1="145" x2="505" y2="345" stroke="#0F766E" strokeWidth="1" opacity="0.4" />
            <line x1="595" y1="125" x2="710" y2="345" stroke="#0F766E" strokeWidth="1" opacity="0.4" />
            {/* Sea Link Main Pylon 2 */}
            <polygon fill="#115E59" opacity="0.25" points="770,370 788,140 794,140 812,370 802,370 791,175 780,370" />
            <line x1="791" y1="150" x2="715" y2="345" stroke="#0F766E" strokeWidth="1" opacity="0.35" />
            <line x1="791" y1="150" x2="865" y2="345" stroke="#0F766E" strokeWidth="1" opacity="0.35" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Headlines & Location Typeahead */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-[#DDF5EC] border border-[#A7E8C6] text-xs font-bold text-[#0F766E]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Challenge 6 — Urban Air Quality Assistant</span>
            </div>

            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#182A29] tracking-tight leading-[1.1]">
              Breathe Smarter. <span className="text-[#0F766E]">Live Healthier.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-xl">
              Turn confusing AQI numbers into hour-by-hour respiratory defense. Real-time CPCB telemetry,
              Window Oracle ventilation timing, and low-exposure CleanRoute navigation tailored for Indian families.
            </p>

            {/* Location Typeahead & Search */}
            <div className="bg-white p-2.5 rounded-2xl shadow-elevated border border-[#E2E8F0] flex flex-col gap-2 max-w-lg">
              <div className="flex items-center gap-2 px-3 py-1.5">
                <Search className="w-4 h-4 text-[#0F766E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city or monitoring station (e.g., Andheri, Delhi)..."
                  className="w-full text-xs font-medium text-[#182A29] placeholder-[#64748B] outline-none bg-transparent"
                />
              </div>

              {/* City Quick Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#E2E8F0] px-1">
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Quick select:</span>
                {filteredCities.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => {
                      setSelectedCity(city);
                      setSearchQuery('');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      selectedCity.name === city.name
                        ? 'bg-[#0F766E] text-white shadow-sm'
                        : 'bg-[#F8FAF7] text-[#64748B] hover:bg-[#DDF5EC] hover:text-[#0F766E]'
                    }`}
                  >
                    {city.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/signup"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] font-heading font-bold text-sm shadow-elevated transition-transform hover:-translate-y-0.5"
              >
                Start Protecting Your Family
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-5 py-3 rounded-xl bg-white text-[#182A29] hover:bg-[#F8FAF7] border border-[#E2E8F0] font-heading font-bold text-sm shadow-sm transition-colors"
              >
                Explore Live Demo
              </Link>
            </div>
          </div>

          {/* Right Column: Live Ambient Air Telemetry Card */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-end">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-elevated border border-[#E2E8F0] p-6 lg:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#0F766E]" />
                    <span className="text-[11px] uppercase font-bold tracking-wider text-[#64748B]">
                      Live Ambient Air Telemetry
                    </span>
                  </div>
                  <h3 className="font-heading font-extrabold text-2xl text-[#182A29] mt-0.5">
                    {selectedCity.name}
                  </h3>
                  <span className="text-xs text-[#64748B] font-medium">{selectedCity.station}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#DDF5EC] text-[#0F766E] text-[10px] font-bold uppercase tracking-wider">
                    LIVE
                  </span>
                  <span className="text-[10px] text-[#64748B]">Updated 4m ago</span>
                </div>
              </div>

              {/* Main Gauge & Category */}
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading font-extrabold text-6xl text-[#182A29] tabular-nums">
                      {selectedCity.aqi}
                    </span>
                    <span className="text-sm font-bold text-[#64748B] uppercase">CPCB NAQI</span>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2 ${
                      selectedCity.aqi > 300
                        ? 'bg-[#FFDAD6] text-[#DC5252]'
                        : selectedCity.aqi > 200
                        ? 'bg-[#FEF3C7] text-[#DC5252]'
                        : selectedCity.aqi > 100
                        ? 'bg-[#FEF3C7] text-[#B45309]'
                        : 'bg-[#DDF5EC] text-[#0F766E]'
                    }`}
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>{selectedCity.category.toUpperCase()} (CPCB / MPCB)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-right">
                  <div className="bg-[#F8FAF7] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">PM2.5</span>
                    <span className="font-heading font-bold text-base text-[#182A29]">
                      {selectedCity.pm25} µg/m³
                    </span>
                  </div>
                  <div className="bg-[#F8FAF7] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">PM10</span>
                    <span className="font-heading font-bold text-base text-[#182A29]">
                      {selectedCity.pm10} µg/m³
                    </span>
                  </div>
                  <div className="bg-[#F8FAF7] p-2.5 rounded-xl border border-[#E2E8F0] col-span-2 text-left">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">Wind Vector</span>
                    <span className="font-heading font-bold text-xs text-[#0F766E]">
                      {selectedCity.wind}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sparkline Curve */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-1 bg-[#B45309] rounded-full inline-block"></span>
                    Measured Inversion Curve
                  </span>
                  <span className="flex items-center gap-1.5 text-[#0F766E]">
                    <span className="w-3 h-0.5 border-b-2 border-dashed border-[#0F766E] inline-block"></span>
                    6h Dispersion Forecast
                  </span>
                </div>
                <div className="h-16 w-full bg-[#E3F8F6] rounded-xl p-2 relative overflow-hidden border border-[#CCFBF1]">
                  <svg className="w-full h-full" viewBox="0 0 400 48" preserveAspectRatio="none">
                    <path
                      d="M0 32 Q50 36, 100 24 T200 22"
                      fill="none"
                      stroke="#B45309"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M200 22 Q260 14, 320 28 T400 36"
                      fill="none"
                      stroke="#0F766E"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                    <circle cx="200" cy="22" r="4" fill="#B45309" />
                  </svg>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#64748B] mt-1.5 font-medium px-1">
                  <span>06:00 AM (Peak Inversion)</span>
                  <span className="font-bold text-[#B45309]">NOW</span>
                  <span>08:00 PM (Sea Breeze Drop)</span>
                </div>
              </div>

              {/* Copilot verdict popover */}
              <div className="p-3.5 rounded-2xl bg-[#DDF5EC] border border-[#A7E8C6] flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-[#0F766E]">Window Oracle Ventilation Verdict:</span>
                  <p className="text-[#182A29] mt-0.5 leading-relaxed">
                    Solar lifting clears ground-level particulates between <strong>1:30 PM – 4:00 PM</strong>.
                    Seal bedroom windows before evening coastal stagnation begins.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DATA TRANSPARENCY STRIP */}
      <section className="w-full bg-[#E3F8F6] px-4 lg:px-8 py-4 border-y border-[#BDC9C6]" id="transparency">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex flex-wrap items-center gap-2 text-[#182A29]">
            <span className="uppercase tracking-wider text-[#64748B] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
              Open Verified Sources:
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#BDC9C6]">OpenAQ Stations</span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#BDC9C6]">CPCB NAQI Standard</span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#BDC9C6]">Open-Meteo Inversion</span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#BDC9C6]">OpenStreetMap</span>
            <span className="px-2 py-0.5 rounded bg-white border border-[#BDC9C6]">Google Gemini 1.5</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider mr-1">Provenance Badges:</span>
            <span className="px-2 py-0.5 rounded-full bg-[#DDF5EC] text-[#0F766E] text-[10px] font-bold">LIVE</span>
            <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] text-[10px] font-bold">MODELED</span>
            <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold">FORECAST</span>
            <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">ESTIMATED</span>
            <span className="px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] text-[10px] font-bold">DEMO</span>
          </div>
        </div>
      </section>

      {/* 3. THE PROBLEM SECTION */}
      <section className="w-full px-4 lg:px-8 py-20 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <span className="text-xs uppercase font-bold tracking-wider text-[#0F766E]">The Smog Paradox</span>
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#182A29] mt-2 tracking-tight">
                AQI numbers alone don't tell families what to do.
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] mt-4 leading-relaxed">
                Every winter, millions across Delhi-NCR, Mumbai, and the Indo-Gangetic Plains wake up to scary red dials.
                An arbitrary number doesn't tell you if school bus windows should stay shut, or when it's safe to air out your home.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#F8FAF7] p-5 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-[#DDF5EC] flex items-center justify-center text-[#0F766E] mb-3">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#182A29]">Data without context</h3>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    "AQI is 380." Does that mean stay home completely? Can I run an air purifier without closing cross-vents?
                  </p>
                </div>
                <span className="mt-4 text-[10px] font-bold text-[#0F766E] uppercase">Zero actionable agency</span>
              </div>

              <div className="bg-[#F8FAF7] p-5 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-[#DDF5EC] flex items-center justify-center text-[#0F766E] mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#182A29]">Blanket alerts</h3>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Generic advisories ignore differences between an asthmatic toddler, an elderly grandparent, and an athlete.
                  </p>
                </div>
                <span className="mt-4 text-[10px] font-bold text-[#0F766E] uppercase">No personalization</span>
              </div>

              <div className="bg-[#F8FAF7] p-5 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-[#DDF5EC] flex items-center justify-center text-[#0F766E] mb-3">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#182A29]">Invisible impact</h3>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    You took the metro instead of driving. Did that actually cut your inhaled dose? Without feedback, motivation fades.
                  </p>
                </div>
                <span className="mt-4 text-[10px] font-bold text-[#0F766E] uppercase">Zero feedback loops</span>
              </div>
            </div>
          </div>

          {/* Sample Impact Stats Banner */}
          <div className="bg-[#E3F8F6] p-6 lg:p-8 rounded-3xl border border-[#CCFBF1]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                Collective Impact Potential
              </span>
              <span className="text-[10px] text-[#64748B] uppercase font-bold">[SAMPLE ESTIMATES — DEMO]</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#BDC9C6]">
              <div>
                <span className="font-heading font-extrabold text-4xl text-[#0F766E] block">248 µg</span>
                <span className="font-heading font-bold text-sm text-[#182A29] mt-1 block">
                  Daily inhaled PM2.5 avoided
                </span>
                <span className="text-xs text-[#64748B]">Per family following CleanRoute & Window Oracle guidance</span>
              </div>
              <div className="pt-4 md:pt-0 md:pl-6">
                <span className="font-heading font-extrabold text-4xl text-[#216963] block">3.2 hrs</span>
                <span className="font-heading font-bold text-sm text-[#182A29] mt-1 block">
                  Safe ventilation discovered
                </span>
                <span className="text-xs text-[#64748B]">Average midday thermal inversion lift mapped daily</span>
              </div>
              <div className="pt-4 md:pt-0 md:pl-6">
                <span className="font-heading font-extrabold text-4xl text-[#182A29] block">18.4M</span>
                <span className="font-heading font-bold text-sm text-[#182A29] mt-1 block">
                  Hourly data points analyzed
                </span>
                <span className="text-xs text-[#64748B]">Across 100+ CPCB CAAQMS sensor stations nationwide</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE 5-STEP BREATHEIQ LOOP */}
      <section className="w-full px-4 lg:px-8 py-20 bg-[#F8FAF7]" id="how-it-works">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-wider text-[#0F766E]">Continuous Methodology</span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#182A29] mt-2">
              The BreatheIQ Intelligence Loop
            </h2>
            <p className="text-sm text-[#64748B] mt-2">
              From raw atmospheric sensors to real-world respiratory defense, refreshed continuously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                title: 'Detect',
                desc: 'Continuous ingestion of CPCB ground stations and satellite meteorological forecasts.',
                metric: 'Station Influx: 342 AQI',
              },
              {
                step: '02',
                title: 'Understand',
                desc: 'Breaks down boundary-layer height, humidity, wind vectors, and particulate species.',
                metric: 'Inversion Lid: Active 180m',
              },
              {
                step: '03',
                title: 'Protect',
                desc: 'Generates hour-by-hour checklists for vulnerable children, elderly, and athletes.',
                metric: 'Mask Advisory: N95 Active',
              },
              {
                step: '04',
                title: 'Optimize',
                desc: 'CleanRoute transit comparisons steer your commute away from peak vehicular corridors.',
                metric: 'Metro Choice: -48% Inhaled',
              },
              {
                step: '05',
                title: 'Improve',
                desc: 'Quantifies cumulative personal emission reductions and collective citizen impact.',
                metric: 'Weekly Saved: 1,820 µg PM',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col">
                <span className="w-9 h-9 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs mb-3 shadow-sm">
                  {item.step}
                </span>
                <h3 className="font-heading font-bold text-lg text-[#182A29]">{item.title}</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed flex-1">{item.desc}</p>
                <div className="mt-4 pt-2.5 border-t border-[#E2E8F0] text-[11px] font-bold text-[#0F766E]">
                  {item.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BENTO GRID OF 8 FEATURES */}
      <section className="w-full px-4 lg:px-8 py-20 bg-white" id="features">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#0F766E]">
                Complete Defense Architecture
              </span>
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#182A29] mt-2">
                Engineered for Indian Urban Realities
              </h2>
            </div>
            <p className="text-sm text-[#64748B] max-w-md">
              Calibrated for winter thermal inversions, construction dust resuspension, and multi-generational households.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
            {/* Bento 1: Conversational Copilot (6 Cols) */}
            <div className="lg:col-span-6 bg-[#F8FAF7] p-6 rounded-3xl border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-[#DDF5EC] text-[#0F766E] text-[10px] font-bold uppercase">
                  AI Atmospheric Copilot
                </span>
                <h3 className="font-heading font-bold text-xl text-[#182A29] mt-3">
                  Conversational Copilot with Evidence Chips
                </h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  Ask plain questions. Receive scientifically grounded advice cross-referenced against your hyper-local
                  ward and family sensitivities.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] mt-4 flex flex-col gap-2">
                <div className="self-end bg-[#0F766E] text-white px-3 py-1.5 rounded-xl rounded-tr-none text-xs max-w-[85%]">
                  "Should my son attend outdoor sports day at Dwarka tomorrow morning?"
                </div>
                <div className="self-start bg-[#F8FAF7] p-3 rounded-xl rounded-tl-none border border-[#E2E8F0] text-xs max-w-[90%] flex flex-col gap-1">
                  <span className="font-bold text-[#0F766E]">Recommend indoor gym or delaying past 1:30 PM.</span>
                  <span className="text-[#64748B]">
                    Morning thermal lid traps ground-level PM2.5 above 320 µg/m³ until solar lifting begins.
                  </span>
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-[#64748B]">
                    <span className="bg-[#E3F8F6] px-1.5 py-0.5 rounded text-[#0F766E] font-semibold">
                      Source: CPCB Dwarka #11
                    </span>
                    <span className="bg-[#E3F8F6] px-1.5 py-0.5 rounded text-[#0F766E] font-semibold">
                      Confidence: 94%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 2: Smart Daily Routine Planner (6 Cols) */}
            <div className="lg:col-span-6 bg-[#F8FAF7] p-6 rounded-3xl border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-[#A8ECE5] text-[#266D68] text-[10px] font-bold uppercase">
                  Adaptive Daily Routine
                </span>
                <h3 className="font-heading font-bold text-xl text-[#182A29] mt-3">
                  Smart Daily Routine Planner
                </h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  Dynamically shifts morning walks, commute schedules, and indoor tasks based on hourly pollution forecasts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
                <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#DC5252]">06:00 – 09:30 AM</span>
                  <span className="text-xs font-bold text-[#182A29]">Strict Shield</span>
                  <span className="text-[11px] text-[#64748B]">Inversion peak. Indoor yoga only.</span>
                </div>
                <div className="bg-[#DDF5EC] p-3 rounded-xl border border-[#A7E8C6] flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#0F766E]">01:00 – 03:45 PM</span>
                  <span className="text-xs font-bold text-[#0F766E]">Ventilation Window</span>
                  <span className="text-[11px] text-[#182A29]">Air out living rooms safely.</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#216963]">05:30 – 07:30 PM</span>
                  <span className="text-xs font-bold text-[#182A29]">Clean Commute</span>
                  <span className="text-[11px] text-[#64748B]">Use underground metro lines.</span>
                </div>
              </div>
            </div>

            {/* Bento 3: Window Oracle & Indoor Air (4 Cols) */}
            <div className="lg:col-span-4 bg-[#F8FAF7] p-6 rounded-3xl border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <Home className="w-6 h-6 text-[#0F766E] mb-2" />
                <h3 className="font-heading font-bold text-base text-[#182A29]">Window Oracle & Air Ingest</h3>
                <p className="text-xs text-[#64748B] mt-1.5">
                  Prevent indoor CO₂ build-up without letting in deadly particulate waves. Generates custom ventilation slots.
                </p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] mt-4">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Living Room HEPA:</span>
                  <span className="text-[#0F766E]">18 µg/m³</span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden my-2">
                  <div className="bg-[#0F766E] h-full" style={{ width: '15%' }}></div>
                </div>
                <div className="flex justify-between text-[11px] text-[#64748B]">
                  <span>Outdoor Balcony:</span>
                  <span className="font-bold text-[#DC5252]">218 µg/m³ (12x higher)</span>
                </div>
              </div>
            </div>

            {/* Bento 4: CleanRoute IQ (4 Cols) */}
            <div className="lg:col-span-4 bg-[#F8FAF7] p-6 rounded-3xl border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <Compass className="w-6 h-6 text-[#0F766E] mb-2" />
                <h3 className="font-heading font-bold text-base text-[#182A29]">CleanRoute Commute Navigator</h3>
                <p className="text-xs text-[#64748B] mt-1.5">
                  Compares exposure across walking, cycle, metro, and road routes to minimize cumulative inhaled toxins.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 mt-4">
                <div className="bg-[#DDF5EC] p-2 rounded-lg flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#0F766E]">Subterranean Metro</span>
                  <span className="font-bold text-[#0F766E]">38 µg Inhaled</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Surface Car Congestion</span>
                  <span className="font-bold text-[#DC5252]">142 µg Inhaled</span>
                </div>
              </div>
            </div>

            {/* Bento 5: SmogShield Early Warning (4 Cols) */}
            <div className="lg:col-span-4 bg-[#F8FAF7] p-6 rounded-3xl border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <Shield className="w-6 h-6 text-[#DC5252] mb-2" />
                <h3 className="font-heading font-bold text-base text-[#182A29]">SmogShield 48h Risk Engine</h3>
                <p className="text-xs text-[#64748B] mt-1.5">
                  Predicts sudden thermal inversion drops up to 48 hours in advance, giving families time to prepare.
                </p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] mt-4 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Thermal Trap Risk:</span>
                  <span className="font-bold text-[#DC5252]">High (140m Ceiling)</span>
                </div>
                <span className="px-2 py-1 rounded bg-[#FFDAD6] text-[#DC5252] text-[10px] font-bold">
                  GRAP Stage III Ready
                </span>
              </div>
            </div>

            {/* Bento 6: Family Sensitivity Hub (4 Cols) */}
            <div className="lg:col-span-4 bg-[#F8FAF7] p-6 rounded-3xl border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <Users className="w-6 h-6 text-[#0F766E] mb-2" />
                <h3 className="font-heading font-bold text-base text-[#182A29]">Family Air Guardians</h3>
                <p className="text-xs text-[#64748B] mt-1.5">
                  Custom guidance for asthmatic toddlers, pregnant women, and elderly family members.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 mt-4">
                <div className="bg-white p-2 rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span>Aarav (Age 7, Mild Asthma)</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">
                    Alert &gt; 120
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span>Dadiji (Age 71, Cardiac)</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FFDAD6] text-[#DC5252] text-[10px] font-bold">
                    Alert &gt; 150
                  </span>
                </div>
              </div>
            </div>

            {/* Bento 7: Purifier CADR Sizing (4 Cols) */}
            <div className="lg:col-span-4 bg-[#F8FAF7] p-6 rounded-3xl border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <Wind className="w-6 h-6 text-[#0F766E] mb-2" />
                <h3 className="font-heading font-bold text-base text-[#182A29]">Purifier CADR Sizing & DIY Guide</h3>
                <p className="text-xs text-[#64748B] mt-1.5">
                  Scientific air exchange calculations (ACH) and DIY Corsi-Rosenthal box build blueprints for tight budgets.
                </p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] mt-4 flex items-center justify-between text-xs font-semibold">
                <span>Room: 240 sq.ft</span>
                <span className="text-[#0F766E]">Target CADR: 320 m³/h</span>
              </div>
            </div>

            {/* Bento 8: Community Air Pulse (4 Cols) */}
            <div className="lg:col-span-4 bg-[#F8FAF7] p-6 rounded-3xl border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <Layers className="w-6 h-6 text-[#0F766E] mb-2" />
                <h3 className="font-heading font-bold text-base text-[#182A29]">Citizen Air Watch & Verification</h3>
                <p className="text-xs text-[#64748B] mt-1.5">
                  Report hyperlocal garbage burning and industrial fumes with community moderation and transparent badges.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4 text-center text-xs">
                <div className="flex-1 bg-[#DDF5EC] p-2 rounded-xl text-[#0F766E] font-bold">
                  <span className="text-[10px] block font-normal">VERIFIED</span>
                  42 CPCB Units
                </div>
                <div className="flex-1 bg-white p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] font-bold">
                  <span className="text-[10px] block font-normal">COMMUNITY</span>
                  318 Hyperlocal
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHAT-IF INTERACTIVE SIMULATOR (CALLS WHAT-IF ENGINE PREVIEW) */}
      <section className="w-full px-4 lg:px-8 py-20 bg-[#F8FAF7]" id="what-if">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          <div className="max-w-2xl">
            <span className="text-xs uppercase font-bold tracking-wider text-[#0F766E]">Personal & Civic Feedback</span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#182A29] mt-2">
              What-If Air Simulator
            </h2>
            <p className="text-sm text-[#64748B] mt-2">
              Adjust your household routines to see real-time calculated reductions in inhaled particulate dosage.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-elevated border border-[#E2E8F0] p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sliders Left */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <h3 className="font-heading font-bold text-lg text-[#182A29]">Configure Your Adaptations</h3>

              {/* Slider 1: Metro */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Metro commute instead of personal cab:</span>
                  <span className="text-[#0F766E] font-bold">{metroDays} days / week</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  value={metroDays}
                  onChange={(e) => setMetroDays(Number(e.target.value))}
                  className="w-full accent-[#0F766E] cursor-pointer"
                />
                <span className="text-[10px] text-[#64748B]">Bypasses ground-level vehicular exhaust plumes</span>
              </div>

              {/* Slider 2: Carpool */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>School car-pooling trips:</span>
                  <span className="text-[#0F766E] font-bold">{carpoolTrips} trips / week</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={carpoolTrips}
                  onChange={(e) => setCarpoolTrips(Number(e.target.value))}
                  className="w-full accent-[#0F766E] cursor-pointer"
                />
                <span className="text-[10px] text-[#64748B]">Cuts gate idling congestion near school gates</span>
              </div>

              {/* Checkbox: Induction Cooking */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                <input
                  type="checkbox"
                  id="induction"
                  checked={inductionStove}
                  onChange={(e) => setInductionStove(e.target.checked)}
                  className="w-4 h-4 accent-[#0F766E] rounded cursor-pointer"
                />
                <label htmlFor="induction" className="text-xs cursor-pointer">
                  <span className="font-bold text-[#182A29] block">Use induction cooktop for evening meals</span>
                  <span className="text-[#64748B] text-[11px]">
                    Prevents indoor frying PM2.5 spikes from exceeding 250 µg/m³
                  </span>
                </label>
              </div>

              <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 pt-1">
                <Info className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Computed from CPCB baseline emission coefficients. Labeled estimate.</span>
              </div>
            </div>

            {/* Results Right */}
            <div className="lg:col-span-6 bg-[#E3F8F6] p-8 rounded-2xl border border-[#CCFBF1] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                    Projected Net Benefit
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold uppercase">
                    ESTIMATED
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="font-heading font-extrabold text-5xl lg:text-6xl text-[#0F766E] block tabular-nums">
                    -{avoidedPM} µg
                  </span>
                  <span className="font-heading font-bold text-base text-[#182A29] block">
                    Inhaled PM2.5 particulate avoided daily
                  </span>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Equivalent to avoiding direct exposure to <strong>{(avoidedPM / 22).toFixed(1)}</strong> passive
                    cigarette smoke equivalents per week during winter smog episodes.
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#BDC9C6] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#182A29]">Ready to track your household savings?</span>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] text-xs font-bold transition-colors shadow-sm"
                >
                  Save My Scenario
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. AUDIENCE TABS (FAMILIES / SCHOOLS / COMMUNITIES) */}
      <section className="w-full px-4 lg:px-8 py-20 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-wider text-[#0F766E]">Tailored Modes</span>
            <h2 className="font-heading font-extrabold text-3xl text-[#182A29] mt-2">
              Actionable Guidance for Every Context
            </h2>
          </div>

          {/* Tab Selector */}
          <div className="flex justify-center">
            <div className="inline-flex bg-[#F8FAF7] p-1 rounded-2xl border border-[#E2E8F0]">
              {[
                { id: 'families', label: 'For Families' },
                { id: 'schools', label: 'For Schools & Daycares' },
                { id: 'communities', label: 'For RWAs & Communities' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAudienceTab(tab.id as any)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    audienceTab === tab.id
                      ? 'bg-[#0F766E] text-white shadow-sm'
                      : 'text-[#64748B] hover:text-[#182A29]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-[#F8FAF7] p-8 lg:p-10 rounded-3xl border border-[#E2E8F0] grid grid-cols-1 md:grid-cols-3 gap-6">
            {audienceTab === 'families' && (
              <>
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
                  <Home className="w-6 h-6 text-[#0F766E] mb-2" />
                  <h4 className="font-heading font-bold text-base text-[#182A29]">AirTwin Family Profiles</h4>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Personalized alerts based on age, respiratory history, and specific room dimensions in your home.
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
                  <Compass className="w-6 h-6 text-[#0F766E] mb-2" />
                  <h4 className="font-heading font-bold text-base text-[#182A29]">Clean Commute Planner</h4>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Find the cleanest route for office journeys and school drop-offs to keep child exposure low.
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
                  <Wind className="w-6 h-6 text-[#0F766E] mb-2" />
                  <h4 className="font-heading font-bold text-base text-[#182A29]">Window Oracle Alerts</h4>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Daily push alerts notifying you of the cleanest afternoon window to ventilate stale indoor air.
                  </p>
                </div>
              </>
            )}

            {audienceTab === 'schools' && (
              <>
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
                  <Activity className="w-6 h-6 text-[#0F766E] mb-2" />
                  <h4 className="font-heading font-bold text-base text-[#182A29]">Recess & PE Advisories</h4>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Traffic-light matrix for morning assemblies, sports practices, and outdoor play zones.
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
                  <Calendar className="w-6 h-6 text-[#0F766E] mb-2" />
                  <h4 className="font-heading font-bold text-base text-[#182A29]">Printable Daily Advisory</h4>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    One-click PDF generation to post on notice boards or send via parent WhatsApp groups.
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
                  <Shield className="w-6 h-6 text-[#0F766E] mb-2" />
                  <h4 className="font-heading font-bold text-base text-[#182A29]">Bus Route Ventilation</h4>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Guidelines for school bus drivers regarding window sealing on high-density arterial roads.
                  </p>
                </div>
              </>
            )}

            {audienceTab === 'communities' && (
              <>
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
                  <Layers className="w-6 h-6 text-[#0F766E] mb-2" />
                  <h4 className="font-heading font-bold text-base text-[#182A29]">Citizen Air Watch</h4>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Tag local burning incidents and construction dust violations with GPS coordinates and photos.
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
                  <Users className="w-6 h-6 text-[#0F766E] mb-2" />
                  <h4 className="font-heading font-bold text-base text-[#182A29]">Clean Air Campaigns</h4>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Organize neighborhood carpool clubs, anti-idling drives, and collective air purifier group buys.
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0]">
                  <Sparkles className="w-6 h-6 text-[#0F766E] mb-2" />
                  <h4 className="font-heading font-bold text-base text-[#182A29]">RWA Leaderboard</h4>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Track and celebrate sustainable habit points across residential housing societies.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section className="w-full px-4 lg:px-8 py-20 bg-[#F8FAF7]" id="faq">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          <div className="text-center">
            <span className="text-xs uppercase font-bold tracking-wider text-[#0F766E]">Frequently Asked Questions</span>
            <h2 className="font-heading font-extrabold text-3xl text-[#182A29] mt-2">
              Everything You Need to Know
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                q: 'How does BreatheIQ calculate the National Air Quality Index (NAQI)?',
                a: 'We strictly implement the official Central Pollution Control Board (CPCB) piecewise-linear breakpoint formulas across Indian statutory pollutants (PM2.5, PM10, NO2, SO2, CO, O3). Sub-indices are computed per pollutant and the highest determines the composite AQI and dominant pollutant.',
              },
              {
                q: 'What is the Window Oracle and how does it know when to open windows?',
                a: 'During winter, nighttime radiation cooling causes a thermal inversion that traps pollutants close to the ground. Midday sunshine warms the ground, raising the boundary layer and clearing particulates. Window Oracle uses hourly atmospheric forecasts to identify this optimal ventilation window.',
              },
              {
                q: 'Does BreatheIQ provide medical diagnoses?',
                a: 'No. BreatheIQ offers environmental exposure mitigation and lifestyle guidance following public health guidelines (CPCB and WHO). It never diagnoses conditions or prescribes medications. Always consult a licensed pulmonologist or physician for clinical symptoms.',
              },
              {
                q: 'What data sources are used across the platform?',
                a: 'We ingest ground station telemetry from OpenAQ (official CPCB/SPCB CAAQMS monitors) and high-resolution atmospheric models and meteorological forecasts from Open-Meteo. Every card displays an explicit provenance badge (LIVE, MODELED, FORECAST, ESTIMATED, or DEMO).',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between font-heading font-bold text-sm text-[#182A29] hover:text-[#0F766E]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#64748B] transition-transform ${
                      openFaq === idx ? 'rotate-180 text-[#0F766E]' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4 pt-1 text-xs text-[#64748B] leading-relaxed border-t border-[#E2E8F0]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA BANNER */}
      <section className="w-full bg-[#0F766E] text-white px-4 lg:px-8 py-16 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <span className="px-3 py-1 rounded-full bg-[#A8ECE5] text-[#266D68] text-xs font-bold uppercase tracking-wider">
            Ready to Protect Your Lungs?
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Take Control of Your Winter Air Quality Today.
          </h2>
          <p className="text-sm sm:text-base text-[#DDF5EC] max-w-xl">
            Free forever for families. Set up your personalized AirTwin and start receiving hourly ventilation and commute guidance in under 2 minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/signup"
              className="px-6 py-3 rounded-xl bg-white text-[#0F766E] hover:bg-[#F8FAF7] font-heading font-bold text-sm shadow-elevated transition-transform hover:-translate-y-0.5"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4 inline ml-2" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-[#115E59] text-white hover:bg-[#005C55] font-heading font-bold text-sm transition-colors border border-[#A7E8C6]/30"
            >
              Sign In to Demo
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-[#E2E8F0] px-4 lg:px-8 py-12 text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src="/logo-mark.webp" alt="Logo" className="w-7 h-7 rounded-md" />
              <span className="font-heading font-bold text-base text-[#182A29]">
                Breathe<span className="text-[#0F766E]">IQ</span>
              </span>
            </Link>
            <p className="text-xs text-[#64748B] max-w-sm leading-relaxed">
              GenAI Urban Air Quality Assistant engineered for families and communities facing severe winter smog across Indian cities.
            </p>
          </div>

          <div>
            <span className="font-heading font-bold text-xs text-[#182A29] uppercase tracking-wider block mb-3">
              Explore
            </span>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-[#0F766E]">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-[#0F766E]">How It Works</a></li>
              <li><a href="#what-if" className="hover:text-[#0F766E]">What-If Simulator</a></li>
              <li><Link to="/dev/ui" className="hover:text-[#0F766E]">Component Sandbox</Link></li>
            </ul>
          </div>

          <div>
            <span className="font-heading font-bold text-xs text-[#182A29] uppercase tracking-wider block mb-3">
              Platform
            </span>
            <ul className="space-y-2">
              <li><Link to="/login" className="hover:text-[#0F766E]">Sign In</Link></li>
              <li><Link to="/signup" className="hover:text-[#0F766E]">Register</Link></li>
              <li><Link to="/app/dashboard" className="hover:text-[#0F766E]">Main Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <span className="font-heading font-bold text-xs text-[#182A29] uppercase tracking-wider block mb-3">
              Transparency
            </span>
            <ul className="space-y-2">
              <li><a href="#transparency" className="hover:text-[#0F766E]">Data Sources</a></li>
              <li><span className="text-[#64748B]">CPCB Breakpoints</span></li>
              <li><span className="text-[#64748B]">OpenAQ Real-time</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <span>
            BreatheIQ &copy; {new Date().getFullYear()}. Built for Challenge 6 — Urban Air Quality Assistant.
          </span>
          <span className="text-[#64748B]">
            Data provided for environmental risk awareness only &bull; Not medical advice.
          </span>
        </div>
      </footer>
    </div>
  );
};
