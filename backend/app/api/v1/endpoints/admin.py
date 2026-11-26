"""Administrative & Moderation Endpoints protected by DB-backed role checks."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.core.constants import MAX_PAGE_LIMIT
from app.core.exceptions import DomainValidationError, ResourceNotFoundError
from app.models.app_data import CommunityReport
from app.models.auth import AuditLog, User
from app.models.copilot import AITrace
from app.schemas.app_schemas import (
    AITraceResponse,
    AuditLogResponse,
    CommunityReportResponse,
    ModerationAction,
    UserStatusUpdate,
)
from app.services.admin_probes import build_integrations_report, probe_open_meteo
from app.services.auth_service import log_audit

router = APIRouter(prefix="/admin", tags=["Administration & Moderation"])


def _escape_like(term: str) -> str:
    """Escape SQL LIKE wildcard characters to prevent wildcard injection."""
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/users")
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin_user: Annotated[User, Depends(require_role("admin", "moderator"))],
    search: Annotated[str | None, Query(max_length=100)] = None,
) -> list[dict[str, Any]]:
    """List users sorted by recency with escaped substring search."""
    query = select(User).order_by(User.created_at.desc())
    if search:
        safe_term = f"%{_escape_like(search.strip())}%"
        query = query.where(
            User.email.ilike(safe_term, escape="\\") | User.full_name.ilike(safe_term, escape="\\")
        )
    res = await db.execute(query.limit(MAX_PAGE_LIMIT))
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in res.scalars().all()
    ]


def _guard_self_demotion(admin_user: User, user_id: int, req: UserStatusUpdate) -> None:
    """Prevent administrators from suspending or demoting their own account."""
    demoting_role = req.role is not None and req.role != admin_user.role
    if user_id == admin_user.id and (req.is_active is False or demoting_role):
        raise DomainValidationError(
            "Cannot suspend or demote your own administrator account.", status_code=400
        )


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    req: UserStatusUpdate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin_user: Annotated[User, Depends(require_role("admin"))],
) -> dict[str, Any]:
    """Update account activation state or role (admin only)."""
    _guard_self_demotion(admin_user, user_id, req)
    user = (await db.execute(select(User).where(User.id == user_id))).scalars().first()
    if not user:
        raise ResourceNotFoundError("User not found")
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.role is not None:
        user.role = req.role
    details = f"Updated user_id={user.id} active={user.is_active} role={user.role}"
    log_audit(db, admin_user.id, "ADMIN_USER_STATUS_UPDATED", request, details)
    await db.commit()
    return {
        "message": "User updated",
        "user_id": user.id,
        "is_active": user.is_active,
        "role": user.role,
    }


@router.get("/moderation/queue", response_model=list[CommunityReportResponse])
async def get_moderation_queue(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin_user: Annotated[User, Depends(require_role("admin", "moderator"))],
) -> list[CommunityReportResponse]:
    """Retrieve pending community air hazard reports for moderator triage."""
    res = await db.execute(
        select(CommunityReport)
        .where(CommunityReport.status == "UNVERIFIED")
        .order_by(CommunityReport.upvote_count.desc())
    )
    return [CommunityReportResponse.model_validate(item) for item in res.scalars().all()]


@router.patch("/moderation/{report_id}")
async def moderate_report(
    report_id: int,
    req: ModerationAction,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin_user: Annotated[User, Depends(require_role("admin", "moderator"))],
) -> dict[str, Any]:
    """Verify or reject a pending community smog report."""
    report = (
        (await db.execute(select(CommunityReport).where(CommunityReport.id == report_id)))
        .scalars()
        .first()
    )
    if not report:
        raise ResourceNotFoundError("Report not found")
    normalized = req.action.upper()
    if normalized in ("VERIFY", "REJECT"):
        report.status = "VERIFIED" if normalized == "VERIFY" else "REJECTED"
    log_audit(
        db,
        admin_user.id,
        "MODERATION_REPORT_UPDATED",
        request,
        f"Report #{report.id} -> {report.status}",
    )
    await db.commit()
    return {"message": f"Report status updated to {report.status}", "id": report.id}


@router.get("/ai-traces", response_model=list[AITraceResponse])
async def list_ai_traces(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin_user: Annotated[User, Depends(require_role("admin", "moderator"))],
) -> list[AITraceResponse]:
    """Return latest 50 Copilot safety validation traces."""
    res = await db.execute(
        select(AITrace).order_by(AITrace.created_at.desc()).limit(MAX_PAGE_LIMIT)
    )
    return [AITraceResponse.model_validate(item) for item in res.scalars().all()]


@router.get("/audit-logs", response_model=list[AuditLogResponse])
async def list_audit_logs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _admin_user: Annotated[User, Depends(require_role("admin", "moderator"))],
) -> list[AuditLogResponse]:
    """Return latest 50 security audit events."""
    res = await db.execute(
        select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(MAX_PAGE_LIMIT)
    )
    return [AuditLogResponse.model_validate(item) for item in res.scalars().all()]


@router.get("/integrations/health")
async def check_integrations_health(
    request: Request,
    _admin_user: Annotated[User, Depends(require_role("admin", "moderator"))],
) -> list[dict[str, Any]]:
    """Probe external integrations and report current degraded/ready states."""
    om_status, om_latency = await probe_open_meteo(request)
    return build_integrations_report(om_status, om_latency)
