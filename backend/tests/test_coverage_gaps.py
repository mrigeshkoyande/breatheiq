import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.exc import SQLAlchemyError

from app.core.security import create_access_token
from app.db.session import get_db
from app.main import app


@pytest.mark.asyncio
async def test_deps_auth_error_branches(client):
    # Invalid / malformed bearer token
    bad = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert bad.status_code == 401

    # Refresh token passed as Bearer access token must fail type validation
    from app.core.security import create_refresh_token

    raw_refresh, _, _ = create_refresh_token(1, "fam-1")
    wrong_type = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {raw_refresh}"})
    assert wrong_type.status_code == 401

    # Non-existent user ID in valid access JWT
    ghost_access = create_access_token(999999, "user")
    ghost = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {ghost_access}"})
    assert ghost.status_code == 401

    # Public assistant optional dependency ignores malformed bearer safely
    copilot_res = await client.post(
        "/api/v1/assistant/chat",
        json={"message": "What is the current AQI in Mumbai?"},
        headers={"Authorization": "Bearer broken.token"},
    )
    assert copilot_res.status_code == 200


@pytest.mark.asyncio
async def test_admin_moderation_reject_user_status_and_404s(client):
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@breatheiq.org", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    # Fetch users and deactivate then reactivate demo user
    users = (await client.get("/api/v1/admin/users", headers=headers)).json()
    demo_u = next(u for u in users if u["email"] == "user@breatheiq.org")

    deact = await client.patch(
        f"/api/v1/admin/users/{demo_u['id']}/status",
        json={"is_active": False},
        headers=headers,
    )
    assert deact.status_code == 200 and deact.json()["is_active"] is False

    # Inactive user login and API access denied with 403
    login_disabled = await client.post(
        "/api/v1/auth/login",
        json={"email": "user@breatheiq.org", "password": "Password123!"},
    )
    assert login_disabled.status_code == 403

    react = await client.patch(
        f"/api/v1/admin/users/{demo_u['id']}/status",
        json={"is_active": True, "role": "user"},
        headers=headers,
    )
    assert react.status_code == 200 and react.json()["is_active"] is True

    # Unknown user status update -> 404
    missing_user = await client.patch(
        "/api/v1/admin/users/999999/status",
        json={"is_active": False},
        headers=headers,
    )
    assert missing_user.status_code == 404

    # Community report reject flow and 404
    created_rep = await client.post(
        "/api/v1/community/reports",
        json={"report_type": "construction_dust", "severity": "moderate", "location_name": "Parel"},
        headers=headers,
    )
    rep_id = created_rep.json()["id"]
    rejected = await client.patch(
        f"/api/v1/admin/moderation/{rep_id}",
        json={"action": "REJECT"},
        headers=headers,
    )
    assert rejected.status_code == 200
    assert "REJECTED" in rejected.json()["message"]

    missing_rep = await client.patch(
        "/api/v1/admin/moderation/999999",
        json={"action": "VERIFY"},
        headers=headers,
    )
    assert missing_rep.status_code == 404


@pytest.mark.asyncio
async def test_user_flow_missing_resource_404s_and_reads(client):
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": "edgeflow@example.com", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {signup.json()['access_token']}"}

    # Initial GET provisioning + update existing household
    hh1 = await client.get("/api/v1/user/household", headers=headers)
    assert hh1.status_code == 200
    hh2 = await client.post(
        "/api/v1/user/household",
        json={"name": "New Home", "city": "Pune", "neighborhood": "Kothrud", "latitude": 18.5, "longitude": 73.8},
        headers=headers,
    )
    assert hh2.status_code == 200 and hh2.json()["city"] == "Pune"

    # Rooms + default readings + impact + missing IDs
    rooms = await client.get("/api/v1/user/rooms", headers=headers)
    room_id = rooms.json()[0]["id"]
    readings = await client.get(f"/api/v1/user/rooms/{room_id}/readings", headers=headers)
    assert readings.status_code == 200 and len(readings.json()) >= 1

    impact = await client.get("/api/v1/user/impact", headers=headers)
    assert impact.status_code == 200 and impact.json()["clean_air_streak_days"] == 7

    for path in (
        "/api/v1/user/members/99999",
        "/api/v1/user/rooms/99999",
        "/api/v1/user/routine/99999",
        "/api/v1/user/alerts/rules/99999",
    ):
        r = await client.delete(path, headers=headers)
        assert r.status_code == 404

    assert (await client.patch("/api/v1/user/alerts/99999/read", headers=headers)).status_code == 404
    assert (await client.get("/api/v1/user/rooms/99999/readings", headers=headers)).status_code == 404
    assert (
        await client.patch("/api/v1/user/routine/99999/toggle", headers=headers)
    ).status_code == 404


@pytest.mark.asyncio
async def test_air_quality_default_and_readyz_degraded_branch(test_db):
    _ = test_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        default_air = await ac.get("/api/v1/air-quality/current")
        assert default_air.status_code == 200
        assert default_air.json()["city"] == "Mumbai"

    class BrokenSession:
        async def execute(self, *_args, **_kwargs):
            raise SQLAlchemyError("simulated connection drop")

    async def _broken_db():
        yield BrokenSession()

    prev = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = _broken_db
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            degraded = await ac.get("/readyz")
            assert degraded.status_code == 200
            assert degraded.json()["status"] == "degraded"
    finally:
        if prev is not None:
            app.dependency_overrides[get_db] = prev
