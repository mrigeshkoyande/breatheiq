"""Aggregator router for personalized family air protection user flows."""

from fastapi import APIRouter

from app.api.v1.endpoints.user_routes import alerts, household, mobility_impact, rooms, routine
from app.api.v1.endpoints.user_routes.household import compute_vulnerability_score

__all__ = ["compute_vulnerability_score", "router"]

router = APIRouter(prefix="/user", tags=["Personalized User Flow"])
router.include_router(household.router)
router.include_router(rooms.router)
router.include_router(routine.router)
router.include_router(mobility_impact.router)
router.include_router(alerts.router)
