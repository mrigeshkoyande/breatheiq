/**
 * BreatheIQ Client Calculation & Formatting Utilities
 * Standardized CPCB NAQI, inhaled dosage, CADR sizing, and transit emission comparisons.
 * Sources: CPCB National Air Quality Index (2014), ARAI India Emission Factors (2020),
 * USEPA Air Quality Sizing Guidelines, and ICMR Inhalation Rate Tables.
 */

export type CpcbCategory = 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';

export interface TransitSavings {
  co2SavingsG: number;
  pm25AvoidedMg: number;
}

/**
 * Maps an AQI numeric index to the statutory CPCB 6-tier category.
 */
export function getNaqiCategory(aqi: number): CpcbCategory {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

/**
 * Returns color classes and hex for CPCB categories.
 */
export function getNaqiTheme(category: CpcbCategory) {
  switch (category) {
    case 'Good':
      return {
        bg: 'bg-[#2F9E62]',
        text: 'text-[#2F9E62]',
        lightBg: 'bg-[#EBF7F0]',
        border: 'border-[#A3E5BA]',
        hex: '#2F9E62',
      };
    case 'Satisfactory':
      return {
        bg: 'bg-[#7CB342]',
        text: 'text-[#7CB342]',
        lightBg: 'bg-[#F3F8EC]',
        border: 'border-[#CCE8A3]',
        hex: '#7CB342',
      };
    case 'Moderate':
      return {
        bg: 'bg-[#F2B705]',
        text: 'text-[#B88700]',
        lightBg: 'bg-[#FEF8E7]',
        border: 'border-[#FCE28E]',
        hex: '#F2B705',
      };
    case 'Poor':
      return {
        bg: 'bg-[#F28C28]',
        text: 'text-[#C9660D]',
        lightBg: 'bg-[#FEF4EB]',
        border: 'border-[#F9C391]',
        hex: '#F28C28',
      };
    case 'Very Poor':
      return {
        bg: 'bg-[#DC5252]',
        text: 'text-[#DC5252]',
        lightBg: 'bg-[#FDECEC]',
        border: 'border-[#F4A8A8]',
        hex: '#DC5252',
      };
    case 'Severe':
      return {
        bg: 'bg-[#8B1E3F]',
        text: 'text-[#8B1E3F]',
        lightBg: 'bg-[#F6E9EE]',
        border: 'border-[#CA8AA0]',
        hex: '#8B1E3F',
      };
  }
}

/**
 * Calculates cumulative inhaled PM2.5 dosage (micrograms).
 * Formula: Inhaled Dose (µg) = Ventilation Rate (m³/h) × PM2.5 Concentration (µg/m³) × Duration (hours)
 * ICMR/EPA Inhalation Rates:
 * - resting: 0.45 m³/h
 * - light: 0.80 m³/h (walking, office work)
 * - moderate: 1.50 m³/h (cycling, brisk walk)
 * - heavy: 2.50 m³/h (vigorous running, sports)
 */
export function calculateInhaledDosageUg(
  pm25Concentration: number,
  durationHours: number,
  activityLevel: 'resting' | 'light' | 'moderate' | 'heavy' = 'light'
): number {
  if (pm25Concentration < 0 || durationHours <= 0) return 0;

  const rates: Record<string, number> = {
    resting: 0.45,
    light: 0.8,
    moderate: 1.5,
    heavy: 2.5,
  };

  const rate = rates[activityLevel] || 0.8;
  const dosage = rate * pm25Concentration * durationHours;
  return Math.round(dosage * 10) / 10;
}

/**
 * Recommends minimum Clean Air Delivery Rate (CADR in CFM) for room air purifiers.
 * Based on AHAM 2/3 Rule: CADR (CFM) >= (Room Area in sq ft * Ceiling Height / 8) * (Target ACH / 5) * (2/3)
 * Standard benchmark: 5 Air Changes per Hour (ACH) for smog mitigation.
 */
export function calculateCadrRecommendation(
  roomAreaSqFt: number,
  ceilingHeightFt: number = 9.0,
  targetAch: number = 4.0
): number {
  if (roomAreaSqFt <= 0) return 0;
  // Volume in cubic feet
  const volumeCuFt = roomAreaSqFt * ceilingHeightFt;
  // CADR in CFM = (Volume * ACH) / 60
  const cadrCfm = (volumeCuFt * targetAch) / 60;
  return Math.round(cadrCfm);
}

/**
 * Emission factors per passenger-kilometer (ARAI / CPCB India):
 * - Car (ICE Petrol/Diesel solo): ~140 g CO2/km, 18 mg PM2.5/km
 * - Auto-rickshaw (CNG): ~75 g CO2/km, 8 mg PM2.5/km
 * - Electric Metro / Train: ~15 g CO2/km, 1.2 mg PM2.5/km
 * - Electric Bus: ~22 g CO2/km, 2.0 mg PM2.5/km
 * - Walking / Cycling: 0 g CO2/km, 0 mg PM2.5/km
 */
const EMISSION_FACTORS: Record<string, { co2G: number; pm25Mg: number }> = {
  car_ice: { co2G: 140, pm25Mg: 18 },
  car_cng: { co2G: 105, pm25Mg: 10 },
  auto_cng: { co2G: 75, pm25Mg: 8 },
  bus_diesel: { co2G: 68, pm25Mg: 12 },
  metro: { co2G: 15, pm25Mg: 1.2 },
  walk_cycle: { co2G: 0, pm25Mg: 0 },
};

/**
 * Calculates CO2 (grams) and PM2.5 (milligrams) avoided by switching transit mode.
 */
export function calculateTransitSavings(
  distanceKm: number,
  originalMode: string,
  alternativeMode: string
): TransitSavings {
  if (distanceKm <= 0) return { co2SavingsG: 0, pm25AvoidedMg: 0 };

  const orig = EMISSION_FACTORS[originalMode] || EMISSION_FACTORS.car_ice;
  const alt = EMISSION_FACTORS[alternativeMode] || EMISSION_FACTORS.metro;

  const co2SavingsG = Math.max(0, (orig.co2G - alt.co2G) * distanceKm);
  const pm25AvoidedMg = Math.max(0, (orig.pm25Mg - alt.pm25Mg) * distanceKm);

  return {
    co2SavingsG: Math.round(co2SavingsG * 10) / 10,
    pm25AvoidedMg: Math.round(pm25AvoidedMg * 10) / 10,
  };
}

/**
 * Validates whether an environmental data card badge is compliant with truth rules.
 */
export function isValidProvenanceBadge(badge: string): boolean {
  const allowed = ['LIVE', 'MODELED', 'FORECAST', 'ESTIMATED', 'DEMO', 'USER-REPORTED', 'VERIFIED', 'UNVERIFIED'];
  return allowed.includes(badge.toUpperCase());
}
