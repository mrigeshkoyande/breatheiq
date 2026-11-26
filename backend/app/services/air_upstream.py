"""Upstream OpenAQ v3 & Open-Meteo telemetry ingestion adapter with fallback."""

import asyncio
import logging
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from typing import Any, TypeVar

import httpx

from app.core.config import settings
from app.engines.naqi import calculate_cpcb_naqi
from app.services.air_models import AirDataPayload, AirDataProvider, DemoAirDataProvider

T = TypeVar("T")
logger = logging.getLogger(__name__)


def _parse_openaq_measurements(
    results: list[dict[str, Any]], station_name: str
) -> tuple[float | None, str | None]:
    """Extract valid non-negative PM2.5 reading from OpenAQ station measurements."""
    for meas in results:
        param_name = str(meas.get("parameter", {}).get("name", "")).lower()
        val = meas.get("value")
        if param_name in ("pm25", "pm2.5") and isinstance(val, (int, float)) and val >= 0:
            return round(float(val), 1), station_name
    return None, None


def _build_current_payload(
    lat: float,
    lon: float,
    city_name: str | None,
    aq_data: dict[str, Any],
    wx_data: dict[str, Any],
    openaq_pm25: float | None,
    openaq_station: str | None,
) -> AirDataPayload:
    """Normalize Open-Meteo and optional OpenAQ readings into ``AirDataPayload``."""
    pm25 = openaq_pm25 if openaq_pm25 is not None else float(aq_data.get("pm2_5") or 85.0)
    pm10 = float(aq_data.get("pm10") or 130.0)
    no2 = float(aq_data.get("nitrogen_dioxide") or 45.0)
    so2 = float(aq_data.get("sulphur_dioxide") or 15.0)
    co = round(float(aq_data.get("carbon_monoxide") or 1200.0) / 1000.0, 2)
    o3 = float(aq_data.get("ozone") or 40.0)
    naqi_res = calculate_cpcb_naqi(
        {"pm25": pm25, "pm10": pm10, "no2": no2, "so2": so2, "co": co, "o3": o3}
    )

    resolved_city = city_name or "Regional Grid"
    is_live = openaq_pm25 is not None
    location = (
        f"{resolved_city} ({openaq_station})"
        if openaq_station
        else f"{resolved_city} (Atmospheric Model Grid)"
    )

    return AirDataPayload(
        city=resolved_city,
        location_name=location,
        latitude=lat,
        longitude=lon,
        timestamp_utc=datetime.now(UTC).isoformat(),
        source="LIVE" if is_live else "MODELED",
        confidence_score=0.95 if is_live else 0.90,
        station_id=openaq_station or "OPEN-METEO-CAMS",
        pm25=pm25,
        pm10=pm10,
        no2=no2,
        so2=so2,
        co=co,
        o3=o3,
        temperature_c=float(wx_data.get("temperature_2m") or 26.0),
        relative_humidity_pct=float(wx_data.get("relative_humidity_2m") or 65.0),
        wind_speed_ms=float(wx_data.get("wind_speed_10m") or 2.8),
        boundary_layer_height_m=550.0,
        naqi=naqi_res,
    )


def _extract_series_value(series: list[Any], idx: int, default: float) -> float:
    """Safely extract numeric hourly telemetry element at index ``idx``."""
    return float(series[idx]) if idx < len(series) and series[idx] is not None else default


def _build_forecast_series(
    aq_hourly: dict[str, Any], wx_hourly: dict[str, Any], hours: int
) -> list[dict[str, Any]]:
    """Combine air-quality and meteorological hourly arrays into typed forecast points."""
    times = aq_hourly.get("time", [])[:hours]
    pm25_list = aq_hourly.get("pm2_5", [])[:hours]
    pm10_list = aq_hourly.get("pm10", [])[:hours]
    winds = wx_hourly.get("wind_speed_10m", [])
    temps = wx_hourly.get("temperature_2m", [])
    hums = wx_hourly.get("relative_humidity_2m", [])
    bls = wx_hourly.get("boundary_layer_height", [])

    forecast: list[dict[str, Any]] = []
    for idx, (t, p25, p10) in enumerate(zip(times, pm25_list, pm10_list, strict=False)):
        hour_int = int(t.split("T")[-1][:2]) if "T" in t else 12
        default_bl = 900.0 if 12 <= hour_int <= 15 else 320.0
        forecast.append(
            {
                "time": t if "T" in t else f"{t}T00:00:00Z",
                "pm25": round(float(p25 if p25 is not None else 75.0), 1),
                "pm10": round(float(p10 if p10 is not None else 120.0), 1),
                "wind_speed_ms": round(_extract_series_value(winds, idx, 3.0), 1),
                "temperature_c": round(_extract_series_value(temps, idx, 26.0), 1),
                "relative_humidity_pct": round(_extract_series_value(hums, idx, 60.0), 1),
                "boundary_layer_height_m": round(_extract_series_value(bls, idx, default_bl), 1),
                "badge": "FORECAST",
            }
        )
    return forecast


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
        return _parse_openaq_measurements(latest.json().get("results", []), name)

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
        return _build_current_payload(
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
        return _build_forecast_series(aq_res.json().get("hourly", {}), wx_hourly, hours)

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
