import httpx
import pytest

from app.core.config import settings
from app.services.air_data import (
    AirDataService,
    DemoAirDataProvider,
    OpenAQAndMeteoProvider,
    air_data_service,
)


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
    for expected in ("Mumbai", "Delhi", "Bengaluru", "Kolkata", "Pune"):
        assert expected in city_names


@pytest.mark.asyncio
async def test_air_quality_current_api(client):
    response = await client.get("/api/v1/air-quality/current?city=Delhi")
    assert response.status_code == 200
    data = response.json()
    assert data["city"] == "Delhi"
    assert data["source"] in ["LIVE", "MODELED", "DEMO"]
    assert data["naqi"]["is_valid"] is True


@pytest.mark.asyncio
async def test_air_quality_invalid_geo_rejected(client):
    bad_lat = await client.get("/api/v1/air-quality/current?lat=190&lon=72")
    assert bad_lat.status_code == 422


@pytest.mark.asyncio
async def test_air_quality_forecast_api(client):
    response = await client.get("/api/v1/air-quality/forecast?hours=12")
    assert response.status_code == 200
    assert len(response.json()) == 12


@pytest.mark.asyncio
async def test_cities_api(client):
    response = await client.get("/api/v1/air-quality/cities")
    assert response.status_code == 200
    assert len(response.json()) >= 5


@pytest.mark.asyncio
async def test_openmeteo_modeled_and_openaq_live_mocked(monkeypatch):
    monkeypatch.setattr(settings, "DEMO_MODE", False)
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    def handler(request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        if "api.openaq.org/v3/locations/" in url and url.endswith("/latest"):
            return httpx.Response(
                200,
                json={"results": [{"parameter": {"name": "pm25"}, "value": 92.4}]},
            )
        if "api.openaq.org/v3/locations" in url:
            return httpx.Response(
                200,
                json={"results": [{"id": 777, "name": "Bandra CAAQMS"}]},
            )
        if "air-quality-api.open-meteo.com" in url and "hourly=" in url:
            return httpx.Response(
                200,
                json={
                    "hourly": {
                        "time": ["2026-11-25T10:00", "2026-11-25T13:00"],
                        "pm2_5": [110.0, 64.0],
                        "pm10": [155.0, 95.0],
                    }
                },
            )
        if "api.open-meteo.com" in url and "hourly=" in url:
            return httpx.Response(
                200,
                json={
                    "hourly": {
                        "wind_speed_10m": [2.1, 4.3],
                        "temperature_2m": [24.0, 29.0],
                        "relative_humidity_2m": [68.0, 48.0],
                        "boundary_layer_height": [310.0, 960.0],
                    }
                },
            )
        if "air-quality-api.open-meteo.com" in url:
            return httpx.Response(
                200,
                json={
                    "current": {
                        "pm2_5": 115.0,
                        "pm10": 160.0,
                        "nitrogen_dioxide": 48.0,
                        "sulphur_dioxide": 14.0,
                        "carbon_monoxide": 1400.0,
                        "ozone": 38.0,
                    }
                },
            )
        return httpx.Response(
            200,
            json={"current": {"temperature_2m": 27.5, "relative_humidity_2m": 62.0, "wind_speed_10m": 3.5}},
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as mock_client:
        monkeypatch.setattr(settings, "OPENAQ_API_KEY", "")
        provider = OpenAQAndMeteoProvider(http_client=mock_client)
        modeled = await provider.get_current(19.076, 72.8777, "Mumbai")
        assert modeled.source == "MODELED"
        assert modeled.pm25 == 115.0
        assert modeled.co == 1.4

        monkeypatch.setattr(settings, "OPENAQ_API_KEY", "test-openaq-key")
        live = await provider.get_current(19.076, 72.8777, "Mumbai")
        assert live.source == "LIVE"
        assert live.pm25 == 92.4
        assert live.station_id == "Bandra CAAQMS"

        forecast = await provider.get_forecast(19.076, 72.8777, hours=2)
        assert len(forecast) == 2
        assert forecast[1]["wind_speed_ms"] == 4.3
        assert forecast[1]["boundary_layer_height_m"] == 960.0


@pytest.mark.asyncio
async def test_upstream_failure_falls_back_to_demo_and_cache_bounds(monkeypatch):
    monkeypatch.setattr(settings, "DEMO_MODE", False)
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "CACHE_MAX_SIZE", 2)

    def failing_handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("upstream timed out")

    async with httpx.AsyncClient(transport=httpx.MockTransport(failing_handler)) as fail_client:
        service = AirDataService()
        service.set_http_client(fail_client)
        res = await service.get_current_air_quality(19.076, 72.8777, "Mumbai")
        assert res.source == "DEMO"

        fc = await service.get_forecast(19.076, 72.8777, hours=6)
        assert len(fc) == 6
        assert fc[0]["badge"] == "DEMO_FORECAST"

        # Bounded cache check
        await service.get_current_air_quality(28.61, 77.20, "Delhi")
        await service.get_current_air_quality(12.97, 77.59, "Bengaluru")
        assert len(service._current_cache) <= 2
