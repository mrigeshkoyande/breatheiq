import React from 'react';
import {
  AITrace,
  AdminUserSummary,
  AuditLog,
  CommunityReport,
  IntegrationHealth,
} from '../../types/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ErrorBanner, LoadingSkeleton } from '../ui/StatusBanner';

interface ModerationPanelProps {
  reports: CommunityReport[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onModerate: (id: number, action: 'VERIFY' | 'REJECT') => void;
}

/** Moderation queue card listing pending community smoke/hazard reports. */
export const ModerationPanel: React.FC<ModerationPanelProps> = ({
  reports,
  isLoading,
  isError,
  onRetry,
  onModerate,
}) => (
  <Card className="space-y-3">
    <h2 className="font-bold text-lg">Unverified Community Reports</h2>
    {isLoading ? (
      <LoadingSkeleton lines={3} />
    ) : isError ? (
      <ErrorBanner message="Unable to fetch moderation queue." onRetry={onRetry} />
    ) : reports.length === 0 ? (
      <p className="text-sm text-ink-secondary">No pending unverified reports.</p>
    ) : (
      reports.map((r) => (
        <div
          key={r.id}
          className="p-4 rounded-xl bg-canvas border border-edge flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <div className="font-bold text-sm">{r.location_name}</div>
            <div className="text-xs text-ink-secondary">
              {r.report_type} · {r.severity} · {r.upvote_count} confirmations
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onModerate(r.id, 'VERIFY')}>
              Verify
            </Button>
            <Button size="sm" variant="danger" onClick={() => onModerate(r.id, 'REJECT')}>
              Reject
            </Button>
          </div>
        </div>
      ))
    )}
  </Card>
);

interface UsersPanelProps {
  users: AdminUserSummary[];
  isLoading: boolean;
  userSearch: string;
  onSearchChange: (value: string) => void;
  onToggleStatus: (id: number, isActive: boolean) => void;
}

/** Registered account directory with search filtering and activation toggles. */
export const AdminUsersPanel: React.FC<UsersPanelProps> = ({
  users,
  isLoading,
  userSearch,
  onSearchChange,
  onToggleStatus,
}) => (
  <Card className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-bold text-lg">Registered Accounts</h2>
      <input
        aria-label="Filter accounts by email or name"
        placeholder="Search users..."
        value={userSearch}
        onChange={(e) => onSearchChange(e.target.value)}
        className="bg-white border border-edge-strong rounded-lg px-3 py-1.5 text-sm"
      />
    </div>
    {isLoading ? (
      <LoadingSkeleton lines={3} />
    ) : (
      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="p-3 rounded-xl bg-canvas border border-edge flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div>
              <div className="font-bold text-sm">{u.email}</div>
              <div className="text-ink-secondary">
                Role: {u.role} · {u.is_active ? 'Active' : 'Suspended'}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => onToggleStatus(u.id, !u.is_active)}>
              {u.is_active ? 'Suspend' : 'Activate'}
            </Button>
          </div>
        ))}
      </div>
    )}
  </Card>
);

/** Copilot safety validation trace log table. */
export const AiTracesPanel: React.FC<{ traces: AITrace[]; isLoading: boolean }> = ({
  traces,
  isLoading,
}) => (
  <Card className="space-y-3">
    <h2 className="font-bold text-lg">Copilot Safety & Validation Traces</h2>
    {isLoading ? (
      <LoadingSkeleton lines={3} />
    ) : (
      traces.map((t) => (
        <div
          key={t.id}
          className="p-3 rounded-xl bg-canvas border border-edge text-xs flex justify-between"
        >
          <div>
            <strong>{t.intent}</strong> · Model: {t.model} · Status: {t.status}
          </div>
          <span className="text-ink-secondary">{t.latency_ms} ms</span>
        </div>
      ))
    )}
  </Card>
);

/** Security audit log list and external provider health status panels. */
export const AuditAndHealthPanels: React.FC<{
  mode: 'audit' | 'health';
  logs: AuditLog[];
  health: IntegrationHealth[];
  isLoading: boolean;
}> = ({ mode, logs, health, isLoading }) => (
  <Card className="space-y-3">
    <h2 className="font-bold text-lg">
      {mode === 'audit' ? 'Security Audit Logs' : 'External Telemetry & AI Integration Health'}
    </h2>
    {isLoading ? (
      <LoadingSkeleton lines={3} />
    ) : mode === 'audit' ? (
      logs.map((a) => (
        <div
          key={a.id}
          className="p-3 rounded-xl bg-canvas border border-edge text-xs flex justify-between"
        >
          <span>
            <strong>{a.action}</strong> — {a.details || 'Verified event'}
          </span>
          <span className="text-ink-secondary">{new Date(a.timestamp).toLocaleString()}</span>
        </div>
      ))
    ) : (
      health.map((h) => (
        <div
          key={h.service}
          className="p-3.5 rounded-xl bg-canvas border border-edge flex justify-between text-xs"
        >
          <div>
            <div className="font-bold text-sm">{h.service}</div>
            <div className="text-ink-secondary">{h.mode}</div>
          </div>
          <span className="font-bold text-brand">
            {h.status} ({h.latency_ms} ms)
          </span>
        </div>
      ))
    )}
  </Card>
);
