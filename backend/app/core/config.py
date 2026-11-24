import os
import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "BreatheIQ"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000

    # JWT Settings (JWT only - no Firebase/OAuth)
    JWT_SECRET_KEY: str = "breatheiq-super-secret-key-change-in-production-min-32-chars-long"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_SECURE: bool = False  # Set to True in production (HTTPS)
    COOKIE_SAMESITE: str = "lax"  # "lax" for same-domain; "none" for cross-domain (e.g. Vercel frontend -> Render backend)

    # Database (PostgreSQL for production; SQLite fallback for zero-setup demo)
    DATABASE_URL: str = "sqlite+aiosqlite:///./breatheiq.db"

    # Environmental Demo Mode
    DEMO_MODE: bool = True

    # External APIs (Server-Side)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    OPENAQ_API_KEY: str = ""

    # CORS Allowed Origins (Union allows EnvSettingsSource to accept raw comma-separated strings without json.loads error)
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    @field_validator("ALLOWED_ORIGINS")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
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
            if not (origin_str.startswith("http://") or origin_str.startswith("https://") or origin_str == "*"):
                raise ValueError(
                    f"Invalid CORS origin '{origin_str}': each origin must begin with 'http://' or 'https://' (e.g., https://your-app.vercel.app)"
                )
            cleaned_origins.append(origin_str)

        return cleaned_origins

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if not v:
            return "sqlite+aiosqlite:///./breatheiq.db"
        v = str(v).strip()
        # Render / Heroku / Supabase provide postgres:// or postgresql:// without async dialect
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

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
