"""Response schemas for routines, smog alert rules, notifications, and impact logs."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


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
