import sys
from pathlib import Path

# Ensure backend root is in sys.path when executed directly as a script
_BACKEND_DIR = str(Path(__file__).resolve().parent.parent.parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import asyncio
from datetime import datetime, timezone, date, timedelta
from sqlalchemy import select
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal, Base, engine
from app.models.auth import User
from app.models.app_data import (
    Household, HouseholdMember, Room, RoomReading,
    RoutineTask, SmogAlertRule, SmogAlertNotification,
    ImpactLog, CommunityReport
)

DEMO_ACCOUNTS = [
    {
        "email": "user@breatheiq.org",
        "password": "Password123!",
        "full_name": "Priya Sharma (Demo User)",
        "role": "user",
        "is_active": True,
        "is_verified": True
    },
    {
        "email": "moderator@breatheiq.org",
        "password": "Password123!",
        "full_name": "Aarav Mehta (Community Moderator)",
        "role": "moderator",
        "is_active": True,
        "is_verified": True
    },
    {
        "email": "admin@breatheiq.org",
        "password": "Password123!",
        "full_name": "System Administrator",
        "role": "admin",
        "is_active": True,
        "is_verified": True
    }
]

async def seed_database():
    """Idempotently seeds tables, initial demo accounts, and personalized family flow data."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Seed Demo Accounts
        created_users = {}
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
                    is_verified=acc["is_verified"]
                )
                session.add(user)
                await session.flush()
                print(f"[SEED] Created demo account: {acc['email']} ({acc['role']})")
            created_users[acc["role"]] = user

        demo_user = created_users.get("user")
        if demo_user:
            # 2. Seed Household
            res = await session.execute(select(Household).where(Household.user_id == demo_user.id))
            household = res.scalars().first()
            if not household:
                household = Household(
                    user_id=demo_user.id,
                    name="Andheri West Residence",
                    city="Mumbai",
                    neighborhood="Andheri West",
                    latitude=19.0760,
                    longitude=72.8777
                )
                session.add(household)
                await session.flush()
                print(f"[SEED] Created demo household: {household.name}")

            # 3. Seed Household Members
            res = await session.execute(select(HouseholdMember).where(HouseholdMember.user_id == demo_user.id))
            existing_members = {m.name: m for m in res.scalars().all()}
            demo_members_data = [
                {"name": "Priya Sharma (Demo User)", "age_category": "adult", "sensitivity": "none", "vulnerability_score": 25},
                {"name": "Aarav Sharma", "age_category": "child", "sensitivity": "asthma", "vulnerability_score": 80},
                {"name": "Ananya Sharma", "age_category": "infant", "sensitivity": "none", "vulnerability_score": 70}
            ]
            for m_data in demo_members_data:
                if m_data["name"] not in existing_members:
                    member = HouseholdMember(
                        user_id=demo_user.id,
                        household_id=household.id,
                        name=m_data["name"],
                        age_category=m_data["age_category"],
                        sensitivity=m_data["sensitivity"],
                        vulnerability_score=m_data["vulnerability_score"]
                    )
                    session.add(member)
                    print(f"[SEED] Created household member: {m_data['name']}")
                else:
                    # Ensure household_id is linked
                    m = existing_members[m_data["name"]]
                    if m.household_id != household.id:
                        m.household_id = household.id

            # 4. Seed Rooms
            res = await session.execute(select(Room).where(Room.user_id == demo_user.id))
            existing_rooms = {r.name: r for r in res.scalars().all()}
            demo_rooms_data = [
                {"name": "Living Room", "length_m": 5.0, "width_m": 4.0, "height_m": 2.7, "has_purifier": True, "purifier_cadr": 380.0},
                {"name": "Master Bedroom", "length_m": 4.2, "width_m": 3.6, "height_m": 2.7, "has_purifier": True, "purifier_cadr": 250.0}
            ]
            for r_data in demo_rooms_data:
                if r_data["name"] not in existing_rooms:
                    room = Room(
                        user_id=demo_user.id,
                        household_id=household.id,
                        name=r_data["name"],
                        length_m=r_data["length_m"],
                        width_m=r_data["width_m"],
                        height_m=r_data["height_m"],
                        has_purifier=r_data["has_purifier"],
                        purifier_cadr=r_data["purifier_cadr"]
                    )
                    session.add(room)
                    await session.flush()
                    # Add initial reading
                    session.add(RoomReading(
                        room_id=room.id,
                        pm25=34.5 if "Living" in room.name else 22.0,
                        co2=620.0,
                        temperature_c=24.5,
                        humidity_pct=52.0,
                        source="AirTwin Sensor"
                    ))
                    print(f"[SEED] Created room & reading: {r_data['name']}")
                else:
                    r = existing_rooms[r_data["name"]]
                    if r.household_id != household.id:
                        r.household_id = household.id

            # 5. Seed Routine Tasks for Today
            today_str = date.today().isoformat()
            res = await session.execute(select(RoutineTask).where(RoutineTask.user_id == demo_user.id, RoutineTask.date_str == today_str))
            existing_tasks = {t.title: t for t in res.scalars().all()}
            demo_tasks_data = [
                {"title": "Seal windows during twilight inversion", "time_slot": "morning", "category": "ventilation", "is_completed": True, "description": "Prevent boundary-layer smog penetration during early morning spike."},
                {"title": "Indoor living room mobility session", "time_slot": "morning", "category": "exercise", "is_completed": False, "description": "Cardio routine indoors under HEPA filtration; avoid outdoor jogging."},
                {"title": "Window Oracle: Midday Aeration Window", "time_slot": "afternoon", "category": "ventilation", "is_completed": False, "description": "Open cross-ventilation windows between 12:30 and 14:00 while inversion is lifted."},
                {"title": "Activate bedroom HEPA filter before sleep", "time_slot": "evening", "category": "purifier", "is_completed": False, "description": "Ensure clean indoor sleeping air (target PM2.5 < 25 ug/m3)."}
            ]
            for t_data in demo_tasks_data:
                if t_data["title"] not in existing_tasks:
                    task = RoutineTask(
                        user_id=demo_user.id,
                        title=t_data["title"],
                        time_slot=t_data["time_slot"],
                        category=t_data["category"],
                        description=t_data["description"],
                        is_completed=t_data["is_completed"],
                        date_str=today_str
                    )
                    session.add(task)
                    print(f"[SEED] Created routine task: {t_data['title']}")

            # 6. Seed Smog Alert Rule & Notification
            res = await session.execute(select(SmogAlertRule).where(SmogAlertRule.user_id == demo_user.id))
            if not res.scalars().first():
                session.add(SmogAlertRule(
                    user_id=demo_user.id,
                    aqi_threshold=200,
                    target_member="All Members",
                    quiet_hours_start="22:00",
                    quiet_hours_end="07:00",
                    channels="in_app,push",
                    is_enabled=True
                ))
                print("[SEED] Created smog alert rule.")

            res = await session.execute(select(SmogAlertNotification).where(SmogAlertNotification.user_id == demo_user.id))
            if not res.scalars().first():
                session.add(SmogAlertNotification(
                    user_id=demo_user.id,
                    title="Twilight Smog Surge Warning",
                    message="PM2.5 concentration spiked to 245 ug/m3 in Andheri West.",
                    aqi_at_trigger=245,
                    pollutant_driver="PM2.5",
                    reason_why="Boundary layer inversion trapping vehicular and industrial emissions.",
                    is_read=False
                ))
                print("[SEED] Created initial smog notification.")

            # 7. Seed 7-Day Impact Logs
            res = await session.execute(select(ImpactLog).where(ImpactLog.user_id == demo_user.id))
            if len(res.scalars().all()) < 7:
                for i in range(7):
                    day_date = (date.today() - timedelta(days=i)).isoformat()
                    day_res = await session.execute(select(ImpactLog).where(ImpactLog.user_id == demo_user.id, ImpactLog.date_str == day_date))
                    if not day_res.scalars().first():
                        session.add(ImpactLog(
                            user_id=demo_user.id,
                            date_str=day_date,
                            averted_pm25_dose_ug=520.0 + (i * 25.0),
                            averted_co2_kg=2.4 + (i * 0.2),
                            aqi_hours_avoided=180.0 + (i * 10.0),
                            notes="Logged through Window Oracle adherence and HEPA purification."
                        ))
                print("[SEED] Seeded 7-day impact history.")

        # 8. Seed Community Reports
        res = await session.execute(select(CommunityReport))
        if not res.scalars().first():
            demo_reports = [
                CommunityReport(
                    user_id=demo_user.id if demo_user else 1,
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
                    user_id=demo_user.id if demo_user else 1,
                    report_type="garbage_burning",
                    severity="hazardous",
                    location_name="Deonar Peripheral Corridor, Chembur",
                    latitude=19.0620,
                    longitude=72.9050,
                    description="Open solid waste burning behind commercial godowns during twilight inversion.",
                    upvote_count=14,
                    status="VERIFIED"
                ),
                CommunityReport(
                    user_id=demo_user.id if demo_user else 1,
                    report_type="traffic_congestion",
                    severity="moderate",
                    location_name="Western Express Highway Kalanagar Junction",
                    latitude=19.0640,
                    longitude=72.8510,
                    description="Gridlock with heavy commercial diesel trucks idling under shallow boundary layer.",
                    upvote_count=5,
                    status="UNVERIFIED"
                )
            ]
            for cr in demo_reports:
                session.add(cr)
            print("[SEED] Created initial community reports.")

        await session.commit()
        print("[SEED] Database seeding complete and verified.")

if __name__ == "__main__":
    import sys
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_database())
