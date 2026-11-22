import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wind,
  Activity,
  Compass,
  Home,
  Users,
  LogOut,
  Bell,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  Sparkles,
  TrendingUp,
  MapPin,
  RefreshCw,
  Info,
  ChevronRight,
  X,
  AlertTriangle,
} from 'lucide-react';

interface RoutineTask {
  id: string;
  time: string;
  title: string;
  description: string;
  completed: boolean;
  tag: string;
  urgency: 'low' | 'medium' | 'high';
}

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeLocation, setActiveLocation] = useState('Andheri West, Mumbai');
  const [advisoryDismissed, setAdvisoryDismissed] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'HI' | 'MR'>('EN');

  // Interactive routine checklist state
  const [tasks, setTasks] = useState<RoutineTask[]>([
    {
      id: '1',
      time: '06:30 AM',
      title: 'Seal bedroom balcony cross-vents',
      description: 'Morning marine humidity boundary layer traps particulates near street level.',
      completed: true,
      tag: 'Indoor Defense',
      urgency: 'high',
    },
    {
      id: '2',
      time: '08:15 AM',
      title: 'Commute via Line 2A Metro (Filtered)',
      description: 'Avoid SV Road surface idling congestion. Cuts inhaled PM2.5 dose by ~45%.',
      completed: true,
      tag: 'CleanRoute',
      urgency: 'medium',
    },
    {
      id: '3',
      time: '01:45 PM',
      title: 'Window Oracle: 90-minute aeration window',
      description: 'Solar heating lifts the inversion lid. Open living room cross-vents to clear CO2.',
      completed: false,
      tag: 'Ventilation',
      urgency: 'low',
    },
    {
      id: '4',
      time: '07:00 PM',
      title: 'Switch living room HEPA purifier to High',
      description: 'Prepare for evening marine stagnation surge as coastal sea breeze diminishes.',
      completed: false,
      tag: 'HEPA Sizing',
      urgency: 'high',
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] antialiased flex flex-col font-sans">
      {/* SIDEBAR NAVIGATION (DESKTOP) */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-white z-50 hidden lg:flex flex-col border-r border-[#E2E8F0] shadow-sm overflow-y-auto">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3 border-b border-[#E2E8F0]">
          <img src="/logo-mark.webp" alt="Logo" className="w-8 h-8 rounded-lg" />
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-lg text-[#182A29] leading-tight">
              Breathe<span className="text-[#0F766E]">IQ</span>
            </span>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Atmospheric Intelligence
            </span>
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 px-4 py-6 space-y-6">
          <div className="space-y-1">
            <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Core Modules</p>
            <Link
              to="/app/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-bold shadow-sm"
            >
              <Activity className="w-4 h-4" />
              <span>Overview</span>
            </Link>
            <a
              href="#air-quality"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Wind className="w-4 h-4" />
              <span>Air Quality</span>
            </a>
            <a
              href="#analytics"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Analytics</span>
            </a>
            <a
              href="#copilot"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Sparkles className="w-4 h-4 text-[#0F766E]" />
              <span>AI Copilot</span>
            </a>
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Family & Living</p>
            <a
              href="#routine"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Daily Routine</span>
            </a>
            <a
              href="#home"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home & Window Oracle</span>
            </a>
            <a
              href="#family"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Family AirGuard</span>
            </a>
            <a
              href="#routes"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>CleanRoute</span>
            </a>
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Civic & Community</p>
            <a
              href="#community"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Citizen Air Watch</span>
            </a>
            <a
              href="#achievements"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Award className="w-4 h-4" />
              <span>Achievements</span>
            </a>
          </div>
        </nav>

        {/* Telemetry Status Box */}
        <div className="p-4 m-3 bg-[#E3F8F6] rounded-2xl border border-[#CCFBF1]">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse"></span>
            <span className="text-[10px] uppercase font-bold text-[#0F766E]">CPCB Ground Telemetry</span>
          </div>
          <p className="text-[11px] text-[#216963] leading-snug">
            Monitoring active on Station ID: <strong>MH-MUM-AW04</strong>
          </p>
        </div>
      </aside>

      {/* TOP HEADER (OFFSET ON DESKTOP) */}
      <div className="lg:pl-72 flex-1 flex flex-col">
        <header className="sticky top-0 z-40 h-20 bg-white/90 backdrop-blur-xl border-b border-[#E2E8F0] px-6 lg:px-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Location Pill Selector */}
            <div className="inline-flex items-center gap-2 bg-[#F8FAF7] px-3.5 py-2 rounded-2xl border border-[#E2E8F0]">
              <MapPin className="w-4 h-4 text-[#0F766E]" />
              <span className="text-xs font-bold text-[#182A29]">{activeLocation}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">
                AQI 148 · Moderate
              </span>
              <button
                type="button"
                onClick={() =>
                  setActiveLocation((prev) =>
                    prev.includes('Mumbai') ? 'Connaught Place, Delhi' : 'Andheri West, Mumbai'
                  )
                }
                className="text-[10px] text-[#0F766E] underline ml-1 font-semibold"
              >
                Switch
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <div className="hidden sm:flex items-center bg-[#E3F8F6] rounded-xl p-0.5 border border-[#BDC9C6]">
              {(['EN', 'HI', 'MR'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                    language === lang ? 'bg-white text-[#182A29] shadow-sm' : 'text-[#64748B]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="p-2 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] text-[#64748B] hover:text-[#182A29] relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC5252]"></span>
            </button>

            {/* User Session Capsule & Logout */}
            <div className="flex items-center gap-3 pl-2 border-l border-[#E2E8F0]">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-[#182A29] leading-tight">
                  {user?.full_name || user?.email?.split('@')[0] || 'Aarav Sharma'}
                </span>
                <span className="text-[10px] text-[#64748B] uppercase font-semibold">
                  {user?.role || 'User'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl bg-[#F8FAF7] hover:bg-[#FFDAD6] text-[#64748B] hover:text-[#DC5252] border border-[#E2E8F0] transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">
          {/* Hero Greeting & Status */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#0F766E]">
                  Domestic Atmospheric Intelligence
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#BDC9C6]"></span>
                <span className="px-2 py-0.5 rounded-full bg-[#DDF5EC] text-[#0F766E] text-[10px] font-bold">
                  LIVE TELEMETRY
                </span>
              </div>
              <h1 className="font-heading font-extrabold text-3xl text-[#182A29] tracking-tight mt-1">
                Good evening, {user?.full_name?.split(' ')[0] || 'Aarav'}
              </h1>
              <p className="text-xs text-[#64748B] mt-1">
                Marine boundary layer is shifting westerly. Safe balcony ventilation expected by early afternoon.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B] flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-[#0F766E]" />
                Updated 8 mins ago
              </span>
            </div>
          </section>

          {/* SmogShield Micro-Advisory Banner */}
          {!advisoryDismissed && (
            <section className="bg-white rounded-3xl p-5 border border-[#FEF3C7] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F59E0B]"></div>
              <div className="flex items-start gap-3 pl-2">
                <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#B45309] shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-[#182A29]">
                      SmogShield Micro-Advisory
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold uppercase">
                      Marine Inversion Stagnation
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed max-w-3xl">
                    High ambient humidity (74%) will trap street-level particulate matter along coastal corridors
                    after 06:30 PM. Delay high-tempo outdoor cardio until 08:30 PM when offshore breeze disperses stagnation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => setAdvisoryDismissed(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F8FAF7]"
                >
                  Dismiss
                </button>
                <a
                  href="#routine"
                  className="px-4 py-1.5 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] text-xs font-bold transition-colors shadow-sm"
                >
                  View Checklist
                </a>
              </div>
            </section>
          )}

          {/* Primary Bento Grid: Live AQI Gauge + Forecast */}
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="air-quality">
            {/* Hero Gauge Card (7 Cols) */}
            <div className="xl:col-span-7 bg-white rounded-3xl p-6 lg:p-8 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#DDF5EC] text-[#0F766E] text-[10px] font-bold uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] animate-pulse"></span>
                      LIVE CAAQMS TELEMETRY
                    </span>
                    <span className="text-[10px] text-[#64748B]">Station: Andheri West #04</span>
                  </div>
                  <h2 className="font-heading font-extrabold text-2xl text-[#182A29] mt-1">
                    Ambient Air Quality Index
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setExplainOpen(!explainOpen)}
                  className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1"
                >
                  Explain this number
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Gauge & Micro-Pollutants */}
              <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-40 h-40 -rotate-90 transform" viewBox="0 0 160 160">
                      <circle
                        cx="80"
                        cy="80"
                        r="68"
                        fill="transparent"
                        stroke="#E2E8F0"
                        strokeWidth="12"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="68"
                        fill="transparent"
                        stroke="#F2B705"
                        strokeWidth="12"
                        strokeDasharray="427.25"
                        strokeDashoffset="300"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-heading font-extrabold text-5xl text-[#182A29] leading-none tabular-nums">
                        148
                      </span>
                      <span className="text-xs font-bold text-[#B45309] mt-1">MODERATE</span>
                      <span className="text-[10px] text-[#64748B]">CPCB NAQI</span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-7 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">Dominant: PM2.5</span>
                    <span className="font-heading font-bold text-lg text-[#182A29]">78 µg/m³</span>
                    <span className="text-[10px] text-[#DC5252] block mt-0.5">2.6x WHO Guideline</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">PM10 Particulates</span>
                    <span className="font-heading font-bold text-lg text-[#182A29]">142 µg/m³</span>
                    <span className="text-[10px] text-[#B45309] block mt-0.5">Within CPCB 24h limit</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">NO2 Traffic Gas</span>
                    <span className="font-heading font-bold text-lg text-[#182A29]">42 ppb</span>
                    <span className="text-[10px] text-[#0F766E] block mt-0.5">Good dispersion</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">Marine Wind</span>
                    <span className="font-heading font-bold text-lg text-[#0F766E]">WSW 11 km/h</span>
                    <span className="text-[10px] text-[#0F766E] block mt-0.5">Offshore shift active</span>
                  </div>
                </div>
              </div>

              {explainOpen && (
                <div className="p-4 rounded-2xl bg-[#DDF5EC] border border-[#A7E8C6] text-xs text-[#182A29] leading-relaxed mb-4">
                  <div className="flex items-center justify-between font-bold text-[#0F766E] mb-1">
                    <span>How CPCB NAQI is calculated:</span>
                    <button type="button" onClick={() => setExplainOpen(false)}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  The statutory composite index takes the highest sub-index among measured pollutants. In Andheri West,
                  <strong>PM2.5 (78 µg/m³)</strong> drives the composite index to 148 (Moderate). Sensitive individuals
                  should minimize prolonged heavy outdoor exertion.
                </div>
              )}

              {/* Sparkline & Forecast Footer */}
              <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#0F766E]" />
                  Window Oracle optimal ventilation: <strong>01:30 PM – 03:45 PM</strong>
                </span>
                <Link to="/" className="text-xs font-bold text-[#0F766E] hover:underline">
                  View Full Meteorological Forecast &rarr;
                </Link>
              </div>
            </div>

            {/* Window Oracle & Inversion Lifting (5 Cols) */}
            <div className="xl:col-span-5 bg-white rounded-3xl p-6 lg:p-8 border border-[#E2E8F0] shadow-sm flex flex-col justify-between" id="home">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-[#0F766E]" />
                    <span className="font-heading font-bold text-base text-[#182A29]">
                      Window Oracle Indoor Air
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold uppercase">
                    ESTIMATED
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-[#DDF5EC] border border-[#A7E8C6]">
                    <div className="flex items-center justify-between text-xs font-bold text-[#0F766E]">
                      <span>Recommended Aeration Window</span>
                      <span>OPEN 1:30 PM</span>
                    </div>
                    <p className="text-xs text-[#182A29] mt-1 leading-relaxed">
                      Solar ground heating lifts the coastal boundary lid. Open living room cross-vents between
                      <strong> 01:30 PM – 03:45 PM</strong> to purge indoor CO2 without admitting particulate waves.
                    </p>
                  </div>

                  {/* Indoor vs Outdoor Comparison */}
                  <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#182A29]">Living Room HEPA (Indoor):</span>
                      <span className="font-bold text-[#0F766E]">18 µg/m³ (Good)</span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#0F766E] h-full rounded-full" style={{ width: '14%' }}></div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#182A29]">Balcony Sensor (Outdoor):</span>
                      <span className="font-bold text-[#DC5252]">148 µg/m³ (Moderate)</span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#DC5252] h-full rounded-full" style={{ width: '58%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Purifier Filter Life:</span>
                <span className="font-bold text-[#0F766E]">82% (Replace in 4.5 mo)</span>
              </div>
            </div>
          </section>

          {/* Routine Checklist & Commute Navigator */}
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="routine">
            {/* Daily Routine Checklist (7 Cols) */}
            <div className="xl:col-span-7 bg-white rounded-3xl p-6 lg:p-8 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                  <div>
                    <h3 className="font-heading font-extrabold text-xl text-[#182A29]">
                      Today's Protective Routine Checklist
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Tailored to your family AirTwin and Mumbai diurnal inversion cycles.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#0F766E]">
                    {completedCount} / {tasks.length} Completed
                  </span>
                </div>

                <div className="divide-y divide-[#E2E8F0] mt-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="py-3.5 flex items-start gap-3 cursor-pointer group"
                    >
                      <button
                        type="button"
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          task.completed
                            ? 'bg-[#0F766E] border-[#0F766E] text-white'
                            : 'border-[#BDC9C6] group-hover:border-[#0F766E]'
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#64748B]">{task.time}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E3F8F6] text-[#0F766E]">
                            {task.tag}
                          </span>
                        </div>
                        <h4
                          className={`text-xs font-bold mt-1 transition-all ${
                            task.completed ? 'line-through text-[#64748B]' : 'text-[#182A29]'
                          }`}
                        >
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Routine adapts dynamically to forecast changes.</span>
                <button
                  type="button"
                  onClick={() =>
                    setTasks((prev) =>
                      prev.map((t) => ({ ...t, completed: !t.completed }))
                    )
                  }
                  className="font-bold text-[#0F766E] hover:underline"
                >
                  Toggle All
                </button>
              </div>
            </div>

            {/* CleanRoute Commute Navigator (5 Cols) */}
            <div className="xl:col-span-5 bg-white rounded-3xl p-6 lg:p-8 border border-[#E2E8F0] shadow-sm flex flex-col justify-between" id="routes">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#0F766E]" />
                    <h3 className="font-heading font-bold text-base text-[#182A29]">
                      CleanRoute Commute Comparison
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#DDF5EC] text-[#0F766E] text-[10px] font-bold">
                    RECOMMENDED
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#DDF5EC] border border-[#A7E8C6]">
                    <div className="flex items-center justify-between text-xs font-bold text-[#0F766E]">
                      <span>Metro Line 2A & 7 (Subterranean / Elevated AC)</span>
                      <span>38 µg Inhaled</span>
                    </div>
                    <p className="text-[11px] text-[#182A29] mt-1">
                      Filtered carriages shield from direct vehicular exhaust micro-tunnels along Western Express Highway.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#182A29]">
                      <span>Surface Cab / Auto (WEH Jam)</span>
                      <span className="text-[#DC5252] font-bold">142 µg Inhaled (+270%)</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1">
                      Severe idling plumes at Bandra flyover bottle-neck.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#182A29]">
                      <span>Walking / Cycling via Carter Road</span>
                      <span className="text-[#B45309] font-bold">84 µg Inhaled</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1">
                      Marine coastal breeze disperses particulates, but requires low exertion pace.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs text-[#64748B]">Saved 104 µg inhaled today</span>
                <Link
                  to="/"
                  className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1"
                >
                  Map New Route &rarr;
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
