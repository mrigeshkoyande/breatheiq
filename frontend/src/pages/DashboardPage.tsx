import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Bot } from 'lucide-react';
import {
  useCities,
  useCurrentAirQuality,
  useHousehold,
  useImpactLedger,
  useMembers,
  useRoutineTasks,
  useSaveHousehold,
  useToggleRoutineTask,
  useWindowOracle,
} from '../api/hooks';
import { apiRequest } from '../services/api';
import { CleanRouteResponse } from '../types/api';
import { useLanguage } from '../i18n/translations';
import { AppShell } from '../components/layout/AppShell';
import { CorridorSelectorHeader } from '../components/dashboard/CorridorSelectorHeader';
import { DashboardPrimaryRow } from '../components/dashboard/DashboardPrimaryRow';
import { RoutineChecklistCard } from '../components/dashboard/RoutineChecklistCard';
import { DashboardMetricsRow } from '../components/dashboard/DashboardMetricsRow';
import { CleanRoutePreviewCard } from '../components/dashboard/CleanRoutePreviewCard';
import { buttonStyles } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';

const FALLBACK_CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Kolkata', 'Pune'];

/** Authenticated Family Atmospheric Command Center wired to live backend telemetry and DB state. */
export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const [selectedCityOverride, setSelectedCityOverride] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const { data: cities = [] } = useCities();
  const householdQ = useHousehold();
  const activeCity = selectedCityOverride ?? householdQ.data?.city ?? 'Mumbai';
  const activeMeta = cities.find((c) => c.city.toLowerCase() === activeCity.toLowerCase());
  const activeLat = activeMeta?.latitude ?? householdQ.data?.latitude ?? 19.076;
  const activeLon = activeMeta?.longitude ?? householdQ.data?.longitude ?? 72.8777;

  const airQ = useCurrentAirQuality(activeCity);
  const oracleQ = useWindowOracle(activeLat, activeLon);
  const tasksQ = useRoutineTasks();
  const { data: impact } = useImpactLedger();
  const { data: members = [] } = useMembers();
  const saveHousehold = useSaveHousehold();
  const toggleTask = useToggleRoutineTask();

  const routePreview = useMutation({
    mutationFn: (city: string) =>
      apiRequest<CleanRouteResponse>('/user/routes/navigate', {
        method: 'POST',
        body: JSON.stringify({
          origin: householdQ.data?.neighborhood || `${city} Residential Corridor`,
          destination: `${city} Business District`,
          city,
          distance_km: 14.0,
          departure_hour: new Date().getHours(),
        }),
      }),
  });

  const handleCitySelect = async (nextCity: string) => {
    setSelectedCityOverride(nextCity);
    setActionError('');
    const meta = cities.find((c) => c.city.toLowerCase() === nextCity.toLowerCase());
    if (!householdQ.data || !meta) return;
    try {
      await saveHousehold.mutateAsync({
        name: householdQ.data.name,
        city: meta.city,
        neighborhood: `${meta.city} Central`,
        latitude: meta.latitude,
        longitude: meta.longitude,
      });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Unable to save default corridor.');
    }
  };

  const handleToggleTask = async (taskId: number) => {
    setTogglingId(taskId);
    setActionError('');
    try {
      await toggleTask.mutateAsync(taskId);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Unable to update task state.');
    } finally {
      setTogglingId(null);
    }
  };

  const tasks = tasksQ.data ?? [];
  const cityChoices = cities.length > 0 ? cities.map((c) => c.city) : FALLBACK_CITIES;
  const highestRisk = members.reduce((max, m) => Math.max(max, m.vulnerability_score), 0);
  const completedCount = tasks.filter((task) => task.is_completed).length;

  return (
    <AppShell
      title={t('dash.commandCenter')}
      headerRight={
        <Link
          to="/app/assistant"
          className={buttonStyles({
            size: 'sm',
            variant: 'secondary',
            className: 'hidden sm:inline-flex',
          })}
        >
          <Bot className="w-4 h-4" aria-hidden="true" />
          {t('dash.askCopilot')}
        </Link>
      }
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <CorridorSelectorHeader
          title={t('dash.commandCenter')}
          disclaimer={t('dash.medicalDisclaimer')}
          corridorLabel={t('dash.corridorSelector')}
          cities={cityChoices}
          activeCity={activeCity}
          onSelectCity={(c) => void handleCitySelect(c)}
        />

        {(householdQ.error || airQ.error || actionError) && (
          <ErrorBanner
            message={
              actionError ||
              (airQ.error instanceof Error ? airQ.error.message : null) ||
              (householdQ.error instanceof Error ? householdQ.error.message : null) ||
              'Failed to synchronize command center telemetry.'
            }
            onRetry={() => {
              void householdQ.refetch();
              void airQ.refetch();
            }}
          />
        )}

        <DashboardPrimaryRow
          airLoading={householdQ.isLoading || airQ.isLoading}
          airData={airQ.data}
          neighborhood={householdQ.data?.neighborhood}
          oracleLoading={oracleQ.isLoading}
          oracleData={oracleQ.data}
          oracleTitle={t('dash.windowOracle')}
        />

        <DashboardMetricsRow
          completedCount={completedCount}
          totalTasks={tasks.length}
          impactTitle={t('dash.impactSummary')}
          impact={impact}
          highestVulnerability={highestRisk}
          memberCount={members.length}
        />

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            {tasksQ.isLoading ? (
              <Card>
                <LoadingSkeleton lines={4} label="Loading routine checklist..." />
              </Card>
            ) : (
              <RoutineChecklistCard
                title={t('dash.todaysRoutine')}
                viewAllLabel={t('dash.viewAll')}
                tasks={tasks}
                togglingId={togglingId}
                onToggle={(id) => void handleToggleTask(id)}
              />
            )}
          </div>
          <CleanRoutePreviewCard
            title={t('dash.cleanRoute')}
            activeCity={activeCity}
            medicalDisclaimer={t('dash.medicalDisclaimer')}
            data={routePreview.data}
            isPending={routePreview.isPending}
            onCompute={() => routePreview.mutate(activeCity)}
          />
        </div>
      </div>
    </AppShell>
  );
};
