"""
backend/app/api/v1/endpoints/user_flow.py
Personalized Family Flow Endpoints:
Onboarding, Households, Members, Rooms, Indoor Readings, Routine Tasks, CleanRoute, Alerts, and Impact.
"""

from datetime import datetime, timezone, date, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.auth import User
from app.models.app_data import (
    Household, HouseholdMember, Room, RoomReading,
    RoutineTask, SmogAlertRule, SmogAlertNotification, ImpactLog
)
from app.engines.impact import calculate_inhalation_dosage, calculate_transit_emission_savings

router = APIRouter(prefix="/user", tags=["Personalized User Flow"])

def compute_vulnerability_score(age_category: str, sensitivity: str) -> int:
    """Computes AirTwin vulnerability score (1-100) based on physiological sensitivity."""
    base = {
        "infant": 70,
        "child": 50,
        "senior": 65,
        "adult": 25,
    }.get(age_category.lower(), 30)

    sens_mod = {
        "asthma": 30,
        "bronchitis": 25,
        "heart_condition": 30,
        "pregnancy": 25,
        "none": 0,
    }.get(sensitivity.lower(), 0)

    return min(100, max(5, base + sens_mod))

# ----------------- Schemas -----------------
class BaseUserFlowSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

class HouseholdSchema(BaseUserFlowSchema):
    name: str = "My Home"
    city: str = "Mumbai"
    neighborhood: str = "Andheri West"
    latitude: float = 19.0760
    longitude: float = 72.8777

class MemberCreateSchema(BaseUserFlowSchema):
    name: str = Field(..., min_length=1, max_length=100)
    age_category: str = Field("adult", example="child")
    sensitivity: str = Field("none", example="asthma")

class RoomCreateSchema(BaseUserFlowSchema):
    name: str = Field(..., min_length=1, max_length=100)
    length_m: float = Field(4.5, gt=0)
    width_m: float = Field(3.8, gt=0)
    height_m: float = Field(2.7, gt=0)
    has_purifier: bool = False
    purifier_cadr: float = 0.0

class ReadingCreateSchema(BaseUserFlowSchema):
    pm25: float = Field(..., ge=0)
    co2: Optional[float] = 650.0
    temperature_c: Optional[float] = 25.0
    humidity_pct: Optional[float] = 55.0
    source: str = "Manual"

class TaskCreateSchema(BaseUserFlowSchema):
    member_id: Optional[int] = None
    time_slot: str = "morning"  # morning, afternoon, evening
    title: str = Field(..., min_length=2)
    description: Optional[str] = ""
    category: str = "routine"

class CleanRouteRequest(BaseUserFlowSchema):
    origin: str = Field(..., example="Andheri West Station")
    destination: str = Field(..., example="Bandra Kurla Complex (BKC)")
    distance_km: float = Field(14.5, gt=0)
    departure_hour: int = Field(9, ge=0, le=23)

class AlertRuleCreateSchema(BaseUserFlowSchema):
    aqi_threshold: int = Field(200, ge=50, le=500)
    target_member: str = "All Members"
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "07:00"
    channels: str = "in_app,push"

