"""Parsers normalizing OpenAQ and Open-Meteo payloads into internal telemetry types."""

from datetime import UTC, datetime
from typing import Any

from app.engines.naqi import calculate_cpcb_naqi
from app.services.air_models import AirDataPayload


def parse_openaq_measurements(
    results: list[dict[str, Any]], station_name: str
) -> tuple[float | None, str | None]:
    """Extract valid non-negative PM2.5 reading from OpenAQ station measurements."""
    for meas in results:
        param_name = str(meas.get("parameter", {}).get("name", "")).lower()
        val = meas.get("value")
        if param_name in ("pm25", "pm2.5") and isinstance(val, (int, float)) and val >= 0:
            return round(float(val), 1), station_name
    return None, None


def _parse_pollutants(
    aq_data: dict[str, Any], openaq_pm25: float | None
) -> tuple[float, dict[str, float]]:
    """Extract normalized pollutant concentrations with safe numeric defaults."""
    pm25 = openaq_pm25 if openaq_pm25 is not None else float(aq_data.get("pm2_5") or 85.0)
    concentrations = {
        "pm25": pm25,
        "pm10": float(aq_data.get("pm10") or 130.0),
        "no2": float(aq_data.get("nitrogen_dioxide") or 45.0),
        "so2": float(aq_data.get("sulphur_dioxide") or 15.0),
        "co": round(float(aq_data.get("carbon_monoxide") or 1200.0) / 1000.0, 2),
        "o3": float(aq_data.get("ozone") or 40.0),
    }
    return pm25, concentrations


def build_current_payload(
    lat: float,
    lon: float,
    city_name: str | None,
    aq_data: dict[str, Any],
    wx_data: dict[str, Any],
    openaq_pm25: float | None,
    openaq_station: str | None,
) -> AirDataPayload:
    """Normalize Open-Meteo and optional OpenAQ readings into ``AirDataPayload``."""
    pm25, concs = _parse_pollutants(aq_data, openaq_pm25)
    resolved_city = city_name or "Regional Grid"
    is_live = openaq_pm25 is not None
    loc_suffix = openaq_station or "Atmospheric Model Grid"
    return AirDataPayload(
        city=resolved_city,
        location_name=f"{resolved_city} ({loc_suffix})",
        latitude=lat,
        longitude=lon,
        timestamp_utc=datetime.now(UTC).isoformat(),
        source="LIVE" if is_live else "MODELED",
        confidence_score=0.95 if is_live else 0.90,
        station_id=openaq_station or "OPEN-METEO-CAMS",
        pm25=pm25,
        pm10=concs["pm10"],
        no2=concs["no2"],
        so2=concs["so2"],
        co=concs["co"],
        o3=concs["o3"],
        temperature_c=float(wx_data.get("temperature_2m") or 26.0),
        relative_humidity_pct=float(wx_data.get("relative_humidity_2m") or 65.0),
        wind_speed_ms=float(wx_data.get("wind_speed_10m") or 2.8),
        boundary_layer_height_m=550.0,
        naqi=calculate_cpcb_naqi(concs),
    )


def _extract_series_value(series: list[Any], idx: int, default: float) -> float:
    """Safely extract numeric hourly telemetry element at index ``idx``."""
    return float(series[idx]) if idx < len(series) and series[idx] is not None else default


def _build_forecast_point(
    idx: int, t: str, p25: Any, p10: Any, wx_hourly: dict[str, Any]
) -> dict[str, Any]:
    """Assemble one normalized hourly forecast point."""
    hour_int = int(t.split("T")[-1][:2]) if "T" in t else 12
    default_bl = 900.0 if 12 <= hour_int <= 15 else 320.0
    return {
        "time": t if "T" in t else f"{t}T00:00:00Z",
        "pm25": round(float(p25 if p25 is not None else 75.0), 1),
        "pm10": round(float(p10 if p10 is not None else 120.0), 1),
        "wind_speed_ms": round(
            _extract_series_value(wx_hourly.get("wind_speed_10m", []), idx, 3.0), 1
        ),
        "temperature_c": round(
            _extract_series_value(wx_hourly.get("temperature_2m", []), idx, 26.0), 1
        ),
        "relative_humidity_pct": round(
            _extract_series_value(wx_hourly.get("relative_humidity_2m", []), idx, 60.0), 1
        ),
        "boundary_layer_height_m": round(
            _extract_series_value(wx_hourly.get("boundary_layer_height", []), idx, default_bl), 1
        ),
        "badge": "FORECAST",
    }


def build_forecast_series(
    aq_hourly: dict[str, Any], wx_hourly: dict[str, Any], hours: int
) -> list[dict[str, Any]]:
    """Combine air-quality and meteorological hourly arrays into typed forecast points."""
    times = aq_hourly.get("time", [])[:hours]
    pm25_list = aq_hourly.get("pm2_5", [])[:hours]
    pm10_list = aq_hourly.get("pm10", [])[:hours]
    return [
        _build_forecast_point(idx, t, p25, p10, wx_hourly)
        for idx, (t, p25, p10) in enumerate(zip(times, pm25_list, pm10_list, strict=False))
    ]
