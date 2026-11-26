"""Pure meteorological scoring rules and fallback curves for Window Oracle."""

from pydantic import BaseModel, ConfigDict

SCORE_VENTILATE_FREELY = 75
SCORE_VENTILATE_BRIEFLY = 50
SCORE_PURIFY = 25
HOURS_PER_DAY = 24
DEFAULT_BEST_WINDOW_DURATION_H = 2

PM25_BASE_SCORES: tuple[tuple[float, int], ...] = (
    (30.0, 90),
    (60.0, 75),
    (90.0, 55),
    (120.0, 40),
    (250.0, 20),
)

DEFAULT_PM25_SCORE = 5


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
    recommendation: str
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


def pm25_base_score(pm25: float) -> int:
    """Return baseline aeration score tier from hourly PM2.5 concentration."""
    for threshold, tier_score in PM25_BASE_SCORES:
        if pm25 <= threshold:
            return tier_score
    return DEFAULT_PM25_SCORE


def boundary_layer_modifier(bl_height: float | None) -> int:
    """Return dispersion modifier derived from planetary boundary-layer height."""
    if bl_height is None:
        return 0
    if bl_height >= 800:
        return 12
    if bl_height >= 500:
        return 5
    return -15 if bl_height < 250 else 0


def wind_modifier(wind_speed: float) -> int:
    """Return horizontal mixing modifier derived from surface wind speed (m/s)."""
    if 2.0 <= wind_speed <= 5.5:
        return 8
    if wind_speed < 1.0:
        return -10
    return -8 if wind_speed > 9.0 else 0


def humidity_modifier(humidity: float) -> int:
    """Return hygroscopic particulate trap modifier from relative humidity."""
    if humidity > 80:
        return -8
    return 5 if 40 <= humidity <= 65 else 0


def classify_aeration_score(score: int) -> tuple[str, str]:
    """Map numeric aeration suitability score to action tag and human rationale."""
    if score >= SCORE_VENTILATE_FREELY:
        return (
            "VENTILATE_FREELY",
            "Deep thermal boundary mixing and low particulate concentration. Optimal for home air exchange.",
        )
    if score >= SCORE_VENTILATE_BRIEFLY:
        return (
            "VENTILATE_BRIEFLY",
            "Moderate inversion lifting. Safe for a 10-15 minute rapid flush before closing windows.",
        )
    if score >= SCORE_PURIFY:
        return (
            "PURIFY",
            "Elevated particulate density. Keep windows sealed; operate indoor HEPA purifiers.",
        )
    return (
        "SEAL",
        "Hazardous surface stagnation or high particulate loading. Seal windows and door gaps strictly.",
    )
