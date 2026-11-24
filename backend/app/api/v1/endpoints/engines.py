"""
backend/app/api/v1/endpoints/engines.py
Deterministic Atmospheric Calculation Engines Endpoints:
- CPCB NAQI calculation with statutory validity checks
- Window Oracle ventilation evaluation
- CADR-based room purifier sizing
- Inhaled PM2.5 dosage & transit CO2 impact
"""

from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.engines.naqi import calculate_cpcb_naqi, NAQIResult
from app.engines.ventilation import evaluate_window_oracle, WindowOracleOutput
from app.engines.purifier import calculate_purifier_sizing, PurifierSizingResult
from app.engines.impact import calculate_cumulative_impact, HouseholdImpactSummary
from app.services.air_data import air_data_service

router = APIRouter(prefix="/engines", tags=["Atmospheric Calculation Engines"])

class NAQIRequest(BaseModel):
    readings: Dict[str, float] = Field(
        ...,
        example={"pm25": 118.0, "pm10": 165.0, "no2": 52.0, "so2": 18.0, "co": 1.4, "o3": 38.0}
    )

class WindowOracleRequest(BaseModel):
    lat: Optional[float] = 19.0760
    lon: Optional[float] = 72.8777
    hourly_forecast: Optional[List[Dict[str, Any]]] = None

class PurifierSizeRequest(BaseModel):
    length_m: float = Field(..., gt=0, example=4.5)
    width_m: float = Field(..., gt=0, example=3.8)
    height_m: float = Field(2.7, gt=0, example=2.7)
    target_ach: float = Field(5.0, gt=0, example=5.0)
    initial_pm25: float = Field(120.0, ge=0, example=120.0)
    outdoor_pm25: float = Field(180.0, ge=0, example=180.0)

class ImpactRequest(BaseModel):
    outdoor_pm25: float = Field(160.0, ge=0, example=160.0)
    indoor_purified_pm25: float = Field(25.0, ge=0, example=25.0)
    indoor_hours: float = Field(12.0, ge=0, le=24, example=12.0)
    transit_distance_km: Optional[float] = Field(15.0, ge=0, example=15.0)
    transit_mode: str = Field("electric_metro", example="electric_metro")

@router.post("/naqi/calculate", response_model=NAQIResult)
def calculate_naqi_endpoint(req: NAQIRequest):
    """Computes statutory CPCB NAQI sub-indices and composite score."""
    return calculate_cpcb_naqi(req.readings)

@router.post("/window-oracle", response_model=WindowOracleOutput)
async def window_oracle_endpoint(req: WindowOracleRequest):
    """
    Evaluates diurnal thermal inversion and predicts optimal domestic ventilation window.
    """
    hourly_data = req.hourly_forecast
    if not hourly_data and req.lat and req.lon:
        hourly_data = await air_data_service.get_forecast(req.lat, req.lon, hours=24)

    return evaluate_window_oracle(hourly_data)

@router.post("/purifier-size", response_model=PurifierSizingResult)
def purifier_size_endpoint(req: PurifierSizeRequest):
    """
    Computes required Clean Air Delivery Rate (CADR in m³/h and CFM) and PM2.5 decay trajectory.
    """
    try:
        return calculate_purifier_sizing(
            length_m=req.length_m,
            width_m=req.width_m,
            height_m=req.height_m,
            target_ach=req.target_ach,
            initial_pm25=req.initial_pm25,
            outdoor_pm25=req.outdoor_pm25
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/impact/calculate", response_model=HouseholdImpactSummary)
def impact_calculate_endpoint(req: ImpactRequest):
    """
    Computes daily averted inhaled PM2.5 dosage (µg) and vehicular CO2 savings (kg).
    """
    return calculate_cumulative_impact(
        outdoor_pm25=req.outdoor_pm25,
        indoor_purified_pm25=req.indoor_purified_pm25,
        indoor_hours=req.indoor_hours,
        transit_distance_km=req.transit_distance_km,
        transit_mode=req.transit_mode
    )
