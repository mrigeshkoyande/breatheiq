"""Personal & Household Environmental Impact & Dosage Reduction Engine."""

import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, ConfigDict

logger = logging.getLogger(__name__)
FACTORS_PATH = Path(__file__).resolve().parent.parent / "data" / "emission_factors.yaml"

DEFAULT_FACTORS: dict[str, Any] = {
    "transit_emissions": {
        "petrol_car_solo": {
            "co2_g_per_km": 180.0,
            "pm25_g_per_km": 0.045,
            "source": "ARAI / CPCB Vehicular Baseline",
        },
        "electric_metro": {
            "co2_g_per_km": 18.0,
            "pm25_g_per_km": 0.002,
            "source": "DMRC Sustainability Baseline",
        },
        "cng_bus": {"co2_g_per_km": 38.0, "pm25_g_per_km": 0.008, "source": "DTC Clean Fuel Study"},
        "cycling_walking": {
            "co2_g_per_km": 0.0,
            "pm25_g_per_km": 0.0,
            "source": "Non-Motorized Transit Standard",
        },
    },
    "inhalation_rates": {
        "adult_resting": {"m3_per_hour": 0.50, "source": "USEPA Exposure Factors Handbook"},
        "adult_moderate_activity": {
            "m3_per_hour": 0.83,
            "source": "USEPA Exposure Factors Handbook",
        },
        "adult_vigorous_exercise": {
            "m3_per_hour": 1.50,
            "source": "USEPA Exposure Factors Handbook",
        },
        "child_standard": {"m3_per_hour": 0.42, "source": "ICMR Pediatric Respiratory Guidelines"},
    },
}

TREE_DAILY_CO2_KG = 0.06
AQI_POINTS_PER_UGM3_PM25 = 1.15
CIGARETTE_EQUIVALENT_UG = 264.0
IMPACT_METHODOLOGY_NOTE = (
    "Inhaled dose calculated via standard human minute ventilation volumes (USEPA Exposure Factors Handbook). "
    "Carbon savings computed using statutory ARAI/CPCB vehicular emission baselines. "
    "All outputs represent scientific approximations and carry an ESTIMATED provenance tag."
)


@lru_cache(maxsize=1)
def load_factors() -> dict[str, Any]:
    """Load and cache sourced emission/inhalation factors from YAML with fallback."""
    if not FACTORS_PATH.exists():
        return DEFAULT_FACTORS
    try:
        loaded = yaml.safe_load(FACTORS_PATH.read_text(encoding="utf-8"))
        if isinstance(loaded, dict):
            return loaded
    except (OSError, yaml.YAMLError) as exc:
        logger.warning("Failed to parse %s (%s); using built-in factors.", FACTORS_PATH.name, exc)
    return DEFAULT_FACTORS


FACTORS = load_factors()


class InhalationImpact(BaseModel):
    """Dosage avoided via indoor filtration or N95 respiratory protection."""

    model_config = ConfigDict(extra="forbid")

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
    """Avoided carbon and exhaust particulates for sustainable urban commuting."""

    model_config = ConfigDict(extra="forbid")

    baseline_mode: str
    chosen_mode: str
    distance_km: float
    co2_averted_kg: float
    pm25_exhaust_averted_g: float
    trees_equivalent_daily: float
    citation: str


class HouseholdImpactSummary(BaseModel):
    """Combined daily household impact summary."""

    model_config = ConfigDict(extra="forbid")

    daily_averted_pm25_dose_ug: float
    daily_co2_averted_kg: float
    aqi_hours_avoided: float
    equivalent_unfiltered_cigarettes_avoided: float
    inhalation_detail: InhalationImpact
    transit_detail: TransitImpact | None = None
    provenance_badge: str = "ESTIMATED"
    methodology: str


def get_emission_factors_metadata() -> dict[str, Any]:
    """Expose sourced emission and inhalation factors as canonical metadata."""
    factors = load_factors()
    return {
        "transit_emissions": factors.get("transit_emissions", DEFAULT_FACTORS["transit_emissions"]),
        "inhalation_rates": factors.get("inhalation_rates", DEFAULT_FACTORS["inhalation_rates"]),
        "constants": {
            "tree_daily_co2_kg": TREE_DAILY_CO2_KG,
            "cigarette_equivalent_ug": CIGARETTE_EQUIVALENT_UG,
        },
        "provenance": "SOURCED_FACTOR_CONFIG",
    }


