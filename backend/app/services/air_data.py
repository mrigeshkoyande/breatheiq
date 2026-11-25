"""Air Data Ingestion Layer with Provenance Tracking & Statutory NAQI Computation.

Provider fallback chain (never silent; source is recorded in payload):
1. OpenAQ v3 Station Adapter (`LIVE`, when `OPENAQ_API_KEY` is configured and not in demo/test mode)
2. Open-Meteo Atmospheric Air Quality & Weather (`MODELED` / `FORECAST`)
3. Demo Air Data Provider (`DEMO`, deterministic diurnal winter smog profiles)
"""

import asyncio
import logging
import time
from abc import ABC, abstractmethod
from collections import OrderedDict
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Any, TypeVar

import httpx
from pydantic import BaseModel, ConfigDict
from typing_extensions import TypedDict

from app.core.config import settings
from app.engines.naqi import NAQIResult, calculate_cpcb_naqi

T = TypeVar("T")
logger = logging.getLogger(__name__)


class CityConfig(TypedDict):
    """Preconfigured urban corridor metadata and deterministic fallback baseline."""

    city: str
    state: str
    latitude: float
    longitude: float
    base_pm25: float
    base_pm10: float
    base_no2: float
    base_so2: float
    base_co: float
    base_o3: float
    temp_c: float
    humidity: float
    wind_speed: float


PRECONFIGURED_CITIES: dict[str, CityConfig] = {
    "mumbai": {
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "base_pm25": 118.0,
        "base_pm10": 165.0,
        "base_no2": 52.0,
        "base_so2": 18.0,
        "base_co": 1.4,
        "base_o3": 38.0,
        "temp_c": 28.5,
        "humidity": 68.0,
        "wind_speed": 3.4,
    },
    "delhi": {
        "city": "Delhi",
        "state": "NCT of Delhi",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "base_pm25": 245.0,
        "base_pm10": 340.0,
        "base_no2": 78.0,
        "base_so2": 24.0,
        "base_co": 2.8,
        "base_o3": 44.0,
        "temp_c": 19.0,
        "humidity": 78.0,
        "wind_speed": 1.8,
    },
    "bengaluru": {
        "city": "Bengaluru",
        "state": "Karnataka",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "base_pm25": 48.0,
        "base_pm10": 74.0,
        "base_no2": 32.0,
        "base_so2": 11.0,
        "base_co": 0.8,
        "base_o3": 31.0,
        "temp_c": 24.0,
        "humidity": 55.0,
        "wind_speed": 4.1,
    },
    "kolkata": {
        "city": "Kolkata",
        "state": "West Bengal",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "base_pm25": 165.0,
        "base_pm10": 220.0,
        "base_no2": 58.0,
        "base_so2": 21.0,
        "base_co": 1.9,
        "base_o3": 36.0,
        "temp_c": 25.0,
        "humidity": 72.0,
        "wind_speed": 2.2,
    },
    "pune": {
        "city": "Pune",
        "state": "Maharashtra",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "base_pm25": 84.0,
        "base_pm10": 118.0,
        "base_no2": 41.0,
        "base_so2": 14.0,
        "base_co": 1.1,
        "base_o3": 42.0,
        "temp_c": 26.5,
        "humidity": 58.0,
        "wind_speed": 3.1,
    },
}


class AirDataPayload(BaseModel):
    """Normalized current telemetry payload returned to routes and UI."""

    model_config = ConfigDict(extra="forbid")

    city: str
    location_name: str
    latitude: float
    longitude: float
    timestamp_utc: str
    source: str  # LIVE | MODELED | FORECAST | DEMO
    confidence_score: float
    station_id: str | None = None
    pm25: float
    pm10: float
    no2: float
    so2: float
    co: float
    o3: float
    temperature_c: float
    relative_humidity_pct: float
    wind_speed_ms: float
    boundary_layer_height_m: float | None = None
    naqi: NAQIResult


class AirDataProvider(ABC):
    """Abstract interface for environmental telemetry providers."""

    @abstractmethod
    async def get_current(
        self, lat: float, lon: float, city_name: str | None = None
    ) -> AirDataPayload:
        """Fetch current atmospheric telemetry for a coordinate or city."""

    @abstractmethod
    async def get_forecast(
        self, lat: float, lon: float, hours: int = 48
    ) -> list[dict[str, Any]]:
        """Fetch hourly particulate and weather forecast."""


