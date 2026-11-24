import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Cpu,
  Lock,
  Activity,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

interface UserRecord {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface ModerationItem {
  id: number;
  report_type: string;
  severity: string;
  location_name: string;
  description: string;
  upvote_count: number;
  status: string;
}

interface AITraceRecord {
  id: number;
  prompt_hash: string;
  intent: string;
  model: string;
  latency_ms: number;
  tokens_used: number;
  validator_flags: string;
  status: string;
  created_at: string;
}

interface AuditLogRecord {
  id: number;
  action: string;
  ip_address: string;
  details: string;
  timestamp: string;
}

interface IntegrationHealth {
  service: string;
  status: string;
  latency_ms: number;
  mode: string;
}

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'moderation' | 'traces' | 'audit' | 'integrations'>('users');
  const [loading, setLoading] = useState(true);

  // Tab data states
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
  const [aiTraces, setAiTraces] = useState<AITraceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationHealth[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const fetchTabData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'users') {
        const data = await apiRequest<UserRecord[]>('/admin/users');
        setUsersList(data);
      } else if (tab === 'moderation') {
        const data = await apiRequest<ModerationItem[]>('/admin/moderation/queue');
        setModerationQueue(data);
      } else if (tab === 'traces') {
        const data = await apiRequest<AITraceRecord[]>('/admin/ai-traces');
        setAiTraces(data);
      } else if (tab === 'audit') {
        const data = await apiRequest<AuditLogRecord[]>('/admin/audit-logs');
        setAuditLogs(data);
      } else if (tab === 'integrations') {
        const data = await apiRequest<IntegrationHealth[]>('/admin/integrations/health');
        setIntegrations(data);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const handleToggleUserStatus = async (userId: number, currentActive: boolean) => {
    try {
      await apiRequest(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentActive }),
      });
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
      );
    } catch {
      // Handled
    }
  };

  const handleModerate = async (reportId: number, action: 'VERIFY' | 'REJECT') => {
    try {
      await apiRequest(`/admin/moderation/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      setModerationQueue((prev) => prev.filter((r) => r.id !== reportId));
    } catch {
      // Handled
    }
  };

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
            <span className="text-xs font-bold text-[#182A29]">Unified Command Center</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC5252]">
              ADMIN
            </span>
          </div>

          <Link
            to="/app/dashboard"
            className="text-xs px-3 py-1 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-[#182A29]">Administration & Operational Integrity</h1>
          <p className="text-xs text-[#64748B] mt-1">
            RBAC tenant administration, community crowdsource moderation, AI trace logging, and service telemetry.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-bold overflow-x-auto">
          {[
            { id: 'users', label: 'Users & Roles' },
            { id: 'moderation', label: 'Moderation Queue' },
            { id: 'traces', label: 'AI Trace Log' },
            { id: 'audit', label: 'Security Audit' },
            { id: 'integrations', label: 'Integrations Health' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-[#64748B] hover:bg-[#F1F5F9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center gap-2 text-xs font-bold text-[#0F766E]">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Querying Administration Records...</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            {/* Tab 1: Users */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-black text-[#182A29]">Registered Accounts & RBAC</h2>
                  <span className="text-xs text-[#64748B]">{usersList.length} Accounts Found</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAF7] text-[#64748B] font-bold border-b border-[#E2E8F0]">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">User</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-[#3E4947]">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-[#F8FAF7]/50">
                          <td className="p-3 font-mono">#{u.id}</td>
                          <td className="p-3 font-semibold">
                            {u.full_name} <span className="block text-[11px] text-[#64748B] font-normal">{u.email}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#DDF5EC] text-[#0F766E]">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                u.is_active ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#DC5252]'
                              }`}
                            >
                              {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                              className="text-[11px] font-bold text-[#0F766E] hover:underline"
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Moderation Queue */}
            {activeTab === 'moderation' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-black text-[#182A29]">Air Watch Moderation Queue</h2>
                  <span className="text-xs text-[#64748B]">{moderationQueue.length} Pending Observations</span>
                </div>

                {moderationQueue.length === 0 ? (
                  <p className="text-xs text-[#64748B] py-6 text-center">
                    Moderation queue is clean. All community observations verified.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {moderationQueue.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAF7] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase bg-[#FEF3C7] text-[#B45309] px-2 py-0.5 rounded-full">
                            {item.report_type} · {item.severity}
                          </span>
                          <h3 className="text-xs font-bold text-[#182A29]">{item.location_name}</h3>
                          <p className="text-xs text-[#475569]">{item.description}</p>
                          <span className="text-[10px] text-[#0F766E] font-semibold block">
                            Confirmed by {item.upvote_count} nearby users
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleModerate(item.id, 'VERIFY')}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#2F9E62] text-white hover:bg-[#23784B]"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModerate(item.id, 'REJECT')}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#DC5252] text-white hover:bg-[#B91C1C]"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: AI Trace Log */}
            {activeTab === 'traces' && (
              <div className="space-y-4">
                <h2 className="text-base font-black text-[#182A29]">Grounded Assistant Trace Logs</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAF7] text-[#64748B] font-bold border-b border-[#E2E8F0]">
                      <tr>
                        <th className="p-3">Prompt Hash</th>
                        <th className="p-3">Intent</th>
                        <th className="p-3">Model</th>
                        <th className="p-3">Latency</th>
                        <th className="p-3">Validator Flags</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-[#3E4947]">
                      {aiTraces.map((t) => (
                        <tr key={t.id} className="hover:bg-[#F8FAF7]/50">
                          <td className="p-3 font-mono text-[10px] text-[#64748B]">
                            {t.prompt_hash.slice(0, 12)}...
                          </td>
                          <td className="p-3 font-semibold">{t.intent}</td>
                          <td className="p-3 text-[11px] text-[#64748B]">{t.model}</td>
                          <td className="p-3 font-mono">{t.latency_ms} ms</td>
                          <td className="p-3 text-[10px] text-[#0F766E]">{t.validator_flags || 'Clean'}</td>
                          <td className="p-3">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                t.status === 'SUCCESS'
                                  ? 'bg-[#DCFCE7] text-[#15803D]'
                                  : t.status === 'CORRECTION_APPLIED'
                                  ? 'bg-[#FEF3C7] text-[#B45309]'
                                  : 'bg-[#FEE2E2] text-[#DC5252]'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: Security Audit */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <h2 className="text-base font-black text-[#182A29]">Cryptographic Security Audit Log</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAF7] text-[#64748B] font-bold border-b border-[#E2E8F0]">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">IP Address</th>
                        <th className="p-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-[#3E4947]">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#F8FAF7]/50">
                          <td className="p-3 text-[#64748B]">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 font-mono font-bold text-[#182A29]">{log.action}</td>
                          <td className="p-3 font-mono text-[11px]">{log.ip_address}</td>
                          <td className="p-3 text-[11px] text-[#475569]">{log.details || 'Standard transaction'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 5: Integration Health */}
            {activeTab === 'integrations' && (
              <div className="space-y-4">
                <h2 className="text-base font-black text-[#182A29]">Atmospheric Service Integrations Health</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {integrations.map((svc, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAF7] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-[#182A29]">{svc.service}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            svc.status === 'HEALTHY' || svc.status === 'READY'
                              ? 'bg-[#DCFCE7] text-[#15803D]'
                              : 'bg-[#FEF3C7] text-[#B45309]'
                          }`}
                        >
                          {svc.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#64748B]">
                        <span>Mode: {svc.mode}</span>
                        <span>Latency: {svc.latency_ms} ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
