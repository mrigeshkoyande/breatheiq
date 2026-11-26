import pytest

from app.engines.ventilation import evaluate_window_oracle, score_hour


def test_score_hour_good_conditions():
    # PM2.5 25 ug/m3, wind 3 m/s, bl 900m -> VENTILATE_FREELY
    score, rec, _rationale = score_hour(
        pm25=25.0, wind_speed=3.0, temp_c=25.0, humidity=55.0, bl_height=900.0
    )
    assert score >= 75
    assert rec == "VENTILATE_FREELY"


def test_score_hour_severe_inversion():
    # PM2.5 220 ug/m3, wind 0.5 m/s, bl 180m -> SEAL
    score, rec, _rationale = score_hour(
        pm25=220.0, wind_speed=0.5, temp_c=16.0, humidity=85.0, bl_height=180.0
    )
    assert score < 25
    assert rec == "SEAL"


def test_score_hour_brief_flush():
    # PM2.5 70 ug/m3, moderate wind -> VENTILATE_BRIEFLY
    score, rec, _rationale = score_hour(
        pm25=70.0, wind_speed=3.5, temp_c=24.0, humidity=60.0, bl_height=650.0
    )
    assert 50 <= score < 75
    assert rec == "VENTILATE_BRIEFLY"


def test_window_oracle_fallback_when_empty():
    output = evaluate_window_oracle(hourly_data=None)
    assert output.is_forecast_driven is False
    assert output.provenance_badge == "ESTIMATED_RULE_FALLBACK"
    assert len(output.hourly_slots) == 24
    assert output.best_window_start == "12:00"


def test_window_oracle_with_forecast_data():
    sample_forecast = [
        {
            "time": "2026-11-24T06:00:00Z",
            "pm25": 190.0,
            "wind_speed_ms": 1.2,
            "temperature_c": 18.0,
            "relative_humidity_pct": 82.0,
            "boundary_layer_height_m": 220.0,
        },
        {
            "time": "2026-11-24T13:00:00Z",
            "pm25": 45.0,
            "wind_speed_ms": 3.8,
            "temperature_c": 27.0,
            "relative_humidity_pct": 52.0,
            "boundary_layer_height_m": 950.0,
        },
        {
            "time": "2026-11-24T20:00:00Z",
            "pm25": 170.0,
            "wind_speed_ms": 1.5,
            "temperature_c": 21.0,
            "relative_humidity_pct": 75.0,
            "boundary_layer_height_m": 310.0,
        },
    ]
    output = evaluate_window_oracle(hourly_data=sample_forecast)
    assert output.is_forecast_driven is True
    assert output.provenance_badge == "FORECAST"
    assert output.best_window_score >= 70
    assert output.best_window_start == "13:00"


@pytest.mark.asyncio
async def test_window_oracle_api_endpoint(client):
    response = await client.post(
        "/api/v1/engines/window-oracle", json={"lat": 19.0760, "lon": 72.8777}
    )
    assert response.status_code == 200
    data = response.json()
    assert "hourly_slots" in data
    assert len(data["hourly_slots"]) > 0
    assert "best_window_score" in data
