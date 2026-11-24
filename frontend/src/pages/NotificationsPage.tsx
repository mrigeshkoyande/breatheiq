import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

interface AlertNotification {
  id: number;
  title: string;
  message: string;
  aqi_at_trigger: number;
  pollutant_driver: string;
  reason_why: string;
  is_read: boolean;
  created_at: string;
}

interface AlertRule {
  id: number;
  aqi_threshold: number;
  target_member: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  channels: string;
  is_enabled: boolean;
}

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // New rule state
  const [threshold, setThreshold] = useState(200);
  const [targetMember, setTargetMember] = useState('All Members');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ rules: AlertRule[]; notifications: AlertNotification[] }>('/user/alerts');
      setNotifications(data.notifications);
      setRules(data.rules);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await apiRequest(`/user/alerts/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // Handled
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiRequest<AlertRule>('/user/alerts/rules', {
        method: 'POST',
        body: JSON.stringify({
          aqi_threshold: Number(threshold),
          target_member: targetMember,
          quiet_hours_start: '22:00',
          quiet_hours_end: '07:00',
          channels: 'in_app,push',
        }),
      });
      setRules((prev) => [...prev, created]);
    } catch {
      // Handled
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/app/dashboard" className="flex items-center gap-2.5">
              <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 rounded-lg" />
              <span className="font-extrabold text-lg tracking-tight text-[#0F766E]">BreatheIQ</span>
            </Link>
            <span className="text-xs text-[#94A3B8]">/</span>
            <span className="text-xs font-bold text-[#182A29]">SmogShield Notifications</span>
          </div>

          <Link
            to="/app/dashboard"
            className="text-xs px-3 py-1 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 lg:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-[#182A29]">SmogShield Alerts & Dispatch Center</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Automated alerts triggered by continuous CAAQMS telemetry spikes and nocturnal boundary-layer inversions.
          </p>
        </div>

        {/* Notifications History List */}
        <div className="space-y-4">
          <h2 className="text-base font-black text-[#182A29]">Recent Atmospheric Alerts</h2>
          {loading ? (
            <div className="py-12 flex justify-center items-center gap-2 text-xs font-bold text-[#0F766E]">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Checking Alert Feeds...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 transition ${
                    n.is_read ? 'border-[#E2E8F0]' : 'border-[#0F766E]/40 bg-[#F0FDF4]/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] text-[#DC5252] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#182A29]">{n.title}</h3>
                          {!n.is_read && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#0F766E] text-white">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#475569]">{n.message}</p>
                        <div className="text-[11px] text-[#64748B]">
                          Triggered at <strong>{n.aqi_at_trigger} NAQI</strong> · Driver: {n.pollutant_driver}
                        </div>
                      </div>
                    </div>

                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        className="text-[11px] font-bold text-[#0F766E] hover:underline shrink-0"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>

                  {/* Why did I get this? */}
                  <div className="border-t border-[#F1F5F9] pt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
                      className="text-[11px] font-bold text-[#0F766E] flex items-center gap-1 hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Why did I get this alert?</span>
                      {expandedId === n.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {expandedId === n.id && (
                      <div className="mt-2 p-3 bg-[#F8FAF7] rounded-xl border border-[#E2E8F0] text-[11px] text-[#475569] space-y-1">
                        <span className="font-bold text-[#182A29] block">Meteorological Telemetry Snapshot:</span>
                        <p>{n.reason_why}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert Rule Configuration */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#0F766E]" />
            <h2 className="text-base font-black text-[#182A29]">Configure Custom Trigger Rules</h2>
          </div>

          <form onSubmit={handleCreateRule} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-[11px] font-bold text-[#64748B] block mb-1">
                Trigger Threshold (NAQI)
              </label>
              <input
                type="number"
                min="50"
                max="400"
                step="10"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#64748B] block mb-1">Target Member</label>
              <select
                value={targetMember}
                onChange={(e) => setTargetMember(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
              >
                <option value="All Members">All Members</option>
                <option value="Children">Children Only</option>
                <option value="Asthma Sensitive">Asthma Sensitive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full font-bold py-2.5 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59]"
              >
                Save Trigger Rule
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
