"""
backend/app/engines/impact.py
Personal & Household Environmental Impact & Dosage Reduction Calculator.
Computes averted inhaled PM2.5 dosage (µg), averted vehicular CO2 emissions (kg),
and cumulative exposure mitigation using statutory emission factors.
"""

import os
import yaml
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

# Load emission factors from yaml
FACTORS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "emission_factors.yaml")

def load_factors() -> Dict[str, Any]:
    if os.path.exists(FACTORS_PATH):
        try:
            with open(FACTORS_PATH, "r", encoding="utf-8") as f:
                return yaml.safe_load(f)
        except Exception:
            pass
    # Fallback built-in factors if file read fails
    return {
        "transit_emissions": {
            "petrol_car_solo": {"co2_g_per_km": 180.0, "pm25_g_per_km": 0.045, "source": "ARAI / CPCB Vehicular Baseline"},
            "electric_metro": {"co2_g_per_km": 18.0, "pm25_g_per_km": 0.002, "source": "DMRC Sustainability Baseline"},
            "cng_bus": {"co2_g_per_km": 38.0, "pm25_g_per_km": 0.008, "source": "DTC Clean Fuel Study"},
            "cycling_walking": {"co2_g_per_km": 0.0, "pm25_g_per_km": 0.0, "source": "Non-Motorized Transit Standard"},
        },
        "inhalation_rates": {
            "adult_resting": {"m3_per_hour": 0.50, "source": "USEPA Exposure Factors Handbook"},
            "adult_moderate_activity": {"m3_per_hour": 0.83, "source": "USEPA Exposure Factors Handbook"},
            "adult_vigorous_exercise": {"m3_per_hour": 1.50, "source": "USEPA Exposure Factors Handbook"},
            "child_standard": {"m3_per_hour": 0.42, "source": "ICMR Pediatric Respiratory Guidelines"},
        }
    }

FACTORS = load_factors()

class InhalationImpact(BaseModel):
    activity_type: str
    inhalation_rate_m3h: float
    exposure_duration_hours: float
    outdoor_pm25_ugm3: float
    effective_pm25_ugm3: float
    unprotected_inhaled_dose_ug: float
    actual_inhaled_dose_ug: float
    averted_inhaled_dose_ug: float
    protection_efficiency_pct: float
    citation: str

class TransitImpact(BaseModel):
    baseline_mode: str
    chosen_mode: str
    distance_km: float
    co2_averted_kg: float
    pm25_exhaust_averted_g: float
    trees_equivalent_daily: float  # ~0.06 kg CO2 absorbed per tree per day
    citation: str

class HouseholdImpactSummary(BaseModel):
    daily_averted_pm25_dose_ug: float
    daily_co2_averted_kg: float
    aqi_hours_avoided: float
    equivalent_unfiltered_cigarettes_avoided: float  # Approx 22 µg PM2.5 inhaled ≈ 1 cigarette equivalent (Berkeley Earth model)
    inhalation_detail: InhalationImpact
    transit_detail: Optional[TransitImpact] = None
    provenance_badge: str = "ESTIMATED"
    methodology: str

def calculate_inhalation_dosage(
    outdoor_pm25: float,
    mitigated_pm25: float,
    duration_hours: float = 8.0,
    activity_level: str = "adult_resting"
) -> InhalationImpact:
    """
    Computes inhaled PM2.5 dosage with and without protective interventions (HEPA purifier or N95 mask).
    Dosage (µg) = Inhalation Rate (m³/h) * PM2.5 (µg/m³) * Duration (h).
    """
    inhalation_data = FACTORS.get("inhalation_rates", {}).get(
        activity_level,
        {"m3_per_hour": 0.50, "source": "USEPA Exposure Factors Handbook"}
    )
    rate = float(inhalation_data.get("m3_per_hour", 0.50))
    source = inhalation_data.get("source", "Standard Exposure Factors")

    unprotected_dose = rate * outdoor_pm25 * duration_hours
    actual_dose = rate * mitigated_pm25 * duration_hours
    averted_dose = max(0.0, unprotected_dose - actual_dose)
    efficiency = round(((unprotected_dose - actual_dose) / unprotected_dose) * 100, 1) if unprotected_dose > 0 else 0.0

    return InhalationImpact(
        activity_type=activity_level,
        inhalation_rate_m3h=rate,
        exposure_duration_hours=duration_hours,
        outdoor_pm25_ugm3=round(outdoor_pm25, 1),
        effective_pm25_ugm3=round(mitigated_pm25, 1),
        unprotected_inhaled_dose_ug=round(unprotected_dose, 1),
        actual_inhaled_dose_ug=round(actual_dose, 1),
        averted_inhaled_dose_ug=round(averted_dose, 1),
        protection_efficiency_pct=efficiency,
        citation=source
    )

