"""Pydantic schemas for personalized household, routine, route, alert, and impact flows."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.constants import DEFAULT_CITY_LAT, DEFAULT_CITY_LON, DEFAULT_CITY_NAME
from app.schemas.engines_schemas import StrictInputSchema


class HouseholdSchema(StrictInputSchema):
    """Household profile & urban corridor assignment."""

    name: str = Field(default="My Home", min_length=1, max_length=100)
    city: str = Field(default=DEFAULT_CITY_NAME, min_length=1, max_length=100)
    neighborhood: str = Field(default="Andheri West", min_length=1, max_length=150)
    latitude: float = Field(default=DEFAULT_CITY_LAT, ge=-90.0, le=90.0)
    longitude: float = Field(default=DEFAULT_CITY_LON, ge=-180.0, le=180.0)


class MemberCreateSchema(StrictInputSchema):
    """Family member AirTwin sensitivity input."""

    name: str = Field(..., min_length=1, max_length=100)
    age_category: str = Field(
        "adult", min_length=2, max_length=32, json_schema_extra={"examples": ["child"]}
    )
    sensitivity: str = Field(
        "none", min_length=2, max_length=50, json_schema_extra={"examples": ["asthma"]}
    )


class RoomCreateSchema(StrictInputSchema):
    """Indoor room dimensions and filtration input."""

    name: str = Field(..., min_length=1, max_length=100)
    length_m: float = Field(4.5, gt=0, le=100)
    width_m: float = Field(3.8, gt=0, le=100)
    height_m: float = Field(2.7, gt=0, le=20)
    has_purifier: bool = False
    purifier_cadr: float = Field(default=0.0, ge=0, le=5000)


class ReadingCreateSchema(StrictInputSchema):
    """Manual or sensor indoor reading submission."""

    pm25: float = Field(..., ge=0, le=2000)
    co2: float | None = Field(default=650.0, ge=250, le=10000)
    temperature_c: float | None = Field(default=25.0, ge=-20, le=60)
    humidity_pct: float | None = Field(default=55.0, ge=0, le=100)
    source: str = Field(default="Manual", min_length=1, max_length=50)


class TaskCreateSchema(StrictInputSchema):
    """Daily adaptive smog routine task creation payload."""

    member_id: int | None = None
    time_slot: str = Field(default="morning", min_length=2, max_length=32)
    title: str = Field(..., min_length=2, max_length=200)
    description: str | None = Field(default="", max_length=1000)
    category: str = Field(default="routine", min_length=2, max_length=50)


class CleanRouteRequest(StrictInputSchema):
    """Multimodal commute comparison request."""

    origin: str = Field(
        ..., min_length=1, max_length=200, json_schema_extra={"examples": ["Andheri West Station"]}
    )
    destination: str = Field(
        ...,
        min_length=1,
        max_length=200,
        json_schema_extra={"examples": ["Bandra Kurla Complex (BKC)"]},
    )
    city: str | None = Field(default=DEFAULT_CITY_NAME, min_length=1, max_length=64)
    distance_km: float = Field(14.5, gt=0, le=200)
    departure_hour: int = Field(9, ge=0, le=23)


class AlertRuleCreateSchema(StrictInputSchema):
    """Smog threshold alert rule creation payload."""

    aqi_threshold: int = Field(200, ge=50, le=500)
    target_member: str = Field(default="All Members", min_length=1, max_length=100)
    quiet_hours_start: str = Field(default="22:00", min_length=4, max_length=10)
    quiet_hours_end: str = Field(default="07:00", min_length=4, max_length=10)
    channels: str = Field(default="in_app,push", min_length=2, max_length=100)


class HouseholdResponse(BaseModel):
    """Serialized household corridor profile."""

    id: int
    user_id: int
    name: str
    city: str
    neighborhood: str
    latitude: float
    longitude: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MemberResponse(BaseModel):
    """Serialized household member AirTwin profile."""

    id: int
    user_id: int
    household_id: int | None = None
    name: str
    age_category: str
    sensitivity: str
    vulnerability_score: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoomResponse(BaseModel):
    """Serialized indoor room configuration."""

    id: int
    user_id: int
    household_id: int | None = None
    name: str
    length_m: float
    width_m: float
    height_m: float
    has_purifier: bool
    purifier_cadr: float | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoomReadingResponse(BaseModel):
    """Serialized indoor particulate reading."""

    id: int
    room_id: int
    pm25: float
    co2: float | None = None
    temperature_c: float | None = None
    humidity_pct: float | None = None
    source: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class RoutineTaskResponse(BaseModel):
    """Serialized daily adaptive routine item."""

    id: int
    user_id: int
    member_id: int | None = None
    time_slot: str
    title: str
    description: str | None = None
    category: str
    is_completed: bool
    date_str: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertRuleResponse(BaseModel):
    """Serialized smog threshold rule."""

    id: int
    user_id: int
    aqi_threshold: int
    target_member: str
    quiet_hours_start: str
    quiet_hours_end: str
    channels: str
    is_enabled: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    """Serialized smog alert notification."""

    id: int
    user_id: int
    title: str
    message: str
    aqi_at_trigger: int
    pollutant_driver: str
    reason_why: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ImpactLogResponse(BaseModel):
    """Serialized daily impact log record."""

    id: int
    user_id: int
    date_str: str
    averted_pm25_dose_ug: float
    averted_co2_kg: float
    aqi_hours_avoided: float
    notes: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
