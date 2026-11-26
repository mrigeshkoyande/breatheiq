"""CADR-based Air Purifier Sizing & Single-Zone Decay Kinetics Engine."""

import math

from pydantic import BaseModel, ConfigDict

from app.core.exceptions import DomainValidationError

SQFT_PER_M2 = 10.7639
CUFT_PER_M3 = 35.3147
CFM_PER_M3H = 0.588578
NATURAL_DEPOSITION_PER_HOUR = 0.2
OUTDOOR_LEAKAGE_FRACTION = 0.15
DECAY_SIMULATION_MINUTES = 60
DECAY_STEP_MINUTES = 5

PURIFIER_LIMITATIONS_NOTE = (
    "Calculated using idealized single-zone well-mixed room dynamics. "
    "Real-world efficacy depends on door sealing, interior air obstructions, filter clogging, "
    "and fan operational speed. Does not eliminate gaseous pollutants (NO2/SO2) without activated carbon."
)


class DecayPoint(BaseModel):
    """Modeled indoor PM2.5 concentration at a minute offset."""

    model_config = ConfigDict(extra="forbid")

    minute: int
    pm25_concentration: float
    reduction_pct: float


class PurifierSizingResult(BaseModel):
    """Required CADR capacity and 60-minute concentration decay profile."""

    model_config = ConfigDict(extra="forbid")

    room_area_m2: float
    room_area_sqft: float
    room_volume_m3: float
    room_volume_cuft: float
    target_ach: float
    required_cadr_m3h: float
    required_cadr_cfm: float
    time_to_50pct_min: float
    time_to_80pct_min: float
    decay_curve: list[DecayPoint]
    recommended_device_class: str
    diy_corsi_rosenthal_comparable: bool
    limitations: str
    provenance: str = "ESTIMATED_PHYSICAL_MODEL"


def _build_decay_curve(
    k_per_minute: float, initial_pm25: float, outdoor_pm25: float
) -> list[DecayPoint]:
    """Generate a 0-60 minute exponential decay profile at 5-minute intervals."""
    baseline = OUTDOOR_LEAKAGE_FRACTION * outdoor_pm25
    points: list[DecayPoint] = []
    for minute in range(0, DECAY_SIMULATION_MINUTES + 1, DECAY_STEP_MINUTES):
        decay = math.exp(-k_per_minute * minute)
        conc = max(baseline, (initial_pm25 - baseline) * decay + baseline)
        red_pct = (
            round(((initial_pm25 - conc) / initial_pm25) * 100, 1) if initial_pm25 > 0 else 0.0
        )
        points.append(
            DecayPoint(minute=minute, pm25_concentration=round(conc, 1), reduction_pct=red_pct)
        )
    return points


def _classify_device_class(required_cadr_m3h: float) -> tuple[str, bool]:
    """Classify purifier hardware tier and DIY Corsi-Rosenthal suitability."""
    if required_cadr_m3h <= 250:
        return "Compact Bedroom HEPA (200-300 m³/h CADR)", False
    if required_cadr_m3h <= 450:
        return "Mid-Size Living Room Unit (400-500 m³/h CADR)", True
    return "High-Capacity Dual-Filter or Multiple Distributed Units (500+ m³/h CADR)", True


def _validate_sizing_inputs(
    length_m: float, width_m: float, height_m: float, target_ach: float, filter_efficiency: float
) -> None:
    """Validate positive physical room dimensions, ACH, and filtration efficiency."""
    if length_m <= 0 or width_m <= 0 or height_m <= 0:
        raise DomainValidationError("Room dimensions must be positive numbers.")
    if target_ach <= 0 or filter_efficiency <= 0:
        raise DomainValidationError("Target ACH and filter efficiency must be positive.")


def calculate_purifier_sizing(
    length_m: float,
    width_m: float,
    height_m: float = 2.7,
    target_ach: float = 5.0,
    initial_pm25: float = 120.0,
    outdoor_pm25: float = 180.0,
    filter_efficiency: float = 0.99,
) -> PurifierSizingResult:
    """Compute required CADR and single-zone particulate decay curve (Time/Space O(M))."""
    _validate_sizing_inputs(length_m, width_m, height_m, target_ach, filter_efficiency)
    area_m2 = round(length_m * width_m, 2)
    volume_m3 = round(area_m2 * height_m, 2)
    required_cadr_m3h = round(volume_m3 * target_ach, 1)
    k_per_min = (
        NATURAL_DEPOSITION_PER_HOUR + (required_cadr_m3h / volume_m3) * filter_efficiency
    ) / 60.0
    device_class, diy_comp = _classify_device_class(required_cadr_m3h)
    return PurifierSizingResult(
        room_area_m2=area_m2,
        room_area_sqft=round(area_m2 * SQFT_PER_M2, 1),
        room_volume_m3=volume_m3,
        room_volume_cuft=round(volume_m3 * CUFT_PER_M3, 1),
        target_ach=target_ach,
        required_cadr_m3h=required_cadr_m3h,
        required_cadr_cfm=round(required_cadr_m3h * CFM_PER_M3H, 1),
        time_to_50pct_min=round(math.log(2) / k_per_min, 1),
        time_to_80pct_min=round(math.log(5) / k_per_min, 1),
        decay_curve=_build_decay_curve(k_per_min, initial_pm25, outdoor_pm25),
        recommended_device_class=device_class,
        diy_corsi_rosenthal_comparable=diy_comp,
        limitations=PURIFIER_LIMITATIONS_NOTE,
    )
