"""
backend/app/api/v1/endpoints/community.py
Air Watch Community Pollution Reports & Civic Verification Endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.auth import User
from app.models.app_data import CommunityReport

router = APIRouter(prefix="/community", tags=["Community Air Watch"])

class ReportCreateSchema(BaseModel):
    report_type: str = Field(..., example="construction_dust")  # stubble_burning, construction_dust, garbage_burning, industrial_plume, traffic_congestion
    severity: str = Field("moderate", example="severe")  # moderate, severe, hazardous
    location_name: str = Field(..., example="SV Road & Linking Road Junction, Andheri")
    latitude: float = Field(19.0760)
    longitude: float = Field(72.8777)
    description: Optional[str] = Field("", example="Heavy unpaved road dust with no water sprinkling.")

@router.get("/reports")
async def list_community_reports(
    report_type: Optional[str] = None,
    severity: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(CommunityReport).where(CommunityReport.status != "REJECTED").order_by(CommunityReport.created_at.desc())
    if report_type:
        query = query.where(CommunityReport.report_type == report_type)
    if severity:
        query = query.where(CommunityReport.severity == severity)

    res = await db.execute(query.limit(50))
    reports = res.scalars().all()

    if not reports:
        # Seed realistic initial community reports
        seed = [
            CommunityReport(
                user_id=1,
                report_type="construction_dust",
                severity="severe",
                location_name="SV Road Metro Construction Corridor, Andheri West",
                latitude=19.1190,
                longitude=72.8470,
                description="Excavation site active without mandatory green dust barrier mesh. Visible particulate plume.",
                upvote_count=8,
                status="UNVERIFIED"
            ),
            CommunityReport(
                user_id=1,
                report_type="garbage_burning",
                severity="hazardous",
                location_name="Deonar Peripheral Corridor, Chembur",
                latitude=19.0620,
                longitude=72.9210,
                description="Biomass and plastic waste smoldering on vacant lot. Acrid smoke entering residential towers.",
                upvote_count=14,
                status="VERIFIED"
            ),
            CommunityReport(
                user_id=1,
                report_type="traffic_congestion",
                severity="moderate",
                location_name="Western Express Highway Kalanagar Junction",
                latitude=19.0600,
                longitude=72.8520,
                description="Stalled commercial trucks causing severe evening twilight diesel idling.",
                upvote_count=5,
                status="UNVERIFIED"
            )
        ]
        db.add_all(seed)
        await db.commit()
        res = await db.execute(query.limit(50))
        reports = res.scalars().all()

    return reports

@router.post("/reports")
async def create_community_report(
    req: ReportCreateSchema,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    report = CommunityReport(
        user_id=user.id,
        report_type=req.report_type,
        severity=req.severity,
        location_name=req.location_name,
        latitude=req.latitude,
        longitude=req.longitude,
        description=req.description,
        upvote_count=1,
        status="UNVERIFIED"
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report

@router.post("/reports/{report_id}/verify")
async def upvote_community_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    res = await db.execute(select(CommunityReport).where(CommunityReport.id == report_id))
    report = res.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.upvote_count += 1
    await db.commit()
    await db.refresh(report)
    return report