def calculate_inhalation_dosage(
    outdoor_pm25: float,
    mitigated_pm25: float,
    duration_hours: float = 8.0,
    activity_level: str = "adult_resting",
) -> InhalationImpact:
    """Compute inhaled PM2.5 dosage (ug) = minute ventilation * concentration * hours."""
    factors = load_factors()
    inhalation_map = factors.get("inhalation_rates", DEFAULT_FACTORS["inhalation_rates"])
    inhalation_data = inhalation_map.get(
        activity_level, DEFAULT_FACTORS["inhalation_rates"]["adult_resting"]
    )
    rate = float(inhalation_data.get("m3_per_hour", 0.50))
    source = str(inhalation_data.get("source", "Standard Exposure Factors"))

    unprotected_dose = rate * outdoor_pm25 * duration_hours
    actual_dose = rate * mitigated_pm25 * duration_hours
    averted_dose = max(0.0, unprotected_dose - actual_dose)
    efficiency = (
        round(((unprotected_dose - actual_dose) / unprotected_dose) * 100, 1)
        if unprotected_dose > 0
        else 0.0
    )

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
        citation=source,
    )


def calculate_transit_emission_savings(
    distance_km: float,
    chosen_mode: str = "electric_metro",
    baseline_mode: str = "petrol_car_solo",
) -> TransitImpact:
    """Compute CO2 and tailpipe particulate savings vs baseline car transit."""
    factors = load_factors()
    transits = factors.get("transit_emissions", DEFAULT_FACTORS["transit_emissions"])
    base = transits.get(baseline_mode, DEFAULT_FACTORS["transit_emissions"]["petrol_car_solo"])
    chosen = transits.get(chosen_mode, DEFAULT_FACTORS["transit_emissions"]["electric_metro"])
    delta_co2_g = max(
        0.0, (float(base["co2_g_per_km"]) - float(chosen["co2_g_per_km"])) * distance_km
    )
    delta_pm25_g = max(
        0.0, (float(base["pm25_g_per_km"]) - float(chosen["pm25_g_per_km"])) * distance_km
    )
    co2_kg = round(delta_co2_g / 1000.0, 3)

    return TransitImpact(
        baseline_mode=baseline_mode,
        chosen_mode=chosen_mode,
        distance_km=distance_km,
        co2_averted_kg=co2_kg,
        pm25_exhaust_averted_g=round(delta_pm25_g, 3),
        trees_equivalent_daily=round(co2_kg / TREE_DAILY_CO2_KG, 2),
        citation=f"{base.get('source', '')} vs {chosen.get('source', '')}",
    )


def calculate_cumulative_impact(
    outdoor_pm25: float = 160.0,
    indoor_purified_pm25: float = 25.0,
    indoor_hours: float = 12.0,
    transit_distance_km: float | None = 15.0,
    transit_mode: str = "electric_metro",
) -> HouseholdImpactSummary:
    """Combine indoor dosage mitigation and transit emission savings into daily impact."""
    inhalation = calculate_inhalation_dosage(
        outdoor_pm25=outdoor_pm25,
        mitigated_pm25=indoor_purified_pm25,
        duration_hours=indoor_hours,
        activity_level="adult_resting",
    )
    transit = (
        calculate_transit_emission_savings(transit_distance_km, chosen_mode=transit_mode)
        if transit_distance_km and transit_distance_km > 0
        else None
    )
    aqi_delta = max(0.0, (outdoor_pm25 - indoor_purified_pm25) * AQI_POINTS_PER_UGM3_PM25)

    return HouseholdImpactSummary(
        daily_averted_pm25_dose_ug=inhalation.averted_inhaled_dose_ug,
        daily_co2_averted_kg=transit.co2_averted_kg if transit else 0.0,
        aqi_hours_avoided=round(aqi_delta * indoor_hours, 1),
        equivalent_unfiltered_cigarettes_avoided=round(
            inhalation.averted_inhaled_dose_ug / CIGARETTE_EQUIVALENT_UG, 1
        ),
        inhalation_detail=inhalation,
        transit_detail=transit,
        methodology=IMPACT_METHODOLOGY_NOTE,
    )
