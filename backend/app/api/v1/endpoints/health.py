"""Health check and database readiness endpoints."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Health"])


@router.get("/healthz")
async def healthz() -> dict[str, str]:
    """Liveness check confirming HTTP worker responsiveness."""
    return {"status": "ok", "service": "BreatheIQ API"}


@router.get("/readyz")
async def readyz(db: Annotated[AsyncSession, Depends(get_db)]) -> dict[str, str]:
    """Readiness check verifying database connectivity."""
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except SQLAlchemyError as exc:
        logger.warning("Database readiness check failed: %s", exc)
        db_status = f"unhealthy: {type(exc).__name__}"

    return {
        "status": "ready" if db_status == "connected" else "degraded",
        "database": db_status,
    }
