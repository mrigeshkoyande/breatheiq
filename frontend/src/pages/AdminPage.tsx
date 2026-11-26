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
import { ErrorBanner } from '../components/ui/StatusBanner';
import {
  AdminUsersPanel,
  AiTracesPanel,
  AuditAndHealthPanels,
  ModerationPanel,
} from '../components/admin/AdminTabPanels';

type AdminTab = 'moderation' | 'users' | 'ai' | 'audit' | 'health';

const ADMIN_TABS: Array<{ id: AdminTab; label: string }> = [
  { id: 'moderation', label: 'Moderation Queue' },
  { id: 'users', label: 'Users' },
  { id: 'ai', label: 'AI Traces' },
  { id: 'audit', label: 'Audit Logs' },
  { id: 'health', label: 'Integrations' },
];

/** RBAC-protected console for moderation, user status, AI traces, audit logs, and health checks. */
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
      apiRequest(`/admin/moderation/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'queue'] }),
    onError: (err: unknown) =>
      setActionError(err instanceof Error ? err.message : 'Moderation failed.'),
  });

  const toggleUserMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      apiRequest(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
    onError: (err: unknown) =>
      setActionError(err instanceof Error ? err.message : 'User update failed.'),
  });

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
          {ADMIN_TABS.map((tab) => (
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
          <ModerationPanel
            reports={queueQuery.data ?? []}
            isLoading={queueQuery.isLoading}
            isError={Boolean(queueQuery.error)}
            onRetry={() => void queueQuery.refetch()}
            onModerate={(id, action) => moderateMutation.mutate({ id, action })}
          />
        )}
        {activeTab === 'users' && (
          <AdminUsersPanel
            users={usersQuery.data ?? []}
            isLoading={usersQuery.isLoading}
            userSearch={userSearch}
            onSearchChange={setUserSearch}
            onToggleStatus={(id, is_active) => toggleUserMutation.mutate({ id, is_active })}
          />
        )}
        {activeTab === 'ai' && (
          <AiTracesPanel traces={tracesQuery.data ?? []} isLoading={tracesQuery.isLoading} />
        )}
        {(activeTab === 'audit' || activeTab === 'health') && (
          <AuditAndHealthPanels
            mode={activeTab}
            logs={auditQuery.data ?? []}
            health={healthQuery.data ?? []}
            isLoading={activeTab === 'audit' ? auditQuery.isLoading : healthQuery.isLoading}
          />
        )}
      </div>
    </AppShell>
  );
};
