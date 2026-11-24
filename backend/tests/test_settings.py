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


def test_settings_allowed_origins_invalid():
    with pytest.raises(ValueError, match="Invalid CORS origin"):
        Settings(ALLOWED_ORIGINS="ftp://invalid.com")


def test_settings_postgres_dialect_normalization():
    s1 = Settings(DATABASE_URL="postgres://user:pass@ep-123.ap-southeast-1.render.com/breatheiq")
    assert s1.DATABASE_URL == "postgresql+asyncpg://user:pass@ep-123.ap-southeast-1.render.com/breatheiq"

    s2 = Settings(DATABASE_URL="postgresql://user:pass@ep-123.ap-southeast-1.render.com/breatheiq")
    assert s2.DATABASE_URL == "postgresql+asyncpg://user:pass@ep-123.ap-southeast-1.render.com/breatheiq"


def test_settings_debug_boolean_normalization():
    assert Settings(DEBUG="true").DEBUG is True
    assert Settings(DEBUG="1").DEBUG is True
    assert Settings(DEBUG="false").DEBUG is False
    assert Settings(DEBUG="0").DEBUG is False

