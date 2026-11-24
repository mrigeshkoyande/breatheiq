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
  Menu,
  Shield,
  Settings,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div
      className="min-h-screen text-[#182A29] antialiased flex flex-col font-sans relative bg-[#F8FAF7]"
      style={{
        backgroundImage: 'linear-gradient(135deg, #EDFAF5, #F8FAF7, #E3F8F6)',
      }}
    >
      {/* 0. TOP ANNOUNCEMENT BANNER */}
      <div className="w-full bg-[#115E59] text-white px-4 lg:px-8 py-2 text-center shadow-sm z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-center flex-wrap gap-2 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#A8ECE5] text-[#266D68] text-[10px] uppercase font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] animate-pulse"></span>
            Winter Smog Alert
          </span>
          <span>Diurnal thermal inversion forecasting is now active across 42 Indian municipal corridors.</span>
          <Link
            to="/app/impact/what-if"
            className="underline text-[#9CF2E8] hover:text-white transition-colors ml-1 inline-flex items-center gap-1 font-semibold"
          >
            Explore What-If Simulator &rarr;
          </Link>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION (DESKTOP) */}
      <aside className="fixed left-0 top-0 h-screen w-72 bg-white/80 backdrop-blur-2xl z-50 hidden lg:flex flex-col border-r border-white/70 shadow-xl overflow-y-auto">
        {/* Brand: Redirects to Home Page when clicked */}
        <Link
          to="/"
          className="p-6 flex items-center gap-3 border-b border-[#E2E8F0] hover:bg-[#F8FAF7] transition-colors group cursor-pointer"
          title="Back to Home Page"
        >
          <img src="/logo-mark.webp" alt="BreatheIQ Logo" className="w-8 h-8 rounded-lg group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-lg text-[#182A29] leading-tight">
              Breathe<span className="text-[#0F766E]">IQ</span>
            </span>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Atmospheric Intelligence
            </span>
          </div>
        </Link>

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
            <Link
              to="/app/air-quality"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Wind className="w-4 h-4" />
              <span>Air Quality</span>
            </Link>
            <Link
              to="/app/analytics"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Analytics</span>
            </Link>
            <Link
              to="/app/assistant"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Sparkles className="w-4 h-4 text-[#0F766E]" />
              <span>AI Copilot</span>
            </Link>
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Family & Living</p>
            <Link
              to="/app/routine"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Daily Routine</span>
            </Link>
            <Link
              to="/app/home"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home & Window Oracle</span>
            </Link>
            <Link
              to="/app/family"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Family AirGuard</span>
            </Link>
            <Link
              to="/app/routes"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>CleanRoute</span>
            </Link>
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Civic & Community</p>
            <Link
              to="/app/community"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Citizen Air Watch</span>
            </Link>
            <Link
              to="/app/impact"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
            >
              <Award className="w-4 h-4" />
              <span>Sustainability Ledger</span>
            </Link>
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

      {/* MOBILE SLIDE-OVER NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            <div className="p-5 flex items-center justify-between border-b border-slate-100">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
                <img src="/logo-mark.webp" alt="BreatheIQ Logo" className="w-8 h-8 rounded-lg" />
                <div className="flex flex-col">
                  <span className="font-heading font-extrabold text-base text-[#182A29] leading-tight">
                    Breathe<span className="text-[#0F766E]">IQ</span>
                  </span>
                  <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">
                    Urban Air Platform
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                aria-label="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-5">
              <div className="space-y-1">
                <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Core Modules</p>
                <Link
                  to="/app/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-bold shadow-sm"
                >
                  <Activity className="w-4 h-4" />
                  <span>Overview</span>
                </Link>
                <Link
                  to="/app/air-quality"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
                >
                  <Wind className="w-4 h-4" />
                  <span>Air Quality</span>
                </Link>
                <Link
                  to="/app/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Analytics</span>
                </Link>
                <Link
                  to="/app/assistant"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-[#0F766E]" />
                  <span>AI Copilot</span>
                </Link>
              </div>

              <div className="space-y-1">
                <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Family & Living</p>
                <Link
                  to="/app/routine"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Daily Routine</span>
                </Link>
                <Link
                  to="/app/home"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Home & Window Oracle</span>
                </Link>
                <Link
                  to="/app/family"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Family AirGuard</span>
                </Link>
                <Link
                  to="/app/routes"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
                >
                  <Compass className="w-4 h-4" />
                  <span>CleanRoute</span>
                </Link>
              </div>

              <div className="space-y-1">
                <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Civic & Impact</p>
                <Link
                  to="/app/community"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  <span>Citizen Air Watch</span>
                </Link>
                <Link
                  to="/app/impact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
                >
                  <Award className="w-4 h-4" />
                  <span>Sustainability Ledger</span>
                </Link>
                <Link
                  to="/app/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#DDF2F0] hover:text-[#182A29] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
                {(user?.role === 'admin' || user?.role === 'moderator') && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Center</span>
                  </Link>
                )}
              </div>
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#182A29]">
                  {user?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-[10px] text-[#64748B] uppercase font-semibold">
                  {user?.role || 'user'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER (OFFSET ON DESKTOP) */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        <div className="sticky top-2 sm:top-2.5 z-40 px-2 sm:px-4 lg:px-8">
          <header className="h-14 sm:h-16 glass-nav rounded-2xl px-3 sm:px-4 lg:px-7 flex items-center justify-between gap-2 sm:gap-4 transition-all shadow-md">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile Sidebar Hamburger Trigger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 sm:p-2 rounded-xl glass-pill lg:hidden text-slate-700 hover:text-[#0F766E] transition-colors shadow-xs shrink-0"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Mobile Logo Link (Redirects to Home) */}
              <Link to="/" className="flex lg:hidden items-center gap-1.5 shrink-0 group" title="Back to Home Page">
                <img src="/logo-mark.webp" alt="BreatheIQ Logo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg group-hover:scale-105 transition-transform" />
                <span className="font-extrabold text-sm sm:text-base text-[#182A29] hidden sm:inline">
                  Breathe<span className="text-[#0F766E]">IQ</span>
                </span>
              </Link>

              {/* Adaptive Location Pill Selector */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 glass-pill px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border border-white/70 shadow-xs min-w-0">
                <MapPin className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold text-[#182A29] truncate max-w-[85px] sm:max-w-none">
                  {activeLocation.split(',')[0]}
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[9px] sm:text-[10px] font-bold shrink-0">
                  168 · Mod
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveLocation((prev) =>
                      prev.includes('Mumbai') ? 'Connaught Place, Delhi' : 'Andheri West, Mumbai'
                    )
                  }
                  className="text-[9px] sm:text-[10px] text-[#0F766E] underline ml-0.5 sm:ml-1 font-semibold shrink-0"
                >
                  Switch
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Language Switch */}
              <div className="hidden md:flex items-center glass-pill rounded-xl p-0.5 border border-white/60">
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
                className="p-1.5 sm:p-2 rounded-xl glass-pill text-[#64748B] hover:text-[#182A29] relative transition-colors shadow-xs"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-2 h-2 rounded-full bg-[#DC5252]"></span>
              </button>

              {/* User Session Capsule & Logout */}
              <div className="flex items-center gap-2 sm:gap-3 pl-1.5 sm:pl-2 border-l border-slate-200/60">
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
                  className="p-1.5 sm:p-2 rounded-xl glass-pill hover:bg-[#FFDAD6] text-[#64748B] hover:text-[#DC5252] transition-colors shadow-xs"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>
        </div>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 pb-24 lg:pb-10 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
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
            <div className="xl:col-span-7 glass-card rounded-3xl p-6 lg:p-8 border border-white/80 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#DDF5EC] text-[#0F766E] text-[10px] font-bold uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] animate-pulse"></span>
                      LIVE AMBIENT AIR TELEMETRY
                    </span>
                    <span className="text-[10px] text-[#64748B]">MPCB Station #18 (Andheri West)</span>
                  </div>
                  <h2 className="font-heading font-extrabold text-2xl text-[#182A29] mt-1">
                    Andheri West, Mumbai
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#DDF5EC] text-[#0F766E] text-[10px] font-bold uppercase tracking-wider">
                    LIVE
                  </span>
                  <span className="text-[10px] text-[#64748B]">Updated 4m ago</span>
                </div>
              </div>

              {/* Gauge & Micro-Pollutants */}
              <div className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading font-extrabold text-6xl text-[#182A29] leading-none tabular-nums">
                        168
                      </span>
                      <span className="text-xs font-bold text-[#64748B] uppercase">CPCB NAQI</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2.5 bg-[#FEF3C7] text-[#B45309]">
                      <Info className="w-3.5 h-3.5" />
                      <span>MODERATE (CPCB / MPCB)</span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-7 grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">Dominant: PM2.5</span>
                    <span className="font-heading font-bold text-base text-[#182A29]">78 µg/m³</span>
                    <span className="text-[10px] text-[#DC5252] block mt-0.5">2.6x WHO Guideline</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">PM10 Particulates</span>
                    <span className="font-heading font-bold text-base text-[#182A29]">142 µg/m³</span>
                    <span className="text-[10px] text-[#B45309] block mt-0.5">Within CPCB 24h limit</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0] col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#64748B] block">Wind Vector</span>
                      <span className="font-heading font-bold text-xs text-[#0F766E]">WSW 11 km/h (Marine)</span>
                    </div>
                    <span className="text-[10px] text-[#0F766E] font-semibold bg-[#E8F8F5] px-2 py-0.5 rounded-md">
                      Offshore shift active
                    </span>
                  </div>
                </div>
              </div>

              {/* Measured Inversion Curve & 6h Dispersion Forecast */}
              <div className="py-2 border-t border-[#F1F5F9]">
                <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-1 bg-[#B45309] rounded-full inline-block"></span>
                    Measured Inversion Curve
                  </span>
                  <span className="flex items-center gap-1.5 text-[#0F766E]">
                    <span className="w-3 h-0.5 border-b-2 border-dashed border-[#0F766E] inline-block"></span>
                    6h Dispersion Forecast
                  </span>
                </div>
                <div className="h-14 w-full bg-[#E3F8F6] rounded-xl p-2 relative overflow-hidden border border-[#CCFBF1]">
                  <svg className="w-full h-full" viewBox="0 0 400 44" preserveAspectRatio="none">
                    <path
                      d="M0 30 Q50 34, 100 22 T200 20"
                      fill="none"
                      stroke="#B45309"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M200 20 Q260 12, 320 26 T400 34"
                      fill="none"
                      stroke="#0F766E"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                    />
                    <circle cx="200" cy="20" r="4" fill="#B45309" />
                  </svg>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#64748B] mt-1 font-medium px-1">
                  <span>06:00 AM (Peak Inversion)</span>
                  <span className="font-bold text-[#B45309]">NOW</span>
                  <span>08:00 PM (Sea Breeze Drop)</span>
                </div>
              </div>

              {/* Window Oracle Ventilation Verdict Popover */}
              <div className="mt-3 p-3.5 rounded-2xl bg-[#DDF5EC] border border-[#A7E8C6] flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-[#0F766E]">Window Oracle Ventilation Verdict:</span>
                  <p className="text-[#182A29] mt-0.5 leading-relaxed">
                    Solar lifting clears ground-level particulates between 1:30 PM – 4:00 PM. Seal bedroom windows
                    before evening coastal stagnation begins.
                  </p>
                </div>
              </div>

              {/* Sparkline & Forecast Footer */}
              <div className="pt-3 mt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#0F766E]" />
                  Window Oracle optimal window: <strong>01:30 PM – 04:00 PM</strong>
                </span>
                <Link to="/app/analytics" className="text-xs font-bold text-[#0F766E] hover:underline">
                  View Full Meteorological Forecast &rarr;
                </Link>
              </div>
            </div>

            {/* Window Oracle & Inversion Lifting (5 Cols) */}
            <div className="xl:col-span-5 glass-card rounded-3xl p-6 lg:p-8 border border-white/80 shadow-xl flex flex-col justify-between" id="home">
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
            <div className="xl:col-span-7 glass-card rounded-3xl p-6 lg:p-8 border border-white/80 shadow-xl flex flex-col justify-between">
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
            <div className="xl:col-span-5 glass-card rounded-3xl p-6 lg:p-8 border border-white/80 shadow-xl flex flex-col justify-between" id="routes">
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
                  to="/app/routes"
                  className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1"
                >
                  Map New Route &rarr;
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* MOBILE FIXED BOTTOM NAVIGATION BAR */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-4 py-2 flex justify-around items-center lg:hidden shadow-lg shadow-teal-950/10">
          <Link
            to="/app/dashboard"
            className="flex flex-col items-center gap-0.5 text-[#0F766E]"
            title="Overview"
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-bold">Home</span>
          </Link>
          <Link
            to="/app/air-quality"
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#0F766E]"
            title="Air Quality"
          >
            <Wind className="w-5 h-5" />
            <span className="text-[10px] font-medium">Air</span>
          </Link>
          <Link
            to="/app/assistant"
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#0F766E]"
            title="AI Copilot"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">Copilot</span>
          </Link>
          <Link
            to="/app/routine"
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#0F766E]"
            title="Daily Routine"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium">Routine</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#0F766E]"
            title="All Modules"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
