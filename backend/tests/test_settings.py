import sys
from pathlib import Path

# Ensure 'backend' directory is in sys.path regardless of execution working directory
_BACKEND_DIR = str(Path(__file__).resolve().parent.parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import pytest
from app.core.config import Settings


def test_settings_allowed_origins_json():
    s = Settings(ALLOWED_ORIGINS='["https://breatheiq.vercel.app"]')
    assert s.ALLOWED_ORIGINS == ["https://breatheiq.vercel.app"]


def test_settings_allowed_origins_csv():
    s = Settings(ALLOWED_ORIGINS="https://breatheiq.vercel.app/, https://api.breatheiq.org")
    assert s.ALLOWED_ORIGINS == ["https://breatheiq.vercel.app", "https://api.breatheiq.org"]


def test_settings_allowed_origins_single():
    s = Settings(ALLOWED_ORIGINS="https://breatheiq.vercel.app")
    assert s.ALLOWED_ORIGINS == ["https://breatheiq.vercel.app"]


def test_settings_allowed_origins_list():
    s = Settings(ALLOWED_ORIGINS=["https://breatheiq.vercel.app/", "https://preview.vercel.app"])
    assert s.ALLOWED_ORIGINS == ["https://breatheiq.vercel.app", "https://preview.vercel.app"]


def test_settings_allowed_origins_empty_string():
    s = Settings(ALLOWED_ORIGINS="")
    assert s.ALLOWED_ORIGINS == []


def test_settings_allowed_origins_wildcard_forbidden():
    with pytest.raises(ValueError, match="Wildcard '\\*' origin cannot be combined with credentials"):
        Settings(ALLOWED_ORIGINS="*")


def test_settings_allowed_origins_invalid():
    with pytest.raises(ValueError, match="Invalid CORS origin"):
        Settings(ALLOWED_ORIGINS="ftp://invalid.com")


def test_settings_postgres_dialect_normalization():
    s1 = Settings(DATABASE_URL="postgres://user:pass@ep-123.ap-southeast-1.render.com/breatheiq")
    assert s1.DATABASE_URL == "postgresql+asyncpg://user:pass@ep-123.ap-southeast-1.render.com/breatheiq"

    s2 = Settings(DATABASE_URL="postgresql://user:pass@ep-123.ap-southeast-1.render.com/breatheiq")
    assert s2.DATABASE_URL == "postgresql+asyncpg://user:pass@ep-123.ap-southeast-1.render.com/breatheiq"

    s3 = Settings(DATABASE_URL="postgresql://user:pass@ep-123.ap-southeast-1.render.com/breatheiq?sslmode=require")
    assert "ssl=require" in s3.DATABASE_URL
    assert "sslmode=" not in s3.DATABASE_URL


def test_settings_debug_boolean_normalization():
    assert Settings(DEBUG="true").DEBUG is True
    assert Settings(DEBUG="1").DEBUG is True
    assert Settings(DEBUG="false").DEBUG is False
    assert Settings(DEBUG="0").DEBUG is False


def test_settings_env_var_json(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", '["https://breatheiq.vercel.app"]')
    s = Settings()
    assert s.ALLOWED_ORIGINS == ["https://breatheiq.vercel.app"]


def test_settings_env_var_csv(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://breatheiq.vercel.app, https://preview.vercel.app")
    s = Settings()
    assert s.ALLOWED_ORIGINS == ["https://breatheiq.vercel.app", "https://preview.vercel.app"]


def test_settings_env_var_single(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://breatheiq.vercel.app")
    s = Settings()
    assert s.ALLOWED_ORIGINS == ["https://breatheiq.vercel.app"]


def test_settings_env_var_single_quoted_json(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "['https://breatheiq.vercel.app']")
    s = Settings()
    assert s.ALLOWED_ORIGINS == ["https://breatheiq.vercel.app"]


def test_settings_env_var_empty_is_empty_list(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "")
    s = Settings()
    assert s.ALLOWED_ORIGINS == []


def test_settings_production_refuses_weak_jwt_secret():
    with pytest.raises(ValueError, match="Production environment requires a strong"):
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET_KEY="short-secret"
        )

    with pytest.raises(ValueError, match="Production environment requires a strong"):
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET_KEY="breatheiq-super-secret-key-change-in-production-min-32-chars-long"
        )


def test_settings_production_boots_with_strong_secret():
    strong = "a-very-strong-unique-secret-key-that-has-over-32-characters"
    s = Settings(ENVIRONMENT="production", JWT_SECRET_KEY=strong)
    assert s.JWT_SECRET_KEY == strong
    assert s.COOKIE_SECURE is True
