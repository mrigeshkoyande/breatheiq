"""Personal & Household Environmental Impact & Dosage Reduction Engine."""

from typing import Any

from pydantic import BaseModel, ConfigDict

from app.engines.impact_data import (
    AQI_POINTS_PER_UGM3_PM25 as AQI_POINTS_PER_UGM3_PM25,
)
from app.engines.impact_data import (
    CIGARETTE_EQUIVALENT_UG as CIGARETTE_EQUIVALENT_UG,
)
from app.engines.impact_data import (
    DEFAULT_FACTORS as DEFAULT_FACTORS,
)
from app.engines.impact_data import (
    FACTORS as FACTORS,
)
from app.engines.impact_data import (
    FACTORS_PATH as FACTORS_PATH,
)
from app.engines.impact_data import (
    IMPACT_METHODOLOGY_NOTE as IMPACT_METHODOLOGY_NOTE,
)
from app.engines.impact_data import (
    TREE_DAILY_CO2_KG as TREE_DAILY_CO2_KG,
)
from app.engines.impact_data import (
    load_factors as load_factors,
)


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


def _resolve_inhalation_rate(activity_level: str) -> tuple[float, str]:
    """Return minute-ventilation rate (m3/h) and citation source for an activity level."""
    factors = load_factors()
    inhalation_map = factors.get("inhalation_rates", DEFAULT_FACTORS["inhalation_rates"])
    entry = inhalation_map.get(activity_level, DEFAULT_FACTORS["inhalation_rates"]["adult_resting"])
    return float(entry.get("m3_per_hour", 0.50)), str(
        entry.get("source", "Standard Exposure Factors")
    )


def calculate_inhalation_dosage(
    outdoor_pm25: float,
    mitigated_pm25: float,
    duration_hours: float = 8.0,
    activity_level: str = "adult_resting",
) -> InhalationImpact:
    """Compute inhaled PM2.5 dosage (ug) = minute ventilation * concentration * hours."""
    rate, source = _resolve_inhalation_rate(activity_level)
    unprotected_dose = rate * outdoor_pm25 * duration_hours
    actual_dose = rate * mitigated_pm25 * duration_hours
    averted_dose = max(0.0, unprotected_dose - actual_dose)
    efficiency = round((averted_dose / unprotected_dose) * 100, 1) if unprotected_dose > 0 else 0.0
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
    transits = load_factors().get("transit_emissions", DEFAULT_FACTORS["transit_emissions"])
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
        outdoor_pm25, indoor_purified_pm25, indoor_hours, "adult_resting"
    )
    transit = (
        calculate_transit_emission_savings(transit_distance_km, chosen_mode=transit_mode)
        if transit_distance_km and transit_distance_km > 0
        else None
    )
    aqi_delta = max(0.0, (outdoor_pm25 - indoor_purified_pm25) * AQI_POINTS_PER_UGM3_PM25)
    cigs_avoided = round(inhalation.averted_inhaled_dose_ug / CIGARETTE_EQUIVALENT_UG, 1)
    return HouseholdImpactSummary(
        daily_averted_pm25_dose_ug=inhalation.averted_inhaled_dose_ug,
        daily_co2_averted_kg=transit.co2_averted_kg if transit else 0.0,
        aqi_hours_avoided=round(aqi_delta * indoor_hours, 1),
        equivalent_unfiltered_cigarettes_avoided=cigs_avoided,
        inhalation_detail=inhalation,
        transit_detail=transit,
        methodology=IMPACT_METHODOLOGY_NOTE,
    )
