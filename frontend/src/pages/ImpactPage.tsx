import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Sliders } from 'lucide-react';
import { useImpactLedger } from '../api/hooks';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { buttonStyles } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';

export const ImpactPage: React.FC = () => {
  const { data: impactData, isLoading, error, refetch } = useImpactLedger();

  return (
    <AppShell
      title="Personal Impact Ledger"
      headerRight={
        <Link
          to="/app/impact/what-if"
          className={buttonStyles({ size: 'sm', variant: 'secondary' })}
        >
          <Sliders className="w-4 h-4" aria-hidden="true" />
          What-If Builder
        </Link>
      }
    >
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Leaf className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
              Personal Impact & Avoided Exposure Ledger
            </h1>
            <p className="text-sm text-[#475569]">
              Cumulative particulate intake and transit emissions avoided via daily choices.
            </p>
          </div>
          <Badge badgeType="ESTIMATED" />
        </div>

        {isLoading && <LoadingSkeleton lines={4} label="Loading impact ledger..." />}
        {error && (
          <ErrorBanner
            message={error instanceof Error ? error.message : 'Unable to fetch impact history.'}
            onRetry={() => void refetch()}
          />
        )}

        {impactData && !isLoading && (
          <>
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <div className="text-xs font-bold uppercase text-[#475569]">Averted PM2.5 Dose</div>
                <div className="text-3xl font-extrabold mt-1 text-[#0F766E]">
                  {impactData.total_averted_pm25_mg} mg
                </div>
              </Card>
              <Card>
                <div className="text-xs font-bold uppercase text-[#475569]">Avoided CO2</div>
                <div className="text-3xl font-extrabold mt-1">
                  {impactData.total_averted_co2_kg} kg
                </div>
              </Card>
              <Card>
                <div className="text-xs font-bold uppercase text-[#475569]">Active Streak</div>
                <div className="text-3xl font-extrabold mt-1">
                  {impactData.clean_air_streak_days} days
                </div>
              </Card>
            </div>

            <Card className="space-y-3">
              <h2 className="font-bold text-lg">Daily Ledger History</h2>
              <div className="space-y-2.5">
                {impactData.history.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                  >
                    <div>
                      <div className="font-bold">{log.date_str}</div>
                      {log.notes && <div className="text-xs text-[#475569]">{log.notes}</div>}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-[#0F766E]">
                      <span>{log.averted_pm25_dose_ug} µg PM2.5 averted</span>
                      <span>{log.averted_co2_kg} kg CO2 saved</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
};
