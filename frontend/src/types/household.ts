import type { ProvenanceSource } from './telemetry';

export interface InhalationImpact {
  activity_type: string;
  inhalation_rate_m3h: number;
  exposure_duration_hours: number;
  outdoor_pm25_ugm3: number;
  effective_pm25_ugm3: number;
  unprotected_inhaled_dose_ug: number;
  actual_inhaled_dose_ug: number;
  averted_inhaled_dose_ug: number;
  protection_efficiency_pct: number;
  citation: string;
}

export interface TransitImpact {
  baseline_mode: string;
  chosen_mode: string;
  distance_km: number;
  co2_averted_kg: number;
  pm25_exhaust_averted_g: number;
  trees_equivalent_daily: number;
  citation: string;
}

export interface HouseholdImpactSummary {
  daily_averted_pm25_dose_ug: number;
  daily_co2_averted_kg: number;
  aqi_hours_avoided: number;
  equivalent_unfiltered_cigarettes_avoided: number;
  inhalation_detail: InhalationImpact;
  transit_detail: TransitImpact | null;
  provenance_badge: string;
  methodology: string;
}

export interface Household {
  id: number;
  user_id: number;
  name: string;
  city: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface HouseholdMember {
  id: number;
  user_id: number;
  household_id?: number | null;
  name: string;
  age_category: string;
  sensitivity: string;
  vulnerability_score: number;
  created_at: string;
}

export interface Room {
  id: number;
  user_id: number;
  household_id?: number | null;
  name: string;
  length_m: number;
  width_m: number;
  height_m: number;
  has_purifier: boolean;
  purifier_cadr?: number | null;
  created_at: string;
}

export interface RoomReading {
  id: number;
  room_id: number;
  pm25: number;
  co2?: number | null;
  temperature_c?: number | null;
  humidity_pct?: number | null;
  source: string;
  timestamp: string;
}

export interface RoutineTask {
  id: number;
  user_id: number;
  member_id?: number | null;
  time_slot: string;
  title: string;
  description?: string | null;
  category: string;
  is_completed: boolean;
  date_str: string;
  created_at: string;
}

export interface CleanRouteOption {
  id: string;
  name: string;
  travel_time_min: number;
  average_pm25: number;
  inhaled_dose_ug: number;
  co2_emissions_kg: number;
  exposure_rating: string;
  recommended: boolean;
  advisory: string;
}

export interface CleanRouteResponse {
  origin: string;
  destination: string;
  city: string;
  source: ProvenanceSource;
  distance_km: number;
  routes: CleanRouteOption[];
}

export interface ImpactLog {
  id: number;
  user_id: number;
  date_str: string;
  averted_pm25_dose_ug: number;
  averted_co2_kg: number;
  aqi_hours_avoided: number;
  notes?: string | null;
  created_at: string;
}

export interface ImpactLedgerResponse {
  total_averted_pm25_mg: number;
  total_averted_co2_kg: number;
  total_aqi_hours_avoided: number;
  clean_air_streak_days: number;
  history: ImpactLog[];
}

export interface SmogAlertRule {
  id: number;
  user_id: number;
  aqi_threshold: number;
  target_member: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  channels: string;
  is_enabled: boolean;
  created_at: string;
}

export interface SmogAlertNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  aqi_at_trigger: number;
  pollutant_driver: string;
  reason_why: string;
  is_read: boolean;
  created_at: string;
}

export interface AlertsResponse {
  rules: SmogAlertRule[];
  notifications: SmogAlertNotification[];
}
