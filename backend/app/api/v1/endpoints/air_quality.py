"""Air Quality Telemetry, Station Ingestion, and Forecast Endpoints."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.services.air_data import (
    PRECONFIGURED_CITIES,
    AirDataPayload,
    CityConfig,
    air_data_service,
)

router = APIRouter(prefix="/air-quality", tags=["Air Quality Telemetry"])


@router.get("/cities", response_model=list[CityConfig])
def list_cities() -> list[CityConfig]:
    """Return preconfigured Indian metropolitan monitoring corridors."""
    return air_data_service.get_cities()


@router.get("/current", response_model=AirDataPayload)
async def get_current_air_quality(
    lat: Annotated[float | None, Query(ge=-90.0, le=90.0, description="Latitude coordinate")] = None,
    lon: Annotated[float | None, Query(ge=-180.0, le=180.0, description="Longitude coordinate")] = None,
    city: Annotated[
        str | None, Query(min_length=1, max_length=64, description="Preconfigured city name")
    ] = None,
) -> AirDataPayload:
    """Retrieve current air quality readings with provenance badge and CPCB NAQI score."""
    if city and city.lower() in PRECONFIGURED_CITIES:
        c_info = PRECONFIGURED_CITIES[city.lower()]
        resolved_lat = c_info["latitude"]
        resolved_lon = c_info["longitude"]
        resolved_city: str | None = c_info["city"]
    elif lat is None or lon is None:
        resolved_lat = 19.0760
        resolved_lon = 72.8777
        resolved_city = city or "Mumbai"
    else:
        resolved_lat = lat
        resolved_lon = lon
        resolved_city = city

    return await air_data_service.get_current_air_quality(resolved_lat, resolved_lon, resolved_city)


@router.get("/forecast", response_model=list[dict[str, object]])
async def get_air_quality_forecast(
    lat: Annotated[float, Query(ge=-90.0, le=90.0, description="Latitude coordinate")] = 19.0760,
    lon: Annotated[float, Query(ge=-180.0, le=180.0, description="Longitude coordinate")] = 72.8777,
    hours: Annotated[int, Query(ge=6, le=72, description="Forecast horizon in hours")] = 48,
) -> list[dict[str, object]]:
    """Retrieve hourly particulate and meteorological forecast series."""
    return await air_data_service.get_forecast(lat, lon, hours)
