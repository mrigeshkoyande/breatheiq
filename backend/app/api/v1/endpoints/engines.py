"""Deterministic Atmospheric Calculation Engines Endpoints."""

from fastapi import APIRouter, HTTPException

from app.engines.impact import (
    HouseholdImpactSummary,
    calculate_cumulative_impact,
    get_emission_factors_metadata,
)
from app.engines.naqi import NAQIResult, calculate_cpcb_naqi, get_cpcb_breakpoints_table
from app.engines.purifier import PurifierSizingResult, calculate_purifier_sizing
from app.engines.ventilation import WindowOracleOutput, evaluate_window_oracle
from app.schemas.app_schemas import (
    ImpactRequest,
    NAQIRequest,
    PurifierSizeRequest,
    WindowOracleRequest,
)
from app.services.air_data import air_data_service

router = APIRouter(prefix="/engines", tags=["Atmospheric Calculation Engines"])


@router.get("/naqi/breakpoints")
def get_naqi_breakpoints() -> dict[str, object]:
    """Return statutory CPCB breakpoint categories and ranges."""
    return get_cpcb_breakpoints_table()


@router.get("/factors")
def get_engine_factors() -> dict[str, object]:
    """Return canonical sourced emission and inhalation constants."""
    return get_emission_factors_metadata()


@router.post("/naqi/calculate", response_model=NAQIResult)
def calculate_naqi_endpoint(req: NAQIRequest) -> NAQIResult:
    """Compute statutory CPCB NAQI sub-indices and composite score."""
    return calculate_cpcb_naqi(req.readings)


@router.post("/window-oracle", response_model=WindowOracleOutput)
async def window_oracle_endpoint(req: WindowOracleRequest) -> WindowOracleOutput:
    """Evaluate diurnal thermal inversion and identify optimal ventilation windows."""
    hourly_data = req.hourly_forecast
    if not hourly_data and req.lat is not None and req.lon is not None:
        hourly_data = await air_data_service.get_forecast(req.lat, req.lon, hours=24)

    return evaluate_window_oracle(hourly_data)


@router.post("/purifier-size", response_model=PurifierSizingResult)
def purifier_size_endpoint(req: PurifierSizeRequest) -> PurifierSizingResult:
    """Compute required Clean Air Delivery Rate (m3/h and CFM) and PM2.5 decay trajectory."""
    try:
        return calculate_purifier_sizing(
            length_m=req.length_m,
            width_m=req.width_m,
            height_m=req.height_m,
            target_ach=req.target_ach,
            initial_pm25=req.initial_pm25,
            outdoor_pm25=req.outdoor_pm25,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/impact/calculate", response_model=HouseholdImpactSummary)
def impact_calculate_endpoint(req: ImpactRequest) -> HouseholdImpactSummary:
    """Compute daily averted inhaled PM2.5 dosage (ug) and vehicular CO2 savings (kg)."""
    return calculate_cumulative_impact(
        outdoor_pm25=req.outdoor_pm25,
        indoor_purified_pm25=req.indoor_purified_pm25,
        indoor_hours=req.indoor_hours,
        transit_distance_km=req.transit_distance_km,
        transit_mode=req.transit_mode,
    )
