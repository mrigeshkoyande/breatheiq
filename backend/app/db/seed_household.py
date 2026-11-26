"""Activity, alert, and 7-day impact log seeding helpers for demo accounts."""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import (
    SEED_BASE_AQI_HOURS,
    SEED_BASE_AVERTED_CO2_KG,
    SEED_BASE_AVERTED_PM25_UG,
    SEED_IMPACT_DAYS,
    SEED_STEP_AQI_HOURS,
    SEED_STEP_AVERTED_CO2_KG,
    SEED_STEP_AVERTED_PM25_UG,
)
from app.db.seed_data import DEMO_TASKS
from app.models.app_data import ImpactLog, RoutineTask, SmogAlertNotification, SmogAlertRule


async def seed_routine_and_alerts(session: AsyncSession, user_id: int) -> None:
    """Seed daily adaptive routine tasks, alert rule, notification, and 7-day impact logs."""
    today_str = date.today().isoformat()
    res_tasks = await session.execute(
        select(RoutineTask).where(RoutineTask.user_id == user_id, RoutineTask.date_str == today_str)
    )
    existing_tasks = {t.title for t in res_tasks.scalars().all()}
    for title, slot, category, done, desc in DEMO_TASKS:
        if title not in existing_tasks:
            session.add(
                RoutineTask(
                    user_id=user_id,
                    title=title,
                    time_slot=slot,
                    category=category,
                    description=desc,
                    is_completed=done,
                    date_str=today_str,
                )
            )

    if (
        not (await session.execute(select(SmogAlertRule).where(SmogAlertRule.user_id == user_id)))
        .scalars()
        .first()
    ):
        session.add(SmogAlertRule(user_id=user_id, aqi_threshold=200, target_member="All Members"))
    if (
        not (
            await session.execute(
                select(SmogAlertNotification).where(SmogAlertNotification.user_id == user_id)
            )
        )
        .scalars()
        .first()
    ):
        session.add(
            SmogAlertNotification(
                user_id=user_id,
                title="Twilight Smog Surge Warning",
                message="PM2.5 concentration spiked to 245 ug/m3 in Andheri West.",
                aqi_at_trigger=245,
                pollutant_driver="PM2.5",
                reason_why="Boundary layer inversion trapping vehicular and industrial emissions.",
            )
        )

    await seed_impact_history(session, user_id)


async def seed_impact_history(session: AsyncSession, user_id: int) -> None:
    """Populate 7-day baseline impact records when fewer than 7 days exist."""
    res = await session.execute(select(ImpactLog).where(ImpactLog.user_id == user_id))
    if len(res.scalars().all()) >= SEED_IMPACT_DAYS:
        return
    for i in range(SEED_IMPACT_DAYS):
        day_date = (date.today() - timedelta(days=i)).isoformat()
        day_res = await session.execute(
            select(ImpactLog).where(ImpactLog.user_id == user_id, ImpactLog.date_str == day_date)
        )
        if not day_res.scalars().first():
            session.add(
                ImpactLog(
                    user_id=user_id,
                    date_str=day_date,
                    averted_pm25_dose_ug=SEED_BASE_AVERTED_PM25_UG
                    + (i * SEED_STEP_AVERTED_PM25_UG),
                    averted_co2_kg=SEED_BASE_AVERTED_CO2_KG + (i * SEED_STEP_AVERTED_CO2_KG),
                    aqi_hours_avoided=SEED_BASE_AQI_HOURS + (i * SEED_STEP_AQI_HOURS),
                    notes="Logged through Window Oracle adherence and HEPA purification.",
                )
            )
