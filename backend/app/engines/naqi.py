"""
backend/app/engines/naqi.py
Calculates Indian National Air Quality Index (NAQI) sub-indices and composite score
using official Central Pollution Control Board (CPCB) statutory piecewise-linear breakpoint formulas.

Validity rule:
- Minimum 3 pollutants must be monitored.
- At least one particulate matter pollutant (PM2.5 or PM10) MUST be present.
- If invalid, returns valid=False with diagnostic explanation.
"""

from typing import Dict, Any, Optional, Tuple, List
from pydantic import BaseModel, Field

# Statutory CPCB Breakpoint Tables
# Each tuple: (B_lo, B_hi, I_lo, I_hi)
CPCB_BREAKPOINTS = {
    "pm25": [
        (0.0, 30.0, 0, 50),
        (30.1, 60.0, 51, 100),
        (60.1, 90.0, 101, 200),
        (90.1, 120.0, 201, 300),
        (120.1, 250.0, 301, 400),
        (250.1, 500.0, 401, 500),
    ],
    "pm10": [
        (0.0, 50.0, 0, 50),
        (50.1, 100.0, 51, 100),
        (100.1, 250.0, 101, 200),
        (250.1, 350.0, 201, 300),
        (350.1, 430.0, 301, 400),
        (430.1, 500.0, 401, 500),
    ],
    "no2": [
        (0.0, 40.0, 0, 50),
        (40.1, 80.0, 51, 100),
        (80.1, 180.0, 101, 200),
        (180.1, 280.0, 201, 300),
        (280.1, 400.0, 301, 400),
        (400.1, 500.0, 401, 500),
    ],
    "so2": [
        (0.0, 40.0, 0, 50),
        (40.1, 80.0, 51, 100),
        (80.1, 380.0, 101, 200),
        (380.1, 800.0, 201, 300),
        (800.1, 1600.0, 301, 400),
        (1600.1, 2000.0, 401, 500),
    ],
    "co": [  # in mg/m³
        (0.0, 1.0, 0, 50),
        (1.01, 2.0, 51, 100),
        (2.01, 10.0, 101, 200),
        (10.01, 17.0, 201, 300),
        (17.01, 34.0, 301, 400),
        (34.01, 50.0, 401, 500),
    ],
    "o3": [
        (0.0, 50.0, 0, 50),
        (50.1, 100.0, 51, 100),
        (100.1, 168.0, 101, 200),
        (168.1, 208.0, 201, 300),
        (208.1, 748.0, 301, 400),
        (748.1, 1000.0, 401, 500),
    ],
    "nh3": [
        (0.0, 200.0, 0, 50),
        (200.1, 400.0, 51, 100),
        (401.1, 800.0, 101, 200),
        (800.1, 1200.0, 201, 300),
        (1201.1, 1800.0, 301, 400),
        (1801.1, 2400.0, 401, 500),
    ],
    "pb": [
        (0.0, 0.5, 0, 50),
        (0.51, 1.0, 51, 100),
        (1.01, 2.0, 101, 200),
        (2.01, 3.0, 201, 300),
        (3.01, 4.0, 301, 400),
        (4.01, 5.0, 401, 500),
    ],
}

AQI_CATEGORIES = [
    (0, 50, "Good", "#2F9E62", "Minimal impact on health; ideal for outdoor activities."),
    (51, 100, "Satisfactory", "#7CB342", "Minor breathing discomfort to sensitive individuals."),
    (101, 200, "Moderate", "#F2B705", "Breathing discomfort to people with lung, asthma and heart diseases."),
    (201, 300, "Poor", "#F28C28", "Breathing discomfort to most people on prolonged exposure."),
    (301, 400, "Very Poor", "#DC5252", "Respiratory illness on prolonged exposure; severe impact on sensitive groups."),
    (401, 9999, "Severe", "#8B1E3F", "Healthy people affected and seriously impacts those with existing diseases."),
]

class SubIndexResult(BaseModel):
    pollutant: str
    concentration: float
    unit: str
    sub_index: int
    category: str
    color: str

