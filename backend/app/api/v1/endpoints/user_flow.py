"""Personalized Family Flow Endpoints."""

from datetime import date, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.engines.routing import evaluate_clean_routes
from app.models.app_data import (
    Household,
    HouseholdMember,
    ImpactLog,
    Room,
    RoomReading,
    RoutineTask,
    SmogAlertNotification,
    SmogAlertRule,
)
from app.models.auth import User
from app.schemas.app_schemas import (
    AlertRuleCreateSchema,
    AlertRuleResponse,
    CleanRouteRequest,
    HouseholdResponse,
    HouseholdSchema,
    ImpactLogResponse,
    MemberCreateSchema,
    MemberResponse,
    NotificationResponse,
    ReadingCreateSchema,
    RoomCreateSchema,
    RoomReadingResponse,
    RoomResponse,
    RoutineTaskResponse,
    TaskCreateSchema,
)
from app.services.air_data import PRECONFIGURED_CITIES, air_data_service

router = APIRouter(prefix="/user", tags=["Personalized User Flow"])

VULNERABILITY_AGE_SCORES: dict[str, int] = {
    "infant": 70,
    "child": 50,
    "senior": 65,
    "adult": 25,
}
VULNERABILITY_SENSITIVITY_SCORES: dict[str, int] = {
    "asthma": 30,
    "bronchitis": 25,
    "heart_condition": 30,
    "pregnancy": 25,
    "none": 0,
}


def compute_vulnerability_score(age_category: str, sensitivity: str) -> int:
    """Compute AirTwin vulnerability score (5-100) from age tier and respiratory sensitivity."""
    base = VULNERABILITY_AGE_SCORES.get(age_category.lower(), 30)
    sens_mod = VULNERABILITY_SENSITIVITY_SCORES.get(sensitivity.lower(), 0)
    return min(100, max(5, base + sens_mod))


