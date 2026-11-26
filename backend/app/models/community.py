"""Database model for community air hazard reporting."""

from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.constants import DEFAULT_CITY_LAT, DEFAULT_CITY_LON
from app.db.session import Base


def _utcnow() -> datetime:
    """Return timezone-aware UTC timestamp."""
    return datetime.now(UTC)


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
    latitude: Mapped[float] = mapped_column(Float, default=DEFAULT_CITY_LAT, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, default=DEFAULT_CITY_LON, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    upvote_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="UNVERIFIED", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
