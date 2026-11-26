"""CPCB National Air Quality Index (NAQI) calculation engine.

Implements Indian NAQI sub-indices and composite index computation using
statutory Central Pollution Control Board piecewise-linear breakpoints.
"""

from functools import lru_cache

from app.engines.naqi_data import (
    AQI_CATEGORIES,
    CPCB_BREAKPOINTS,
    INCOMPLETE_DATA_COLOR,
    MAX_NAQI_INDEX,
    MIN_REQUIRED_POLLUTANTS,
    PARTICULATE_KEYS,
    NAQIResult,
    SubIndexResult,
    get_cpcb_breakpoints_table,
)

__all__ = [
    "AQI_CATEGORIES",
    "CPCB_BREAKPOINTS",
    "MAX_NAQI_INDEX",
    "MIN_REQUIRED_POLLUTANTS",
    "PARTICULATE_KEYS",
    "NAQIResult",
    "SubIndexResult",
    "calculate_cpcb_naqi",
    "calculate_sub_index",
    "get_category_info",
    "get_cpcb_breakpoints_table",
]


def _normalize_pollutant_key(pollutant: str) -> str:
    """Normalize pollutant identifier string for breakpoint lookup."""
    return pollutant.strip().lower().replace(".", "").replace("-", "").replace("_", "")


@lru_cache(maxsize=256)
def calculate_sub_index(pollutant: str, conc: float) -> int | None:
    """Compute a single pollutant sub-index via piecewise-linear interpolation.

    Args:
        pollutant: Pollutant key such as ``pm25``, ``pm10``, ``no2``, or ``co``.
        conc: Measured pollutant concentration (non-negative).

    Returns:
        Rounded integer sub-index, or ``None`` for negative/unsupported inputs.
    """
    key = _normalize_pollutant_key(pollutant)
    breakpoints = CPCB_BREAKPOINTS.get(key)
    if breakpoints is None or conc < 0:
        return None
    for b_lo, b_hi, i_lo, i_hi in breakpoints:
        if conc <= b_hi:
            span = b_hi - b_lo
            return i_hi if span <= 0 else round(((i_hi - i_lo) / span) * (conc - b_lo) + i_lo)
    return MAX_NAQI_INDEX


@lru_cache(maxsize=64)
def get_category_info(aqi: int) -> tuple[str, str, str]:
    """Return ``(category_name, hex_color, advisory)`` for a numeric NAQI score."""
    for low, high, cat, color, adv in AQI_CATEGORIES:
        if low <= aqi <= high:
            return cat, color, adv
    return (
        "Severe",
        "#8B1E3F",
        "Emergency conditions. Serious health impacts for entire population.",
    )


def _compute_sub_indices(readings: dict[str, float]) -> tuple[dict[str, SubIndexResult], bool]:
    """Compute sub-index entries for valid pollutants and flag particulate presence."""
    sub_indices: dict[str, SubIndexResult] = {}
    has_particulate = False
    for poll, conc in readings.items():
        if conc < 0:
            continue
        key = _normalize_pollutant_key(poll)
        idx = calculate_sub_index(key, conc)
        if idx is None:
            continue
        unit = "mg/m³" if key == "co" else "µg/m³"
        cat, col, _ = get_category_info(idx)
        sub_indices[key] = SubIndexResult(
            pollutant=key.upper(),
            concentration=round(conc, 2),
            unit=unit,
            sub_index=idx,
            category=cat,
            color=col,
        )
        if key in PARTICULATE_KEYS:
            has_particulate = True
    return sub_indices, has_particulate


def _build_incomplete_naqi(
    sub_indices: dict[str, SubIndexResult], advisory: str, notes: str
) -> NAQIResult:
    """Build an explicit invalid NAQI payload when CPCB validity criteria are unmet."""
    return NAQIResult(
        is_valid=False,
        aqi=None,
        category="Incomplete Data",
        color=INCOMPLETE_DATA_COLOR,
        dominant_pollutant=None,
        health_advisory=advisory,
        sub_indices=sub_indices,
        validity_notes=notes,
    )


def _select_dominant_pollutant(sub_indices: dict[str, SubIndexResult]) -> tuple[int, str]:
    """Return the maximum sub-index score and its owning pollutant label."""
    dominant_sub = max(sub_indices.values(), key=lambda sub: sub.sub_index)
    return dominant_sub.sub_index, dominant_sub.pollutant


def _insufficient_pollutant_count(
    sub_indices: dict[str, SubIndexResult], count: int, has_particulate: bool
) -> NAQIResult:
    """Build CPCB invalid response when fewer than 3 pollutants are present."""
    missing = MIN_REQUIRED_POLLUTANTS - count
    extra = "" if has_particulate else " At least one particulate (PM2.5 or PM10) is also required."
    return _build_incomplete_naqi(
        sub_indices,
        "Data insufficient for official NAQI calculation (minimum 3 pollutants required per CPCB standards).",
        f"Monitored {count} pollutants; requires at least {missing} more.{extra}",
    )


def calculate_cpcb_naqi(readings: dict[str, float]) -> NAQIResult:
    """Compute composite statutory CPCB NAQI from raw concentrations (Time O(P*B), Space O(P))."""
    sub_indices, has_particulate = _compute_sub_indices(readings)
    count = len(sub_indices)
    if count < MIN_REQUIRED_POLLUTANTS:
        return _insufficient_pollutant_count(sub_indices, count, has_particulate)
    if not has_particulate:
        return _build_incomplete_naqi(
            sub_indices,
            "Data insufficient: CPCB rules mandate at least one particulate pollutant (PM2.5 or PM10).",
            "Particulate matter (PM2.5 or PM10) is missing from station readings.",
        )

    highest_sub, dominant = _select_dominant_pollutant(sub_indices)
    category, color, advisory = get_category_info(highest_sub)
    return NAQIResult(
        is_valid=True,
        aqi=highest_sub,
        category=category,
        color=color,
        dominant_pollutant=dominant,
        health_advisory=advisory,
        sub_indices=sub_indices,
        validity_notes="Statutory CPCB NAQI validity criteria satisfied (>= 3 parameters including particulate matter).",
    )
