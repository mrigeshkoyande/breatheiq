import type { CpcbCategory } from '../utils/calculations';

export type ProvenanceSource =
  'LIVE' | 'MODELED' | 'FORECAST' | 'ESTIMATED' | 'USER-REPORTED' | 'DEMO';

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
