"""Database seed helper for development and demo environments."""

import asyncio
import logging
import sys
from datetime import date, timedelta
from pathlib import Path
from typing import TypedDict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Ensure backend root is in sys.path when executed directly as a script
_BACKEND_DIR = str(Path(__file__).resolve().parent.parent.parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from app.core.security import hash_password  # noqa: E402
from app.db.session import AsyncSessionLocal, Base, engine  # noqa: E402
from app.models.app_data import (  # noqa: E402
    CommunityReport,
    Household,
    HouseholdMember,
    ImpactLog,
    Room,
    RoomReading,
    RoutineTask,
    SmogAlertNotification,
    SmogAlertRule,
)
from app.models.auth import User  # noqa: E402

logger = logging.getLogger(__name__)


class DemoAccountSpec(TypedDict):
    """Seed user account attributes."""

    email: str
    password: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool


DEMO_ACCOUNTS: list[DemoAccountSpec] = [
    {
        "email": "user@breatheiq.org",
        "password": "Password123!",
        "full_name": "Priya Sharma (Demo User)",
        "role": "user",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "moderator@breatheiq.org",
        "password": "Password123!",
        "full_name": "Aarav Mehta (Community Moderator)",
        "role": "moderator",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "admin@breatheiq.org",
        "password": "Password123!",
        "full_name": "System Administrator",
        "role": "admin",
        "is_active": True,
        "is_verified": True,
    },
]


async def _seed_demo_accounts(session: AsyncSession) -> dict[str, User]:
    created_users: dict[str, User] = {}
    for acc in DEMO_ACCOUNTS:
        res = await session.execute(select(User).where(User.email == acc["email"]))
        user = res.scalars().first()
        if not user:
            user = User(
                email=acc["email"],
                hashed_password=hash_password(acc["password"]),
                full_name=acc["full_name"],
                role=acc["role"],
                is_active=acc["is_active"],
                is_verified=acc["is_verified"],
            )
            session.add(user)
            await session.flush()
            logger.info("Created demo account: %s (%s)", acc["email"], acc["role"])
        created_users[acc["role"]] = user
    return created_users


async def _seed_demo_household_data(session: AsyncSession, demo_user: User) -> None:
    res = await session.execute(select(Household).where(Household.user_id == demo_user.id))
    household = res.scalars().first()
    if not household:
        household = Household(
            user_id=demo_user.id,
            name="Andheri West Residence",
            city="Mumbai",
            neighborhood="Andheri West",
            latitude=19.0760,
            longitude=72.8777,
        )
        session.add(household)
        await session.flush()
        logger.info("Created demo household: %s", household.name)

    res_members = await session.execute(
        select(HouseholdMember).where(HouseholdMember.user_id == demo_user.id)
    )
    existing_members = {m.name: m for m in res_members.scalars().all()}
    demo_members = [
        ("Priya Sharma (Demo User)", "adult", "none", 25),
        ("Aarav Sharma", "child", "asthma", 80),
        ("Ananya Sharma", "infant", "none", 70),
    ]
    for name, age_cat, sens, score in demo_members:
        if name not in existing_members:
            session.add(
                HouseholdMember(
                    user_id=demo_user.id,
                    household_id=household.id,
                    name=name,
                    age_category=age_cat,
                    sensitivity=sens,
                    vulnerability_score=score,
                )
            )
        elif existing_members[name].household_id != household.id:
            existing_members[name].household_id = household.id

    res_rooms = await session.execute(select(Room).where(Room.user_id == demo_user.id))
    existing_rooms = {r.name: r for r in res_rooms.scalars().all()}
    demo_rooms = [
        ("Living Room", 5.0, 4.0, 2.7, True, 380.0, 34.5),
        ("Master Bedroom", 4.2, 3.6, 2.7, True, 250.0, 22.0),
    ]
    for r_name, length_m, width_m, height_m, has_purifier, cadr, pm25_val in demo_rooms:
        if r_name not in existing_rooms:
            room = Room(
                user_id=demo_user.id,
                household_id=household.id,
                name=r_name,
                length_m=length_m,
                width_m=width_m,
                height_m=height_m,
                has_purifier=has_purifier,
                purifier_cadr=cadr,
            )
            session.add(room)
            await session.flush()
            session.add(
                RoomReading(
                    room_id=room.id,
                    pm25=pm25_val,
                    co2=620.0,
                    temperature_c=24.5,
                    humidity_pct=52.0,
                    source="AirTwin Sensor",
                )
            )
        elif existing_rooms[r_name].household_id != household.id:
            existing_rooms[r_name].household_id = household.id

    today_str = date.today().isoformat()
    res_tasks = await session.execute(
        select(RoutineTask).where(RoutineTask.user_id == demo_user.id, RoutineTask.date_str == today_str)
    )
    existing_tasks = {t.title for t in res_tasks.scalars().all()}
    demo_tasks = [
        ("Seal windows during twilight inversion", "morning", "ventilation", True, "Prevent boundary-layer smog penetration during early morning spike."),
        ("Indoor living room mobility session", "morning", "exercise", False, "Cardio routine indoors under HEPA filtration; avoid outdoor jogging."),
        ("Window Oracle: Midday Aeration Window", "afternoon", "ventilation", False, "Open cross-ventilation windows during peak dispersion score window."),
        ("Activate bedroom HEPA filter before sleep", "evening", "purifier", False, "Ensure clean indoor sleeping air (target PM2.5 < 25 ug/m3)."),
    ]
    for title, slot, category, done, desc in demo_tasks:
        if title not in existing_tasks:
            session.add(
                RoutineTask(
                    user_id=demo_user.id,
                    title=title,
                    time_slot=slot,
                    category=category,
                    description=desc,
                    is_completed=done,
                    date_str=today_str,
                )
            )

    res_rules = await session.execute(select(SmogAlertRule).where(SmogAlertRule.user_id == demo_user.id))
    if not res_rules.scalars().first():
        session.add(
            SmogAlertRule(
                user_id=demo_user.id,
                aqi_threshold=200,
                target_member="All Members",
                quiet_hours_start="22:00",
                quiet_hours_end="07:00",
                channels="in_app,push",
                is_enabled=True,
            )
        )

    res_notifs = await session.execute(
        select(SmogAlertNotification).where(SmogAlertNotification.user_id == demo_user.id)
    )
    if not res_notifs.scalars().first():
        session.add(
            SmogAlertNotification(
                user_id=demo_user.id,
                title="Twilight Smog Surge Warning",
                message="PM2.5 concentration spiked to 245 ug/m3 in Andheri West.",
                aqi_at_trigger=245,
                pollutant_driver="PM2.5",
                reason_why="Boundary layer inversion trapping vehicular and industrial emissions.",
                is_read=False,
            )
        )

    res_impact = await session.execute(select(ImpactLog).where(ImpactLog.user_id == demo_user.id))
    if len(res_impact.scalars().all()) < 7:
        for i in range(7):
            day_date = (date.today() - timedelta(days=i)).isoformat()
            day_res = await session.execute(
                select(ImpactLog).where(ImpactLog.user_id == demo_user.id, ImpactLog.date_str == day_date)
            )
            if not day_res.scalars().first():
                session.add(
                    ImpactLog(
                        user_id=demo_user.id,
                        date_str=day_date,
                        averted_pm25_dose_ug=520.0 + (i * 25.0),
                        averted_co2_kg=2.4 + (i * 0.2),
                        aqi_hours_avoided=180.0 + (i * 10.0),
                        notes="Logged through Window Oracle adherence and HEPA purification.",
                    )
                )


async def _seed_community_reports(session: AsyncSession, owner_user_id: int) -> None:
    res = await session.execute(select(CommunityReport))
    if res.scalars().first():
        return
    reports = [
        CommunityReport(
            user_id=owner_user_id,
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
            user_id=owner_user_id,
            report_type="garbage_burning",
            severity="hazardous",
            location_name="Deonar Peripheral Corridor, Chembur",
            latitude=19.0620,
            longitude=72.9050,
            description="Open solid waste burning behind commercial godowns during twilight inversion.",
            upvote_count=14,
            status="VERIFIED",
        ),
        CommunityReport(
            user_id=owner_user_id,
            report_type="traffic_congestion",
            severity="moderate",
            location_name="Western Express Highway Kalanagar Junction",
            latitude=19.0640,
            longitude=72.8510,
            description="Gridlock with commercial diesel trucks idling under shallow boundary layer.",
            upvote_count=5,
            status="UNVERIFIED",
        ),
    ]
    session.add_all(reports)


async def seed_database() -> None:
    """Idempotently initialize database tables and seed development/demo fixtures."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        created_users = await _seed_demo_accounts(session)
        demo_user = created_users.get("user")
        if demo_user:
            await _seed_demo_household_data(session, demo_user)
        await _seed_community_reports(session, demo_user.id if demo_user else 1)
        await session.commit()
        logger.info("Database seeding complete.")


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_database())
