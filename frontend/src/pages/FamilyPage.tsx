import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldAlert, Trash2, Users } from 'lucide-react';
import { queryKeys, useImpactLedger, useMembers } from '../api/hooks';
import { apiRequest } from '../services/api';
import { HouseholdMember } from '../types/api';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Input } from '../components/ui/Input';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';

export const FamilyPage: React.FC = () => {
  const qc = useQueryClient();
  const { data: members = [], isLoading, error, refetch } = useMembers();
  const { data: impact } = useImpactLedger();

  const [name, setName] = useState('');
  const [ageCategory, setAgeCategory] = useState('child');
  const [sensitivity, setSensitivity] = useState('asthma');
  const [memberToDelete, setMemberToDelete] = useState<HouseholdMember | null>(null);
  const [actionError, setActionError] = useState('');

  const addMutation = useMutation({
    mutationFn: () =>
      apiRequest<HouseholdMember>('/user/members', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          age_category: ageCategory,
          sensitivity,
        }),
      }),
    onSuccess: () => {
      setName('');
      void qc.invalidateQueries({ queryKey: queryKeys.members });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Unable to add member.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/user/members/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setMemberToDelete(null);
      void qc.invalidateQueries({ queryKey: queryKeys.members });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Unable to remove member.');
    },
  });

  return (
    <AppShell title="Family Air Guardians">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
              Family AirTwin Vulnerability Profiles
            </h1>
            <p className="text-sm text-[#475569]">
              Household exposure protection ({impact?.total_averted_pm25_mg ?? 0} mg cumulative
              PM2.5 averted).
            </p>
          </div>
          <Badge badgeType="ESTIMATED" />
        </div>

        {(error || actionError) && (
          <ErrorBanner
            message={
              actionError ||
              (error instanceof Error ? error.message : 'Unable to load family profiles.')
            }
            onRetry={() => void refetch()}
          />
        )}

        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              setActionError('');
              addMutation.mutate();
            }}
            className="grid sm:grid-cols-12 gap-3 items-end"
          >
            <div className="sm:col-span-5">
              <Input
                label="Family Member Name"
                placeholder="e.g. Aarav Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-3 flex flex-col gap-1.5">
              <label htmlFor="fam-age" className="text-xs font-semibold uppercase text-[#334155]">
                Age Tier
              </label>
              <select
                id="fam-age"
                value={ageCategory}
                onChange={(e) => setAgeCategory(e.target.value)}
                className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="infant">Infant (0-2)</option>
                <option value="child">Child (3-17)</option>
                <option value="adult">Adult (18-59)</option>
                <option value="senior">Senior (60+)</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="fam-sens" className="text-xs font-semibold uppercase text-[#334155]">
                Sensitivity
              </label>
              <select
                id="fam-sens"
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value)}
                className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="none">None</option>
                <option value="asthma">Asthma</option>
                <option value="bronchitis">Bronchitis</option>
                <option value="heart_condition">Heart</option>
                <option value="pregnancy">Pregnancy</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={addMutation.isPending} className="w-full h-10">
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add
              </Button>
            </div>
          </form>
        </Card>

        {isLoading ? (
          <LoadingSkeleton lines={4} label="Loading household members..." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {members.map((m) => (
              <Card key={m.id} className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="font-bold text-lg">{m.name}</div>
                  <div className="text-xs text-[#475569] capitalize">
                    {m.age_category} · Sensitivity: {m.sensitivity.replace('_', ' ')}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DDF5EC] text-[#0F766E] text-xs font-bold">
                    Vulnerability Score: {m.vulnerability_score}/100
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${m.name} from family profile`}
                  onClick={() => setMemberToDelete(m)}
                  className="p-2 rounded-lg text-[#475569] hover:text-[#B91C1C] hover:bg-[#FEF2F2]"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </Card>
            ))}
          </div>
        )}

        <div className="text-xs text-[#475569] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#0F766E] shrink-0" aria-hidden="true" />
          <span>
            Vulnerability weights guide daily scheduling only and are not clinical advice.
          </span>
        </div>
      </div>

      <ConfirmModal
        isOpen={memberToDelete !== null}
        title="Remove Family Member"
        description={`Remove ${memberToDelete?.name || 'this member'} from your household AirTwin list?`}
        confirmLabel="Remove Member"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (memberToDelete) deleteMutation.mutate(memberToDelete.id);
        }}
        onCancel={() => setMemberToDelete(null)}
      />
    </AppShell>
  );
};
