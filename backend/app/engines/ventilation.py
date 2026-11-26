"""Window Oracle — Deterministic Boundary Layer & Ventilation Advisory Engine.

Evaluates hourly atmospheric forecasts (PM2.5, wind speed, boundary layer height,
temperature, humidity) to identify safer domestic cross-ventilation windows.
"""

from datetime import UTC, datetime
from typing import Any

from app.engines.ventilation_rules import (
    DEFAULT_BEST_WINDOW_DURATION_H,
    HOURS_PER_DAY,
    HourlyVentilationSlot,
    WindowOracleOutput,
    boundary_layer_modifier,
    classify_aeration_score,
    humidity_modifier,
    pm25_base_score,
    wind_modifier,
)

__all__ = [
    "HourlyVentilationSlot",
    "WindowOracleOutput",
    "evaluate_window_oracle",
    "score_hour",
]


def score_hour(
    pm25: float,
    wind_speed: float,
    temp_c: float,
    humidity: float,
    bl_height: float | None = None,
) -> tuple[int, str, str]:
    """Compute an aeration suitability score (0-100) from meteorology and PM2.5.

    Args:
        pm25: Hourly particulate concentration (µg/m³).
        wind_speed: 10m wind speed (m/s).
        temp_c: Ambient temperature (°C), retained for forecast schema parity.
        humidity: Relative humidity percentage (0-100).
        bl_height: Optional planetary boundary layer height in meters.

    Returns:
        Tuple of ``(score_0_to_100, recommendation_code, rationale_text)``.
    """
    _ = temp_c
    raw_score = (
        pm25_base_score(pm25)
        + boundary_layer_modifier(bl_height)
        + wind_modifier(wind_speed)
        + humidity_modifier(humidity)
    )
    clamped = max(0, min(100, int(raw_score)))
    rec, rationale = classify_aeration_score(clamped)
    return clamped, rec, rationale


def _fallback_tier(hour: int) -> tuple[int, str, str]:
    """Return diurnal heuristic score, recommendation tag, and rationale for clock hour."""
    if 12 <= hour <= 15:
        return (
            65,
            "VENTILATE_BRIEFLY",
            "Heuristic midday solar heating window. Inversion layer typically ascends during early afternoon.",
        )
    if 6 <= hour <= 9 or 18 <= hour <= 22:
        return (
            15,
            "SEAL",
            "Heuristic peak inversion window. Low boundary layer and rush-hour emissions trap pollutants.",
        )
    return (35, "PURIFY", "Nighttime/mid-morning baseline. Keep windows closed and run purifiers.")


def _build_fallback_slot(today_iso: str, hour: int) -> HourlyVentilationSlot:
    """Construct one hourly diurnal heuristic fallback slot."""
    score, rec, rat = _fallback_tier(hour)
    return HourlyVentilationSlot(
        hour_iso=f"{today_iso}T{hour:02d}:00:00Z",
        hour_local=f"{hour:02d}:00",
        pm25=110.0 if rec in ("SEAL", "PURIFY") else 55.0,
        boundary_layer_height_m=350.0 if rec == "SEAL" else 750.0,
        wind_speed_ms=1.5 if rec == "SEAL" else 3.2,
        temperature_c=26.0,
        relative_humidity_pct=65.0,
        aeration_score=score,
        recommendation=rec,
        rationale=rat,
        badge="ESTIMATED_RULE_FALLBACK",
    )


def _build_rule_fallback() -> WindowOracleOutput:
    """Return labeled diurnal heuristic fallback when forecast series is unavailable."""
    now = datetime.now(UTC)
    today_iso = now.date().isoformat()
    slots = [_build_fallback_slot(today_iso, hour) for hour in range(HOURS_PER_DAY)]
    return WindowOracleOutput(
        is_forecast_driven=False,
        summary_advisory=(
            "Midday brief ventilation window (12:00-15:00) estimated from standard "
            "urban diurnal inversion cycles."
        ),
        best_window_start="12:00",
        best_window_end="15:00",
        best_window_score=65,
        current_action="SEAL" if now.hour in range(6, 10) else "PURIFY",
        hourly_slots=slots,
        provenance_badge="ESTIMATED_RULE_FALLBACK",
        methodology_note=(
            "Based on empirical diurnal urban smog curves. Connect live Open-Meteo "
            "atmospheric forecast for hourly precision."
        ),
    )


def _parse_forecast_slot(entry: dict[str, Any], today_iso: str) -> HourlyVentilationSlot:
    """Score a single hourly forecast dictionary into a typed ventilation slot."""
    pm25 = float(entry.get("pm25", 80.0))
    wind = float(entry.get("wind_speed_ms", 2.0))
    temp = float(entry.get("temperature_c", 25.0))
    hum = float(entry.get("relative_humidity_pct", 60.0))
    bl_raw = entry.get("boundary_layer_height_m")
    bl_height = float(bl_raw) if bl_raw is not None else None
    score, rec, rat = score_hour(pm25, wind, temp, hum, bl_height)
    iso_str = str(entry.get("time") or f"{today_iso}T12:00:00Z")
    hour_str = iso_str.split("T")[-1][:5] if "T" in iso_str else iso_str[:5]
    return HourlyVentilationSlot(
        hour_iso=iso_str,
        hour_local=hour_str,
        pm25=pm25,
        boundary_layer_height_m=bl_height,
        wind_speed_ms=wind,
        temperature_c=temp,
        relative_humidity_pct=hum,
        aeration_score=score,
        recommendation=rec,
        rationale=rat,
        badge="FORECAST",
    )


def _compute_best_window_end(best_start: str) -> str:
    """Compute end clock HH:00 string adding default ventilation window duration."""
    if ":" not in best_start:
        return "15:00"
    end_hour = (int(best_start.split(":")[0]) + DEFAULT_BEST_WINDOW_DURATION_H) % HOURS_PER_DAY
    return f"{end_hour:02d}:00"


def evaluate_window_oracle(hourly_data: list[dict[str, Any]] | None = None) -> WindowOracleOutput:
    """Evaluate 24-hour ventilation suitability from forecast slots or fallback (Time/Space O(H))."""
    if not hourly_data:
        return _build_rule_fallback()
    today_iso = datetime.now(UTC).date().isoformat()
    slots = [_parse_forecast_slot(entry, today_iso) for entry in hourly_data]
    best_slot = max(slots, key=lambda slot: slot.aeration_score)
    best_start = best_slot.hour_local
    best_end = _compute_best_window_end(best_start)
    return WindowOracleOutput(
        is_forecast_driven=True,
        summary_advisory=(
            f"Optimal ventilation identified between {best_start} and {best_end} "
            f"(Score: {best_slot.aeration_score}/100) when atmospheric boundary layer expands to dilute ground emissions."
        ),
        best_window_start=best_start,
        best_window_end=best_end,
        best_window_score=best_slot.aeration_score,
        current_action=slots[0].recommendation,
        hourly_slots=slots,
        provenance_badge="FORECAST",
        methodology_note=(
            "Computed hourly from Open-Meteo atmospheric forecast (PM2.5, planetary boundary layer height, "
            "and wind dispersion dynamics)."
        ),
    )
