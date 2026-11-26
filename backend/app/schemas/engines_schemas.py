"""Pydantic request and response schemas for engines, copilot, community, and admin."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.core.constants import DEFAULT_CITY_LAT, DEFAULT_CITY_LON, DEFAULT_CITY_NAME


class StrictInputSchema(BaseModel):
    """Reject unknown request payload fields to harden endpoints against mass assignment."""

    model_config = ConfigDict(extra="forbid")


class NAQIRequest(StrictInputSchema):
    """Pollutant concentrations keyed by standard chemical code."""

    readings: dict[str, float] = Field(
        ...,
        json_schema_extra={
            "examples": [
                {"pm25": 118.0, "pm10": 165.0, "no2": 52.0, "so2": 18.0, "co": 1.4, "o3": 38.0}
            ]
        },
    )


class WindowOracleRequest(StrictInputSchema):
    """Coordinates or pre-fetched hourly series for ventilation scoring."""

    lat: float | None = Field(default=DEFAULT_CITY_LAT, ge=-90.0, le=90.0)
    lon: float | None = Field(default=DEFAULT_CITY_LON, ge=-180.0, le=180.0)
    hourly_forecast: list[dict[str, Any]] | None = None


class PurifierSizeRequest(StrictInputSchema):
    """Room dimensions and initial particulate state for CADR calculation."""

    length_m: float = Field(..., gt=0, le=100, json_schema_extra={"examples": [4.5]})
    width_m: float = Field(..., gt=0, le=100, json_schema_extra={"examples": [3.8]})
    height_m: float = Field(2.7, gt=0, le=20, json_schema_extra={"examples": [2.7]})
    target_ach: float = Field(5.0, gt=0, le=20, json_schema_extra={"examples": [5.0]})
    initial_pm25: float = Field(120.0, ge=0, le=2000, json_schema_extra={"examples": [120.0]})
    outdoor_pm25: float = Field(180.0, ge=0, le=2000, json_schema_extra={"examples": [180.0]})


class ImpactRequest(StrictInputSchema):
    """Inputs for daily averted dosage and commute carbon savings."""

    outdoor_pm25: float = Field(160.0, ge=0, le=2000, json_schema_extra={"examples": [160.0]})
    indoor_purified_pm25: float = Field(25.0, ge=0, le=2000, json_schema_extra={"examples": [25.0]})
    indoor_hours: float = Field(12.0, ge=0, le=24, json_schema_extra={"examples": [12.0]})
    transit_distance_km: float | None = Field(
        15.0, ge=0, le=500, json_schema_extra={"examples": [15.0]}
    )
    transit_mode: str = Field(
        "electric_metro",
        min_length=2,
        max_length=40,
        json_schema_extra={"examples": ["electric_metro"]},
    )


class CopilotChatRequest(StrictInputSchema):
    """Grounded AI atmospheric assistant query payload."""

    message: str = Field(..., min_length=1, max_length=1000)
    city: str | None = Field(default=DEFAULT_CITY_NAME, min_length=1, max_length=64)
    lat: float | None = Field(default=DEFAULT_CITY_LAT, ge=-90.0, le=90.0)
    lon: float | None = Field(default=DEFAULT_CITY_LON, ge=-180.0, le=180.0)
    user_profile: dict[str, Any] | None = None


class CopilotChatResponse(BaseModel):
    """Structured safety-validated Copilot turn response."""

    reply: str
    intent: str
    source_badge: str
    evidence_context: dict[str, Any]
    why_this_advice: str
    limitations: str
    validator_flags: list[str]
    suggested_prompts: list[str]
    is_fallback: bool


class ReportCreateSchema(StrictInputSchema):
    """Citizen smog incident report payload."""

    report_type: str = Field(
        ..., min_length=2, max_length=50, json_schema_extra={"examples": ["construction_dust"]}
    )
    severity: str = Field(
        "moderate", min_length=2, max_length=32, json_schema_extra={"examples": ["severe"]}
    )
    location_name: str = Field(
        ...,
        min_length=2,
        max_length=200,
        json_schema_extra={"examples": ["SV Road Junction, Andheri"]},
    )
    latitude: float = Field(DEFAULT_CITY_LAT, ge=-90.0, le=90.0)
    longitude: float = Field(DEFAULT_CITY_LON, ge=-180.0, le=180.0)
    description: str | None = Field(
        "", max_length=1000, json_schema_extra={"examples": ["Unpaved dust plume"]}
    )


class CommunityReportResponse(BaseModel):
    """Serialized citizen smog report."""

    id: int
    user_id: int
    report_type: str
    severity: str
    location_name: str
    latitude: float
    longitude: float
    description: str | None = None
    upvote_count: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserStatusUpdate(StrictInputSchema):
    """Admin user activation or role update request."""

    is_active: bool | None = None
    role: Literal["user", "moderator", "admin"] | None = None


class ModerationAction(StrictInputSchema):
    """Moderation queue approval/rejection action."""

    action: Literal["VERIFY", "REJECT", "verify", "reject"]
    reason: str | None = Field(default="", max_length=500)


class AITraceResponse(BaseModel):
    """Admin view of persisted Copilot safety traces."""

    id: int
    user_id: int | None = None
    prompt_hash: str
    intent: str
    model: str
    latency_ms: int
    tokens_used: int
    validator_flags: str | None = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogResponse(BaseModel):
    """Admin view of persisted security audit logs."""

    id: int
    user_id: int | None = None
    action: str
    resource_type: str | None = None
    resource_id: str | None = None
    ip_address: str | None = None
    details: str | None = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
