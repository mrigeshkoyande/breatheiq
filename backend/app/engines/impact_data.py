"""Sourced emission and human ventilation factor tables with YAML override loader."""

import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

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
