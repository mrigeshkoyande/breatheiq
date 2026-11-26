"""Targeted integration tests for auth recovery, user lifecycle, community, and seeding."""

import pytest
from pydantic import TypeAdapter
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.security import create_one_time_token
from app.db.seed import DemoAccountSpec, seed_database
from app.db.session import Base
from app.models.auth import OneTimeToken
from app.services.air_data import CityConfig


@pytest.mark.asyncio
async def test_pydantic_type_adapter_supports_typed_dicts():
    """Guard against Python < 3.12 TypedDict runtime errors on FastAPI response models."""
    city_adapter = TypeAdapter(list[CityConfig])
    validated = city_adapter.validate_python(
        [
            {
                "city": "Mumbai",
                "state": "Maharashtra",
                "latitude": 19.076,
                "longitude": 72.8777,
                "base_pm25": 95.0,
                "base_pm10": 150.0,
                "base_no2": 45.0,
                "base_so2": 18.0,
                "base_co": 1.1,
                "base_o3": 42.0,
                "temp_c": 29.0,
                "humidity": 65.0,
                "wind_speed": 10.0,
            }
        ]
    )
    assert validated[0]["city"] == "Mumbai"

    account_adapter = TypeAdapter(DemoAccountSpec)
    spec = account_adapter.validate_python(
        {
            "email": "check@breatheiq.org",
            "password": "Password123!",
            "full_name": "Check User",
            "role": "user",
            "is_active": True,
            "is_verified": True,
        }
    )
    assert spec["role"] == "user"


@pytest.mark.asyncio
async def test_auth_logout_invalid_tokens_and_error_paths(client):
    # Invalid refresh / logout without cookie
    assert (await client.post("/api/v1/auth/refresh")).status_code == 401
    out_no_cookie = await client.post("/api/v1/auth/logout")
    assert out_no_cookie.status_code == 200

    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": "logouttester@example.com", "password": "Password123!"},
    )
    assert signup.status_code == 201
    token = signup.json()["access_token"]
    cookie = signup.cookies["breatheiq_refresh"]
    headers = {"Authorization": f"Bearer {token}"}

    # Revoke non-existent session returns 404
    missing_sess = await client.delete("/api/v1/auth/sessions/999999", headers=headers)
    assert missing_sess.status_code == 404

    # Logout with refresh cookie revokes that session, then logout-all succeeds
    client.cookies.set("breatheiq_refresh", cookie)
    out = await client.post("/api/v1/auth/logout")
    assert out.status_code == 200
    assert (await client.post("/api/v1/auth/logout-all", headers=headers)).status_code == 200

    # Invalid / malformed / wrong-purpose one-time tokens rejected
    assert (
        await client.post(
            "/api/v1/auth/reset-password",
            json={"token": "not.a.jwt", "new_password": "Password123!"},
        )
    ).status_code == 422
    assert (
        await client.post(
            "/api/v1/auth/reset-password",
            json={"token": "invalid.jwt.token.payload.12345", "new_password": "Password123!"},
        )
    ).status_code == 400
    assert (
        await client.post(
            "/api/v1/auth/verify-email", json={"token": "invalid.jwt.token.payload.12345"}
        )
    ).status_code == 400

    wrong_purpose, _, _ = create_one_time_token(signup.json()["user"]["id"], "verify_email")
    assert (
        await client.post(
            "/api/v1/auth/reset-password",
            json={"token": wrong_purpose, "new_password": "Password123!"},
        )
    ).status_code == 400
    assert (
        await client.post(
            "/api/v1/auth/verify-email",
            json={"token": create_one_time_token(signup.json()["user"]["id"], "reset_password")[0]},
        )
    ).status_code == 400


