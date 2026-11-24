"""
backend/app/models/copilot.py
Database models for AI trace logging and safety audit trails.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class AITrace(Base):
    __tablename__ = "ai_traces"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    prompt_hash = Column(String(64), nullable=False, index=True)
    intent = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    latency_ms = Column(Integer, nullable=False)
    tokens_used = Column(Integer, default=0, nullable=False)
    validator_flags = Column(Text, nullable=True)  # Comma-separated or JSON string
    status = Column(String(50), nullable=False)  # SUCCESS, FALLBACK_TEMPLATE, CORRECTION_APPLIED, INJECTION_BLOCKED
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
