"""Database models for user smog alerts, notifications, and personal impact ledger."""

from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


def _utcnow() -> datetime:
    """Return timezone-aware UTC timestamp."""
    return datetime.now(UTC)


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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
