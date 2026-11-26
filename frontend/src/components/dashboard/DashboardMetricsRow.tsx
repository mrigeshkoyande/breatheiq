import React from 'react';
import { Leaf, Users } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface ImpactLedgerSummary {
  total_averted_pm25_mg: number;
  total_averted_co2_kg: number;
  clean_air_streak_days: number;
}

interface DashboardMetricsRowProps {
  completedCount: number;
  totalTasks: number;
  impactTitle: string;
  impact?: ImpactLedgerSummary;
  highestVulnerability: number;
  memberCount: number;
}

/** Three-column summary KPI strip for routine progress, averted impact, and peak risk. */
export const DashboardMetricsRow: React.FC<DashboardMetricsRowProps> = ({
  completedCount,
  totalTasks,
  impactTitle,
  impact,
  highestVulnerability,
  memberCount,
}) => (
  <div className="grid sm:grid-cols-3 gap-4">
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">
          Routine Progress
        </span>
        <Badge badgeType="ESTIMATED" />
      </div>
      <div className="text-2xl font-extrabold">
        {completedCount} / {totalTasks} Tasks
      </div>
      <p className="text-xs text-[#475569]">Persisted daily smog protection steps</p>
    </Card>

    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
          <Leaf className="w-3.5 h-3.5 text-[#0F766E]" aria-hidden="true" />
          {impactTitle}
        </span>
        <Badge badgeType="ESTIMATED" />
      </div>
      <div className="text-2xl font-extrabold">
        {impact ? `${impact.total_averted_pm25_mg} mg PM2.5` : '--'}
      </div>
      <p className="text-xs text-[#475569]">
        {impact
          ? `${impact.total_averted_co2_kg} kg CO2 avoided · ${impact.clean_air_streak_days}-day ledger`
          : 'Loading impact ledger...'}
      </p>
    </Card>

    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#0F766E]" aria-hidden="true" />
          Family AirTwin Peak Risk
        </span>
        <Badge badgeType="ESTIMATED" />
      </div>
      <div className="text-2xl font-extrabold">
        {highestVulnerability > 0 ? `${highestVulnerability} / 100` : '--'}
      </div>
      <p className="text-xs text-[#475569]">
        {memberCount} registered family member{memberCount === 1 ? '' : 's'}
      </p>
    </Card>
  </div>
);
