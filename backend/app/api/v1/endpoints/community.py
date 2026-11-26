"""Air Watch Community Pollution Reports & Civic Verification Endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.constants import MAX_PAGE_LIMIT
from app.core.exceptions import ResourceNotFoundError
from app.core.rate_limit import limiter
from app.db.seed_data import DEMO_COMMUNITY_REPORTS
from app.models.app_data import CommunityReport
from app.models.auth import User
from app.schemas.app_schemas import CommunityReportResponse, ReportCreateSchema

router = APIRouter(prefix="/community", tags=["Community Air Watch"])


async def _seed_initial_reports(db: AsyncSession) -> None:
    """Seed fallback community smog reports in demo/dev environments when empty."""
    reports = [CommunityReport(user_id=1, **spec) for spec in DEMO_COMMUNITY_REPORTS]
    db.add_all(reports)
    await db.commit()


@router.get("/reports", response_model=list[CommunityReportResponse])
async def list_community_reports(
    db: Annotated[AsyncSession, Depends(get_db)],
    report_type: Annotated[str | None, Query(max_length=50)] = None,
    severity: Annotated[str | None, Query(max_length=32)] = None,
) -> list[CommunityReportResponse]:
    """List verified and unverified community smog hazard reports."""
    query = (
        select(CommunityReport)
        .where(CommunityReport.status != "REJECTED")
        .order_by(CommunityReport.created_at.desc())
    )
    if report_type:
        query = query.where(CommunityReport.report_type == report_type)
    if severity:
        query = query.where(CommunityReport.severity == severity)

    reports = list((await db.execute(query.limit(MAX_PAGE_LIMIT))).scalars().all())
    if not reports and (
        settings.DEMO_MODE or settings.ENVIRONMENT in ("development", "demo", "testing")
    ):
        await _seed_initial_reports(db)
        reports = list((await db.execute(query.limit(MAX_PAGE_LIMIT))).scalars().all())

    return [CommunityReportResponse.model_validate(item) for item in reports]


@router.post("/reports", response_model=CommunityReportResponse)
@limiter.limit("15/minute")
async def create_community_report(
    request: Request,
    req: ReportCreateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> CommunityReportResponse:
    """Submit a new citizen air hazard report."""
    _ = request
    report = CommunityReport(
        user_id=user.id,
        report_type=req.report_type,
        severity=req.severity,
        location_name=req.location_name,
        latitude=req.latitude,
        longitude=req.longitude,
        description=req.description,
        upvote_count=1,
        status="UNVERIFIED",
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return CommunityReportResponse.model_validate(report)


@router.post("/reports/{report_id}/verify", response_model=CommunityReportResponse)
async def upvote_community_report(
    report_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[User, Depends(get_current_user)],
) -> CommunityReportResponse:
    """Confirm and upvote a community air hazard observation."""
    report = (
        (await db.execute(select(CommunityReport).where(CommunityReport.id == report_id)))
        .scalars()
        .first()
    )
    if not report:
        raise ResourceNotFoundError("Report not found")
    report.upvote_count += 1
    await db.commit()
    await db.refresh(report)
    return CommunityReportResponse.model_validate(report)
