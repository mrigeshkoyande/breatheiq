import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import type {
  AirDataPayload,
  AlertsResponse,
  AuthConfig,
  CityInfo,
  CommunityReport,
  ForecastSlot,
  Household,
  HouseholdMember,
  ImpactLedgerResponse,
  NAQIBreakpointsTable,
  Room,
  RoutineTask,
  WindowOracleOutput,
} from '../types/api';

export const queryKeys = {
  authConfig: ['auth', 'config'] as const,
  cities: ['air-quality', 'cities'] as const,
  currentAir: (city: string) => ['air-quality', 'current', city] as const,
  forecast: (lat: number, lon: number, hours: number) =>
    ['air-quality', 'forecast', lat, lon, hours] as const,
  windowOracle: (lat: number, lon: number) => ['engines', 'window-oracle', lat, lon] as const,
  naqiBreakpoints: ['engines', 'naqi', 'breakpoints'] as const,
  household: ['user', 'household'] as const,
  members: ['user', 'members'] as const,
  rooms: ['user', 'rooms'] as const,
  routine: ['user', 'routine'] as const,
  impact: ['user', 'impact'] as const,
  alerts: ['user', 'alerts'] as const,
  community: (reportType?: string, severity?: string) =>
    ['community', 'reports', reportType ?? '', severity ?? ''] as const,
};

export function useAuthConfig() {
  return useQuery({
    queryKey: queryKeys.authConfig,
    queryFn: () => apiRequest<AuthConfig>('/auth/config'),
    staleTime: 5 * 60_000,
  });
}

export function useCities() {
  return useQuery({
    queryKey: queryKeys.cities,
    queryFn: () => apiRequest<CityInfo[]>('/air-quality/cities'),
    staleTime: 10 * 60_000,
  });
}

export function useCurrentAirQuality(city: string) {
  return useQuery({
    queryKey: queryKeys.currentAir(city),
    queryFn: () => apiRequest<AirDataPayload>(`/air-quality/current?city=${encodeURIComponent(city)}`),
    staleTime: 60_000,
  });
}

export function useAirQualityForecast(lat: number, lon: number, hours = 24) {
  return useQuery({
    queryKey: queryKeys.forecast(lat, lon, hours),
    queryFn: () =>
      apiRequest<ForecastSlot[]>(`/air-quality/forecast?lat=${lat}&lon=${lon}&hours=${hours}`),
    staleTime: 5 * 60_000,
  });
}

export function useWindowOracle(lat: number, lon: number) {
  return useQuery({
    queryKey: queryKeys.windowOracle(lat, lon),
    queryFn: () =>
      apiRequest<WindowOracleOutput>('/engines/window-oracle', {
        method: 'POST',
        body: JSON.stringify({ lat, lon }),
      }),
    staleTime: 5 * 60_000,
  });
}

export function useNaqiBreakpoints() {
  return useQuery({
    queryKey: queryKeys.naqiBreakpoints,
    queryFn: () => apiRequest<NAQIBreakpointsTable>('/engines/naqi/breakpoints'),
    staleTime: 30 * 60_000,
  });
}

export function useHousehold() {
  return useQuery({
    queryKey: queryKeys.household,
    queryFn: () => apiRequest<Household>('/user/household'),
    staleTime: 60_000,
  });
}

export function useSaveHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Pick<Household, 'name' | 'city' | 'neighborhood' | 'latitude' | 'longitude'>) =>
      apiRequest<Household>('/user/household', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.household, updated);
    },
  });
}

export function useMembers() {
  return useQuery({
    queryKey: queryKeys.members,
    queryFn: () => apiRequest<HouseholdMember[]>('/user/members'),
    staleTime: 60_000,
  });
}

export function useRooms() {
  return useQuery({
    queryKey: queryKeys.rooms,
    queryFn: () => apiRequest<Room[]>('/user/rooms'),
    staleTime: 60_000,
  });
}

export function useRoutineTasks() {
  return useQuery({
    queryKey: queryKeys.routine,
    queryFn: () => apiRequest<RoutineTask[]>('/user/routine'),
    staleTime: 30_000,
  });
}

export function useToggleRoutineTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) =>
      apiRequest<RoutineTask>(`/user/routine/${taskId}/toggle`, { method: 'PATCH' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.routine });
    },
  });
}

export function useImpactLedger() {
  return useQuery({
    queryKey: queryKeys.impact,
    queryFn: () => apiRequest<ImpactLedgerResponse>('/user/impact'),
    staleTime: 60_000,
  });
}

export function useAlertsAndRules() {
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: () => apiRequest<AlertsResponse>('/user/alerts'),
    staleTime: 30_000,
  });
}

export function useCommunityReports(reportType?: string, severity?: string) {
  return useQuery({
    queryKey: queryKeys.community(reportType, severity),
    queryFn: () => {
      const params = new URLSearchParams();
      if (reportType) params.set('report_type', reportType);
      if (severity) params.set('severity', severity);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return apiRequest<CommunityReport[]>(`/community/reports${qs}`);
    },
    staleTime: 30_000,
  });
}
