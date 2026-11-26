import pytest

from app.engines.purifier import calculate_purifier_sizing


def test_purifier_sizing_standard_room():
    # 5.0m x 4.0m x 2.7m room = 54.0 m3. Target 5 ACH -> 270.0 m3/h CADR
    res = calculate_purifier_sizing(length_m=5.0, width_m=4.0, height_m=2.7, target_ach=5.0)
    assert res.room_area_m2 == 20.0
    assert res.room_volume_m3 == 54.0
    assert res.required_cadr_m3h == 270.0
    assert res.required_cadr_cfm > 150.0
    assert res.time_to_50pct_min > 0
    assert res.time_to_80pct_min > res.time_to_50pct_min
    assert len(res.decay_curve) == 13  # 0 to 60 mins step 5


def test_purifier_sizing_invalid_dimensions():
    with pytest.raises(ValueError):
        calculate_purifier_sizing(length_m=-4.0, width_m=3.0)


def test_decay_curve_reduction():
    res = calculate_purifier_sizing(length_m=4.0, width_m=3.0, height_m=2.7, initial_pm25=150.0)
    curve = res.decay_curve
    assert curve[0].minute == 0
    assert curve[0].pm25_concentration == 150.0
    assert curve[-1].minute == 60
    assert curve[-1].pm25_concentration < curve[0].pm25_concentration
    assert curve[-1].reduction_pct > 50.0


@pytest.mark.asyncio
async def test_purifier_api_endpoint(client):
    response = await client.post(
        "/api/v1/engines/purifier-size",
        json={"length_m": 4.5, "width_m": 3.8, "height_m": 2.7, "target_ach": 5.0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["required_cadr_m3h"] > 0
    assert "decay_curve" in data
