/**
 * BreatheIQ Client Calculation & Formatting Utilities.
 * Constants mirror backend/app/data/emission_factors.yaml & backend/app/engines/naqi.py.
 */

export type CpcbCategory = 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';

export interface TransitSavings {
  co2SavingsG: number;
  pm25AvoidedMg: number;
}

export interface NaqiTheme {
  bg: string;
  text: string;
  lightBg: string;
  border: string;
  hex: string;
  symbol: string;
}

export const NAQI_THEMES: Record<CpcbCategory, NaqiTheme> = {
  Good: {
    bg: 'bg-[#2F9E62]',
    text: 'text-[#1E6F44]',
    lightBg: 'bg-[#EBF7F0]',
    border: 'border-[#A3E5BA]',
    hex: '#2F9E62',
    symbol: 'OK',
  },
  Satisfactory: {
    bg: 'bg-[#7CB342]',
    text: 'text-[#4D7720]',
    lightBg: 'bg-[#F3F8EC]',
    border: 'border-[#CCE8A3]',
    hex: '#7CB342',
    symbol: 'LOW',
  },
  Moderate: {
    bg: 'bg-[#F2B705]',
    text: 'text-[#8C6500]',
    lightBg: 'bg-[#FEF8E7]',
    border: 'border-[#FCE28E]',
    hex: '#F2B705',
    symbol: 'MOD',
  },
  Poor: {
    bg: 'bg-[#F28C28]',
    text: 'text-[#9F4E04]',
    lightBg: 'bg-[#FEF4EB]',
    border: 'border-[#F9C391]',
    hex: '#F28C28',
    symbol: 'HIGH',
  },
  'Very Poor': {
    bg: 'bg-[#DC5252]',
    text: 'text-[#A62828]',
    lightBg: 'bg-[#FDECEC]',
    border: 'border-[#F4A8A8]',
    hex: '#DC5252',
    symbol: 'VHIGH',
  },
  Severe: {
    bg: 'bg-[#8B1E3F]',
    text: 'text-[#8B1E3F]',
    lightBg: 'bg-[#F6E9EE]',
    border: 'border-[#CA8AA0]',
    hex: '#8B1E3F',
    symbol: 'MAX',
  },
};

/** Maps a numeric NAQI score to one of the 6 statutory CPCB categories. */
export function getNaqiCategory(aqi: number): CpcbCategory {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

/** Returns accessible Tailwind theme classes, hex value, and non-color cue for a category. */
export function getNaqiTheme(category: CpcbCategory): NaqiTheme {
  return NAQI_THEMES[category] || NAQI_THEMES.Moderate;
}

const INHALATION_RATES_M3H: Record<'resting' | 'light' | 'moderate' | 'heavy', number> = {
  resting: 0.5, // Matches emission_factors.yaml adult_resting (0.50 m3/h)
  light: 0.83, // Matches adult_moderate_activity (0.83 m3/h)
  moderate: 1.5, // Matches adult_vigorous_exercise (1.50 m3/h)
  heavy: 2.5,
};

/** Calculates cumulative inhaled PM2.5 dosage (ug) from concentration, duration, and activity tier. */
export function calculateInhaledDosageUg(
  pm25Concentration: number,
  durationHours: number,
  activityLevel: 'resting' | 'light' | 'moderate' | 'heavy' = 'light'
): number {
  if (pm25Concentration < 0 || durationHours <= 0) return 0;
  const rate = INHALATION_RATES_M3H[activityLevel] ?? 0.83;
  const dosage = rate * pm25Concentration * durationHours;
  return Math.round(dosage * 10) / 10;
}

/** Estimates required Clean Air Delivery Rate (CFM) for a room volume and target ACH. */
export function calculateCadrRecommendation(
  roomAreaSqFt: number,
  ceilingHeightFt = 9.0,
  targetAch = 4.0
): number {
  if (roomAreaSqFt <= 0 || ceilingHeightFt <= 0 || targetAch <= 0) return 0;
  const volumeCuFt = roomAreaSqFt * ceilingHeightFt;
  return Math.round((volumeCuFt * targetAch) / 60);
}

// Aligned with backend/app/data/emission_factors.yaml (ARAI/CPCB/DMRC/DTC)
const EMISSION_FACTORS: Record<string, { co2G: number; pm25Mg: number }> = {
  car_ice: { co2G: 180, pm25Mg: 45 },
  car_cng: { co2G: 105, pm25Mg: 10 },
  auto_cng: { co2G: 75, pm25Mg: 8 },
  bus_diesel: { co2G: 68, pm25Mg: 12 },
  cng_bus: { co2G: 38, pm25Mg: 8 },
  metro: { co2G: 18, pm25Mg: 2 },
  walk_cycle: { co2G: 0, pm25Mg: 0 },
};

/** Calculates CO2 (grams) and exhaust PM2.5 (milligrams) avoided by switching transit modes. */
export function calculateTransitSavings(
  distanceKm: number,
  originalMode: string,
  alternativeMode: string
): TransitSavings {
  if (distanceKm <= 0) return { co2SavingsG: 0, pm25AvoidedMg: 0 };

  const orig = EMISSION_FACTORS[originalMode] ?? EMISSION_FACTORS.car_ice;
  const alt = EMISSION_FACTORS[alternativeMode] ?? EMISSION_FACTORS.metro;

  const co2SavingsG = Math.max(0, (orig.co2G - alt.co2G) * distanceKm);
  const pm25AvoidedMg = Math.max(0, (orig.pm25Mg - alt.pm25Mg) * distanceKm);

  return {
    co2SavingsG: Math.round(co2SavingsG * 10) / 10,
    pm25AvoidedMg: Math.round(pm25AvoidedMg * 10) / 10,
  };
}

/** Validates allowed data-card provenance labels. */
export function isValidProvenanceBadge(badge: string): boolean {
  const allowed = [
    'LIVE',
    'MODELED',
    'FORECAST',
    'ESTIMATED',
    'DEMO',
    'USER-REPORTED',
    'VERIFIED',
    'UNVERIFIED',
  ];
  return allowed.includes(badge.toUpperCase());
}
