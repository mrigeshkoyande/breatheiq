"""Preconfigured Indian urban corridor telemetry baselines and diurnal helpers."""

from typing_extensions import TypedDict


class CityConfig(TypedDict):
    """Preconfigured urban corridor metadata and deterministic fallback baseline."""

    city: str
    state: str
    latitude: float
    longitude: float
    base_pm25: float
    base_pm10: float
    base_no2: float
    base_so2: float
    base_co: float
    base_o3: float
    temp_c: float
    humidity: float
    wind_speed: float


PRECONFIGURED_CITIES: dict[str, CityConfig] = {
    "mumbai": {
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "base_pm25": 118.0,
        "base_pm10": 165.0,
        "base_no2": 52.0,
        "base_so2": 18.0,
        "base_co": 1.4,
        "base_o3": 38.0,
        "temp_c": 28.5,
        "humidity": 68.0,
        "wind_speed": 3.4,
    },
    "delhi": {
        "city": "Delhi",
        "state": "NCT of Delhi",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "base_pm25": 245.0,
        "base_pm10": 340.0,
        "base_no2": 78.0,
        "base_so2": 24.0,
        "base_co": 2.8,
        "base_o3": 44.0,
        "temp_c": 19.0,
        "humidity": 78.0,
        "wind_speed": 1.8,
    },
    "bengaluru": {
        "city": "Bengaluru",
        "state": "Karnataka",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "base_pm25": 48.0,
        "base_pm10": 74.0,
        "base_no2": 32.0,
        "base_so2": 11.0,
        "base_co": 0.8,
        "base_o3": 31.0,
        "temp_c": 24.0,
        "humidity": 55.0,
        "wind_speed": 4.1,
    },
    "kolkata": {
        "city": "Kolkata",
        "state": "West Bengal",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "base_pm25": 165.0,
        "base_pm10": 220.0,
        "base_no2": 58.0,
        "base_so2": 21.0,
        "base_co": 1.9,
        "base_o3": 36.0,
        "temp_c": 25.0,
        "humidity": 72.0,
        "wind_speed": 2.2,
    },
    "pune": {
        "city": "Pune",
        "state": "Maharashtra",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "base_pm25": 84.0,
        "base_pm10": 118.0,
        "base_no2": 41.0,
        "base_so2": 14.0,
        "base_co": 1.1,
        "base_o3": 42.0,
        "temp_c": 26.5,
        "humidity": 58.0,
        "wind_speed": 3.1,
    },
}


def match_city(lat: float, lon: float, city_name: str | None) -> CityConfig:
    """Resolve explicit city name or nearest preconfigured Indian urban corridor."""
    if city_name:
        key = city_name.strip().lower()
        if key in PRECONFIGURED_CITIES:
            return PRECONFIGURED_CITIES[key]
    return min(
        PRECONFIGURED_CITIES.values(),
        key=lambda cfg: (cfg["latitude"] - lat) ** 2 + (cfg["longitude"] - lon) ** 2,
    )


def diurnal_profile_for_hour(hour: int) -> tuple[float, float, float]:
    """Return ``(pm_multiplier, boundary_layer_m, wind_ms)`` for UTC clock hour."""
    if 7 <= hour <= 9:
        return 1.30, 240.0, 1.6
    if 19 <= hour <= 22:
        return 1.25, 300.0, 1.8
    if 12 <= hour <= 15:
        return 0.68, 980.0, 3.6
    return 0.95, 450.0, 2.4
