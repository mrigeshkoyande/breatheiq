"""CleanRoute commute comparison and personal impact ledger routes."""

from datetime import date, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.constants import (
    SEED_BASE_AQI_HOURS,
    SEED_BASE_AVERTED_CO2_KG,
    SEED_BASE_AVERTED_PM25_UG,
    SEED_IMPACT_DAYS,
    SEED_STEP_AQI_HOURS,
    SEED_STEP_AVERTED_CO2_KG,
    SEED_STEP_AVERTED_PM25_UG,
)
from app.engines.routing import evaluate_clean_routes
from app.models.app_data import ImpactLog
from app.models.auth import User
from app.schemas.app_schemas import CleanRouteRequest, ImpactLogResponse
from app.services.air_data import PRECONFIGURED_CITIES, air_data_service

router = APIRouter()


@router.post("/routes/navigate")
async def cleanroute_navigator(req: CleanRouteRequest) -> dict[str, Any]:
    """Compute 3 comparative commute corridors grounded in city telemetry and sourced factors."""
    city_key = (req.city or "mumbai").strip().lower()
    city_meta = PRECONFIGURED_CITIES.get(city_key, PRECONFIGURED_CITIES["mumbai"])
    telemetry = await air_data_service.get_current_air_quality(
        city_meta["latitude"], city_meta["longitude"], city_meta["city"]
    )
    return evaluate_clean_routes(
        origin=req.origin,
        destination=req.destination,
        city=telemetry.city,
        source=telemetry.source,
        distance_km=req.distance_km,
        departure_hour=req.departure_hour,
        ambient_pm25=telemetry.pm25,
    )


async def _seed_initial_impact_logs(db: AsyncSession, user_id: int) -> None:
    """Provision starter 7-day baseline impact records for new users."""
    today = date.today()
    seed_logs = [
        ImpactLog(
            user_id=user_id,
            date_str=(today - timedelta(days=i)).isoformat(),
            averted_pm25_dose_ug=SEED_BASE_AVERTED_PM25_UG + (i * SEED_STEP_AVERTED_PM25_UG),
            averted_co2_kg=SEED_BASE_AVERTED_CO2_KG + (i * SEED_STEP_AVERTED_CO2_KG),
            aqi_hours_avoided=SEED_BASE_AQI_HOURS + (i * SEED_STEP_AQI_HOURS),
            notes="Metro commute + domestic HEPA purification",
        )
        for i in range(SEED_IMPACT_DAYS)
    ]
    db.add_all(seed_logs)
    await db.commit()


@router.get("/impact")
async def get_impact_ledger(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    """Return user's personal exposure and CO2 reduction ledger."""
    stmt = select(ImpactLog).where(ImpactLog.user_id == user.id).order_by(ImpactLog.date_str.desc())
    logs = list((await db.execute(stmt)).scalars().all())
    if not logs:
        await _seed_initial_impact_logs(db, user.id)
        logs = list((await db.execute(stmt)).scalars().all())

    return {
        "total_averted_pm25_mg": round(sum(item.averted_pm25_dose_ug for item in logs) / 1000.0, 2),
        "total_averted_co2_kg": round(sum(item.averted_co2_kg for item in logs), 2),
        "total_aqi_hours_avoided": round(sum(item.aqi_hours_avoided for item in logs), 1),
        "clean_air_streak_days": len(logs),
        "history": [ImpactLogResponse.model_validate(item) for item in logs],
    }
