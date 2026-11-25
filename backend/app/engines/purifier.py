"""CADR-based Air Purifier Sizing & Single-Zone Decay Kinetics Engine."""

import math

from pydantic import BaseModel, ConfigDict

SQFT_PER_M2 = 10.7639
CUFT_PER_M3 = 35.3147
CFM_PER_M3H = 0.588578
NATURAL_DEPOSITION_PER_HOUR = 0.2
OUTDOOR_LEAKAGE_FRACTION = 0.15


class DecayPoint(BaseModel):
    """Modeled indoor PM2.5 value at a minute offset."""

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


def calculate_purifier_sizing(
    length_m: float,
    width_m: float,
    height_m: float = 2.7,
    target_ach: float = 5.0,
    initial_pm25: float = 120.0,
    outdoor_pm25: float = 180.0,
    filter_efficiency: float = 0.99,
) -> PurifierSizingResult:
    """Compute required CADR and single-zone particulate decay curve."""
    if length_m <= 0 or width_m <= 0 or height_m <= 0:
        raise ValueError("Room dimensions must be positive numbers.")
    if target_ach <= 0 or filter_efficiency <= 0:
        raise ValueError("Target ACH and filter efficiency must be positive.")

    area_m2 = round(length_m * width_m, 2)
    area_sqft = round(area_m2 * SQFT_PER_M2, 1)
    volume_m3 = round(area_m2 * height_m, 2)
    volume_cuft = round(volume_m3 * CUFT_PER_M3, 1)

    required_cadr_m3h = round(volume_m3 * target_ach, 1)
    required_cadr_cfm = round(required_cadr_m3h * CFM_PER_M3H, 1)

    ach_clean = (required_cadr_m3h / volume_m3) * filter_efficiency
    k_total_per_hour = NATURAL_DEPOSITION_PER_HOUR + ach_clean
    k_per_minute = k_total_per_hour / 60.0

    t_50 = round(math.log(2) / k_per_minute, 1)
    t_80 = round(math.log(5) / k_per_minute, 1)

    decay_curve: list[DecayPoint] = []
    baseline_outdoor_leakage = OUTDOOR_LEAKAGE_FRACTION * outdoor_pm25

    for minute in range(0, 61, 5):
        decay_factor = math.exp(-k_per_minute * minute)
        conc = max(
            baseline_outdoor_leakage,
            (initial_pm25 - baseline_outdoor_leakage) * decay_factor + baseline_outdoor_leakage,
        )
        red_pct = round(((initial_pm25 - conc) / initial_pm25) * 100, 1) if initial_pm25 > 0 else 0.0
        decay_curve.append(
            DecayPoint(
                minute=minute,
                pm25_concentration=round(conc, 1),
                reduction_pct=red_pct,
            )
        )

    if required_cadr_m3h <= 250:
        device_class = "Compact Bedroom HEPA (200-300 m³/h CADR)"
        diy_comp = False
    elif required_cadr_m3h <= 450:
        device_class = "Mid-Size Living Room Unit (400-500 m³/h CADR)"
        diy_comp = True
    else:
        device_class = "High-Capacity Dual-Filter or Multiple Distributed Units (500+ m³/h CADR)"
        diy_comp = True

    limitations = (
        "Calculated using idealized single-zone well-mixed room dynamics. "
        "Real-world efficacy depends on door sealing, interior air obstructions, filter clogging, "
        "and fan operational speed. Does not eliminate gaseous pollutants (NO2/SO2) without activated carbon."
    )

    return PurifierSizingResult(
        room_area_m2=area_m2,
        room_area_sqft=area_sqft,
        room_volume_m3=volume_m3,
        room_volume_cuft=volume_cuft,
        target_ach=target_ach,
        required_cadr_m3h=required_cadr_m3h,
        required_cadr_cfm=required_cadr_cfm,
        time_to_50pct_min=t_50,
        time_to_80pct_min=t_80,
        decay_curve=decay_curve,
        recommended_device_class=device_class,
        diy_corsi_rosenthal_comparable=diy_comp,
        limitations=limitations,
        provenance="ESTIMATED_PHYSICAL_MODEL",
    )