# ----------------- Household & Onboarding -----------------
@router.get("/household", response_model=HouseholdResponse)
async def get_household(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> HouseholdResponse:
    """Retrieve or initialize the user's primary household corridor."""
    res = await db.execute(select(Household).where(Household.user_id == user.id))
    household = res.scalars().first()
    if not household:
        household = Household(
            user_id=user.id, name="Home", city="Mumbai", neighborhood="Andheri West"
        )
        db.add(household)
        await db.commit()
        await db.refresh(household)
    return HouseholdResponse.model_validate(household)


@router.post("/household", response_model=HouseholdResponse)
async def save_household(
    req: HouseholdSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> HouseholdResponse:
    """Create or update the user's household location corridor."""
    res = await db.execute(select(Household).where(Household.user_id == user.id))
    household = res.scalars().first()
    if not household:
        household = Household(
            user_id=user.id,
            name=req.name,
            city=req.city,
            neighborhood=req.neighborhood,
            latitude=req.latitude,
            longitude=req.longitude,
        )
        db.add(household)
    else:
        household.name = req.name
        household.city = req.city
        household.neighborhood = req.neighborhood
        household.latitude = req.latitude
        household.longitude = req.longitude
    await db.commit()
    await db.refresh(household)
    return HouseholdResponse.model_validate(household)


# ----------------- Members -----------------
@router.get("/members", response_model=list[MemberResponse])
async def list_members(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[MemberResponse]:
    """List household member profiles belonging to the caller."""
    res = await db.execute(select(HouseholdMember).where(HouseholdMember.user_id == user.id))
    members = list(res.scalars().all())
    if not members:
        primary = HouseholdMember(
            user_id=user.id,
            name=user.full_name or "Primary Member",
            age_category="adult",
            sensitivity="none",
            vulnerability_score=25,
        )
        db.add(primary)
        await db.commit()
        await db.refresh(primary)
        members = [primary]
    return [MemberResponse.model_validate(m) for m in members]


@router.post("/members", response_model=MemberResponse)
async def add_member(
    req: MemberCreateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> MemberResponse:
    """Create a family member AirTwin profile."""
    score = compute_vulnerability_score(req.age_category, req.sensitivity)
    member = HouseholdMember(
        user_id=user.id,
        name=req.name,
        age_category=req.age_category,
        sensitivity=req.sensitivity,
        vulnerability_score=score,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return MemberResponse.model_validate(member)


@router.delete("/members/{member_id}")
async def delete_member(
    member_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    """Delete a household member owned by the caller."""
    res = await db.execute(
        select(HouseholdMember).where(
            HouseholdMember.id == member_id, HouseholdMember.user_id == user.id
        )
    )
    member = res.scalars().first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    await db.delete(member)
    await db.commit()
    return {"message": "Member removed"}


# ----------------- Rooms & IAQ -----------------
@router.get("/rooms", response_model=list[RoomResponse])
async def list_rooms(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[RoomResponse]:
    """List rooms configured for the caller's household."""
    res = await db.execute(select(Room).where(Room.user_id == user.id))
    rooms = list(res.scalars().all())
    if not rooms:
        r1 = Room(
            user_id=user.id,
            name="Living Room",
            length_m=5.0,
            width_m=4.0,
            height_m=2.7,
            has_purifier=True,
            purifier_cadr=350.0,
        )
        r2 = Room(
            user_id=user.id,
            name="Master Bedroom",
            length_m=4.2,
            width_m=3.6,
            height_m=2.7,
            has_purifier=True,
            purifier_cadr=250.0,
        )
        db.add_all([r1, r2])
        await db.commit()
        res = await db.execute(select(Room).where(Room.user_id == user.id))
        rooms = list(res.scalars().all())
    return [RoomResponse.model_validate(r) for r in rooms]


@router.post("/rooms", response_model=RoomResponse)
async def add_room(
    req: RoomCreateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> RoomResponse:
    """Create a room profile for purifier sizing and indoor readings."""
    room = Room(
        user_id=user.id,
        name=req.name,
        length_m=req.length_m,
        width_m=req.width_m,
        height_m=req.height_m,
        has_purifier=req.has_purifier,
        purifier_cadr=req.purifier_cadr,
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return RoomResponse.model_validate(room)


@router.delete("/rooms/{room_id}")
async def delete_room(
    room_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    """Delete an owned room profile."""
    res = await db.execute(select(Room).where(Room.id == room_id, Room.user_id == user.id))
    room = res.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    await db.delete(room)
    await db.commit()
    return {"message": "Room removed"}


@router.get("/rooms/{room_id}/readings", response_model=list[RoomReadingResponse])
async def get_room_readings(
    room_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[RoomReadingResponse]:
    """Retrieve indoor sensor/manual readings for an owned room."""
    res = await db.execute(select(Room).where(Room.id == room_id, Room.user_id == user.id))
    if not res.scalars().first():
        raise HTTPException(status_code=404, detail="Room not found")

    readings_res = await db.execute(
        select(RoomReading)
        .where(RoomReading.room_id == room_id)
        .order_by(RoomReading.timestamp.desc())
        .limit(20)
    )
    readings = list(readings_res.scalars().all())
    if not readings:
        initial = RoomReading(
            room_id=room_id,
            pm25=28.0,
            co2=620.0,
            temperature_c=25.5,
            humidity_pct=58.0,
            source="Manual",
        )
        db.add(initial)
        await db.commit()
        await db.refresh(initial)
        readings = [initial]
    return [RoomReadingResponse.model_validate(r) for r in readings]


@router.post("/rooms/{room_id}/readings", response_model=RoomReadingResponse)
async def add_room_reading(
    room_id: int,
    req: ReadingCreateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> RoomReadingResponse:
    """Record a new indoor reading for an owned room."""
    res = await db.execute(select(Room).where(Room.id == room_id, Room.user_id == user.id))
    if not res.scalars().first():
        raise HTTPException(status_code=404, detail="Room not found")

    reading = RoomReading(
        room_id=room_id,
        pm25=req.pm25,
        co2=req.co2,
        temperature_c=req.temperature_c,
        humidity_pct=req.humidity_pct,
        source=req.source,
    )
    db.add(reading)
    await db.commit()
    await db.refresh(reading)
    return RoomReadingResponse.model_validate(reading)


# ----------------- Adaptive Routine -----------------
@router.get("/routine", response_model=list[RoutineTaskResponse])
async def get_routine_tasks(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[RoutineTaskResponse]:
    """List or provision today's adaptive smog routine tasks."""
    today_str = date.today().isoformat()
    res = await db.execute(
        select(RoutineTask).where(RoutineTask.user_id == user.id, RoutineTask.date_str == today_str)
    )
    tasks = list(res.scalars().all())
    if not tasks:
        seed_tasks = [
            RoutineTask(
                user_id=user.id,
                time_slot="morning",
                title="Seal windows during twilight inversion",
                description="Surface boundary layer is shallow (250m). Keep home sealed.",
                category="ventilation",
                date_str=today_str,
                is_completed=True,
            ),
            RoutineTask(
                user_id=user.id,
                time_slot="morning",
                title="Indoor living room mobility session",
                description="Avoid outdoor running; replace with indoor mobility or core work.",
                category="exercise",
                date_str=today_str,
                is_completed=False,
            ),
            RoutineTask(
                user_id=user.id,
                time_slot="afternoon",
                title="Window Oracle: Midday Aeration Window",
                description="Solar heating expands boundary layer. Cross-ventilate briefly when score is favorable.",
                category="ventilation",
                date_str=today_str,
                is_completed=False,
            ),
            RoutineTask(
                user_id=user.id,
                time_slot="evening",
                title="Activate bedroom HEPA filter before sleep",
                description="Run purifier on medium-high for 45 mins to establish 5 ACH.",
                category="purifier",
                date_str=today_str,
                is_completed=False,
            ),
        ]
        db.add_all(seed_tasks)
        await db.commit()
        res = await db.execute(
            select(RoutineTask).where(
                RoutineTask.user_id == user.id, RoutineTask.date_str == today_str
            )
        )
        tasks = list(res.scalars().all())
    return [RoutineTaskResponse.model_validate(t) for t in tasks]


@router.post("/routine", response_model=RoutineTaskResponse)
async def add_routine_task(
    req: TaskCreateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> RoutineTaskResponse:
    """Create a custom adaptive routine task for today."""
    today_str = date.today().isoformat()
    task = RoutineTask(
        user_id=user.id,
        member_id=req.member_id,
        time_slot=req.time_slot,
        title=req.title,
        description=req.description,
        category=req.category,
        date_str=today_str,
        is_completed=False,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return RoutineTaskResponse.model_validate(task)


@router.patch("/routine/{task_id}/toggle", response_model=RoutineTaskResponse)
async def toggle_routine_task(
    task_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> RoutineTaskResponse:
    """Toggle completion status on an owned routine task."""
    res = await db.execute(
        select(RoutineTask).where(RoutineTask.id == task_id, RoutineTask.user_id == user.id)
    )
    task = res.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.is_completed = not task.is_completed
    await db.commit()
    await db.refresh(task)
    return RoutineTaskResponse.model_validate(task)


@router.delete("/routine/{task_id}")
async def delete_routine_task(
    task_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    """Delete an owned routine task."""
    res = await db.execute(
        select(RoutineTask).where(RoutineTask.id == task_id, RoutineTask.user_id == user.id)
    )
    task = res.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()
    return {"message": "Task deleted"}


# ----------------- CleanRoute Navigator -----------------
@router.post("/routes/navigate")
async def cleanroute_navigator(req: CleanRouteRequest) -> dict[str, Any]:
    """Compute 3 comparative commute corridors grounded in city telemetry and sourced emission factors."""
    city_key = (req.city or "mumbai").strip().lower()
    city_meta = PRECONFIGURED_CITIES.get(city_key, PRECONFIGURED_CITIES["mumbai"])
    telemetry = await air_data_service.get_current_air_quality(
        city_meta["latitude"], city_meta["longitude"], city_meta["city"]
    )
    return evaluate_clean_routes(
        origin=req.origin,
        destination=req.destination,
        city=telemetry.city,
        source=telemetry.source,
        distance_km=req.distance_km,
        departure_hour=req.departure_hour,
        ambient_pm25=telemetry.pm25,
    )


# ----------------- Impact Ledger -----------------
@router.get("/impact")
async def get_impact_ledger(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    """Return user's personal exposure and CO2 reduction ledger."""
    res = await db.execute(
        select(ImpactLog).where(ImpactLog.user_id == user.id).order_by(ImpactLog.date_str.desc())
    )
    logs = list(res.scalars().all())

    if not logs:
        today = date.today()
        seed_logs = [
            ImpactLog(
                user_id=user.id,
                date_str=(today - timedelta(days=i)).isoformat(),
                averted_pm25_dose_ug=520.0 + (i * 25),
                averted_co2_kg=2.4 + (i * 0.2),
                aqi_hours_avoided=180.0 + (i * 10),
                notes="Metro commute + domestic HEPA purification",
            )
            for i in range(7)
        ]
        db.add_all(seed_logs)
        await db.commit()
        res = await db.execute(
            select(ImpactLog)
            .where(ImpactLog.user_id == user.id)
            .order_by(ImpactLog.date_str.desc())
        )
        logs = list(res.scalars().all())

    total_pm25_mg = round(sum(item.averted_pm25_dose_ug for item in logs) / 1000.0, 2)
    total_co2_kg = round(sum(item.averted_co2_kg for item in logs), 2)
    total_aqi_hours = round(sum(item.aqi_hours_avoided for item in logs), 1)

    return {
        "total_averted_pm25_mg": total_pm25_mg,
        "total_averted_co2_kg": total_co2_kg,
        "total_aqi_hours_avoided": total_aqi_hours,
        "clean_air_streak_days": len(logs),
        "history": [ImpactLogResponse.model_validate(item) for item in logs],
    }


# ----------------- Smog Alerts & Notifications -----------------
@router.get("/alerts")
async def get_alerts_and_rules(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    """Fetch user's smog alert threshold rules and alert notification feed."""
    rules_res = await db.execute(select(SmogAlertRule).where(SmogAlertRule.user_id == user.id))
    rules = list(rules_res.scalars().all())
    if not rules:
        default_rule = SmogAlertRule(
            user_id=user.id,
            aqi_threshold=200,
            target_member="All Members",
            quiet_hours_start="22:00",
            quiet_hours_end="07:00",
            channels="in_app,push",
        )
        db.add(default_rule)
        await db.commit()
        await db.refresh(default_rule)
        rules = [default_rule]

    notifs_res = await db.execute(
        select(SmogAlertNotification)
        .where(SmogAlertNotification.user_id == user.id)
        .order_by(SmogAlertNotification.created_at.desc())
    )
    notifs = list(notifs_res.scalars().all())
    if not notifs:
        sample_notif = SmogAlertNotification(
            user_id=user.id,
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
        notifs = [sample_notif]

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
    rule = SmogAlertRule(
        user_id=user.id,
        aqi_threshold=req.aqi_threshold,
        target_member=req.target_member,
        quiet_hours_start=req.quiet_hours_start,
        quiet_hours_end=req.quiet_hours_end,
        channels=req.channels,
    )
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
    res = await db.execute(
        select(SmogAlertRule).where(SmogAlertRule.id == rule_id, SmogAlertRule.user_id == user.id)
    )
    rule = res.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
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
    res = await db.execute(
        select(SmogAlertNotification).where(
            SmogAlertNotification.id == notification_id,
            SmogAlertNotification.user_id == user.id,
        )
    )
    notif = res.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    return {"message": "Notification marked as read"}
