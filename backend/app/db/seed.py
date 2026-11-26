"""Database seed runner for development and demo environments."""

import asyncio
import logging
import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

_BACKEND_DIR = str(Path(__file__).resolve().parent.parent.parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from app.core.constants import DEFAULT_CITY_LAT, DEFAULT_CITY_LON, DEFAULT_CITY_NAME  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.db.seed_data import (  # noqa: E402
    DEMO_ACCOUNTS,
    DEMO_COMMUNITY_REPORTS,
    DEMO_MEMBERS,
    DEMO_ROOMS,
    DemoAccountSpec,
)
from app.db.seed_household import seed_routine_and_alerts  # noqa: E402
from app.db.session import AsyncSessionLocal, Base, engine  # noqa: E402
from app.models.app_data import (  # noqa: E402
    CommunityReport,
    Household,
    HouseholdMember,
    Room,
    RoomReading,
)
from app.models.auth import User  # noqa: E402

__all__ = ["DEMO_ACCOUNTS", "DemoAccountSpec", "seed_database"]
logger = logging.getLogger(__name__)


async def _seed_demo_accounts(session: AsyncSession) -> dict[str, User]:
    """Ensure demo user, moderator, and admin accounts exist."""
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


async def _ensure_household(session: AsyncSession, demo_user: User) -> Household:
    """Create the default demo household when absent."""
    res = await session.execute(select(Household).where(Household.user_id == demo_user.id))
    household = res.scalars().first()
    if household:
        return household
    household = Household(
        user_id=demo_user.id,
        name="Andheri West Residence",
        city=DEFAULT_CITY_NAME,
        neighborhood="Andheri West",
        latitude=DEFAULT_CITY_LAT,
        longitude=DEFAULT_CITY_LON,
    )
    session.add(household)
    await session.flush()
    return household


async def _seed_members(session: AsyncSession, user_id: int, household_id: int) -> None:
    """Seed AirTwin household member profiles idempotently."""
    res = await session.execute(select(HouseholdMember).where(HouseholdMember.user_id == user_id))
    existing = {m.name: m for m in res.scalars().all()}
    for name, age_cat, sens, score in DEMO_MEMBERS:
        if name not in existing:
            session.add(
                HouseholdMember(
                    user_id=user_id,
                    household_id=household_id,
                    name=name,
                    age_category=age_cat,
                    sensitivity=sens,
                    vulnerability_score=score,
                )
            )
        elif existing[name].household_id != household_id:
            existing[name].household_id = household_id


async def _seed_rooms(session: AsyncSession, user_id: int, household_id: int) -> None:
    """Seed monitored rooms and initial AirTwin readings idempotently."""
    res = await session.execute(select(Room).where(Room.user_id == user_id))
    existing = {r.name: r for r in res.scalars().all()}
    for r_name, length_m, width_m, height_m, has_purifier, cadr, pm25_val in DEMO_ROOMS:
        if r_name not in existing:
            room = Room(
                user_id=user_id,
                household_id=household_id,
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
        elif existing[r_name].household_id != household_id:
            existing[r_name].household_id = household_id


async def _seed_community_reports(session: AsyncSession, owner_user_id: int) -> None:
    """Seed initial community smog incident reports when empty."""
    if (await session.execute(select(CommunityReport))).scalars().first():
        return
    reports = [CommunityReport(user_id=owner_user_id, **spec) for spec in DEMO_COMMUNITY_REPORTS]
    session.add_all(reports)


async def seed_database() -> None:
    """Idempotently initialize database tables and seed development/demo fixtures."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        created_users = await _seed_demo_accounts(session)
        demo_user = created_users.get("user")
        if demo_user:
            household = await _ensure_household(session, demo_user)
            await _seed_members(session, demo_user.id, household.id)
            await _seed_rooms(session, demo_user.id, household.id)
            await seed_routine_and_alerts(session, demo_user.id)
        await _seed_community_reports(session, demo_user.id if demo_user else 1)
        await session.commit()
        logger.info("Database seeding complete.")


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_database())