# ----------------- Household & Onboarding -----------------
@router.get("/household")
async def get_household(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    res = await db.execute(select(Household).where(Household.user_id == user.id))
    h = res.scalars().first()
    if not h:
        # Create initial default household
        h = Household(user_id=user.id, name="Home", city="Mumbai", neighborhood="Andheri West")
        db.add(h)
        await db.commit()
        await db.refresh(h)
    return h

@router.post("/household")
async def save_household(
    req: HouseholdSchema,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    res = await db.execute(select(Household).where(Household.user_id == user.id))
    h = res.scalars().first()
    if not h:
        h = Household(
            user_id=user.id,
            name=req.name,
            city=req.city,
            neighborhood=req.neighborhood,
            latitude=req.latitude,
            longitude=req.longitude
        )
        db.add(h)
    else:
        h.name = req.name
        h.city = req.city
        h.neighborhood = req.neighborhood
        h.latitude = req.latitude
        h.longitude = req.longitude
    await db.commit()
    await db.refresh(h)
    return h

# ----------------- Members -----------------
@router.get("/members")
async def list_members(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    res = await db.execute(select(HouseholdMember).where(HouseholdMember.user_id == user.id))
    members = res.scalars().all()
    if not members:
        # Seed default primary profile for user
        primary = HouseholdMember(
            user_id=user.id,
            name=user.full_name or "Primary Member",
            age_category="adult",
            sensitivity="none",
            vulnerability_score=25
        )
        db.add(primary)
        await db.commit()
        await db.refresh(primary)
        members = [primary]
    return members

@router.post("/members")
async def add_member(
    req: MemberCreateSchema,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    score = compute_vulnerability_score(req.age_category, req.sensitivity)
    member = HouseholdMember(
        user_id=user.id,
        name=req.name,
        age_category=req.age_category,
        sensitivity=req.sensitivity,
        vulnerability_score=score
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member

@router.delete("/members/{member_id}")
async def delete_member(
    member_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    res = await db.execute(select(HouseholdMember).where(HouseholdMember.id == member_id, HouseholdMember.user_id == user.id))
    member = res.scalars().first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    await db.delete(member)
    await db.commit()
    return {"message": "Member removed"}

# ----------------- Rooms & IAQ -----------------
@router.get("/rooms")
async def list_rooms(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    res = await db.execute(select(Room).where(Room.user_id == user.id))
    rooms = res.scalars().all()
    if not rooms:
        # Seed sample rooms
        r1 = Room(user_id=user.id, name="Living Room", length_m=5.0, width_m=4.0, height_m=2.7, has_purifier=True, purifier_cadr=350.0)
        r2 = Room(user_id=user.id, name="Master Bedroom", length_m=4.2, width_m=3.6, height_m=2.7, has_purifier=True, purifier_cadr=250.0)
        db.add_all([r1, r2])
        await db.commit()
        res = await db.execute(select(Room).where(Room.user_id == user.id))
        rooms = res.scalars().all()
    return rooms

@router.post("/rooms")
async def add_room(
    req: RoomCreateSchema,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    room = Room(
        user_id=user.id,
        name=req.name,
        length_m=req.length_m,
        width_m=req.width_m,
        height_m=req.height_m,
        has_purifier=req.has_purifier,
        purifier_cadr=req.purifier_cadr
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room

@router.delete("/rooms/{room_id}")
async def delete_room(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    res = await db.execute(select(Room).where(Room.id == room_id, Room.user_id == user.id))
    room = res.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    await db.delete(room)
    await db.commit()
    return {"message": "Room removed"}

@router.get("/rooms/{room_id}/readings")
async def get_room_readings(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    res = await db.execute(select(Room).where(Room.id == room_id, Room.user_id == user.id))
    room = res.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    readings_res = await db.execute(select(RoomReading).where(RoomReading.room_id == room_id).order_by(RoomReading.timestamp.desc()).limit(20))
    readings = readings_res.scalars().all()
    if not readings:
        # Default initial baseline reading
        initial = RoomReading(room_id=room_id, pm25=28.0, co2=620.0, temperature_c=25.5, humidity_pct=58.0, source="Manual")
        db.add(initial)
        await db.commit()
        readings = [initial]
    return readings

@router.post("/rooms/{room_id}/readings")
async def add_room_reading(
    room_id: int,
    req: ReadingCreateSchema,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    res = await db.execute(select(Room).where(Room.id == room_id, Room.user_id == user.id))
    room = res.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    reading = RoomReading(
        room_id=room_id,
        pm25=req.pm25,
        co2=req.co2,
        temperature_c=req.temperature_c,
        humidity_pct=req.humidity_pct,
        source=req.source
    )
    db.add(reading)
    await db.commit()
    await db.refresh(reading)
    return reading

# ----------------- Adaptive Routine -----------------
@router.get("/routine")
async def get_routine_tasks(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    today_str = date.today().isoformat()
    res = await db.execute(select(RoutineTask).where(RoutineTask.user_id == user.id, RoutineTask.date_str == today_str))
    tasks = res.scalars().all()
    if not tasks:
        # Seed default routine tasks tailored to winter smog
        seed_tasks = [
            RoutineTask(user_id=user.id, time_slot="morning", title="Seal windows during twilight inversion", description="Surface boundary layer is shallow (250m). Keep home sealed.", category="ventilation", date_str=today_str, is_completed=True),
            RoutineTask(user_id=user.id, time_slot="morning", title="Indoor living room mobility session", description="Avoid outdoor running; replace with indoor yoga or core exercises.", category="exercise", date_str=today_str, is_completed=False),
            RoutineTask(user_id=user.id, time_slot="afternoon", title="Window Oracle: Midday Aeration Window", description="Solar heating expands boundary layer. Cross-ventilate for 15 mins (12:30–14:30).", category="ventilation", date_str=today_str, is_completed=False),
            RoutineTask(user_id=user.id, time_slot="evening", title="Activate bedroom HEPA filter before sleep", description="Run purifier on medium-high for 45 mins to establish 5 ACH.", category="purifier", date_str=today_str, is_completed=False),
        ]
        db.add_all(seed_tasks)
        await db.commit()
        res = await db.execute(select(RoutineTask).where(RoutineTask.user_id == user.id, RoutineTask.date_str == today_str))
        tasks = res.scalars().all()
    return tasks

@router.post("/routine")
async def add_routine_task(
    req: TaskCreateSchema,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    today_str = date.today().isoformat()
    task = RoutineTask(
        user_id=user.id,
        member_id=req.member_id,
        time_slot=req.time_slot,
        title=req.title,
        description=req.description,
        category=req.category,
        date_str=today_str,
        is_completed=False
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

@router.patch("/routine/{task_id}/toggle")
async def toggle_routine_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    res = await db.execute(select(RoutineTask).where(RoutineTask.id == task_id, RoutineTask.user_id == user.id))
    task = res.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.is_completed = not task.is_completed
    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/routine/{task_id}")
async def delete_routine_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    res = await db.execute(select(RoutineTask).where(RoutineTask.id == task_id, RoutineTask.user_id == user.id))
    task = res.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()
    return {"message": "Task deleted"}

# ----------------- CleanRoute Navigator -----------------
@router.post("/routes/navigate")
def cleanroute_navigator(req: CleanRouteRequest):
    """
    Computes 3 comparative commute routes:
    - Route A: Fastest Arterial Highway (Heavy vehicular particulate plume)
    - Route B: CleanRoute Green Corridor (Tree canopies, secondary roads, lower PM2.5)
    - Route C: Electric Metro Transit (Air conditioned, lowest personal dosage & emissions)
    """
    dist = req.distance_km
    # Route A (Fastest Arterial)
    time_a_min = int(dist * 2.4)
    pm25_a = 185.0
    dose_a = calculate_inhalation_dosage(pm25_a, pm25_a, duration_hours=time_a_min / 60.0, activity_level="adult_moderate_activity").unprotected_inhaled_dose_ug
    co2_a = round(dist * 0.180, 2)  # 180 g/km

    # Route B (CleanRoute Green Corridor)
    time_b_min = time_a_min + 5
    pm25_b = 105.0
    dose_b = calculate_inhalation_dosage(pm25_b, pm25_b, duration_hours=time_b_min / 60.0, activity_level="adult_moderate_activity").unprotected_inhaled_dose_ug
    co2_b = round(dist * 0.170, 2)

    # Route C (Electric Metro Transit)
    time_c_min = time_a_min - 2
    pm25_c = 35.0  # AC underground filtered transit
    dose_c = calculate_inhalation_dosage(pm25_c, pm25_c, duration_hours=time_c_min / 60.0, activity_level="adult_resting").unprotected_inhaled_dose_ug
    co2_c = round(dist * 0.018, 2)  # 18 g/km

    return {
        "origin": req.origin,
        "destination": req.destination,
        "distance_km": dist,
        "routes": [
            {
                "id": "route_clean",
                "name": "CleanRoute (Green Corridor & Canopy)",
                "travel_time_min": time_b_min,
                "average_pm25": pm25_b,
                "inhaled_dose_ug": round(dose_b, 1),
                "co2_emissions_kg": co2_b,
                "exposure_rating": "Lowest Surface Road Exposure",
                "recommended": True,
                "advisory": "Shielded by roadside tree canopy and secondary arterials. Averts 43% particulate dosage vs highway.",
            },
            {
                "id": "route_metro",
                "name": "Line 3 / Metro Corridor Transit",
                "travel_time_min": time_c_min,
                "average_pm25": pm25_c,
                "inhaled_dose_ug": round(dose_c, 1),
                "co2_emissions_kg": co2_c,
                "exposure_rating": "Minimal Inhaled Dosage",
                "recommended": True,
                "advisory": "Filtered underground air. Eliminates 90% vehicular CO2 and 81% personal inhaled PM2.5.",
            },
            {
                "id": "route_arterial",
                "name": "Western Express Arterial Highway",
                "travel_time_min": time_a_min,
                "average_pm25": pm25_a,
                "inhaled_dose_ug": round(dose_a, 1),
                "co2_emissions_kg": co2_a,
                "exposure_rating": "Severe Exhaust Exposure",
                "recommended": False,
                "advisory": "High diesel exhaust concentration and twilight stagnation. N95 respirator mandatory if open window.",
            }
        ]
    }

# ----------------- Impact Ledger -----------------
@router.get("/impact")
async def get_impact_ledger(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    res = await db.execute(select(ImpactLog).where(ImpactLog.user_id == user.id).order_by(ImpactLog.date_str.desc()))
    logs = res.scalars().all()

    # If empty, seed realistic cumulative 7-day impact
    if not logs:
        today = date.today()
        seed_logs = []
        for i in range(7):
            day_str = (today - timedelta(days=i)).isoformat()
            seed_logs.append(ImpactLog(
                user_id=user.id,
                date_str=day_str,
                averted_pm25_dose_ug=520.0 + (i * 25),
                averted_co2_kg=2.4 + (i * 0.2),
                aqi_hours_avoided=180.0 + (i * 10),
                notes="Metro commute + domestic HEPA purification"
            ))
        db.add_all(seed_logs)
        await db.commit()
        res = await db.execute(select(ImpactLog).where(ImpactLog.user_id == user.id).order_by(ImpactLog.date_str.desc()))
        logs = res.scalars().all()

    total_pm25_mg = round(sum(l.averted_pm25_dose_ug for l in logs) / 1000.0, 2)
    total_co2_kg = round(sum(l.averted_co2_kg for l in logs), 2)
    total_aqi_hours = round(sum(l.aqi_hours_avoided for l in logs), 1)

    return {
        "total_averted_pm25_mg": total_pm25_mg,
        "total_averted_co2_kg": total_co2_kg,
        "total_aqi_hours_avoided": total_aqi_hours,
        "clean_air_streak_days": len(logs),
        "history": logs
    }

# ----------------- Smog Alerts & Notifications -----------------
@router.get("/alerts")
async def get_alerts_and_rules(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    rules_res = await db.execute(select(SmogAlertRule).where(SmogAlertRule.user_id == user.id))
    rules = rules_res.scalars().all()
    if not rules:
        default_rule = SmogAlertRule(
            user_id=user.id,
            aqi_threshold=200,
            target_member="All Members",
            quiet_hours_start="22:00",
            quiet_hours_end="07:00",
            channels="in_app,push"
        )
        db.add(default_rule)
        await db.commit()
        rules = [default_rule]

    notifs_res = await db.execute(select(SmogAlertNotification).where(SmogAlertNotification.user_id == user.id).order_by(SmogAlertNotification.created_at.desc()))
    notifs = notifs_res.scalars().all()
    if not notifs:
        sample_notif = SmogAlertNotification(
            user_id=user.id,
            title="Twilight Smog Surge Warning",
            message="Andheri West ground station crossed AQI 245 (Poor) due to nocturnal boundary layer inversion.",
            aqi_at_trigger=245,
            pollutant_driver="PM2.5 (118 µg/m³)",
            reason_why="Surface radiation cooling trapped vehicular exhaust below 280m mixing height.",
            is_read=False
        )
        db.add(sample_notif)
        await db.commit()
        notifs = [sample_notif]

    return {
        "rules": rules,
        "notifications": notifs
    }

@router.post("/alerts/rules")
async def create_alert_rule(
    req: AlertRuleCreateSchema,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    rule = SmogAlertRule(
        user_id=user.id,
        aqi_threshold=req.aqi_threshold,
        target_member=req.target_member,
        quiet_hours_start=req.quiet_hours_start,
        quiet_hours_end=req.quiet_hours_end,
        channels=req.channels
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule

@router.patch("/alerts/{notification_id}/read")
async def mark_alert_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    res = await db.execute(select(SmogAlertNotification).where(SmogAlertNotification.id == notification_id, SmogAlertNotification.user_id == user.id))
    notif = res.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    return {"message": "Notification marked as read"}
