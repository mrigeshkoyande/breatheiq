import pytest
from app.services.air_data import air_data_service, DemoAirDataProvider, PRECONFIGURED_CITIES

@pytest.mark.asyncio
async def test_demo_provider_mumbai():
    demo = DemoAirDataProvider()
    payload = await demo.get_current(19.0760, 72.8777, "Mumbai")
    assert payload.city == "Mumbai"
    assert payload.source == "DEMO"
    assert payload.confidence_score > 0.8
    assert payload.pm25 > 0
    assert payload.naqi.is_valid is True

@pytest.mark.asyncio
async def test_demo_provider_forecast():
    demo = DemoAirDataProvider()
    forecast = await demo.get_forecast(28.6139, 77.2090, hours=24)
    assert len(forecast) == 24
    assert forecast[0]["pm25"] > 0
    assert "wind_speed_ms" in forecast[0]
    assert "boundary_layer_height_m" in forecast[0]

def test_cities_list():
    cities = air_data_service.get_cities()
    city_names = [c["city"] for c in cities]
    assert "Mumbai" in city_names
    assert "Delhi" in city_names
    assert "Bengaluru" in city_names
    assert "Kolkata" in city_names
    assert "Pune" in city_names

@pytest.mark.asyncio
async def test_air_quality_current_api(client):
    response = await client.get("/api/v1/air-quality/current?city=Delhi")
    assert response.status_code == 200
    data = response.json()
    assert data["city"] == "Delhi"
    assert data["source"] in ["LIVE", "MODELED", "DEMO"]
    assert "naqi" in data
    assert data["naqi"]["is_valid"] is True

@pytest.mark.asyncio
async def test_air_quality_forecast_api(client):
    response = await client.get("/api/v1/air-quality/forecast?hours=12")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 12

@pytest.mark.asyncio
async def test_cities_api(client):
    response = await client.get("/api/v1/air-quality/cities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
