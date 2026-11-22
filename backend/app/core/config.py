import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "BreatheIQ"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: Union[bool, str] = True
    PORT: int = 8000

    # JWT Settings (JWT only - no Firebase/OAuth)
    JWT_SECRET_KEY: str = "breatheiq-super-secret-key-change-in-production-min-32-chars-long"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_SECURE: bool = False  # Relax for localhost development

    # Database (PostgreSQL with PostGIS for production; SQLite fallback for zero-setup demo)
    DATABASE_URL: str = "sqlite+aiosqlite:///./breatheiq.db"

    # Environmental Demo Mode
    DEMO_MODE: bool = True

    # External APIs (Server-Side)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    OPENAQ_API_KEY: str = ""

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
