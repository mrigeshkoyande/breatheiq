import pytest
from app.api.v1.endpoints.user_flow import compute_vulnerability_score

def test_vulnerability_score_calculation():
    assert compute_vulnerability_score("child", "asthma") == 80
    assert compute_vulnerability_score("infant", "none") == 70
    assert compute_vulnerability_score("senior", "heart_condition") == 95
    assert compute_vulnerability_score("adult", "none") == 25

@pytest.mark.asyncio
async def test_cleanroute_navigation(client):
    response = await client.post(
        "/api/v1/user/routes/navigate",
        json={
            "origin": "Andheri West",
            "destination": "BKC",
            "distance_km": 15.0,
            "departure_hour": 9
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["routes"]) == 3
    route_ids = [r["id"] for r in data["routes"]]
    assert "route_clean" in route_ids
    assert "route_metro" in route_ids
    assert "route_arterial" in route_ids

    # Metro has lowest emissions
    metro = next(r for r in data["routes"] if r["id"] == "route_metro")
    highway = next(r for r in data["routes"] if r["id"] == "route_arterial")
    assert metro["co2_emissions_kg"] < highway["co2_emissions_kg"]
    assert metro["inhaled_dose_ug"] < highway["inhaled_dose_ug"]

@pytest.mark.asyncio
async def test_auth_protected_endpoints_require_login(client):
    # Unauthenticated requests should return 401
    resp_hh = await client.get("/api/v1/user/household")
    assert resp_hh.status_code == 401

    resp_members = await client.get("/api/v1/user/members")
    assert resp_members.status_code == 401

    resp_routine = await client.get("/api/v1/user/routine")
    assert resp_routine.status_code == 401
