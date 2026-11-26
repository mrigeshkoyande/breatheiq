import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Plus, Trash2 } from 'lucide-react';
import { queryKeys, useAlertsAndRules } from '../api/hooks';
import { apiRequest } from '../services/api';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';

export const NotificationsPage: React.FC = () => {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useAlertsAndRules();
  const [threshold, setThreshold] = useState('220');
  const [targetMember, setTargetMember] = useState('All Members');
  const [actionError, setActionError] = useState('');

  const markReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/user/alerts/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.alerts }),
    onError: (err: unknown) =>
      setActionError(err instanceof Error ? err.message : 'Unable to mark read.'),
  });

  const addRuleMutation = useMutation({
    mutationFn: () =>
      apiRequest('/user/alerts/rules', {
        method: 'POST',
        body: JSON.stringify({
          aqi_threshold: Number(threshold),
          target_member: targetMember.trim() || 'All Members',
          quiet_hours_start: '22:00',
          quiet_hours_end: '07:00',
          channels: 'in_app,push',
        }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.alerts }),
    onError: (err: unknown) =>
      setActionError(err instanceof Error ? err.message : 'Unable to save rule.'),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/user/alerts/rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.alerts }),
    onError: (err: unknown) =>
      setActionError(err instanceof Error ? err.message : 'Unable to remove rule.'),
  });

  const rules = data?.rules ?? [];
  const notifications = data?.notifications ?? [];

  return (
    <AppShell title="SmogShield Notifications & Rules">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
            Smog Alert Feed & Threshold Rules
          </h1>
          <p className="text-sm text-[#475569]">
            Configure personal NAQI escalation triggers and manage delivered advisories.
          </p>
        </div>

        {(error || actionError) && (
          <ErrorBanner
            message={
              actionError || (error instanceof Error ? error.message : 'Unable to fetch alerts.')
            }
            onRetry={() => void refetch()}
          />
        )}

        {isLoading ? (
          <LoadingSkeleton lines={4} label="Loading notifications and alert rules..." />
        ) : (
          <div className="grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5 space-y-4">
              <h2 className="font-bold text-lg">Active Threshold Rules ({rules.length})</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setActionError('');
                  addRuleMutation.mutate();
                }}
                className="space-y-3"
              >
                <Input
                  label="NAQI Trigger Threshold"
                  type="number"
                  min={50}
                  max={500}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
                <Input
                  label="Target Group"
                  value={targetMember}
                  onChange={(e) => setTargetMember(e.target.value)}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={addRuleMutation.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add Alert Rule
                </Button>
              </form>

              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold">AQI &gt;= {rule.aqi_threshold}</div>
                      <div className="text-[#475569]">
                        {rule.target_member} · Quiet {rule.quiet_hours_start}-{rule.quiet_hours_end}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete alert rule for ${rule.target_member}`}
                      onClick={() => deleteRuleMutation.mutate(rule.id)}
                      className="p-1.5 rounded text-[#475569] hover:text-[#B91C1C]"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="lg:col-span-7 space-y-3">
              <h2 className="font-bold text-lg">Alert Notifications ({notifications.length})</h2>
              {notifications.length === 0 ? (
                <p className="text-sm text-[#475569]">No alert notifications recorded.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-xl border space-y-1.5 ${
                        n.is_read
                          ? 'bg-[#F8FAF7] border-[#E2E8F0]'
                          : 'bg-[#FEF8E7] border-[#FCE28E]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-sm">{n.title}</div>
                        {!n.is_read && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => markReadMutation.mutate(n.id)}
                          >
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-[#334155]">{n.message}</p>
                      <div className="text-[11px] text-[#475569]">
                        Driver: {n.pollutant_driver} · Trigger AQI: {n.aqi_at_trigger}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
};
