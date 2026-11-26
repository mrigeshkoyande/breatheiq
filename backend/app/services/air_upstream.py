"""Upstream OpenAQ v3 & Open-Meteo telemetry ingestion adapter with fallback."""

import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

import httpx

from app.core.config import settings
from app.services.air_models import AirDataPayload, AirDataProvider, DemoAirDataProvider
from app.services.air_parsers import (
    build_current_payload,
    build_forecast_series,
    parse_openaq_measurements,
)

T = TypeVar("T")
logger = logging.getLogger(__name__)


class OpenAQAndMeteoProvider(AirDataProvider):
    """Ingests OpenAQ ground stations (LIVE) or Open-Meteo models (MODELED), with Demo fallback."""

    def __init__(self, http_client: httpx.AsyncClient | None = None) -> None:
        """Initialize provider with optional injected shared async HTTP client."""
        self.demo = DemoAirDataProvider()
        self._http_client = http_client

    def set_http_client(self, client: httpx.AsyncClient | None) -> None:
        """Bind or clear shared connection-pooled HTTPX client."""
        self._http_client = client

    async def _run_with_client(
        self, coro_factory: Callable[[httpx.AsyncClient], Awaitable[T]]
    ) -> T:
        """Execute ``coro_factory`` using pooled HTTP client or a bounded local client."""
        if self._http_client is not None:
            return await coro_factory(self._http_client)
        async with httpx.AsyncClient(timeout=4.0) as local_client:
            return await coro_factory(local_client)

    async def _fetch_openaq_pm25(
        self, client: httpx.AsyncClient, lat: float, lon: float
    ) -> tuple[float | None, str | None]:
        """Query nearest OpenAQ v3 station measurement when ``OPENAQ_API_KEY`` is configured."""
        if not settings.OPENAQ_API_KEY:
            return None, None
        url = f"https://api.openaq.org/v3/locations?coordinates={lat},{lon}&radius=15000&limit=3"
        headers = {"X-API-Key": settings.OPENAQ_API_KEY}
        resp = await client.get(url, headers=headers)
        results = resp.json().get("results", []) if resp.status_code == 200 else []
        if not results:
            return None, None
        loc_id = str(results[0].get("id", "OPENAQ-LOCAL"))
        name = str(results[0].get("name") or f"OpenAQ #{loc_id}")
        latest = await client.get(
            f"https://api.openaq.org/v3/locations/{loc_id}/latest", headers=headers
        )
        if latest.status_code != 200:
            return None, None
        return parse_openaq_measurements(latest.json().get("results", []), name)

    async def _query_current_upstream(
        self, client: httpx.AsyncClient, lat: float, lon: float, city_name: str | None
    ) -> AirDataPayload | None:
        """Fetch current Open-Meteo AQ, Weather, and OpenAQ telemetry concurrently."""
        aq_url = (
            "https://air-quality-api.open-meteo.com/v1/air-quality"
            f"?latitude={lat}&longitude={lon}"
            "&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"
        )
        wx_url = (
            "https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
        )
        aq_res, wx_res, openaq_res = await asyncio.gather(
            client.get(aq_url),
            client.get(wx_url),
            self._fetch_openaq_pm25(client, lat, lon),
            return_exceptions=True,
        )
        if not (
            isinstance(aq_res, httpx.Response)
            and isinstance(wx_res, httpx.Response)
            and aq_res.status_code == 200
            and wx_res.status_code == 200
        ):
            return None
        openaq_pm25, openaq_station = openaq_res if isinstance(openaq_res, tuple) else (None, None)
        return build_current_payload(
            lat,
            lon,
            city_name,
            aq_res.json().get("current", {}),
            wx_res.json().get("current", {}),
            openaq_pm25,
            openaq_station,
        )

    async def get_current(
        self, lat: float, lon: float, city_name: str | None = None
    ) -> AirDataPayload:
        """Fetch current atmospheric telemetry with automatic labeled Demo fallback."""
        if settings.DEMO_MODE or settings.ENVIRONMENT in ("testing", "test"):
            return await self.demo.get_current(lat, lon, city_name)
        try:
            payload = await self._run_with_client(
                lambda c: self._query_current_upstream(c, lat, lon, city_name)
            )
            if payload is not None:
                return payload
        except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
            logger.warning("Upstream current telemetry failed (%s); using DEMO fallback.", exc)
        return await self.demo.get_current(lat, lon, city_name)

    async def _query_forecast_upstream(
        self, client: httpx.AsyncClient, lat: float, lon: float, hours: int
    ) -> list[dict[str, Any]] | None:
        """Fetch multi-day hourly Open-Meteo AQ and weather forecast concurrently."""
        aq_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&hourly=pm10,pm2_5&forecast_days=3"
        wx_url = (
            "https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            "&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,boundary_layer_height&forecast_days=3"
        )
        aq_res, wx_res = await asyncio.gather(
            client.get(aq_url), client.get(wx_url), return_exceptions=True
        )
        if not (isinstance(aq_res, httpx.Response) and aq_res.status_code == 200):
            return None
        wx_hourly = (
            wx_res.json().get("hourly", {})
            if isinstance(wx_res, httpx.Response) and wx_res.status_code == 200
            else {}
        )
        return build_forecast_series(aq_res.json().get("hourly", {}), wx_hourly, hours)

    async def get_forecast(self, lat: float, lon: float, hours: int = 48) -> list[dict[str, Any]]:
        """Fetch hourly particulate and weather forecast with Demo fallback."""
        if settings.DEMO_MODE or settings.ENVIRONMENT in ("testing", "test"):
            return await self.demo.get_forecast(lat, lon, hours)
        try:
            series = await self._run_with_client(
                lambda c: self._query_forecast_upstream(c, lat, lon, hours)
            )
            if series:
                return series
        except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
            logger.warning("Upstream forecast telemetry failed (%s); using DEMO fallback.", exc)
        return await self.demo.get_forecast(lat, lon, hours)
