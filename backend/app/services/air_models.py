"""Air telemetry schemas, provider interface, and deterministic offline demo provider."""

from abc import ABC, abstractmethod
from datetime import UTC, datetime, timedelta
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.engines.naqi import NAQIResult, calculate_cpcb_naqi
from app.services.air_cities import CityConfig, diurnal_profile_for_hour, match_city


class AirDataPayload(BaseModel):
    """Normalized current telemetry payload returned to routes and UI."""

    model_config = ConfigDict(extra="forbid")

    city: str
    location_name: str
    latitude: float
    longitude: float
    timestamp_utc: str
    source: str
    confidence_score: float
    station_id: str | None = None
    pm25: float
    pm10: float
    no2: float
    so2: float
    co: float
    o3: float
    temperature_c: float
    relative_humidity_pct: float
    wind_speed_ms: float
    boundary_layer_height_m: float | None = None
    naqi: NAQIResult


class AirDataProvider(ABC):
    """Abstract interface for environmental telemetry providers."""

    @abstractmethod
    async def get_current(
        self, lat: float, lon: float, city_name: str | None = None
    ) -> AirDataPayload:
        """Fetch current atmospheric telemetry for a coordinate or city."""

    @abstractmethod
    async def get_forecast(self, lat: float, lon: float, hours: int = 48) -> list[dict[str, Any]]:
        """Fetch hourly particulate and weather forecast."""


def _demo_diurnal_multiplier(hour: int) -> float:
    """Return current-hour winter smog diurnal multiplier."""
    if 7 <= hour <= 9:
        return 1.25
    if 19 <= hour <= 22:
        return 1.20
    return 0.70 if 12 <= hour <= 15 else 1.0


def _build_demo_forecast_point(city_info: CityConfig, target_time: datetime) -> dict[str, Any]:
    """Generate one hourly deterministic demo forecast entry."""
    hour = target_time.hour
    diurnal, bl, wind = diurnal_profile_for_hour(hour)
    temp_offset = 3.0 if 12 <= hour <= 15 else -2.5
    hum_offset = 10.0 if 4 <= hour <= 8 else -12.0
    return {
        "time": target_time.isoformat(),
        "pm25": round(city_info["base_pm25"] * diurnal, 1),
        "pm10": round(city_info["base_pm10"] * diurnal, 1),
        "wind_speed_ms": wind,
        "temperature_c": round(city_info["temp_c"] + temp_offset, 1),
        "relative_humidity_pct": round(city_info["humidity"] + hum_offset, 1),
        "boundary_layer_height_m": bl,
        "badge": "DEMO_FORECAST",
    }


def _build_demo_pollutants(city_info: CityConfig, hour: int) -> dict[str, float]:
    """Compute diurnal pollutant concentrations for ``city_info`` at UTC ``hour``."""
    diurnal = _demo_diurnal_multiplier(hour)
    return {
        "pm25": round(city_info["base_pm25"] * diurnal, 1),
        "pm10": round(city_info["base_pm10"] * diurnal, 1),
        "no2": round(city_info["base_no2"] * (1.1 if 7 <= hour <= 20 else 0.8), 1),
        "so2": city_info["base_so2"],
        "co": round(city_info["base_co"] * diurnal, 2),
        "o3": round(city_info["base_o3"] * (1.4 if 12 <= hour <= 16 else 0.6), 1),
    }


class DemoAirDataProvider(AirDataProvider):
    """Deterministic offline fallback modeling urban diurnal winter smog curves."""

    async def get_current(
        self, lat: float, lon: float, city_name: str | None = None
    ) -> AirDataPayload:
        """Compute current synthetic diurnal telemetry for offline and demo mode."""
        city_info = match_city(lat, lon, city_name)
        now = datetime.now(UTC)
        concs = _build_demo_pollutants(city_info, now.hour)
        return AirDataPayload(
            city=city_info["city"],
            location_name=f"{city_info['city']} Central Monitoring Corridor",
            latitude=city_info["latitude"],
            longitude=city_info["longitude"],
            timestamp_utc=now.isoformat(),
            source="DEMO",
            confidence_score=0.85,
            station_id="DEMO-CAAQMS-01",
            temperature_c=city_info["temp_c"],
            relative_humidity_pct=city_info["humidity"],
            wind_speed_ms=city_info["wind_speed"],
            boundary_layer_height_m=950.0 if 12 <= now.hour <= 15 else 280.0,
            naqi=calculate_cpcb_naqi(concs),
            **concs,
        )

    async def get_forecast(self, lat: float, lon: float, hours: int = 48) -> list[dict[str, Any]]:
        """Generate multi-hour synthetic winter smog forecast series."""
        city_info = match_city(lat, lon, None)
        now = datetime.now(UTC)
        return [
            _build_demo_forecast_point(city_info, now + timedelta(hours=h)) for h in range(hours)
        ]
