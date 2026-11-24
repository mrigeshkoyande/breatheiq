"""
backend/app/models/app_data.py
Database models for personalized family flow:
Households, Members, Rooms, Readings, Routine Tasks, Alerts, and Impact Logs.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), default="My Home", nullable=False)
    city = Column(String(100), default="Mumbai", nullable=False)
    neighborhood = Column(String(150), default="Andheri West", nullable=False)
    latitude = Column(Float, default=19.0760, nullable=False)
    longitude = Column(Float, default=72.8777, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    members = relationship("HouseholdMember", back_populates="household", cascade="all, delete-orphan")
    rooms = relationship("Room", back_populates="household", cascade="all, delete-orphan")

class HouseholdMember(Base):
    __tablename__ = "household_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    household_id = Column(Integer, ForeignKey("households.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    age_category = Column(String(50), default="adult", nullable=False)  # infant, child, adult, senior
    sensitivity = Column(String(50), default="none", nullable=False)  # none, asthma, bronchitis, heart_condition, pregnancy
    vulnerability_score = Column(Integer, default=30, nullable=False)  # 1 to 100
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    household = relationship("Household", back_populates="members")
    routine_tasks = relationship("RoutineTask", back_populates="member", cascade="all, delete-orphan")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    household_id = Column(Integer, ForeignKey("households.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False)  # e.g. Living Room, Kids Room
    length_m = Column(Float, default=4.5, nullable=False)
    width_m = Column(Float, default=3.8, nullable=False)
    height_m = Column(Float, default=2.7, nullable=False)
    has_purifier = Column(Boolean, default=False, nullable=False)
    purifier_cadr = Column(Float, default=0.0, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    household = relationship("Household", back_populates="rooms")
    readings = relationship("RoomReading", back_populates="room", cascade="all, delete-orphan")

class RoomReading(Base):
    __tablename__ = "room_readings"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    pm25 = Column(Float, nullable=False)
    co2 = Column(Float, default=650.0, nullable=True)
    temperature_c = Column(Float, default=25.0, nullable=True)
    humidity_pct = Column(Float, default=55.0, nullable=True)
    source = Column(String(50), default="Manual", nullable=False)  # Manual, Sensor
    timestamp = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    room = relationship("Room", back_populates="readings")

class RoutineTask(Base):
    __tablename__ = "routine_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("household_members.id", ondelete="SET NULL"), nullable=True, index=True)
    time_slot = Column(String(50), default="morning", nullable=False)  # morning, afternoon, evening
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="routine", nullable=False)  # exercise, ventilation, purifier, commute
    is_completed = Column(Boolean, default=False, nullable=False)
    date_str = Column(String(10), nullable=False)  # YYYY-MM-DD
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    member = relationship("HouseholdMember", back_populates="routine_tasks")

class SmogAlertRule(Base):
    __tablename__ = "smog_alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    aqi_threshold = Column(Integer, default=200, nullable=False)
    target_member = Column(String(100), default="All Members", nullable=False)
    quiet_hours_start = Column(String(10), default="22:00", nullable=False)
    quiet_hours_end = Column(String(10), default="07:00", nullable=False)
    channels = Column(String(100), default="in_app,push", nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class SmogAlertNotification(Base):
    __tablename__ = "smog_alert_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    aqi_at_trigger = Column(Integer, nullable=False)
    pollutant_driver = Column(String(50), default="PM2.5", nullable=False)
    reason_why = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class ImpactLog(Base):
    __tablename__ = "impact_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date_str = Column(String(10), nullable=False)  # YYYY-MM-DD
    averted_pm25_dose_ug = Column(Float, default=0.0, nullable=False)
    averted_co2_kg = Column(Float, default=0.0, nullable=False)
    aqi_hours_avoided = Column(Float, default=0.0, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class CommunityReport(Base):
    __tablename__ = "community_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_type = Column(String(50), nullable=False)  # stubble_burning, construction_dust, garbage_burning, industrial_plume, traffic_congestion
    severity = Column(String(50), default="moderate", nullable=False)  # moderate, severe, hazardous
    location_name = Column(String(200), nullable=False)
    latitude = Column(Float, default=19.0760, nullable=False)
    longitude = Column(Float, default=72.8777, nullable=False)
    description = Column(Text, nullable=True)
    upvote_count = Column(Integer, default=1, nullable=False)
    status = Column(String(50), default="UNVERIFIED", nullable=False)  # UNVERIFIED, VERIFIED, REJECTED
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
