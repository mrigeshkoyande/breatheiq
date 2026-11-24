import { describe, it, expect } from 'vitest';
import {
  getNaqiCategory,
  getNaqiTheme,
  calculateInhaledDosageUg,
  calculateCadrRecommendation,
  calculateTransitSavings,
  isValidProvenanceBadge,
} from '../../src/utils/calculations';

describe('BreatheIQ Calculation Utilities', () => {
  describe('getNaqiCategory', () => {
    it('classifies Good (0 - 50)', () => {
      expect(getNaqiCategory(0)).toBe('Good');
      expect(getNaqiCategory(25)).toBe('Good');
      expect(getNaqiCategory(50)).toBe('Good');
    });

    it('classifies Satisfactory (51 - 100)', () => {
      expect(getNaqiCategory(51)).toBe('Satisfactory');
      expect(getNaqiCategory(80)).toBe('Satisfactory');
      expect(getNaqiCategory(100)).toBe('Satisfactory');
    });

    it('classifies Moderate (101 - 200)', () => {
      expect(getNaqiCategory(101)).toBe('Moderate');
      expect(getNaqiCategory(150)).toBe('Moderate');
      expect(getNaqiCategory(200)).toBe('Moderate');
    });

    it('classifies Poor (201 - 300)', () => {
      expect(getNaqiCategory(201)).toBe('Poor');
      expect(getNaqiCategory(260)).toBe('Poor');
      expect(getNaqiCategory(300)).toBe('Poor');
    });

    it('classifies Very Poor (301 - 400)', () => {
      expect(getNaqiCategory(301)).toBe('Very Poor');
      expect(getNaqiCategory(350)).toBe('Very Poor');
      expect(getNaqiCategory(400)).toBe('Very Poor');
    });

    it('classifies Severe (> 400)', () => {
      expect(getNaqiCategory(401)).toBe('Severe');
      expect(getNaqiCategory(485)).toBe('Severe');
      expect(getNaqiCategory(500)).toBe('Severe');
    });
  });

  describe('getNaqiTheme', () => {
    it('returns valid color tokens for all CPCB categories', () => {
      const categories = ['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe'] as const;
      for (const cat of categories) {
        const theme = getNaqiTheme(cat);
        expect(theme.bg).toContain('bg-[');
        expect(theme.text).toContain('text-[');
        expect(theme.lightBg).toContain('bg-[');
        expect(theme.border).toContain('border-[');
        expect(theme.hex).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });

    it('maps Good to statutory emerald #2F9E62', () => {
      expect(getNaqiTheme('Good').hex).toBe('#2F9E62');
    });

    it('maps Severe to statutory maroon #8B1E3F', () => {
      expect(getNaqiTheme('Severe').hex).toBe('#8B1E3F');
    });
  });

  describe('calculateInhaledDosageUg', () => {
    it('calculates dosage accurately for light activity', () => {
      // 0.8 m3/h * 100 ug/m3 * 2 h = 160 ug
      expect(calculateInhaledDosageUg(100, 2, 'light')).toBe(160);
    });

    it('calculates dosage accurately for heavy activity', () => {
      // 2.5 m3/h * 200 ug/m3 * 1 h = 500 ug
      expect(calculateInhaledDosageUg(200, 1, 'heavy')).toBe(500);
    });

    it('calculates resting dosage accurately', () => {
      // 0.45 m3/h * 80 ug/m3 * 8 h = 288 ug
      expect(calculateInhaledDosageUg(80, 8, 'resting')).toBe(288);
    });

    it('returns zero for zero or negative duration or concentration', () => {
      expect(calculateInhaledDosageUg(-50, 2, 'light')).toBe(0);
      expect(calculateInhaledDosageUg(100, 0, 'light')).toBe(0);
      expect(calculateInhaledDosageUg(100, -1, 'light')).toBe(0);
    });
  });

  describe('calculateCadrRecommendation', () => {
    it('sizes standard 200 sq ft room with 9 ft ceiling for 4 ACH', () => {
      // Volume = 200 * 9 = 1800 cu ft; CADR = (1800 * 4) / 60 = 120 CFM
      expect(calculateCadrRecommendation(200, 9, 4)).toBe(120);
    });

    it('sizes large 400 sq ft living room for 5 ACH', () => {
      // Volume = 400 * 9 = 3600 cu ft; CADR = (3600 * 5) / 60 = 300 CFM
      expect(calculateCadrRecommendation(400, 9, 5)).toBe(300);
    });

    it('returns 0 for zero or negative area', () => {
      expect(calculateCadrRecommendation(0)).toBe(0);
      expect(calculateCadrRecommendation(-100)).toBe(0);
    });
  });

  describe('calculateTransitSavings', () => {
    it('calculates CO2 and PM2.5 savings from ICE Car to Metro for 10 km', () => {
      // Car: 140 g/km CO2, 18 mg/km PM2.5
      // Metro: 15 g/km CO2, 1.2 mg/km PM2.5
      // Delta CO2: (140 - 15) * 10 = 1250 g
      // Delta PM2.5: (18 - 1.2) * 10 = 168 mg
      const savings = calculateTransitSavings(10, 'car_ice', 'metro');
      expect(savings.co2SavingsG).toBe(1250);
      expect(savings.pm25AvoidedMg).toBe(168);
    });

    it('calculates zero savings if distance is zero or negative', () => {
      const savings = calculateTransitSavings(0, 'car_ice', 'metro');
      expect(savings.co2SavingsG).toBe(0);
      expect(savings.pm25AvoidedMg).toBe(0);
    });

    it('handles identical modes with zero net savings', () => {
      const savings = calculateTransitSavings(15, 'metro', 'metro');
      expect(savings.co2SavingsG).toBe(0);
      expect(savings.pm25AvoidedMg).toBe(0);
    });
  });

  describe('isValidProvenanceBadge', () => {
    it('approves standard required badges', () => {
      expect(isValidProvenanceBadge('LIVE')).toBe(true);
      expect(isValidProvenanceBadge('MODELED')).toBe(true);
      expect(isValidProvenanceBadge('FORECAST')).toBe(true);
      expect(isValidProvenanceBadge('ESTIMATED')).toBe(true);
      expect(isValidProvenanceBadge('DEMO')).toBe(true);
      expect(isValidProvenanceBadge('USER-REPORTED')).toBe(true);
      expect(isValidProvenanceBadge('VERIFIED')).toBe(true);
      expect(isValidProvenanceBadge('UNVERIFIED')).toBe(true);
    });

    it('rejects unverified and marketing buzzword badges', () => {
      expect(isValidProvenanceBadge('100% ACCURATE')).toBe(false);
      expect(isValidProvenanceBadge('ZERO-DELAY')).toBe(false);
      expect(isValidProvenanceBadge('OFFICIAL')).toBe(false);
      expect(isValidProvenanceBadge('REAL-TIME')).toBe(false);
    });
  });
});
