"""
backend/app/engines/ventilation.py
Window Oracle — Deterministic Boundary Layer & Ventilation Advisory Engine.
Evaluates hourly atmospheric forecasts (PM2.5, wind speed, boundary layer height, temperature, humidity)
to model winter thermal inversion lifting and identify safe domestic aeration windows.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class HourlyVentilationSlot(BaseModel):
    hour_iso: str
    hour_local: str
    pm25: float
    boundary_layer_height_m: Optional[float] = None
    wind_speed_ms: float
    temperature_c: float
    relative_humidity_pct: float
    aeration_score: int  # 0 to 100
    recommendation: str  # "VENTILATE_FREELY" | "VENTILATE_BRIEFLY" | "PURIFY" | "SEAL"
    rationale: str
    badge: str = "FORECAST"

class WindowOracleOutput(BaseModel):
    is_forecast_driven: bool
    summary_advisory: str
    best_window_start: Optional[str] = None
    best_window_end: Optional[str] = None
    best_window_score: int = 0
    current_action: str
    hourly_slots: List[HourlyVentilationSlot]
    provenance_badge: str
    methodology_note: str

def score_hour(
    pm25: float,
    wind_speed: float,
    temp_c: float,
    humidity: float,
    bl_height: Optional[float] = None
) -> (int, str, str):
    """
    Computes an aeration suitability score (0-100) based on boundary layer physics and particulate concentration.
    Returns: (score, recommendation, rationale)
    """
    # Base score determined by particulate safety
    if pm25 <= 30:
        base = 90
    elif pm25 <= 60:
        base = 75
    elif pm25 <= 90:
        base = 55
    elif pm25 <= 120:
        base = 40
    elif pm25 <= 250:
        base = 20
    else:
        base = 5

    # Boundary layer height adjustment (if provided by meteorological model)
    # Higher boundary layer = pollutants diluted vertically
    bl_mod = 0
    if bl_height is not None:
        if bl_height >= 800:
            bl_mod = 12
        elif bl_height >= 500:
            bl_mod = 5
        elif bl_height < 250:
            bl_mod = -15  # Severe surface inversion cap

    # Wind speed adjustment (ideal: 2.0 to 5.0 m/s for dispersion without kicking up dust)
    wind_mod = 0
    if 2.0 <= wind_speed <= 5.5:
        wind_mod = 8
    elif wind_speed < 1.0:
        wind_mod = -10  # Stagnant conditions
    elif wind_speed > 9.0:
        wind_mod = -8   # High wind kicks up local road dust and crustal matter

    # Humidity adjustment (very high humidity > 75% promotes secondary aerosol formation and hygroscopic growth of particles)
    hum_mod = 0
    if humidity > 80:
        hum_mod = -8
    elif 40 <= humidity <= 65:
        hum_mod = 5

    score = max(0, min(100, int(base + bl_mod + wind_mod + hum_mod)))

    # Determine recommendation & rationale
    if score >= 75:
        rec = "VENTILATE_FREELY"
        rationale = "Deep thermal boundary mixing and low particulate concentration. Optimal for home air exchange."
    elif score >= 50:
        rec = "VENTILATE_BRIEFLY"
        rationale = "Moderate inversion lifting. Safe for a 10-15 minute rapid flush before closing windows."
    elif score >= 25:
        rec = "PURIFY"
        rationale = "Elevated particulate density. Keep windows sealed; operate indoor HEPA purifiers."
    else:
        rec = "SEAL"
        rationale = "Hazardous surface stagnation or high particulate loading. Seal windows and door gaps strictly."

    return score, rec, rationale

def evaluate_window_oracle(hourly_data: Optional[List[Dict[str, Any]]] = None) -> WindowOracleOutput:
    """
    Evaluates 24-hour ventilation potential.
    If hourly_data is provided, uses real meteorological modeling.
    If absent, provides a labeled heuristic rule fallback.
    """
    if not hourly_data:
        # Heuristic Fallback
        slots = []
        for hour in range(24):
            # Diurnal inversion heuristic
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

            slots.append(HourlyVentilationSlot(
                hour_iso=f"2026-11-24T{hour:02d}:00:00Z",
                hour_local=f"{hour:02d}:00",
                pm25=110.0 if rec in ["SEAL", "PURIFY"] else 55.0,
                boundary_layer_height_m=350.0 if rec == "SEAL" else 750.0,
                wind_speed_ms=1.5 if rec == "SEAL" else 3.2,
                temperature_c=26.0,
                relative_humidity_pct=65.0,
                aeration_score=score,
                recommendation=rec,
                rationale=rat,
                badge="ESTIMATED_RULE_FALLBACK"
            ))

        return WindowOracleOutput(
            is_forecast_driven=False,
            summary_advisory="Midday brief ventilation window (12:00-15:00) estimated from standard urban diurnal inversion cycles.",
            best_window_start="12:00",
            best_window_end="15:00",
            best_window_score=65,
            current_action="SEAL" if datetime.now().hour in range(6, 10) else "PURIFY",
            hourly_slots=slots,
            provenance_badge="ESTIMATED_RULE_FALLBACK",
            methodology_note="Based on empirical diurnal urban smog curves. Connect live Open-Meteo atmospheric forecast for hourly precision."
        )

    # Process hourly meteorological forecast data
    slots = []
    best_score = -1
    best_slot = None

    for entry in hourly_data:
        pm25 = float(entry.get("pm25", 80.0))
        wind = float(entry.get("wind_speed_ms", 2.0))
        temp = float(entry.get("temperature_c", 25.0))
        hum = float(entry.get("relative_humidity_pct", 60.0))
        bl_height = entry.get("boundary_layer_height_m")
        if bl_height is not None:
            bl_height = float(bl_height)

        score, rec, rat = score_hour(pm25, wind, temp, hum, bl_height)

        iso_str = entry.get("time", "2026-11-24T12:00:00Z")
        # Extract local hour string
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
            badge="FORECAST"
        )
        slots.append(slot)

        if score > best_score:
            best_score = score
            best_slot = slot

    best_start = best_slot.hour_local if best_slot else "13:00"
    best_end = f"{(int(best_start.split(':')[0]) + 2) % 24:02d}:00" if ":" in best_start else "15:00"
    current_action = slots[0].recommendation if slots else "PURIFY"

    summary = (
        f"Optimal ventilation identified between {best_start} and {best_end} (Score: {best_score}/100) "
        f"when atmospheric boundary layer expands to dilute ground emissions."
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
        methodology_note="Computed hourly from Open-Meteo atmospheric forecast (PM2.5, planetary boundary layer height, and wind dispersion dynamics)."
    )