class DemoAirDataProvider(AirDataProvider):
    """Deterministic offline fallback modeling typical urban diurnal winter smog curves."""

    def _match_city(self, lat: float, lon: float, city_name: str | None) -> CityConfig:
        if city_name:
            key = city_name.strip().lower()
            if key in PRECONFIGURED_CITIES:
                return PRECONFIGURED_CITIES[key]

        closest = PRECONFIGURED_CITIES["mumbai"]
        min_dist = float("inf")
        for city_cfg in PRECONFIGURED_CITIES.values():
            dist = (city_cfg["latitude"] - lat) ** 2 + (city_cfg["longitude"] - lon) ** 2
            if dist < min_dist:
                min_dist = dist
                closest = city_cfg
        return closest

    async def get_current(
        self, lat: float, lon: float, city_name: str | None = None
    ) -> AirDataPayload:
        city_info = self._match_city(lat, lon, city_name)
        now = datetime.now(UTC)
        hour = now.hour

        if 7 <= hour <= 9:
            diurnal = 1.25
        elif 19 <= hour <= 22:
            diurnal = 1.20
        elif 12 <= hour <= 15:
            diurnal = 0.70
        else:
            diurnal = 1.0

        pm25 = round(city_info["base_pm25"] * diurnal, 1)
        pm10 = round(city_info["base_pm10"] * diurnal, 1)
        no2 = round(city_info["base_no2"] * (1.1 if 7 <= hour <= 20 else 0.8), 1)
        so2 = city_info["base_so2"]
        co = round(city_info["base_co"] * diurnal, 2)
        o3 = round(city_info["base_o3"] * (1.4 if 12 <= hour <= 16 else 0.6), 1)

        naqi_res = calculate_cpcb_naqi(
            {"pm25": pm25, "pm10": pm10, "no2": no2, "so2": so2, "co": co, "o3": o3}
        )
        bl_height = 950.0 if 12 <= hour <= 15 else 280.0

        return AirDataPayload(
            city=city_info["city"],
            location_name=f"{city_info['city']} Central Monitoring Corridor",
            latitude=city_info["latitude"],
            longitude=city_info["longitude"],
            timestamp_utc=now.isoformat(),
            source="DEMO",
            confidence_score=0.85,
            station_id="DEMO-CAAQMS-01",
            pm25=pm25,
            pm10=pm10,
            no2=no2,
            so2=so2,
            co=co,
            o3=o3,
            temperature_c=city_info["temp_c"],
            relative_humidity_pct=city_info["humidity"],
            wind_speed_ms=city_info["wind_speed"],
            boundary_layer_height_m=bl_height,
            naqi=naqi_res,
        )

    async def get_forecast(
        self, lat: float, lon: float, hours: int = 48
    ) -> list[dict[str, Any]]:
        city_info = self._match_city(lat, lon, None)
        now = datetime.now(UTC)
        forecast: list[dict[str, Any]] = []

        for h in range(hours):
            target_time = now + timedelta(hours=h)
            hour = target_time.hour

            if 7 <= hour <= 9:
                diurnal, bl, wind = 1.30, 240.0, 1.6
            elif 19 <= hour <= 22:
                diurnal, bl, wind = 1.25, 300.0, 1.8
            elif 12 <= hour <= 15:
                diurnal, bl, wind = 0.68, 980.0, 3.6
            else:
                diurnal, bl, wind = 0.95, 450.0, 2.4

            forecast.append(
                {
                    "time": target_time.isoformat(),
                    "pm25": round(city_info["base_pm25"] * diurnal, 1),
                    "pm10": round(city_info["base_pm10"] * diurnal, 1),
                    "wind_speed_ms": wind,
                    "temperature_c": round(city_info["temp_c"] + (3.0 if 12 <= hour <= 15 else -2.5), 1),
                    "relative_humidity_pct": round(
                        city_info["humidity"] + (10.0 if 4 <= hour <= 8 else -12.0), 1
                    ),
                    "boundary_layer_height_m": bl,
                    "badge": "DEMO_FORECAST",
                }
            )

        return forecast


