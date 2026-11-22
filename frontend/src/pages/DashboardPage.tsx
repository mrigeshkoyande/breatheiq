import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { AqiBadge } from '../components/ui/AqiBadge';
import { Button } from '../components/ui/Button';
import { Sparkles, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 px-6 lg:px-10 border-b border-[#E2E8F0] bg-white flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <img src="/logo-mark.webp" alt="Logo" className="w-8 h-8 rounded-lg" />
          <div>
            <h1 className="font-heading font-bold text-base text-[#182A29]">
              Breathe<span className="text-[#0F766E]">IQ</span> Dashboard
            </h1>
            <span className="text-[10px] font-bold uppercase text-[#64748B]">
              Station: Andheri West, Mumbai
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#3E4947] font-medium hidden sm:inline">
            Signed in as <strong>{user?.email}</strong> ({user?.role})
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#DC5252]">
            <LogOut className="w-4 h-4 mr-1.5" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#DDF5EC] to-[#E9FEFB] border border-[#CCFBF1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#0F766E]" />
            <p className="text-xs text-[#0F766E] font-medium">
              Winter Smog Advisory active. Ground-level particulate concentration peaks between 06:00–10:00 AM.
            </p>
          </div>
          <Badge badgeType="LIVE" />
        </div>

        {/* Hero AQI Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 space-y-6" elevated>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Live Ambient Air Telemetry
                </span>
                <h2 className="font-heading font-bold text-2xl text-[#182A29] mt-1">
                  Andheri West, Mumbai
                </h2>
              </div>
              <AqiBadge category="Poor" aqi={242} />
            </div>

            <div className="flex flex-wrap items-baseline gap-4">
              <span className="font-heading font-extrabold text-6xl text-[#182A29] tabular-nums">
                242
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#DC5252]">
                  POOR (CPCB NAQI)
                </span>
                <span className="text-xs text-[#64748B]">
                  Dominant Pollutant: PM2.5 (118 µg/m³)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E2E8F0]">
              <div className="p-3 bg-[#F8FAF7] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold text-[#64748B]">PM2.5</span>
                <p className="font-heading font-bold text-lg text-[#182A29] mt-0.5">118 µg/m³</p>
              </div>
              <div className="p-3 bg-[#F8FAF7] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold text-[#64748B]">PM10</span>
                <p className="font-heading font-bold text-lg text-[#182A29] mt-0.5">196 µg/m³</p>
              </div>
              <div className="p-3 bg-[#F8FAF7] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold text-[#64748B]">NO2</span>
                <p className="font-heading font-bold text-lg text-[#182A29] mt-0.5">42 ppb</p>
              </div>
              <div className="p-3 bg-[#F8FAF7] rounded-xl border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Temp / Humidity</span>
                <p className="font-heading font-bold text-lg text-[#182A29] mt-0.5">27°C / 64%</p>
              </div>
            </div>
          </Card>

          {/* Window Oracle Quick Card */}
          <Card className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-[#182A29]">
                Window Oracle
              </h3>
              <Badge badgeType="ESTIMATED" />
            </div>
            <div className="p-4 rounded-xl bg-[#FDECEC] border border-[#F4A8A8] space-y-1">
              <span className="text-xs font-bold text-[#DC5252] block">
                Windows: Keep Closed
              </span>
              <p className="text-xs text-[#3E4947]">
                Thermal inversion is trapping particulate matter close to the ground. Next safe ventilation window opens at 13:30.
              </p>
            </div>
            <div className="text-xs space-y-2 text-[#64748B] pt-2">
              <p>&bull; Recommended Purifier Mode: <strong>High (CADR 350)</strong></p>
              <p>&bull; Mask Requirement: <strong>N95 / FFP2 for Outdoor Activity</strong></p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};
