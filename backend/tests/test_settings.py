from app.core.config import Settings
import pytest

def test_settings_allowed_origins_json():
    s = Settings(ALLOWED_ORIGINS='["https://breatheiq.vercel.app"]')
    assert s.ALLOWED_ORIGINS == ["https://breatheiq.vercel.app"]

def test_settings_allowed_origins_csv():
    s = Settings(ALLOWED_ORIGINS="https://breatheiq.vercel.app/, https://api.breatheiq.org")
    assert s.ALLOWED_ORIGINS == ["https://breatheiq.vercel.app", "https://api.breatheiq.org"]

def test_settings_allowed_origins_single():
    s = Settings(ALLOWED_ORIGINS="https://breatheiq.vercel.app")
    assert s.ALLOWED_ORIGINS == ["https://breatheiq.vercel.app"]

def test_settings_allowed_origins_invalid():
    try:
        Settings(ALLOWED_ORIGINS="ftp://invalid.com")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Invalid CORS origin" in str(e)

def test_settings_postgres_dialect_normalization():
    s = Settings(DATABASE_URL="postgres://user:pass@ep-123.ap-southeast-1.render.com/breatheiq")
    assert s.DATABASE_URL == "postgresql+asyncpg://user:pass@ep-123.ap-southeast-1.render.com/breatheiq"
