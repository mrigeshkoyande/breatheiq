"""Async SQLAlchemy database engine and session factory."""

import sys
from collections.abc import AsyncGenerator
from pathlib import Path
from typing import Any

# Ensure backend root is in sys.path when executed directly as a script
_BACKEND_DIR = str(Path(__file__).resolve().parent.parent.parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from sqlalchemy import event  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.orm import DeclarativeBase  # noqa: E402

from app.core.config import settings  # noqa: E402

is_sqlite = "sqlite" in settings.DATABASE_URL

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if is_sqlite else {},
)

if is_sqlite:

    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection: Any, _connection_record: Any) -> None:
        """Enable SQLite foreign key enforcement per connection."""
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Declarative base class for ORM models."""


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session and close it on exit."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