class OpenAQAndMeteoProvider(AirDataProvider):
    """Ingests OpenAQ ground stations (LIVE) or Open-Meteo forecasts (MODELED), with Demo fallback."""

    def __init__(self, http_client: httpx.AsyncClient | None = None) -> None:
        self.demo = DemoAirDataProvider()
        self._http_client = http_client

    def set_http_client(self, client: httpx.AsyncClient | None) -> None:
        """Attach shared connection-pooled HTTPX client."""
        self._http_client = client

    async def _fetch_openaq_pm25(
        self, client: httpx.AsyncClient, lat: float, lon: float
    ) -> tuple[float | None, str | None]:
        """Query nearest OpenAQ v3 station measurement when OPENAQ_API_KEY is configured."""
        if not settings.OPENAQ_API_KEY:
            return None, None
        url = (
            "https://api.openaq.org/v3/locations"
            f"?coordinates={lat},{lon}&radius=15000&limit=3"
        )
        headers = {"X-API-Key": settings.OPENAQ_API_KEY}
        resp = await client.get(url, headers=headers)
        if resp.status_code != 200:
            return None, None
        results = resp.json().get("results", [])
        if not results:
            return None, None
        loc = results[0]
        loc_id = str(loc.get("id", "OPENAQ-LOCAL"))
        name = str(loc.get("name") or f"OpenAQ #{loc_id}")
        latest = await client.get(
            f"https://api.openaq.org/v3/locations/{loc_id}/latest", headers=headers
        )
        if latest.status_code != 200:
            return None, None
        for meas in latest.json().get("results", []):
            param_name = str(meas.get("parameter", {}).get("name", "")).lower()
            val = meas.get("value")
            if param_name in ("pm25", "pm2.5") and isinstance(val, (int, float)) and val >= 0:
                return round(float(val), 1), name
        return None, None

    async def _run_with_client(
        self, coro_factory: Callable[[httpx.AsyncClient], Awaitable[T]]
    ) -> T:
        if self._http_client is not None:
            return await coro_factory(self._http_client)
        async with httpx.AsyncClient(timeout=4.0) as local_client:
            return await coro_factory(local_client)

    async def get_current(
        self, lat: float, lon: float, city_name: str | None = None
    ) -> AirDataPayload:
        if settings.DEMO_MODE or settings.ENVIRONMENT in ("testing", "test"):
            return await self.demo.get_current(lat, lon, city_name)

        async def _query(client: httpx.AsyncClient) -> AirDataPayload | None:
            aq_url = (
                "https://air-quality-api.open-meteo.com/v1/air-quality"
                f"?latitude={lat}&longitude={lon}"
                "&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"
            )
            wx_url = (
                "https://api.open-meteo.com/v1/forecast"
                f"?latitude={lat}&longitude={lon}"
                "&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
            )

            aq_res, wx_res, openaq_res = await asyncio.gather(
                client.get(aq_url),
                client.get(wx_url),
                self._fetch_openaq_pm25(client, lat, lon),
                return_exceptions=True,
            )

            openaq_pm25: float | None = None
            openaq_station: str | None = None
            if isinstance(openaq_res, tuple):
                openaq_pm25, openaq_station = openaq_res

            if (
                isinstance(aq_res, httpx.Response)
                and isinstance(wx_res, httpx.Response)
                and aq_res.status_code == 200
                and wx_res.status_code == 200
            ):
                aq_data = aq_res.json().get("current", {})
                wx_data = wx_res.json().get("current", {})

                pm25 = openaq_pm25 if openaq_pm25 is not None else float(aq_data.get("pm2_5") or 85.0)
                pm10 = float(aq_data.get("pm10") or 130.0)
                no2 = float(aq_data.get("nitrogen_dioxide") or 45.0)
                so2 = float(aq_data.get("sulphur_dioxide") or 15.0)
                co_raw = float(aq_data.get("carbon_monoxide") or 1200.0)
                co = round(co_raw / 1000.0, 2)
                o3 = float(aq_data.get("ozone") or 40.0)

                temp = float(wx_data.get("temperature_2m") or 26.0)
                hum = float(wx_data.get("relative_humidity_2m") or 65.0)
                wind = float(wx_data.get("wind_speed_10m") or 2.8)

                naqi_res = calculate_cpcb_naqi(
                    {"pm25": pm25, "pm10": pm10, "no2": no2, "so2": so2, "co": co, "o3": o3}
                )
                resolved_city = city_name or "Regional Grid"
                is_live = openaq_pm25 is not None
                return AirDataPayload(
                    city=resolved_city,
                    location_name=(
                        f"{resolved_city} ({openaq_station})"
                        if openaq_station
                        else f"{resolved_city} (Atmospheric Model Grid)"
                    ),
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
                    temperature_c=temp,
                    relative_humidity_pct=hum,
                    wind_speed_ms=wind,
                    boundary_layer_height_m=550.0,
                    naqi=naqi_res,
                )
            return None

        try:
            payload = await self._run_with_client(_query)
            if payload is not None:
                return payload
        except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
            logger.warning("Upstream current telemetry failed (%s); using DEMO fallback.", exc)

        return await self.demo.get_current(lat, lon, city_name)

    async def get_forecast(
        self, lat: float, lon: float, hours: int = 48
    ) -> list[dict[str, Any]]:
        if settings.DEMO_MODE or settings.ENVIRONMENT in ("testing", "test"):
            return await self.demo.get_forecast(lat, lon, hours)

        async def _query_forecast(client: httpx.AsyncClient) -> list[dict[str, Any]] | None:
            aq_url = (
                "https://air-quality-api.open-meteo.com/v1/air-quality"
                f"?latitude={lat}&longitude={lon}&hourly=pm10,pm2_5&forecast_days=3"
            )
            wx_url = (
                "https://api.open-meteo.com/v1/forecast"
                f"?latitude={lat}&longitude={lon}"
                "&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,boundary_layer_height"
                "&forecast_days=3"
            )
            aq_res, wx_res = await asyncio.gather(
                client.get(aq_url),
                client.get(wx_url),
                return_exceptions=True,
            )
            if not (isinstance(aq_res, httpx.Response) and aq_res.status_code == 200):
                return None

            aq_hourly = aq_res.json().get("hourly", {})
            wx_hourly = (
                wx_res.json().get("hourly", {})
                if isinstance(wx_res, httpx.Response) and wx_res.status_code == 200
                else {}
            )

            times = aq_hourly.get("time", [])[:hours]
            pm25_list = aq_hourly.get("pm2_5", [])[:hours]
            pm10_list = aq_hourly.get("pm10", [])[:hours]
            winds = wx_hourly.get("wind_speed_10m", [])
            temps = wx_hourly.get("temperature_2m", [])
            hums = wx_hourly.get("relative_humidity_2m", [])
            bls = wx_hourly.get("boundary_layer_height", [])

            forecast: list[dict[str, Any]] = []
            for idx, (t, p25, p10) in enumerate(zip(times, pm25_list, pm10_list, strict=False)):
                val_pm25 = float(p25 if p25 is not None else 75.0)
                val_pm10 = float(p10 if p10 is not None else 120.0)
                hour_int = int(t.split("T")[-1][:2]) if "T" in t else 12
                wind_val = float(winds[idx]) if idx < len(winds) and winds[idx] is not None else 3.0
                temp_val = float(temps[idx]) if idx < len(temps) and temps[idx] is not None else 26.0
                hum_val = float(hums[idx]) if idx < len(hums) and hums[idx] is not None else 60.0
                bl_val = (
                    float(bls[idx])
                    if idx < len(bls) and bls[idx] is not None
                    else (900.0 if 12 <= hour_int <= 15 else 320.0)
                )
                forecast.append(
                    {
                        "time": t if "T" in t else f"{t}T00:00:00Z",
                        "pm25": round(val_pm25, 1),
                        "pm10": round(val_pm10, 1),
                        "wind_speed_ms": round(wind_val, 1),
                        "temperature_c": round(temp_val, 1),
                        "relative_humidity_pct": round(hum_val, 1),
                        "boundary_layer_height_m": round(bl_val, 1),
                        "badge": "FORECAST",
                    }
                )
            return forecast

        try:
            series = await self._run_with_client(_query_forecast)
            if series:
                return series
        except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
            logger.warning("Upstream forecast telemetry failed (%s); using DEMO fallback.", exc)

        return await self.demo.get_forecast(lat, lon, hours)


# Backward-compatible class alias
OpenMeteoAirQualityProvider = OpenAQAndMeteoProvider


class AirDataService:
    """Ingest orchestrator with single-flight coalescing and bounded LRU TTL cache."""

    CURRENT_TTL = 900.0
    FORECAST_TTL = 3600.0

    def __init__(self) -> None:
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
        return f"{round(lat, 2)}:{round(lon, 2)}"

    def _store_bounded(
        self, cache: OrderedDict[str, Any], key: str, value: Any
    ) -> None:
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

    async def get_forecast(
        self, lat: float, lon: float, hours: int = 48
    ) -> list[dict[str, Any]]:
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
