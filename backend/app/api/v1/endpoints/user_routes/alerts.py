"""Smog threshold alert rules and notification endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import ResourceNotFoundError
from app.models.app_data import SmogAlertNotification, SmogAlertRule
from app.models.auth import User
from app.schemas.app_schemas import AlertRuleCreateSchema, AlertRuleResponse, NotificationResponse

router = APIRouter()


async def _ensure_default_rules(db: AsyncSession, user_id: int) -> list[SmogAlertRule]:
    """Load caller's alert rules or seed a starter threshold rule on first access."""
    rules = list(
        (await db.execute(select(SmogAlertRule).where(SmogAlertRule.user_id == user_id)))
        .scalars()
        .all()
    )
    if rules:
        return rules
    default_rule = SmogAlertRule(user_id=user_id, aqi_threshold=200, target_member="All Members")
    db.add(default_rule)
    await db.commit()
    await db.refresh(default_rule)
    return [default_rule]


async def _ensure_default_notifications(
    db: AsyncSession, user_id: int
) -> list[SmogAlertNotification]:
    """Load caller's notifications or seed an initial twilight warning card."""
    notifs = list(
        (
            await db.execute(
                select(SmogAlertNotification)
                .where(SmogAlertNotification.user_id == user_id)
                .order_by(SmogAlertNotification.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    if notifs:
        return notifs
    sample_notif = SmogAlertNotification(
        user_id=user_id,
        title="Twilight Smog Surge Warning",
        message="Monitoring corridor crossed AQI 245 (Poor) during nocturnal inversion.",
        aqi_at_trigger=245,
        pollutant_driver="PM2.5 (118 µg/m³)",
        reason_why="Surface radiation cooling trapped exhaust below shallow mixing height.",
        is_read=False,
    )
    db.add(sample_notif)
    await db.commit()
    await db.refresh(sample_notif)
    return [sample_notif]


@router.get("/alerts")
async def get_alerts_and_rules(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    """Fetch user's smog alert threshold rules and alert notification feed."""
    rules = await _ensure_default_rules(db, user.id)
    notifs = await _ensure_default_notifications(db, user.id)
    return {
        "rules": [AlertRuleResponse.model_validate(r) for r in rules],
        "notifications": [NotificationResponse.model_validate(n) for n in notifs],
    }


@router.post("/alerts/rules", response_model=AlertRuleResponse)
async def create_alert_rule(
    req: AlertRuleCreateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> AlertRuleResponse:
    """Create a custom smog threshold alert rule."""
    rule = SmogAlertRule(user_id=user.id, **req.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return AlertRuleResponse.model_validate(rule)


@router.delete("/alerts/rules/{rule_id}")
async def delete_alert_rule(
    rule_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    """Delete a smog threshold alert rule owned by caller."""
    rule = (
        (
            await db.execute(
                select(SmogAlertRule).where(
                    SmogAlertRule.id == rule_id, SmogAlertRule.user_id == user.id
                )
            )
        )
        .scalars()
        .first()
    )
    if not rule:
        raise ResourceNotFoundError("Alert rule not found")
    await db.delete(rule)
    await db.commit()
    return {"message": "Alert rule removed"}


@router.patch("/alerts/{notification_id}/read")
async def mark_alert_read(
    notification_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    """Mark an owned smog notification as read."""
    notif = (
        (
            await db.execute(
                select(SmogAlertNotification).where(
                    SmogAlertNotification.id == notification_id,
                    SmogAlertNotification.user_id == user.id,
                )
            )
        )
        .scalars()
        .first()
    )
    if not notif:
        raise ResourceNotFoundError("Notification not found")
    notif.is_read = True
    await db.commit()
    return {"message": "Marked as read"}
