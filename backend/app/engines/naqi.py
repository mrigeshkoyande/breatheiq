"""CPCB National Air Quality Index (NAQI) calculation engine.

Implements Indian NAQI sub-indices and composite index calculation using
statutory Central Pollution Control Board (CPCB) piecewise-linear breakpoints
with contiguous upper bounds so fractional concentrations never drop out.

Validity criteria:
- Minimum 3 pollutants monitored.
- At least one particulate matter pollutant (PM2.5 or PM10) must be present.
"""

from pydantic import BaseModel, ConfigDict

# Statutory CPCB breakpoints using contiguous ranges [b_lo, b_hi] -> [i_lo, i_hi].
# Matching uses first bracket where conc <= b_hi so fractional gaps (e.g. 30.05) interpolate cleanly.
CPCB_BREAKPOINTS: dict[str, list[tuple[float, float, int, int]]] = {
    "pm25": [
        (0.0, 30.0, 0, 50),
        (30.0, 60.0, 51, 100),
        (60.0, 90.0, 101, 200),
        (90.0, 120.0, 201, 300),
        (120.0, 250.0, 301, 400),
        (250.0, 500.0, 401, 500),
    ],
    "pm10": [
        (0.0, 50.0, 0, 50),
        (50.0, 100.0, 51, 100),
        (100.0, 250.0, 101, 200),
        (250.0, 350.0, 201, 300),
        (350.0, 430.0, 301, 400),
        (430.0, 500.0, 401, 500),
    ],
    "no2": [
        (0.0, 40.0, 0, 50),
        (40.0, 80.0, 51, 100),
        (80.0, 180.0, 101, 200),
        (180.0, 280.0, 201, 300),
        (280.0, 400.0, 301, 400),
        (400.0, 500.0, 401, 500),
    ],
    "so2": [
        (0.0, 40.0, 0, 50),
        (40.0, 80.0, 51, 100),
        (80.0, 380.0, 101, 200),
        (380.0, 800.0, 201, 300),
        (800.0, 1600.0, 301, 400),
        (1600.0, 2000.0, 401, 500),
    ],
    "co": [  # mg/m³ (8-hr)
        (0.0, 1.0, 0, 50),
        (1.0, 2.0, 51, 100),
        (2.0, 10.0, 101, 200),
        (10.0, 17.0, 201, 300),
        (17.0, 34.0, 301, 400),
        (34.0, 50.0, 401, 500),
    ],
    "o3": [
        (0.0, 50.0, 0, 50),
        (50.0, 100.0, 51, 100),
        (100.0, 168.0, 101, 200),
        (168.0, 208.0, 201, 300),
        (208.0, 748.0, 301, 400),
        (748.0, 1000.0, 401, 500),
    ],
    "nh3": [
        (0.0, 200.0, 0, 50),
        (200.0, 400.0, 51, 100),
        (400.0, 800.0, 101, 200),
        (800.0, 1200.0, 201, 300),
        (1200.0, 1800.0, 301, 400),
        (1800.0, 2400.0, 401, 500),
    ],
    "pb": [
        (0.0, 0.5, 0, 50),
        (0.5, 1.0, 51, 100),
        (1.0, 2.0, 101, 200),
        (2.0, 3.0, 201, 300),
        (3.0, 4.0, 301, 400),
        (4.0, 5.0, 401, 500),
    ],
}

MIN_REQUIRED_POLLUTANTS = 3
MAX_NAQI_INDEX = 500
PARTICULATE_KEYS = frozenset({"pm25", "pm10"})

AQI_CATEGORIES: list[tuple[int, int, str, str, str]] = [
    (0, 50, "Good", "#2F9E62", "Minimal impact on health; ideal for outdoor activities."),
    (51, 100, "Satisfactory", "#7CB342", "Minor breathing discomfort to sensitive individuals."),
    (101, 200, "Moderate", "#F2B705", "Breathing discomfort to people with lung, asthma and heart diseases."),
    (201, 300, "Poor", "#F28C28", "Breathing discomfort to most people on prolonged exposure."),
    (301, 400, "Very Poor", "#DC5252", "Respiratory illness on prolonged exposure; severe impact on sensitive groups."),
    (401, 9999, "Severe", "#8B1E3F", "Healthy people affected and seriously impacts those with existing diseases."),
]


class SubIndexResult(BaseModel):
    """Calculated CPCB sub-index for a single pollutant."""

    model_config = ConfigDict(extra="forbid")

    pollutant: str
    concentration: float
    unit: str
    sub_index: int
    category: str
    color: str


