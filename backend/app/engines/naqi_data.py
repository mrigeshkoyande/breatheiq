"""Statutory CPCB National Air Quality Index (NAQI) breakpoint tables and schemas."""

from pydantic import BaseModel, ConfigDict

# Contiguous CPCB breakpoints [b_lo, b_hi] -> [i_lo, i_hi] preventing fractional gaps.
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
    "co": [
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
INCOMPLETE_DATA_COLOR = "#64748B"

AQI_CATEGORIES: list[tuple[int, int, str, str, str]] = [
    (0, 50, "Good", "#2F9E62", "Minimal impact on health; ideal for outdoor activities."),
    (51, 100, "Satisfactory", "#7CB342", "Minor breathing discomfort to sensitive individuals."),
    (
        101,
        200,
        "Moderate",
        "#F2B705",
        "Breathing discomfort to people with lung, asthma and heart diseases.",
    ),
    (201, 300, "Poor", "#F28C28", "Breathing discomfort to most people on prolonged exposure."),
    (
        301,
        400,
        "Very Poor",
        "#DC5252",
        "Respiratory illness on prolonged exposure; severe impact on sensitive groups.",
    ),
    (
        401,
        9999,
        "Severe",
        "#8B1E3F",
        "Healthy people affected and seriously impacts those with existing diseases.",
    ),
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
