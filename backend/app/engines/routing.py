"""Pure CleanRoute commute exposure and emission comparison engine."""

from typing import Any

from app.engines.impact import calculate_inhalation_dosage, calculate_transit_emission_savings

RUSH_MORNING_START, RUSH_MORNING_END = 7, 10
RUSH_EVENING_START, RUSH_EVENING_END = 17, 21
RUSH_HOUR_TIME_FACTOR = 1.2
MINUTES_PER_KM_ARTERIAL = 2.4
CAR_CO2_KG_PER_KM = 0.180
GREEN_CAR_CO2_KG_PER_KM = 0.170
MIN_AMBIENT_PM25 = 25.0
MIN_METRO_PM25 = 18.0


def _rush_hour_multiplier(departure_hour: int) -> float:
    """Return congestion multiplier for morning or evening peak commute hours."""
    is_morning_rush = RUSH_MORNING_START <= departure_hour <= RUSH_MORNING_END
    is_evening_rush = RUSH_EVENING_START <= departure_hour <= RUSH_EVENING_END
    return RUSH_HOUR_TIME_FACTOR if is_morning_rush or is_evening_rush else 1.0


def _inhalation_dose(pm25: float, minutes: int, activity: str) -> float:
    """Compute unprotected inhalation dose (ug) for a route segment duration."""
    return calculate_inhalation_dosage(
        pm25, pm25, duration_hours=minutes / 60.0, activity_level=activity
    ).unprotected_inhaled_dose_ug


def _pct_drop(low: float, high: float) -> int:
    """Return clamped integer percentage reduction from ``high`` to ``low``."""
    return round(max(0.0, (1 - low / max(1.0, high)) * 100))


def _highway_baseline(
    distance_km: float, departure_hour: int, baseline_pm25: float
) -> tuple[int, float, float, float]:
    """Compute arterial highway baseline duration, PM2.5, inhaled dose, and CO2."""
    minutes = max(
        5, round(distance_km * MINUTES_PER_KM_ARTERIAL * _rush_hour_multiplier(departure_hour))
    )
    pm25 = round(baseline_pm25 * 1.4, 1)
    dose = _inhalation_dose(pm25, minutes, "adult_moderate_activity")
    co2 = round(distance_km * CAR_CO2_KG_PER_KM, 2)
    return minutes, pm25, dose, co2


def _build_green_route(
    distance_km: float, baseline_pm25: float, time_highway: int, dose_highway: float, city: str
) -> dict[str, Any]:
    """Build secondary tree-canopy road corridor comparison entry."""
    minutes = time_highway + 5
    pm25 = round(baseline_pm25 * 0.82, 1)
    dose = _inhalation_dose(pm25, minutes, "adult_moderate_activity")
    drop = _pct_drop(dose, dose_highway)
    return {
        "id": "route_clean",
        "name": "CleanRoute (Green Corridor & Canopy)",
        "travel_time_min": minutes,
        "average_pm25": pm25,
        "inhaled_dose_ug": round(dose, 1),
        "co2_emissions_kg": round(distance_km * GREEN_CAR_CO2_KG_PER_KM, 2),
        "exposure_rating": "Lowest Surface Road Exposure",
        "recommended": True,
        "advisory": (
            f"Secondary arterial corridor avoids tailpipe canyons (~{drop}% lower estimated "
            f"particulate intake vs highway under current {city} telemetry)."
        ),
    }


def _build_metro_route(
    distance_km: float,
    baseline_pm25: float,
    time_highway: int,
    dose_highway: float,
    co2_highway: float,
) -> dict[str, Any]:
    """Build rapid electric metro transit corridor comparison entry."""
    minutes = max(4, time_highway - 2)
    pm25 = round(max(MIN_METRO_PM25, baseline_pm25 * 0.28), 1)
    dose = _inhalation_dose(pm25, minutes, "adult_resting")
    savings = calculate_transit_emission_savings(
        distance_km, chosen_mode="electric_metro", baseline_mode="petrol_car_solo"
    )
    co2 = round(max(0.01, co2_highway - savings.co2_averted_kg), 2)
    co2_drop = round(max(0.0, (savings.co2_averted_kg / max(0.01, co2_highway)) * 100))
    return {
        "id": "route_metro",
        "name": "Electric Metro Corridor Transit",
        "travel_time_min": minutes,
        "average_pm25": pm25,
        "inhaled_dose_ug": round(dose, 1),
        "co2_emissions_kg": co2,
        "exposure_rating": "Minimal Inhaled Dosage",
        "recommended": True,
        "advisory": (
            f"Filtered rapid transit avoids ~{co2_drop}% CO2 and "
            f"~{_pct_drop(dose, dose_highway)}% estimated inhaled PM2.5 vs highway driving."
        ),
    }


def _build_highway_route(minutes: int, pm25: float, dose: float, co2: float) -> dict[str, Any]:
    """Build arterial express highway baseline entry."""
    return {
        "id": "route_arterial",
        "name": "Primary Express Arterial Highway",
        "travel_time_min": minutes,
        "average_pm25": pm25,
        "inhaled_dose_ug": round(dose, 1),
        "co2_emissions_kg": co2,
        "exposure_rating": "Severe Exhaust Exposure",
        "recommended": False,
        "advisory": "High diesel exhaust plume. Keep windows closed and consider an N95 mask.",
    }


def evaluate_clean_routes(
    origin: str,
    destination: str,
    city: str,
    source: str,
    distance_km: float,
    departure_hour: int,
    ambient_pm25: float,
) -> dict[str, Any]:
    """Compare CleanRoute green arterial, electric metro, and highway corridors.

    Complexity:
        Time ``O(1)`` and Space ``O(1)`` for fixed 3-corridor comparison.
    """
    baseline_pm25 = max(MIN_AMBIENT_PM25, ambient_pm25)
    t_hw, pm_hw, d_hw, c_hw = _highway_baseline(distance_km, departure_hour, baseline_pm25)
    return {
        "origin": origin,
        "destination": destination,
        "city": city,
        "source": source,
        "distance_km": distance_km,
        "routes": [
            _build_green_route(distance_km, baseline_pm25, t_hw, d_hw, city),
            _build_metro_route(distance_km, baseline_pm25, t_hw, d_hw, c_hw),
            _build_highway_route(t_hw, pm_hw, d_hw, c_hw),
        ],
    }