def calculate_transit_emission_savings(
    distance_km: float,
    chosen_mode: str = "electric_metro",
    baseline_mode: str = "petrol_car_solo"
) -> TransitImpact:
    """Computes carbon dioxide and tailpipe particulate savings for urban transit choices."""
    transits = FACTORS.get("transit_emissions", {})
    base = transits.get(baseline_mode, {"co2_g_per_km": 180.0, "pm25_g_per_km": 0.045, "source": "ARAI Baseline"})
    chosen = transits.get(chosen_mode, {"co2_g_per_km": 18.0, "pm25_g_per_km": 0.002, "source": "DMRC Baseline"})

    delta_co2_g = max(0.0, (base["co2_g_per_km"] - chosen["co2_g_per_km"]) * distance_km)
    delta_pm25_g = max(0.0, (base["pm25_g_per_km"] - chosen["pm25_g_per_km"]) * distance_km)

    co2_kg = round(delta_co2_g / 1000.0, 3)
    pm25_g = round(delta_pm25_g, 3)
    tree_equiv = round(co2_kg / 0.06, 2)  # 1 mature tree absorbs ~22 kg/yr = ~0.06 kg/day

    return TransitImpact(
        baseline_mode=baseline_mode,
        chosen_mode=chosen_mode,
        distance_km=distance_km,
        co2_averted_kg=co2_kg,
        pm25_exhaust_averted_g=pm25_g,
        trees_equivalent_daily=tree_equiv,
        citation=f"{base.get('source', '')} vs {chosen.get('source', '')}"
    )

def calculate_cumulative_impact(
    outdoor_pm25: float = 160.0,
    indoor_purified_pm25: float = 25.0,
    indoor_hours: float = 12.0,
    transit_distance_km: Optional[float] = 15.0,
    transit_mode: str = "electric_metro"
) -> HouseholdImpactSummary:
    """Combines indoor air purification dosage savings and sustainable transit choices into daily household impact."""
    inhalation = calculate_inhalation_dosage(
        outdoor_pm25=outdoor_pm25,
        mitigated_pm25=indoor_purified_pm25,
        duration_hours=indoor_hours,
        activity_level="adult_resting"
    )

    transit = None
    daily_co2 = 0.0
    if transit_distance_km and transit_distance_km > 0:
        transit = calculate_transit_emission_savings(transit_distance_km, chosen_mode=transit_mode)
        daily_co2 = transit.co2_averted_kg

    # AQI hours avoided: hours * delta AQI (approx 1 µg/m³ PM2.5 ≈ 1.2 NAQI point in moderate/poor ranges)
    aqi_delta = max(0.0, (outdoor_pm25 - indoor_purified_pm25) * 1.15)
    aqi_hours = round(aqi_delta * indoor_hours, 1)

    # Cigarette equivalence heuristic (Berkeley Earth standard: 22 µg/m³ PM2.5 exposure for 24h ≈ 1 cigarette)
    # Total µg averted divided by ~264 µg (22 µg/m³ * 12 m³/day)
    cigs = round(inhalation.averted_inhaled_dose_ug / 264.0, 1)

    methodology = (
        "Inhaled dose calculated via standard human minute ventilation volumes (USEPA Exposure Factors Handbook). "
        "Carbon savings computed using statutory ARAI/CPCB vehicular emission baselines. "
        "All outputs represent scientific approximations and carry an ESTIMATED provenance tag."
    )

    return HouseholdImpactSummary(
        daily_averted_pm25_dose_ug=inhalation.averted_inhaled_dose_ug,
        daily_co2_averted_kg=daily_co2,
        aqi_hours_avoided=aqi_hours,
        equivalent_unfiltered_cigarettes_avoided=cigs,
        inhalation_detail=inhalation,
        transit_detail=transit,
        provenance_badge="ESTIMATED",
        methodology=methodology
    )
