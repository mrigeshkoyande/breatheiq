"""Pytest fixtures providing isolated in-memory SQLite DB and clean limiter state."""

import sys
from collections.abc import AsyncGenerator
from pathlib import Path

# Ensure 'backend' directory is in sys.path regardless of execution working directory
_BACKEND_DIR = str(Path(__file__).resolve().parent.parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import app.models.app_data  # noqa: E402
import app.models.auth  # noqa: E402
import app.models.copilot  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.core.rate_limit import limiter  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.db.seed import DEMO_ACCOUNTS  # noqa: E402
from app.db.session import Base, get_db  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402
from app.services.air_data import air_data_service  # noqa: E402

settings.ENVIRONMENT = "testing"
_CACHED_DEMO_HASH = hash_password("Password123!")


@pytest_asyncio.fixture(scope="function")
async def test_db() -> AsyncGenerator[None, None]:
    """Spin up isolated SQLite DB, reset rate limits/caches, and seed demo accounts."""
    limiter.reset()
    air_data_service.invalidate_cache()
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        for acc in DEMO_ACCOUNTS:
            session.add(
                app.models.auth.User(
                    email=acc["email"],
                    hashed_password=_CACHED_DEMO_HASH,
                    full_name=acc["full_name"],
                    role=acc["role"],
                    is_active=acc["is_active"],
                    is_verified=acc["is_verified"],
                )
            )
        await session.commit()

    async def _get_test_db() -> AsyncGenerator[AsyncSession, None]:
        async with async_session() as session:
            yield session

    fastapi_app.dependency_overrides[get_db] = _get_test_db
    yield
    fastapi_app.dependency_overrides.clear()
    limiter.reset()
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def client(test_db: None) -> AsyncGenerator[AsyncClient, None]:
    """Provide an HTTPX AsyncClient wired directly to FastAPI ASGI app."""
    _ = test_db
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
