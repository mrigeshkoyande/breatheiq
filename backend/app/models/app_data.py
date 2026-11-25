"""Database models for personalized family flow."""

from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utcnow() -> datetime:
    """Return timezone-aware UTC timestamp."""
    return datetime.now(UTC)


class Household(Base):
    """User household profile with city and coordinates."""

    __tablename__ = "households"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), default="My Home", nullable=False)
    city: Mapped[str] = mapped_column(String(100), default="Mumbai", nullable=False)
    neighborhood: Mapped[str] = mapped_column(String(150), default="Andheri West", nullable=False)
    latitude: Mapped[float] = mapped_column(Float, default=19.0760, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, default=72.8777, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    members: Mapped[list["HouseholdMember"]] = relationship(
        "HouseholdMember", back_populates="household", cascade="all, delete-orphan"
    )
    rooms: Mapped[list["Room"]] = relationship(
        "Room", back_populates="household", cascade="all, delete-orphan"
    )


class HouseholdMember(Base):
    """Family member with respiratory sensitivity and vulnerability score."""

    __tablename__ = "household_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    household_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("households.id", ondelete="CASCADE"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    age_category: Mapped[str] = mapped_column(String(50), default="adult", nullable=False)
    sensitivity: Mapped[str] = mapped_column(String(50), default="none", nullable=False)
    vulnerability_score: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    household: Mapped["Household | None"] = relationship("Household", back_populates="members")
    routine_tasks: Mapped[list["RoutineTask"]] = relationship(
        "RoutineTask", back_populates="member", cascade="all, delete-orphan"
    )


class Room(Base):
    """Indoor room dimensions and HEPA purifier metadata."""

    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    household_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("households.id", ondelete="CASCADE"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    length_m: Mapped[float] = mapped_column(Float, default=4.5, nullable=False)
    width_m: Mapped[float] = mapped_column(Float, default=3.8, nullable=False)
    height_m: Mapped[float] = mapped_column(Float, default=2.7, nullable=False)
    has_purifier: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    purifier_cadr: Mapped[float | None] = mapped_column(Float, default=0.0, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    household: Mapped["Household | None"] = relationship("Household", back_populates="rooms")
    readings: Mapped[list["RoomReading"]] = relationship(
        "RoomReading", back_populates="room", cascade="all, delete-orphan"
    )


class RoomReading(Base):
    """Indoor particulate and comfort reading associated with a room."""

    __tablename__ = "room_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    room_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pm25: Mapped[float] = mapped_column(Float, nullable=False)
    co2: Mapped[float | None] = mapped_column(Float, default=650.0, nullable=True)
    temperature_c: Mapped[float | None] = mapped_column(Float, default=25.0, nullable=True)
    humidity_pct: Mapped[float | None] = mapped_column(Float, default=55.0, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="Manual", nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    room: Mapped["Room"] = relationship("Room", back_populates="readings")


class RoutineTask(Base):
    """Daily adaptive smog routine item."""

    __tablename__ = "routine_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    member_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("household_members.id", ondelete="SET NULL"), nullable=True, index=True
    )
    time_slot: Mapped[str] = mapped_column(String(50), default="morning", nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="routine", nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    date_str: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    member: Mapped["HouseholdMember | None"] = relationship(
        "HouseholdMember", back_populates="routine_tasks"
    )


class SmogAlertRule(Base):
    """User-configured smog threshold alert rule."""

    __tablename__ = "smog_alert_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    aqi_threshold: Mapped[int] = mapped_column(Integer, default=200, nullable=False)
    target_member: Mapped[str] = mapped_column(String(100), default="All Members", nullable=False)
    quiet_hours_start: Mapped[str] = mapped_column(String(10), default="22:00", nullable=False)
    quiet_hours_end: Mapped[str] = mapped_column(String(10), default="07:00", nullable=False)
    channels: Mapped[str] = mapped_column(String(100), default="in_app,push", nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class SmogAlertNotification(Base):
    """Delivered smog notification record."""

    __tablename__ = "smog_alert_notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    aqi_at_trigger: Mapped[int] = mapped_column(Integer, nullable=False)
    pollutant_driver: Mapped[str] = mapped_column(String(50), default="PM2.5", nullable=False)
    reason_why: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class ImpactLog(Base):
    """Daily personal exposure and CO2 savings ledger entry."""

    __tablename__ = "impact_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date_str: Mapped[str] = mapped_column(String(10), nullable=False)
    averted_pm25_dose_ug: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    averted_co2_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    aqi_hours_avoided: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class CommunityReport(Base):
    """Crowdsourced local pollution hazard report."""

    __tablename__ = "community_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(50), default="moderate", nullable=False)
    location_name: Mapped[str] = mapped_column(String(200), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, default=19.0760, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, default=72.8777, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    upvote_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="UNVERIFIED", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
