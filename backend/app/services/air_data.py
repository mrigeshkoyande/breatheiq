"""Air Data Ingestion Service with single-flight coalescing and bounded LRU TTL cache."""

import asyncio
import time
from collections import OrderedDict
from typing import Any

import httpx

from app.core.config import settings
from app.services.air_cities import PRECONFIGURED_CITIES, CityConfig
from app.services.air_models import AirDataPayload, AirDataProvider, DemoAirDataProvider
from app.services.air_upstream import OpenAQAndMeteoProvider

OpenMeteoAirQualityProvider = OpenAQAndMeteoProvider

__all__ = [
    "PRECONFIGURED_CITIES",
    "AirDataPayload",
    "AirDataProvider",
    "AirDataService",
    "CityConfig",
    "DemoAirDataProvider",
    "OpenAQAndMeteoProvider",
    "OpenMeteoAirQualityProvider",
    "air_data_service",
]


class AirDataService:
    """Ingest orchestrator with single-flight coalescing and bounded LRU TTL cache."""

    CURRENT_TTL = 900.0
    FORECAST_TTL = 3600.0

    def __init__(self) -> None:
        """Initialize provider adapter, LRU caches, and per-key async locks."""
        self.provider = OpenAQAndMeteoProvider()
        self.demo = DemoAirDataProvider()
        self._current_cache: OrderedDict[str, tuple[float, AirDataPayload]] = OrderedDict()
        self._forecast_cache: OrderedDict[str, tuple[float, list[dict[str, Any]]]] = OrderedDict()
        self._current_locks: dict[str, asyncio.Lock] = {}
        self._forecast_locks: dict[str, asyncio.Lock] = {}

    def set_http_client(self, client: httpx.AsyncClient | None) -> None:
        """Bind shared async HTTP client from FastAPI lifespan."""
        self.provider.set_http_client(client)

    def invalidate_cache(self) -> None:
        """Clear in-memory telemetry caches."""
        self._current_cache.clear()
        self._forecast_cache.clear()

    def _cache_key(self, lat: float, lon: float) -> str:
        """Build rounded coordinate key to share telemetry across nearby requests."""
        return f"{round(lat, 2)}:{round(lon, 2)}"

    def _store_bounded(self, cache: OrderedDict[str, Any], key: str, value: Any) -> None:
        """Insert/refresh entry in bounded LRU cache and evict oldest beyond capacity."""
        if key in cache:
            cache.move_to_end(key)
        cache[key] = value
        while len(cache) > settings.CACHE_MAX_SIZE:
            cache.popitem(last=False)

    async def get_current_air_quality(
        self, lat: float, lon: float, city: str | None = None
    ) -> AirDataPayload:
        """Return cached or freshly fetched current telemetry."""
        key = self._cache_key(lat, lon)
        now = time.time()
        cached = self._current_cache.get(key)
        if cached and now - cached[0] < self.CURRENT_TTL:
            return cached[1]

        lock = self._current_locks.setdefault(key, asyncio.Lock())
        async with lock:
            now = time.time()
            cached = self._current_cache.get(key)
            if cached and now - cached[0] < self.CURRENT_TTL:
                return cached[1]
            data = await self.provider.get_current(lat, lon, city)
            self._store_bounded(self._current_cache, key, (now, data))
            return data

    async def get_forecast(self, lat: float, lon: float, hours: int = 48) -> list[dict[str, Any]]:
        """Return cached or freshly fetched hourly forecast series."""
        key = f"{self._cache_key(lat, lon)}:{hours}"
        now = time.time()
        cached = self._forecast_cache.get(key)
        if cached and now - cached[0] < self.FORECAST_TTL:
            return cached[1]

        lock = self._forecast_locks.setdefault(key, asyncio.Lock())
        async with lock:
            now = time.time()
            cached = self._forecast_cache.get(key)
            if cached and now - cached[0] < self.FORECAST_TTL:
                return cached[1]
            data = await self.provider.get_forecast(lat, lon, hours)
            self._store_bounded(self._forecast_cache, key, (now, data))
            return data

    def get_cities(self) -> list[CityConfig]:
        """Return preconfigured city monitoring corridors."""
        return list(PRECONFIGURED_CITIES.values())


air_data_service = AirDataService()
