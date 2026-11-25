"""Air Watch Community Pollution Reports & Civic Verification Endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.rate_limit import limiter
from app.models.app_data import CommunityReport
from app.models.auth import User
from app.schemas.app_schemas import CommunityReportResponse, ReportCreateSchema

router = APIRouter(prefix="/community", tags=["Community Air Watch"])


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

    res = await db.execute(query.limit(50))
    reports = list(res.scalars().all())

    if not reports and (settings.DEMO_MODE or settings.ENVIRONMENT in ("development", "demo", "testing")):
        seed = [
            CommunityReport(
                user_id=1,
                report_type="construction_dust",
                severity="severe",
                location_name="SV Road Metro Construction Corridor, Andheri West",
                latitude=19.1190,
                longitude=72.8470,
                description="Excavation site active without mandatory green dust barrier mesh.",
                upvote_count=8,
                status="UNVERIFIED",
            ),
            CommunityReport(
                user_id=1,
                report_type="garbage_burning",
                severity="hazardous",
                location_name="Deonar Peripheral Corridor, Chembur",
                latitude=19.0620,
                longitude=72.9210,
                description="Biomass and plastic waste smoldering on vacant lot.",
                upvote_count=14,
                status="VERIFIED",
            ),
            CommunityReport(
                user_id=1,
                report_type="traffic_congestion",
                severity="moderate",
                location_name="Western Express Highway Kalanagar Junction",
                latitude=19.0600,
                longitude=72.8520,
                description="Stalled commercial trucks causing evening diesel idling.",
                upvote_count=5,
                status="UNVERIFIED",
            ),
        ]
        db.add_all(seed)
        await db.commit()
        res = await db.execute(query.limit(50))
        reports = list(res.scalars().all())

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
    res = await db.execute(select(CommunityReport).where(CommunityReport.id == report_id))
    report = res.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.upvote_count += 1
    await db.commit()
    await db.refresh(report)
    return CommunityReportResponse.model_validate(report)
