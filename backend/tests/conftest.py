import os
import sys
from pathlib import Path

# Ensure 'backend' directory is in sys.path regardless of execution working directory
_BACKEND_DIR = str(Path(__file__).resolve().parent.parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from app.core.config import settings
from app.main import app as fastapi_app
from app.db.session import Base, get_db
import app.models.auth
import app.models.copilot
import app.models.app_data

from app.core.security import hash_password
from app.db.seed import DEMO_ACCOUNTS

settings.ENVIRONMENT = "testing"
_CACHED_DEMO_HASH = hash_password("Password123!")

@pytest_asyncio.fixture(scope="function")
async def test_db():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    # Seed demo accounts into test db using precomputed hash for performance
    async with async_session() as session:
        for acc in DEMO_ACCOUNTS:
            u = app.models.auth.User(
                email=acc["email"],
                hashed_password=_CACHED_DEMO_HASH,
                full_name=acc["full_name"],
                role=acc["role"],
                is_active=acc["is_active"],
                is_verified=acc["is_verified"]
            )
            session.add(u)
        await session.commit()

    async def _get_test_db():
        async with async_session() as session:
            yield session

    fastapi_app.dependency_overrides[get_db] = _get_test_db
    yield
    fastapi_app.dependency_overrides.clear()
    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def client(test_db):
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
