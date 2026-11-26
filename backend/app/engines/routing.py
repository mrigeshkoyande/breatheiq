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

    Args:
        origin: Commute starting neighborhood.
        destination: Commute destination neighborhood.
        city: Resolved urban corridor display name.
        source: Telemetry provenance tag (LIVE/MODELED/DEMO).
        distance_km: One-way trip distance in kilometers.
        departure_hour: 24-hour departure clock hour.
        ambient_pm25: Baseline corridor PM2.5 concentration (µg/m³).

    Returns:
        Dictionary payload listing 3 ranked commute alternatives and advisories.
    """
    baseline_pm25 = max(MIN_AMBIENT_PM25, ambient_pm25)
    time_highway = max(
        5, round(distance_km * MINUTES_PER_KM_ARTERIAL * _rush_hour_multiplier(departure_hour))
    )
    pm25_highway = round(baseline_pm25 * 1.4, 1)
    dose_highway = _inhalation_dose(pm25_highway, time_highway, "adult_moderate_activity")
    co2_highway = round(distance_km * CAR_CO2_KG_PER_KM, 2)

    time_green = time_highway + 5
    pm25_green = round(baseline_pm25 * 0.82, 1)
    dose_green = _inhalation_dose(pm25_green, time_green, "adult_moderate_activity")
    co2_green = round(distance_km * GREEN_CAR_CO2_KG_PER_KM, 2)
    green_drop_pct = round(max(0.0, (1 - dose_green / max(1.0, dose_highway)) * 100))

    time_metro = max(4, time_highway - 2)
    pm25_metro = round(max(MIN_METRO_PM25, baseline_pm25 * 0.28), 1)
    dose_metro = _inhalation_dose(pm25_metro, time_metro, "adult_resting")
    metro_savings = calculate_transit_emission_savings(
        distance_km, chosen_mode="electric_metro", baseline_mode="petrol_car_solo"
    )
    co2_metro = round(max(0.01, co2_highway - metro_savings.co2_averted_kg), 2)
    metro_dose_drop_pct = round(max(0.0, (1 - dose_metro / max(1.0, dose_highway)) * 100))
    metro_co2_drop_pct = round(
        max(0.0, (metro_savings.co2_averted_kg / max(0.01, co2_highway)) * 100)
    )

    return {
        "origin": origin,
        "destination": destination,
        "city": city,
        "source": source,
        "distance_km": distance_km,
        "routes": [
            {
                "id": "route_clean",
                "name": "CleanRoute (Green Corridor & Canopy)",
                "travel_time_min": time_green,
                "average_pm25": pm25_green,
                "inhaled_dose_ug": round(dose_green, 1),
                "co2_emissions_kg": co2_green,
                "exposure_rating": "Lowest Surface Road Exposure",
                "recommended": True,
                "advisory": f"Secondary arterial corridor avoids tailpipe canyons (~{green_drop_pct}% lower estimated particulate intake vs highway under current {city} telemetry).",
            },
            {
                "id": "route_metro",
                "name": "Electric Metro Corridor Transit",
                "travel_time_min": time_metro,
                "average_pm25": pm25_metro,
                "inhaled_dose_ug": round(dose_metro, 1),
                "co2_emissions_kg": co2_metro,
                "exposure_rating": "Minimal Inhaled Dosage",
                "recommended": True,
                "advisory": f"Filtered rapid transit avoids ~{metro_co2_drop_pct}% CO2 and ~{metro_dose_drop_pct}% estimated inhaled PM2.5 vs highway driving.",
            },
            {
                "id": "route_arterial",
                "name": "Primary Express Arterial Highway",
                "travel_time_min": time_highway,
                "average_pm25": pm25_highway,
                "inhaled_dose_ug": round(dose_highway, 1),
                "co2_emissions_kg": co2_highway,
                "exposure_rating": "Severe Exhaust Exposure",
                "recommended": False,
                "advisory": "High diesel exhaust plume. Keep windows closed and consider an N95 mask.",
            },
        ],
    }
