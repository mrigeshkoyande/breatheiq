import os
import json
import sys
from pathlib import Path
from typing import List, Union
from pydantic import field_validator, model_validator, ValidationInfo
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "BreatheIQ"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development | demo | production | testing
    DEBUG: bool = True
    PORT: int = 8000

    # JWT Settings (JWT only - no Firebase/OAuth)
    JWT_SECRET_KEY: str = "breatheiq-super-secret-key-change-in-production-min-32-chars-long"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_SECURE: bool = False  # Set to True in demo and production (HTTPS)
    COOKIE_SAMESITE: str = "lax"  # "strict" or "lax" for same-domain; "none" for cross-domain

    # Database (PostgreSQL for production; SQLite fallback for zero-setup demo)
    DATABASE_URL: str = "sqlite+aiosqlite:///./breatheiq.db"

    # Environmental Demo Mode
    DEMO_MODE: bool = True

    # External APIs (Server-Side)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    OPENAQ_API_KEY: str = ""

    # CORS Allowed Origins
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:10000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str], None]) -> List[str]:
        if v is None:
            return []
        if isinstance(v, list):
            origins = v
        elif isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        origins = parsed
                    else:
                        origins = [str(parsed)]
                except json.JSONDecodeError:
                    cleaned = v.strip("[]").replace("'", "").replace('"', "")
                    origins = [item.strip() for item in cleaned.split(",") if item.strip()]
            elif "," in v:
                origins = [item.strip() for item in v.split(",") if item.strip()]
            else:
                origins = [v]
        else:
            raise ValueError(f"Invalid type for ALLOWED_ORIGINS: {type(v)}. Expected JSON array string or comma-separated URLs.")

        cleaned_origins: List[str] = []
        for origin in origins:
            origin_str = str(origin).strip().rstrip("/")
            if not origin_str:
                continue
            if origin_str == "*":
                raise ValueError(
                    "Wildcard '*' origin cannot be combined with credentials (allow_credentials=True). "
                    "Specify explicit origins (e.g. 'https://breatheiq.vercel.app') or leave empty for same-origin."
                )
            if not (origin_str.startswith("http://") or origin_str.startswith("https://")):
                raise ValueError(
                    f"Invalid CORS origin '{origin_str}': each origin must begin with 'http://' or 'https://' (e.g., https://your-app.vercel.app)"
                )
            cleaned_origins.append(origin_str)

        return cleaned_origins

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        base_dir = Path(__file__).resolve().parent.parent.parent
        canonical_sqlite = f"sqlite+aiosqlite:///{(base_dir / 'breatheiq.db').as_posix()}"
        if not v:
            return canonical_sqlite
        v = str(v).strip()
        if "sqlite" in v and "./breatheiq.db" in v:
            return canonical_sqlite
        # Translate asyncpg incompatible sslmode to ssl
        if "sslmode=" in v:
            v = v.replace("sslmode=", "ssl=")
        # Render / Supabase / Heroku provide postgres:// or postgresql:// without async dialect
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and "+asyncpg" not in v:
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif v.startswith("sqlite:///") and "+aiosqlite" not in v:
            return v.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        return v

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_flag(cls, v: Union[bool, str, int]) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, (str, int)):
            return str(v).strip().lower() in ("true", "1", "yes", "t")
        return False

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: str, info: ValidationInfo) -> str:
        env = info.data.get("ENVIRONMENT", "development")
        if env == "production":
            default_placeholder = "breatheiq-super-secret-key-change-in-production-min-32-chars-long"
            if not v or v == default_placeholder or len(v) < 32:
                raise ValueError(
                    "Production environment requires a strong, non-default JWT_SECRET_KEY with at least 32 characters."
                )
        return v

    @model_validator(mode="after")
    def validate_production_and_cookies(self) -> "Settings":
        if self.ENVIRONMENT in ("demo", "production"):
            if "COOKIE_SECURE" not in self.model_fields_set:
                self.COOKIE_SECURE = True
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


try:
    settings = Settings()
except Exception as _e:
    sys.stderr.write(
        f"\n[FATAL CONFIGURATION ERROR] Failed to load application settings: {_e}\n"
        f"Verify your environment variables. In particular, ALLOWED_ORIGINS accepts:\n"
        f"  - Empty / unset: defaults to local development origins\n"
        f"  - Single origin: 'https://breatheiq.vercel.app'\n"
        f"  - Comma-separated: 'https://breatheiq.vercel.app, https://preview.vercel.app'\n"
        f"  - JSON array: '[\"https://breatheiq.vercel.app\"]'\n\n"
    )
    sys.exit(1)
