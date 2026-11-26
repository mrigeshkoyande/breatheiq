"""Unit tests for CleanRoute pure routing logic and domain edge cases."""

import pytest

from app.core.exceptions import DomainValidationError
from app.engines.impact import load_factors
from app.engines.purifier import calculate_purifier_sizing
from app.engines.routing import evaluate_clean_routes
from app.engines.ventilation import score_hour


def test_cleanroute_ranks_metro_and_green_lower_dose_than_highway():
    res = evaluate_clean_routes(
        origin="Andheri",
        destination="BKC",
        city="Mumbai",
        source="DEMO",
        distance_km=14.0,
        departure_hour=9,
        ambient_pm25=140.0,
    )
    by_id = {r["id"]: r for r in res["routes"]}
    assert by_id["route_metro"]["inhaled_dose_ug"] < by_id["route_clean"]["inhaled_dose_ug"]
    assert by_id["route_clean"]["inhaled_dose_ug"] < by_id["route_arterial"]["inhaled_dose_ug"]
    assert by_id["route_metro"]["co2_emissions_kg"] < by_id["route_arterial"]["co2_emissions_kg"]


def test_cleanroute_off_peak_travel_time_shorter_than_rush_hour():
    rush = evaluate_clean_routes("A", "B", "Delhi", "DEMO", 10.0, 9, 120.0)
    off = evaluate_clean_routes("A", "B", "Delhi", "DEMO", 10.0, 14, 120.0)
    assert rush["routes"][2]["travel_time_min"] > off["routes"][2]["travel_time_min"]


def test_purifier_domain_validation_and_high_capacity_tier():
    res = calculate_purifier_sizing(length_m=10.0, width_m=8.0, height_m=3.0, target_ach=5.0)
    assert res.required_cadr_m3h > 450
    assert res.diy_corsi_rosenthal_comparable is True

    with pytest.raises(DomainValidationError):
        calculate_purifier_sizing(length_m=4.0, width_m=4.0, target_ach=0.0)


def test_ventilation_high_wind_and_mid_bl_modifiers():
    score, rec, _ = score_hour(pm25=50.0, wind_speed=10.5, temp_c=24.0, humidity=45.0, bl_height=550.0)
    assert score > 0 and rec in {"VENTILATE_FREELY", "VENTILATE_BRIEFLY"}


def test_impact_load_factors_is_cached_and_valid():
    f1 = load_factors()
    f2 = load_factors()
    assert f1 is f2
    assert "transit_emissions" in f1
