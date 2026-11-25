"""Window Oracle — Deterministic Boundary Layer & Ventilation Advisory Engine.

Evaluates hourly atmospheric forecasts (PM2.5, wind speed, boundary layer height,
temperature, humidity) to identify safer domestic cross-ventilation windows.
"""

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

SCORE_VENTILATE_FREELY = 75
SCORE_VENTILATE_BRIEFLY = 50
SCORE_PURIFY = 25

PM25_BASE_SCORES: tuple[tuple[float, int], ...] = (
    (30.0, 90),
    (60.0, 75),
    (90.0, 55),
    (120.0, 40),
    (250.0, 20),
)


class HourlyVentilationSlot(BaseModel):
    """Single-hour ventilation score and recommendation."""

    model_config = ConfigDict(extra="forbid")

    hour_iso: str
    hour_local: str
    pm25: float
    boundary_layer_height_m: float | None = None
    wind_speed_ms: float
    temperature_c: float
    relative_humidity_pct: float
    aeration_score: int
    recommendation: str  # VENTILATE_FREELY | VENTILATE_BRIEFLY | PURIFY | SEAL
    rationale: str
    badge: str = "FORECAST"


class WindowOracleOutput(BaseModel):
    """24-hour ventilation oracle evaluation output."""

    model_config = ConfigDict(extra="forbid")

    is_forecast_driven: bool
    summary_advisory: str
    best_window_start: str | None = None
    best_window_end: str | None = None
    best_window_score: int = 0
    current_action: str
    hourly_slots: list[HourlyVentilationSlot]
    provenance_badge: str
    methodology_note: str


def score_hour(
    pm25: float,
    wind_speed: float,
    temp_c: float,
    humidity: float,
    bl_height: float | None = None,
) -> tuple[int, str, str]:
    """Compute an aeration suitability score (0-100) from meteorology and PM2.5."""
    _ = temp_c  # Kept in signature for forecast telemetry compatibility
    base = 5
    for threshold, tier_score in PM25_BASE_SCORES:
        if pm25 <= threshold:
            base = tier_score
            break

    bl_mod = 0
    if bl_height is not None:
        if bl_height >= 800:
            bl_mod = 12
        elif bl_height >= 500:
            bl_mod = 5
        elif bl_height < 250:
            bl_mod = -15

    wind_mod = 0
    if 2.0 <= wind_speed <= 5.5:
        wind_mod = 8
    elif wind_speed < 1.0:
        wind_mod = -10
    elif wind_speed > 9.0:
        wind_mod = -8

    hum_mod = 0
    if humidity > 80:
        hum_mod = -8
    elif 40 <= humidity <= 65:
        hum_mod = 5

    score = max(0, min(100, int(base + bl_mod + wind_mod + hum_mod)))

    if score >= SCORE_VENTILATE_FREELY:
        rec = "VENTILATE_FREELY"
        rationale = "Deep thermal boundary mixing and low particulate concentration. Optimal for home air exchange."
    elif score >= SCORE_VENTILATE_BRIEFLY:
        rec = "VENTILATE_BRIEFLY"
        rationale = "Moderate inversion lifting. Safe for a 10-15 minute rapid flush before closing windows."
    elif score >= SCORE_PURIFY:
        rec = "PURIFY"
        rationale = "Elevated particulate density. Keep windows sealed; operate indoor HEPA purifiers."
    else:
        rec = "SEAL"
        rationale = "Hazardous surface stagnation or high particulate loading. Seal windows and door gaps strictly."

    return score, rec, rationale


def _build_rule_fallback() -> WindowOracleOutput:
    """Return clearly labeled diurnal heuristic fallback when forecast series is unavailable."""
    today_iso = datetime.now(UTC).date().isoformat()
    current_hour = datetime.now(UTC).hour
    slots: list[HourlyVentilationSlot] = []

    for hour in range(24):
        if 12 <= hour <= 15:
            score = 65
            rec = "VENTILATE_BRIEFLY"
            rat = "Heuristic midday solar heating window. Inversion layer typically ascends during early afternoon."
        elif 6 <= hour <= 9 or 18 <= hour <= 22:
            score = 15
            rec = "SEAL"
            rat = "Heuristic peak inversion window. Low boundary layer and rush-hour emissions trap pollutants."
        else:
            score = 35
            rec = "PURIFY"
            rat = "Nighttime/mid-morning baseline. Keep windows closed and run purifiers."

        slots.append(
            HourlyVentilationSlot(
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
        )

    return WindowOracleOutput(
        is_forecast_driven=False,
        summary_advisory=(
            "Midday brief ventilation window (12:00-15:00) estimated from standard "
            "urban diurnal inversion cycles."
        ),
        best_window_start="12:00",
        best_window_end="15:00",
        best_window_score=65,
        current_action="SEAL" if current_hour in range(6, 10) else "PURIFY",
        hourly_slots=slots,
        provenance_badge="ESTIMATED_RULE_FALLBACK",
        methodology_note=(
            "Based on empirical diurnal urban smog curves. Connect live Open-Meteo "
            "atmospheric forecast for hourly precision."
        ),
    )


def evaluate_window_oracle(hourly_data: list[dict[str, Any]] | None = None) -> WindowOracleOutput:
    """Evaluate 24-hour ventilation potential from hourly forecast data or heuristic fallback."""
    if not hourly_data:
        return _build_rule_fallback()

    today_iso = datetime.now(UTC).date().isoformat()
    slots: list[HourlyVentilationSlot] = []
    best_score = -1
    best_slot: HourlyVentilationSlot | None = None

    for entry in hourly_data:
        pm25 = float(entry.get("pm25", 80.0))
        wind = float(entry.get("wind_speed_ms", 2.0))
        temp = float(entry.get("temperature_c", 25.0))
        hum = float(entry.get("relative_humidity_pct", 60.0))
        bl_raw = entry.get("boundary_layer_height_m")
        bl_height = float(bl_raw) if bl_raw is not None else None

        score, rec, rat = score_hour(pm25, wind, temp, hum, bl_height)
        iso_str = str(entry.get("time") or f"{today_iso}T12:00:00Z")
        hour_str = iso_str.split("T")[-1][:5] if "T" in iso_str else iso_str[:5]

        slot = HourlyVentilationSlot(
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
        slots.append(slot)

        if score > best_score:
            best_score = score
            best_slot = slot

    best_start = best_slot.hour_local if best_slot else "13:00"
    if ":" in best_start:
        best_end = f"{(int(best_start.split(':')[0]) + 2) % 24:02d}:00"
    else:
        best_end = "15:00"
    current_action = slots[0].recommendation if slots else "PURIFY"

    summary = (
        f"Optimal ventilation identified between {best_start} and {best_end} "
        f"(Score: {best_score}/100) when atmospheric boundary layer expands to dilute ground emissions."
    )

    return WindowOracleOutput(
        is_forecast_driven=True,
        summary_advisory=summary,
        best_window_start=best_start,
        best_window_end=best_end,
        best_window_score=best_score,
        current_action=current_action,
        hourly_slots=slots,
        provenance_badge="FORECAST",
        methodology_note=(
            "Computed hourly from Open-Meteo atmospheric forecast (PM2.5, planetary boundary layer height, "
            "and wind dispersion dynamics)."
        ),
    )
