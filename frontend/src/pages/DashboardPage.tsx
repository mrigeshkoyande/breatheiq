import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Bot, Leaf, Navigation, ShieldAlert, Users } from 'lucide-react';
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
import { CorridorTelemetryCard } from '../components/dashboard/CorridorTelemetryCard';
import { WindowOracleWidget } from '../components/dashboard/WindowOracleWidget';
import { RoutineChecklistCard } from '../components/dashboard/RoutineChecklistCard';
import { Badge } from '../components/ui/Badge';
import { Button, buttonStyles } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';

/** Authenticated Family Atmospheric Command Center wired to live backend telemetry and DB state. */
export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const [selectedCityOverride, setSelectedCityOverride] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const { data: cities = [] } = useCities();
  const {
    data: household,
    isLoading: householdLoading,
    error: householdError,
    refetch: refetchHousehold,
  } = useHousehold();

  const activeCity = selectedCityOverride ?? household?.city ?? 'Mumbai';
  const activeCityMeta = cities.find((c) => c.city.toLowerCase() === activeCity.toLowerCase());
  const activeLat = activeCityMeta?.latitude ?? household?.latitude ?? 19.076;
  const activeLon = activeCityMeta?.longitude ?? household?.longitude ?? 72.8777;

  const {
    data: airData,
    isLoading: airLoading,
    error: airError,
    refetch: refetchAir,
  } = useCurrentAirQuality(activeCity);

  const { data: oracleData, isLoading: oracleLoading } = useWindowOracle(activeLat, activeLon);
  const { data: tasks = [], isLoading: tasksLoading } = useRoutineTasks();
  const { data: impact } = useImpactLedger();
  const { data: members = [] } = useMembers();

  const saveHousehold = useSaveHousehold();
  const toggleTask = useToggleRoutineTask();

  const routePreviewMutation = useMutation({
    mutationFn: (city: string) =>
      apiRequest<CleanRouteResponse>('/user/routes/navigate', {
        method: 'POST',
        body: JSON.stringify({
          origin: household?.neighborhood || `${city} Residential Corridor`,
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
    if (household && meta) {
      try {
        await saveHousehold.mutateAsync({
          name: household.name,
          city: meta.city,
          neighborhood: `${meta.city} Central`,
          latitude: meta.latitude,
          longitude: meta.longitude,
        });
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : 'Unable to save default corridor.');
      }
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

  const highestVulnerability = members.reduce(
    (max, member) => Math.max(max, member.vulnerability_score),
    0
  );
  const completedCount = tasks.filter((task) => task.is_completed).length;

  return (
    <AppShell
      title={t('dash.commandCenter')}
      headerRight={
        <Link
          to="/app/assistant"
          className={buttonStyles({ size: 'sm', variant: 'secondary', className: 'hidden sm:inline-flex' })}
        >
          <Bot className="w-4 h-4" aria-hidden="true" />
          {t('dash.askCopilot')}
        </Link>
      }
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('dash.commandCenter')}
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">{t('dash.medicalDisclaimer')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('dash.corridorSelector')}>
            {(cities.length > 0 ? cities.map((c) => c.city) : ['Mumbai', 'Delhi', 'Bengaluru', 'Kolkata', 'Pune']).map(
              (cityName) => (
                <button
                  key={cityName}
                  type="button"
                  aria-pressed={activeCity.toLowerCase() === cityName.toLowerCase()}
                  onClick={() => void handleCitySelect(cityName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    activeCity.toLowerCase() === cityName.toLowerCase()
                      ? 'bg-[#0F766E] text-white border-[#0F766E]'
                      : 'bg-white text-[#334155] border-[#CBD5E1] hover:border-[#0F766E]'
                  }`}
                >
                  {cityName}
                </button>
              )
            )}
          </div>
        </div>

        {(householdError || airError || actionError) && (
          <ErrorBanner
            message={
              actionError ||
              (airError instanceof Error ? airError.message : null) ||
              (householdError instanceof Error ? householdError.message : null) ||
              'Failed to synchronize command center telemetry.'
            }
            onRetry={() => {
              void refetchHousehold();
              void refetchAir();
            }}
          />
        )}

        {/* Primary Telemetry & Window Oracle */}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            {householdLoading || airLoading || !airData ? (
              <Card>
                <LoadingSkeleton lines={4} label="Loading corridor telemetry..." />
              </Card>
            ) : (
              <CorridorTelemetryCard airData={airData} neighborhood={household?.neighborhood} />
            )}
          </div>

          <div className="lg:col-span-5">
            {oracleLoading || !oracleData ? (
              <Card>
                <LoadingSkeleton lines={4} label="Loading Window Oracle..." />
              </Card>
            ) : (
              <WindowOracleWidget title={t('dash.windowOracle')} oracle={oracleData} />
            )}
          </div>
        </div>

        {/* Household Protection Metrics */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                Routine Progress
              </span>
              <Badge badgeType="ESTIMATED" />
            </div>
            <div className="text-2xl font-extrabold">
              {completedCount} / {tasks.length} Tasks
            </div>
            <p className="text-xs text-[#475569]">Persisted daily smog protection steps</p>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-[#0F766E]" aria-hidden="true" />
                {t('dash.impactSummary')}
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
              {members.length} registered family member{members.length === 1 ? '' : 's'}
            </p>
          </Card>
        </div>

        {/* Routine Checklist & Live CleanRoute Comparison */}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            {tasksLoading ? (
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

          <Card className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold">
                <Navigation className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                <h2>{t('dash.cleanRoute')}</h2>
              </div>
              <Badge badgeType={routePreviewMutation.data?.source || 'ESTIMATED'} />
            </div>

            {!routePreviewMutation.data ? (
              <div className="space-y-3">
                <p className="text-sm text-[#475569]">
                  Compare inhaled PM2.5 dosage and tailpipe CO2 for a 14 km commute in{' '}
                  <strong>{activeCity}</strong>.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={routePreviewMutation.isPending}
                    onClick={() => routePreviewMutation.mutate(activeCity)}
                  >
                    {routePreviewMutation.isPending ? 'Computing Routes...' : 'Compute Live Corridor Options'}
                  </Button>
                  <Link to="/app/routes" className={buttonStyles({ size: 'sm', variant: 'outline' })}>
                    Open Route Planner
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {routePreviewMutation.data.routes.map((route) => (
                  <div
                    key={route.id}
                    className={`p-3 rounded-xl border text-xs ${
                      route.recommended
                        ? 'bg-[#EBF7F0] border-[#A3E5BA]'
                        : 'bg-[#F8FAF7] border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{route.name}</span>
                      <span>{route.inhaled_dose_ug} µg dose</span>
                    </div>
                    <div className="text-[#475569] mt-0.5">
                      {route.travel_time_min} min · {route.average_pm25} µg/m³ · {route.co2_emissions_kg} kg CO2
                    </div>
                  </div>
                ))}
                <div className="pt-1">
                  <Link to="/app/routes" className={buttonStyles({ variant: 'outline', size: 'sm', className: 'w-full' })}>
                    Customize Origin & Destination
                  </Link>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#E2E8F0] flex items-center gap-2 text-[11px] text-[#475569]">
              <ShieldAlert className="w-3.5 h-3.5 text-[#0F766E] shrink-0" aria-hidden="true" />
              <span>{t('dash.medicalDisclaimer')}</span>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};