@pytest.mark.asyncio
async def test_user_flow_household_members_rooms_impact_and_not_found(client):
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": "lifecycle@example.com", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {signup.json()['access_token']}"}

    # Household default GET then POST update
    hh = await client.get("/api/v1/user/household", headers=headers)
    assert hh.status_code == 200
    saved = await client.post(
        "/api/v1/user/household",
        json={
            "name": "Seaface Home",
            "city": "Mumbai",
            "neighborhood": "Worli",
            "latitude": 19.0,
            "longitude": 72.8,
        },
        headers=headers,
    )
    assert saved.status_code == 200 and saved.json()["city"] == "Mumbai"

    # Members CRUD + 404
    m = await client.post(
        "/api/v1/user/members",
        json={"name": "Dada", "age_category": "senior", "sensitivity": "copd"},
        headers=headers,
    )
    assert m.status_code == 200 and m.json()["vulnerability_score"] == 65
    mid = m.json()["id"]
    assert len((await client.get("/api/v1/user/members", headers=headers)).json()) == 1
    assert (await client.delete(f"/api/v1/user/members/{mid}", headers=headers)).status_code == 200
    assert (await client.delete("/api/v1/user/members/999999", headers=headers)).status_code == 404

    # Rooms + readings CRUD + 404s
    room = await client.post(
        "/api/v1/user/rooms",
        json={
            "name": "Nursery",
            "length_m": 4.0,
            "width_m": 3.5,
            "height_m": 2.9,
            "has_purifier": True,
        },
        headers=headers,
    )
    assert room.status_code == 200
    rid = room.json()["id"]
    reading = await client.post(
        f"/api/v1/user/rooms/{rid}/readings",
        json={"pm25": 45.0, "co2": 620.0, "temperature_c": 25.0, "humidity_pct": 52.0},
        headers=headers,
    )
    assert reading.status_code == 200
    readings = await client.get(f"/api/v1/user/rooms/{rid}/readings", headers=headers)
    assert readings.status_code == 200 and len(readings.json()) >= 1
    assert (
        await client.get("/api/v1/user/rooms/999999/readings", headers=headers)
    ).status_code == 404
    assert (await client.delete(f"/api/v1/user/rooms/{rid}", headers=headers)).status_code == 200

    # Impact ledger auto-seed + totals
    imp = await client.get("/api/v1/user/impact", headers=headers)
    assert imp.status_code == 200
    assert imp.json()["clean_air_streak_days"] == 7
    assert imp.json()["total_averted_pm25_mg"] > 0

    # Missing routine, rule, notification 404 checks
    assert (
        await client.patch("/api/v1/user/routine/999999/toggle", headers=headers)
    ).status_code == 404
    assert (await client.delete("/api/v1/user/routine/999999", headers=headers)).status_code == 404
    assert (
        await client.delete("/api/v1/user/alerts/rules/999999", headers=headers)
    ).status_code == 404
    assert (
        await client.patch("/api/v1/user/alerts/999999/read", headers=headers)
    ).status_code == 404


@pytest.mark.asyncio
async def test_community_filters_and_verify_errors(client):
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": "community@example.com", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {signup.json()['access_token']}"}

    all_reports = await client.get("/api/v1/community/reports")
    assert all_reports.status_code == 200 and len(all_reports.json()) >= 1

    filtered = await client.get(
        "/api/v1/community/reports?report_type=garbage_burning&severity=hazardous"
    )
    assert filtered.status_code == 200
    assert all(r["report_type"] == "garbage_burning" for r in filtered.json())

    created = await client.post(
        "/api/v1/community/reports",
        json={
            "report_type": "industrial_smoke",
            "severity": "moderate",
            "location_name": "Chembur",
        },
        headers=headers,
    )
    assert created.status_code == 200
    rep_id = created.json()["id"]

    upvoted = await client.post(f"/api/v1/community/reports/{rep_id}/verify", headers=headers)
    assert upvoted.status_code == 200
    assert upvoted.json()["upvote_count"] == 2

    missing = await client.post("/api/v1/community/reports/999999/verify", headers=headers)
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_seed_database_is_idempotent(monkeypatch):
    """Ensure seed_database creates schema and seeds safely without duplicating rows."""
    import app.db.seed as seed_mod

    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    monkeypatch.setattr(seed_mod, "engine", engine)
    monkeypatch.setattr(seed_mod, "AsyncSessionLocal", session_factory)

    await seed_database()
    await seed_database()

    async with session_factory() as s:
        res = await s.execute(Base.metadata.tables["users"].select())
        rows = res.fetchall()
        assert len(rows) == 3

    _ = OneTimeToken
    await engine.dispose()
