import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  Flame,
  Truck,
  Building,
  Plus,
  ThumbsUp,
  Filter,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

interface CommunityReport {
  id: number;
  report_type: string;
  severity: string;
  location_name: string;
  description: string;
  upvote_count: number;
  status: string;
  created_at: string;
}

export const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  // New report form state
  const [reportType, setReportType] = useState('construction_dust');
  const [severity, setSeverity] = useState('moderate');
  const [locationName, setLocationName] = useState('SV Road Metro Line Corridor, Andheri West');
  const [description, setDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<CommunityReport[]>('/community/reports');
      setReports(data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpvote = async (id: number) => {
    try {
      const updated = await apiRequest<CommunityReport>(`/community/reports/${id}/verify`, { method: 'POST' });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, upvote_count: updated.upvote_count } : r)));
    } catch {
      // Handled
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim()) return;
    setSubmitting(true);
    try {
      const created = await apiRequest<CommunityReport>('/community/reports', {
        method: 'POST',
        body: JSON.stringify({
          report_type: reportType,
          severity,
          location_name: locationName.trim(),
          description: description.trim(),
          latitude: 19.0760,
          longitude: 72.8777,
        }),
      });
      setReports((prev) => [created, ...prev]);
      setDescription('');
      setShowAddForm(false);
    } catch {
      // Handled
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReports =
    filterType === 'all' ? reports : reports.filter((r) => r.report_type === filterType);

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
            <span className="text-xs font-bold text-[#182A29]">Community Air Watch</span>
          </div>

          <Link
            to="/app/dashboard"
            className="text-xs px-3 py-1 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#182A29]">Air Watch Community Reports</h1>
            <p className="text-xs text-[#64748B] mt-1">
              Crowdsourced hyper-local pollution observations. Reports carry an UNVERIFIED tag until peer-confirmed.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] flex items-center gap-2 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Report Pollution Incident</span>
          </button>
        </div>

        {/* Add Report Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateReport}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4"
          >
            <h3 className="text-sm font-black text-[#182A29]">Log Hyper-Local Incident Observation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">Incident Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
                >
                  <option value="construction_dust">Uncovered Construction Dust</option>
                  <option value="garbage_burning">Open Waste / Garbage Smoldering</option>
                  <option value="stubble_burning">Biomass / Stubble Smoke</option>
                  <option value="industrial_plume">Industrial Chimney Plume</option>
                  <option value="traffic_congestion">Severe Diesel Traffic Stagnation</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">Severity Rating</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
                >
                  <option value="moderate">Moderate (Noticeable haze/dust)</option>
                  <option value="severe">Severe (Acrid odor, low visibility)</option>
                  <option value="hazardous">Hazardous (Immediate respiratory choking)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#64748B] block mb-1">Location Details</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Street address, landmark, intersection..."
                className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#64748B] block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Observed details (e.g. trucks unloading loose sand without tarp cover)..."
                className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#64748B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59]"
              >
                {submitting ? 'Submitting...' : 'Post Observation'}
              </button>
            </div>
          </form>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold">
          <span className="text-[#64748B] text-[11px] uppercase mr-1">Filter:</span>
          {[
            { id: 'all', label: 'All Incidents' },
            { id: 'construction_dust', label: 'Construction Dust' },
            { id: 'garbage_burning', label: 'Waste Burning' },
            { id: 'traffic_congestion', label: 'Traffic Idling' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                filterType === f.id
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-white border border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Reports Feed */}
        {loading ? (
          <div className="py-20 flex justify-center items-center gap-2 text-xs font-bold text-[#0F766E]">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Fetching Community Feed...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          r.status === 'VERIFIED'
                            ? 'bg-[#DCFCE7] text-[#15803D]'
                            : 'bg-[#FEF3C7] text-[#B45309]'
                        }`}
                      >
                        {r.status}
                      </span>
                      <span className="text-[10px] font-bold text-[#DC5252] uppercase bg-[#FEE2E2] px-2 py-0.5 rounded-full">
                        {r.severity}
                      </span>
                      <span className="text-xs text-[#64748B] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#182A29] pt-1">{r.location_name}</h3>
                    <p className="text-xs text-[#475569] leading-relaxed">{r.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpvote(r.id)}
                    className="flex flex-col items-center justify-center bg-[#F8FAF7] border border-[#CBD5E1] hover:border-[#0F766E] text-[#0F766E] rounded-xl px-3 py-2 shrink-0 transition"
                  >
                    <ThumbsUp className="w-4 h-4 mb-0.5" />
                    <span className="text-xs font-bold">{r.upvote_count}</span>
                    <span className="text-[9px] uppercase tracking-tighter">Confirm</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
