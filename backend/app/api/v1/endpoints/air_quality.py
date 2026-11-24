"""
backend/app/api/v1/endpoints/air_quality.py
Air Quality Telemetry, Station Ingestion, and Forecast Endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from app.services.air_data import air_data_service, AirDataPayload, PRECONFIGURED_CITIES

router = APIRouter(prefix="/air-quality", tags=["Air Quality Telemetry"])

@router.get("/cities", response_model=List[dict])
def list_cities():
    """Returns preconfigured Indian metropolitan monitoring corridors."""
    return air_data_service.get_cities()

@router.get("/current", response_model=AirDataPayload)
async def get_current_air_quality(
    lat: Optional[float] = Query(None, description="Latitude coordinate"),
    lon: Optional[float] = Query(None, description="Longitude coordinate"),
    city: Optional[str] = Query(None, description="Preconfigured city name (e.g. Mumbai, Delhi, Bengaluru)")
):
    """
    Retrieves current atmospheric air quality readings with provenance tracking and CPCB NAQI calculation.
    """
    resolved_lat = lat
    resolved_lon = lon

    if city and city.lower() in PRECONFIGURED_CITIES:
        c_info = PRECONFIGURED_CITIES[city.lower()]
        resolved_lat = c_info["latitude"]
        resolved_lon = c_info["longitude"]
    elif resolved_lat is None or resolved_lon is None:
        # Default to Mumbai Andheri West
        resolved_lat = 19.0760
        resolved_lon = 72.8777
        city = "Mumbai"

    payload = await air_data_service.get_current_air_quality(resolved_lat, resolved_lon, city)
    return payload

@router.get("/forecast", response_model=List[dict])
async def get_air_quality_forecast(
    lat: Optional[float] = Query(19.0760, description="Latitude coordinate"),
    lon: Optional[float] = Query(72.8777, description="Longitude coordinate"),
    hours: int = Query(48, ge=6, le=72, description="Forecast horizon in hours")
):
    """
    Retrieves hourly particulate and meteorological forecast series for ventilation and exposure planning.
    """
    return await air_data_service.get_forecast(lat, lon, hours)