class NAQIResult(BaseModel):
    is_valid: bool
    aqi: Optional[int] = None
    category: Optional[str] = None
    color: Optional[str] = None
    dominant_pollutant: Optional[str] = None
    health_advisory: str
    sub_indices: Dict[str, SubIndexResult]
    validity_notes: str
    provenance: str = "COMPUTED_CPCB_NAQI"

def calculate_sub_index(pollutant: str, conc: float) -> Optional[int]:
    """Computes a single pollutant sub-index using piecewise linear interpolation."""
    key = pollutant.lower().replace(".", "").replace("-", "")
    if key not in CPCB_BREAKPOINTS:
        return None

    if conc < 0:
        return 0

    breakpoints = CPCB_BREAKPOINTS[key]
    for b_lo, b_hi, i_lo, i_hi in breakpoints:
        if b_lo <= conc <= b_hi:
            # Linear interpolation
            sub = ((i_hi - i_lo) / (b_hi - b_lo)) * (conc - b_lo) + i_lo
            return int(round(sub))

    # Exceeds maximum breakpoint
    max_b = breakpoints[-1]
    if conc > max_b[1]:
        return 500
    return 0

def get_category_info(aqi: int) -> Tuple[str, str, str]:
    """Returns (category_name, hex_color, advisory) for a given AQI."""
    for low, high, cat, color, adv in AQI_CATEGORIES:
        if low <= aqi <= high:
            return cat, color, adv
    return "Severe", "#8B1E3F", "Emergency conditions. Serious health impacts for entire population."

def calculate_cpcb_naqi(readings: Dict[str, float]) -> NAQIResult:
    """
    Computes statutory CPCB NAQI from a dictionary of pollutant concentrations.
    Keys expected: pm25, pm10, no2, so2, co (in mg/m³), o3, nh3, pb.
    """
    sub_indices: Dict[str, SubIndexResult] = {}
    valid_pollutants = []

    has_particulate = False

    for poll, conc in readings.items():
        if conc is None or conc < 0:
            continue
        key = poll.lower().replace(".", "").replace("-", "")
        if key in CPCB_BREAKPOINTS:
            idx = calculate_sub_index(key, conc)
            if idx is not None:
                unit = "mg/m³" if key == "co" else "µg/m³"
                cat, col, _ = get_category_info(idx)
                sub_indices[key] = SubIndexResult(
                    pollutant=poll.upper(),
                    concentration=round(conc, 2),
                    unit=unit,
                    sub_index=idx,
                    category=cat,
                    color=col
                )
                valid_pollutants.append(key)
                if key in ["pm25", "pm10"]:
                    has_particulate = True

    # Check CPCB validity rules:
    # 1. Minimum 3 pollutants
    # 2. At least one particulate (PM2.5 or PM10)
    if len(valid_pollutants) < 3:
        missing_count = 3 - len(valid_pollutants)
        particulate_msg = " At least one particulate (PM2.5 or PM10) is also required." if not has_particulate else ""
        return NAQIResult(
            is_valid=False,
            aqi=None,
            category="Incomplete Data",
            color="#64748B",
            dominant_pollutant=None,
            health_advisory="Data insufficient for official NAQI calculation (minimum 3 pollutants required per CPCB standards).",
            sub_indices=sub_indices,
            validity_notes=f"Monitored {len(valid_pollutants)} pollutants; requires at least {missing_count} more.{particulate_msg}"
        )

    if not has_particulate:
        return NAQIResult(
            is_valid=False,
            aqi=None,
            category="Incomplete Data",
            color="#64748B",
            dominant_pollutant=None,
            health_advisory="Data insufficient: CPCB rules mandate at least one particulate pollutant (PM2.5 or PM10).",
            sub_indices=sub_indices,
            validity_notes="Particulate matter (PM2.5 or PM10) is missing from station readings."
        )

    # Valid composite NAQI calculation
    highest_sub = -1
    dominant = None

    for key, sub in sub_indices.items():
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
        validity_notes="Statutory CPCB NAQI validity criteria satisfied (>= 3 parameters including particulate matter)."
    )
