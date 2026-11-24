import pytest
from app.engines.naqi import calculate_cpcb_naqi, calculate_sub_index, get_category_info

def test_sub_index_good_pm25():
    # PM2.5: 0 to 30 -> 0 to 50
    sub = calculate_sub_index("pm25", 15.0)
    assert sub is not None
    assert 20 <= sub <= 30

def test_sub_index_severe_pm25():
    # PM2.5: > 250 -> 401 to 500
    sub = calculate_sub_index("pm25", 280.0)
    assert sub is not None
    assert sub > 400

def test_sub_index_boundary_values():
    assert calculate_sub_index("pm25", 0.0) == 0
    assert calculate_sub_index("pm25", 30.0) == 50
    assert calculate_sub_index("pm10", 50.0) == 50
    assert calculate_sub_index("co", 1.0) == 50

def test_naqi_validity_rule_requires_three_pollutants():
    # Only 2 pollutants provided
    readings = {"pm25": 45.0, "no2": 30.0}
    result = calculate_cpcb_naqi(readings)
    assert result.is_valid is False
    assert "minimum 3 pollutants required" in result.health_advisory.lower()
    assert result.aqi is None

def test_naqi_validity_rule_requires_particulate():
    # 3 gaseous pollutants provided but NO particulate (PM2.5 or PM10)
    readings = {"no2": 35.0, "so2": 15.0, "co": 0.8}
    result = calculate_cpcb_naqi(readings)
    assert result.is_valid is False
    assert "particulate" in result.health_advisory.lower()

def test_naqi_valid_calculation_moderate():
    readings = {
        "pm25": 75.0,  # sub-index in 101-200 (Moderate)
        "pm10": 110.0, # sub-index in 101-200
        "no2": 30.0,   # Good (< 50)
        "so2": 12.0    # Good (< 50)
    }
    result = calculate_cpcb_naqi(readings)
    assert result.is_valid is True
    assert result.category == "Moderate"
    assert result.dominant_pollutant in ["PM25", "PM10"]
    assert 101 <= result.aqi <= 200

def test_naqi_valid_calculation_very_poor():
    readings = {
        "pm25": 180.0, # Very Poor (301-400)
        "pm10": 260.0, # Poor (201-300)
        "no2": 65.0,   # Satisfactory
        "so2": 25.0
    }
    result = calculate_cpcb_naqi(readings)
    assert result.is_valid is True
    assert result.category == "Very Poor"
    assert result.dominant_pollutant == "PM25"
    assert 301 <= result.aqi <= 400

@pytest.mark.asyncio
async def test_naqi_api_endpoint(client):
    response = await client.post(
        "/api/v1/engines/naqi/calculate",
        json={"readings": {"pm25": 28.0, "pm10": 42.0, "no2": 20.0}}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["category"] == "Good"
    assert data["aqi"] <= 50
