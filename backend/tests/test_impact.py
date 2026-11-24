import pytest
from app.engines.impact import (
    calculate_inhalation_dosage,
    calculate_transit_emission_savings,
    calculate_cumulative_impact
)

def test_inhalation_dosage_calculation():
    # Outdoor 160 ug/m3, mitigated 30 ug/m3, 8 hours, adult resting (0.5 m3/h)
    # Unprotected = 0.5 * 160 * 8 = 640 ug
    # Actual = 0.5 * 30 * 8 = 120 ug
    # Averted = 520 ug
    res = calculate_inhalation_dosage(outdoor_pm25=160.0, mitigated_pm25=30.0, duration_hours=8.0, activity_level="adult_resting")
    assert res.unprotected_inhaled_dose_ug == 640.0
    assert res.actual_inhaled_dose_ug == 120.0
    assert res.averted_inhaled_dose_ug == 520.0
    assert res.protection_efficiency_pct > 80.0
    assert res.citation != ""

def test_transit_savings_metro_vs_car():
    # 20 km transit. Car solo (180 g/km) vs Metro (18 g/km).
    # Delta = 162 g/km * 20 km = 3240 g = 3.24 kg CO2
    res = calculate_transit_emission_savings(distance_km=20.0, chosen_mode="electric_metro", baseline_mode="petrol_car_solo")
    assert res.co2_averted_kg == 3.24
    assert res.pm25_exhaust_averted_g > 0
    assert res.trees_equivalent_daily > 0

def test_cumulative_impact_summary():
    res = calculate_cumulative_impact(outdoor_pm25=150.0, indoor_purified_pm25=25.0, indoor_hours=12.0, transit_distance_km=10.0)
    assert res.daily_averted_pm25_dose_ug > 0
    assert res.daily_co2_averted_kg > 0
    assert res.provenance_badge == "ESTIMATED"
    assert res.equivalent_unfiltered_cigarettes_avoided > 0

@pytest.mark.asyncio
async def test_impact_api_endpoint(client):
    response = await client.post(
        "/api/v1/engines/impact/calculate",
        json={
            "outdoor_pm25": 140.0,
            "indoor_purified_pm25": 20.0,
            "indoor_hours": 10.0,
            "transit_distance_km": 12.0,
            "transit_mode": "electric_metro"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["daily_averted_pm25_dose_ug"] > 0
    assert data["daily_co2_averted_kg"] > 0
