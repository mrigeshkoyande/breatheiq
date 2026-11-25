import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { apiRequest } from '../services/api';
import {
  AITrace,
  AdminUserSummary,
  AuditLog,
  CommunityReport,
  IntegrationHealth,
} from '../types/api';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';

type AdminTab = 'moderation' | 'users' | 'ai' | 'audit' | 'health';

export const AdminPage: React.FC = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('moderation');
  const [userSearch, setUserSearch] = useState('');
  const [actionError, setActionError] = useState('');

  const queueQuery = useQuery({
    queryKey: ['admin', 'queue'],
    queryFn: () => apiRequest<CommunityReport[]>('/admin/moderation/queue'),
  });
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', userSearch],
    queryFn: () =>
      apiRequest<AdminUserSummary[]>(
        userSearch.trim()
          ? `/admin/users?search=${encodeURIComponent(userSearch.trim())}`
          : '/admin/users'
      ),
    enabled: activeTab === 'users',
  });
  const tracesQuery = useQuery({
    queryKey: ['admin', 'traces'],
    queryFn: () => apiRequest<AITrace[]>('/admin/ai-traces'),
    enabled: activeTab === 'ai',
  });
  const auditQuery = useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: () => apiRequest<AuditLog[]>('/admin/audit-logs'),
    enabled: activeTab === 'audit',
  });
  const healthQuery = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: () => apiRequest<IntegrationHealth[]>('/admin/integrations/health'),
    enabled: activeTab === 'health',
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'VERIFY' | 'REJECT' }) =>
      apiRequest(`/admin/moderation/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'queue'] }),
    onError: (err: unknown) => setActionError(err instanceof Error ? err.message : 'Moderation failed.'),
  });

  const toggleUserMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      apiRequest(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
    onError: (err: unknown) => setActionError(err instanceof Error ? err.message : 'User update failed.'),
  });

  const tabs: Array<{ id: AdminTab; label: string }> = [
    { id: 'moderation', label: 'Moderation Queue' },
    { id: 'users', label: 'Users' },
    { id: 'ai', label: 'AI Traces' },
    { id: 'audit', label: 'Audit Logs' },
    { id: 'health', label: 'Integrations' },
  ];

  return (
    <AppShell title="Admin & Moderation Command">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
            Administration & Moderation Console
          </h1>
          <p className="text-sm text-[#475569]">
            RBAC-enforced moderation queue, Copilot safety traces, audit logs, and provider health.
          </p>
        </div>

        {actionError && <ErrorBanner message={actionError} />}

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Admin sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0F766E] text-white border-[#0F766E]'
                  : 'bg-white text-[#334155] border-[#CBD5E1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'moderation' && (
          <Card className="space-y-3">
            <h2 className="font-bold text-lg">Unverified Community Reports</h2>
            {queueQuery.isLoading ? (
              <LoadingSkeleton lines={3} />
            ) : queueQuery.error ? (
              <ErrorBanner message="Unable to fetch moderation queue." onRetry={() => void queueQuery.refetch()} />
            ) : (queueQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-[#475569]">No pending unverified reports.</p>
            ) : (
              (queueQuery.data ?? []).map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-sm">{r.location_name}</div>
                    <div className="text-xs text-[#475569]">
                      {r.report_type} · {r.severity} · {r.upvote_count} confirmations
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => moderateMutation.mutate({ id: r.id, action: 'VERIFY' })}
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => moderateMutation.mutate({ id: r.id, action: 'REJECT' })}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Card>
        )}

        {activeTab === 'users' && (
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-lg">Registered Accounts</h2>
              <input
                aria-label="Filter accounts by email or name"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-sm"
              />
            </div>
            {usersQuery.isLoading ? (
              <LoadingSkeleton lines={3} />
            ) : (
              <div className="space-y-2">
                {(usersQuery.data ?? []).map((u) => (
                  <div
                    key={u.id}
                    className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-sm">{u.email}</div>
                      <div className="text-[#475569]">
                        Role: {u.role} · {u.is_active ? 'Active' : 'Suspended'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleUserMutation.mutate({ id: u.id, is_active: !u.is_active })}
                    >
                      {u.is_active ? 'Suspend' : 'Activate'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'ai' && (
          <Card className="space-y-3">
            <h2 className="font-bold text-lg">Copilot Safety & Validation Traces</h2>
            {tracesQuery.isLoading ? (
              <LoadingSkeleton lines={3} />
            ) : (
              (tracesQuery.data ?? []).map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] text-xs flex justify-between">
                  <div>
                    <strong>{t.intent}</strong> · Model: {t.model} · Status: {t.status}
                  </div>
                  <span className="text-[#475569]">{t.latency_ms} ms</span>
                </div>
              ))
            )}
          </Card>
        )}

        {activeTab === 'audit' && (
          <Card className="space-y-3">
            <h2 className="font-bold text-lg">Security Audit Logs</h2>
            {auditQuery.isLoading ? (
              <LoadingSkeleton lines={3} />
            ) : (
              (auditQuery.data ?? []).map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] text-xs flex justify-between">
                  <span>
                    <strong>{a.action}</strong> — {a.details || 'Verified event'}
                  </span>
                  <span className="text-[#475569]">{new Date(a.timestamp).toLocaleString()}</span>
                </div>
              ))
            )}
          </Card>
        )}

        {activeTab === 'health' && (
          <Card className="space-y-3">
            <h2 className="font-bold text-lg">External Telemetry & AI Integration Health</h2>
            {healthQuery.isLoading ? (
              <LoadingSkeleton lines={3} />
            ) : (
              (healthQuery.data ?? []).map((h) => (
                <div key={h.service} className="p-3.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] flex justify-between text-xs">
                  <div>
                    <div className="font-bold text-sm">{h.service}</div>
                    <div className="text-[#475569]">{h.mode}</div>
                  </div>
                  <span className="font-bold text-[#0F766E]">
                    {h.status} ({h.latency_ms} ms)
                  </span>
                </div>
              ))
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
};
