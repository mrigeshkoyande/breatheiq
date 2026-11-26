"""Shared domain and application constants replacing scattered magic values."""

from enum import StrEnum

# Default urban monitoring corridor (Mumbai metropolitan baseline)
DEFAULT_CITY_NAME = "Mumbai"
DEFAULT_CITY_LAT = 19.0760
DEFAULT_CITY_LON = 72.8777

# Fallback seed impact baselines for newly onboarded demo households
SEED_IMPACT_DAYS = 7
SEED_BASE_AVERTED_PM25_UG = 520.0
SEED_STEP_AVERTED_PM25_UG = 25.0
SEED_BASE_AVERTED_CO2_KG = 2.4
SEED_STEP_AVERTED_CO2_KG = 0.2
SEED_BASE_AQI_HOURS = 180.0
SEED_STEP_AQI_HOURS = 10.0

# Time and security bounds
SECONDS_PER_HOUR = 3600
MINUTES_PER_HOUR = 60
ONE_TIME_TOKEN_TTL_MINUTES = 30
MAX_PAGE_LIMIT = 50
DEFAULT_AUDIT_LOG_LIMIT = 100
DEFAULT_USER_LIST_LIMIT = 100


class UserRole(StrEnum):
    """Supported authorization roles."""

    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"


class ReportStatus(StrEnum):
    """Lifecycle states for community smog reports."""

    UNVERIFIED = "UNVERIFIED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class TokenPurpose(StrEnum):
    """Valid single-use signed JWT token purposes."""

    RESET_PASSWORD = "reset_password"
    VERIFY_EMAIL = "verify_email"
