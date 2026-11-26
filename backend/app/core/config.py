"""Application settings loaded from environment variables."""

import json
import sys
from pathlib import Path
from typing import Any, Literal

from pydantic import ValidationInfo, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_JWT_PLACEHOLDER = "breatheiq-super-secret-key-change-in-production-min-32-chars-long"


def _parse_origin_entries(v: Any) -> list[str]:
    """Parse ALLOWED_ORIGINS raw value from list, JSON array string, or CSV text."""
    if v is None:
        return []
    if isinstance(v, list):
        return [str(item) for item in v]
    if not isinstance(v, str):
        raise ValueError(
            f"Invalid type for ALLOWED_ORIGINS: {type(v)}. Expected JSON array string or comma-separated URLs."
        )
    stripped = v.strip()
    if not stripped:
        return []
    if stripped.startswith("[") and stripped.endswith("]"):
        try:
            parsed = json.loads(stripped)
            return [str(item) for item in parsed] if isinstance(parsed, list) else [str(parsed)]
        except json.JSONDecodeError:
            cleaned = stripped.strip("[]").replace("'", "").replace('"', "")
            return [item.strip() for item in cleaned.split(",") if item.strip()]
    return (
        [item.strip() for item in stripped.split(",") if item.strip()]
        if "," in stripped
        else [stripped]
    )


def _validate_origin_entries(origins: list[str]) -> list[str]:
    """Validate explicit CORS origin URLs and reject insecure wildcards."""
    cleaned_origins: list[str] = []
    for origin in origins:
        origin_str = origin.strip().rstrip("/")
        if not origin_str:
            continue
        if origin_str == "*":
            raise ValueError(
                "Wildcard '*' origin cannot be combined with credentials (allow_credentials=True). "
                "Specify explicit origins (e.g. 'https://breatheiq.vercel.app') or leave empty for same-origin."
            )
        if not origin_str.startswith(("http://", "https://")):
            raise ValueError(
                f"Invalid CORS origin '{origin_str}': each origin must begin with 'http://' or 'https://'"
            )
        cleaned_origins.append(origin_str)
    return cleaned_origins


class Settings(BaseSettings):
    """Typed runtime settings validated at startup."""

    PROJECT_NAME: str = "BreatheIQ"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development | demo | production | testing
    DEBUG: bool = True
    PORT: int = 8000

    # JWT Settings (JWT only - no Firebase/OAuth)
    JWT_SECRET_KEY: str = DEFAULT_JWT_PLACEHOLDER
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_SECURE: bool = False  # Set True in demo and production (HTTPS)
    # SameSite=strict for canonical same-origin Docker/Render; set "none" via env for cross-site Vercel+Render
    COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "strict"

    # Security & Resilience
    RATE_LIMIT_ENABLED: bool = True
    AUTH_LOCKOUT_THRESHOLD: int = 5
    AUTH_LOCKOUT_MINUTES: int = 15
    MAX_REQUEST_BODY_BYTES: int = 1_048_576
    CACHE_MAX_SIZE: int = 128

    # Database (PostgreSQL for production; SQLite fallback for local/demo)
    DATABASE_URL: str = "sqlite+aiosqlite:///./breatheiq.db"

    # Environmental Demo Mode
    DEMO_MODE: bool = True

    # External APIs (Server-Side)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    OPENAQ_API_KEY: str = ""

    # CORS Allowed Origins
    ALLOWED_ORIGINS: list[str] | str = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:10000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        """Normalize ALLOWED_ORIGINS from list, JSON string, CSV string, or single URL."""
        return _validate_origin_entries(_parse_origin_entries(v))

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        """Normalize SQLite and PostgreSQL async driver prefixes."""
        base_dir = Path(__file__).resolve().parent.parent.parent
        canonical_sqlite = f"sqlite+aiosqlite:///{(base_dir / 'breatheiq.db').as_posix()}"
        if not v:
            return canonical_sqlite
        url = str(v).strip()
        if "sqlite" in url and "./breatheiq.db" in url:
            return canonical_sqlite
        if "sslmode=" in url:
            url = url.replace("sslmode=", "ssl=")
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        if url.startswith("postgresql://") and "+asyncpg" not in url:
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("sqlite:///") and "+aiosqlite" not in url:
            return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        return url

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_flag(cls, v: Any) -> bool:
        """Normalize boolean string flags cleanly."""
        if isinstance(v, bool):
            return v
        if isinstance(v, (str, int)):
            return str(v).strip().lower() in ("true", "1", "yes", "t")
        return False

    @field_validator("COOKIE_SAMESITE", mode="before")
    @classmethod
    def normalize_samesite(cls, v: Any) -> str:
        """Normalize SameSite cookie attribute lowercase."""
        if isinstance(v, str):
            return v.strip().lower()
        return str(v)

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: str, info: ValidationInfo) -> str:
        """Reject weak or default JWT secret in production."""
        env = info.data.get("ENVIRONMENT", "development")
        if env == "production" and (not v or v == DEFAULT_JWT_PLACEHOLDER or len(v) < 32):
            raise ValueError(
                "Production environment requires a strong, non-default JWT_SECRET_KEY with at least 32 characters."
            )
        return v

    @model_validator(mode="after")
    def validate_production_and_cookies(self) -> "Settings":
        """Enforce secure cookies in hosted demo/production environments."""
        if (
            self.ENVIRONMENT in ("demo", "production")
            and "COOKIE_SECURE" not in self.model_fields_set
        ):
            self.COOKIE_SECURE = True
        if (
            self.COOKIE_SAMESITE == "none"
            and not self.COOKIE_SECURE
            and self.ENVIRONMENT != "development"
        ):
            self.COOKIE_SECURE = True
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


try:
    settings = Settings()
except Exception as exc:  # noqa: BLE001 — fail fast with clear operator guidance at startup
    sys.stderr.write(
        f"\n[FATAL CONFIGURATION ERROR] Failed to load application settings: {exc}\n"
        "Verify your environment variables (ALLOWED_ORIGINS, JWT_SECRET_KEY, DATABASE_URL).\n\n"
    )
    sys.exit(1)
