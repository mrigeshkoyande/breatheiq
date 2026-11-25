import type { CpcbCategory } from '../utils/calculations';

export type ProvenanceSource = 'LIVE' | 'MODELED' | 'FORECAST' | 'ESTIMATED' | 'USER-REPORTED' | 'DEMO';

export interface CityInfo {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  base_pm25: number;
  base_pm10: number;
  base_no2: number;
  base_so2: number;
  base_co: number;
  base_o3: number;
  temp_c: number;
  humidity: number;
  wind_speed: number;
}

export interface SubIndexResult {
  pollutant: string;
  concentration: number;
  unit: string;
  sub_index: number;
  category: string;
  color: string;
}

export interface NAQIResult {
  is_valid: boolean;
  aqi: number | null;
  category: CpcbCategory | 'Incomplete Data' | null;
  color: string | null;
  dominant_pollutant: string | null;
  health_advisory: string;
  sub_indices: Record<string, SubIndexResult>;
  validity_notes: string;
  provenance: string;
}

export interface AirDataPayload {
  city: string;
  location_name: string;
  latitude: number;
  longitude: number;
  timestamp_utc: string;
  source: ProvenanceSource;
  confidence_score: number;
  station_id?: string | null;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  temperature_c: number;
  relative_humidity_pct: number;
  wind_speed_ms: number;
  boundary_layer_height_m?: number | null;
  naqi: NAQIResult;
}

export interface ForecastSlot {
  time: string;
  pm25: number;
  pm10: number;
  wind_speed_ms: number;
  temperature_c: number;
  relative_humidity_pct: number;
  boundary_layer_height_m: number;
  badge: string;
}

export interface HourlyVentilationSlot {
  hour_iso: string;
  hour_local: string;
  pm25: number;
  boundary_layer_height_m?: number | null;
  wind_speed_ms: number;
  temperature_c: number;
  relative_humidity_pct: number;
  aeration_score: number;
  recommendation: 'VENTILATE_FREELY' | 'VENTILATE_BRIEFLY' | 'PURIFY' | 'SEAL';
  rationale: string;
  badge: string;
}

export interface WindowOracleOutput {
  is_forecast_driven: boolean;
  summary_advisory: string;
  best_window_start: string | null;
  best_window_end: string | null;
  best_window_score: number;
  current_action: string;
  hourly_slots: HourlyVentilationSlot[];
  provenance_badge: string;
  methodology_note: string;
}

export interface DecayPoint {
  minute: number;
  pm25_concentration: number;
  reduction_pct: number;
}

export interface PurifierSizingResult {
  room_area_m2: number;
  room_area_sqft: number;
  room_volume_m3: number;
  room_volume_cuft: number;
  target_ach: number;
  required_cadr_m3h: number;
  required_cadr_cfm: number;
  time_to_50pct_min: number;
  time_to_80pct_min: number;
  decay_curve: DecayPoint[];
  recommended_device_class: string;
  diy_corsi_rosenthal_comparable: boolean;
  limitations: string;
  provenance: string;
}

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

export interface CommunityReport {
  id: number;
  user_id: number;
  report_type: string;
  severity: string;
  location_name: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  upvote_count: number;
  status: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  created_at: string;
}

export interface AdminUserSummary {
  id: number;
  email: string;
  full_name?: string | null;
  role: 'user' | 'moderator' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  created_at?: string | null;
}

export interface AITrace {
  id: number;
  user_id?: number | null;
  prompt_hash: string;
  intent: string;
  model: string;
  latency_ms: number;
  tokens_used: number;
  validator_flags?: string | null;
  status: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  action: string;
  resource_type?: string | null;
  resource_id?: string | null;
  ip_address?: string | null;
  details?: string | null;
  timestamp: string;
}

export interface IntegrationHealth {
  service: string;
  status: string;
  latency_ms: number;
  mode: string;
}

export interface CopilotChatResponse {
  reply: string;
  intent: string;
  source_badge: string;
  evidence_context: Record<string, unknown>;
  why_this_advice: string;
  limitations: string;
  validator_flags: string[];
  suggested_prompts: string[];
  is_fallback: boolean;
}

export interface AuthConfig {
  demo_mode: boolean;
  environment: string;
}

export interface NAQICategoryBracket {
  min: number;
  max: number;
  category: string;
  color: string;
  advisory: string;
}

export interface NAQIBreakpointsTable {
  categories: NAQICategoryBracket[];
  pollutants: Record<string, Array<{ b_lo: number; b_hi: number; i_lo: number; i_hi: number }>>;
  source: string;
}