class NAQIResult(BaseModel):
    """Composite CPCB NAQI calculation result with provenance and validity flags."""

    model_config = ConfigDict(extra="forbid")

    is_valid: bool
    aqi: int | None = None
    category: str | None = None
    color: str | None = None
    dominant_pollutant: str | None = None
    health_advisory: str
    sub_indices: dict[str, SubIndexResult]
    validity_notes: str
    provenance: str = "COMPUTED_CPCB_NAQI"


def _normalize_pollutant_key(pollutant: str) -> str:
    return pollutant.strip().lower().replace(".", "").replace("-", "").replace("_", "")


def calculate_sub_index(pollutant: str, conc: float) -> int | None:
    """Compute a single pollutant sub-index via piecewise linear interpolation."""
    key = _normalize_pollutant_key(pollutant)
    breakpoints = CPCB_BREAKPOINTS.get(key)
    if breakpoints is None or conc < 0:
        return None

    for b_lo, b_hi, i_lo, i_hi in breakpoints:
        if conc <= b_hi:
            span = b_hi - b_lo
            if span <= 0:
                return i_hi
            sub = ((i_hi - i_lo) / span) * (conc - b_lo) + i_lo
            return round(sub)

    return MAX_NAQI_INDEX


def get_category_info(aqi: int) -> tuple[str, str, str]:
    """Return `(category_name, hex_color, advisory)` for a numeric NAQI score."""
    for low, high, cat, color, adv in AQI_CATEGORIES:
        if low <= aqi <= high:
            return cat, color, adv
    return "Severe", "#8B1E3F", "Emergency conditions. Serious health impacts for entire population."


def get_cpcb_breakpoints_table() -> dict[str, object]:
    """Return statutory CPCB breakpoint categories and ranges for UI inspection."""
    return {
        "categories": [
            {"min": lo, "max": hi, "category": cat, "color": col, "advisory": adv}
            for lo, hi, cat, col, adv in AQI_CATEGORIES
        ],
        "pollutants": {
            key: [
                {"b_lo": b_lo, "b_hi": b_hi, "i_lo": i_lo, "i_hi": i_hi}
                for b_lo, b_hi, i_lo, i_hi in brackets
            ]
            for key, brackets in CPCB_BREAKPOINTS.items()
        },
        "source": "Central Pollution Control Board (CPCB) National Air Quality Index Technical Document",
    }


def calculate_cpcb_naqi(readings: dict[str, float]) -> NAQIResult:
    """Compute statutory CPCB NAQI from pollutant concentrations.

    Expected keys: pm25, pm10, no2, so2, co (mg/m³), o3, nh3, pb.
    """
    sub_indices: dict[str, SubIndexResult] = {}
    valid_pollutants: list[str] = []
    has_particulate = False

    for poll, conc in readings.items():
        if conc is None or conc < 0:
            continue
        key = _normalize_pollutant_key(poll)
        if key not in CPCB_BREAKPOINTS:
            continue
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
        valid_pollutants.append(key)
        if key in PARTICULATE_KEYS:
            has_particulate = True

    if len(valid_pollutants) < MIN_REQUIRED_POLLUTANTS:
        missing_count = MIN_REQUIRED_POLLUTANTS - len(valid_pollutants)
        particulate_msg = (
            " At least one particulate (PM2.5 or PM10) is also required."
            if not has_particulate
            else ""
        )
        return NAQIResult(
            is_valid=False,
            aqi=None,
            category="Incomplete Data",
            color="#64748B",
            dominant_pollutant=None,
            health_advisory=(
                "Data insufficient for official NAQI calculation "
                "(minimum 3 pollutants required per CPCB standards)."
            ),
            sub_indices=sub_indices,
            validity_notes=(
                f"Monitored {len(valid_pollutants)} pollutants; requires at least {missing_count} more."
                f"{particulate_msg}"
            ),
        )

    if not has_particulate:
        return NAQIResult(
            is_valid=False,
            aqi=None,
            category="Incomplete Data",
            color="#64748B",
            dominant_pollutant=None,
            health_advisory=(
                "Data insufficient: CPCB rules mandate at least one particulate pollutant "
                "(PM2.5 or PM10)."
            ),
            sub_indices=sub_indices,
            validity_notes="Particulate matter (PM2.5 or PM10) is missing from station readings.",
        )

    highest_sub = -1
    dominant: str | None = None
    for sub in sub_indices.values():
        if sub.sub_index > highest_sub:
            highest_sub = sub.sub_index
            dominant = sub.pollutant

    category, color, advisory = get_category_info(highest_sub)

    return NAQIResult(
        is_valid=True,
        aqi=highest_sub,
        category=category,
        color=color,
        dominant_pollutant=dominant,
        health_advisory=advisory,
        sub_indices=sub_indices,
        validity_notes=(
            "Statutory CPCB NAQI validity criteria satisfied "
            "(>= 3 parameters including particulate matter)."
        ),
    )
