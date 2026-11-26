import contextlib

import pytest

from app.core.config import settings
from app.core.security import create_one_time_token
from app.models.auth import OneTimeToken


@pytest.mark.asyncio
async def test_health_endpoints(client):
    res = await client.get("/healthz")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    res = await client.get("/readyz")
    assert res.status_code == 200
    assert res.json()["status"] == "ready"


@pytest.mark.asyncio
async def test_auth_config_gates_demo_mode_in_production(client, monkeypatch):
    monkeypatch.setattr(settings, "DEMO_MODE", True)
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    dev_cfg = await client.get("/api/v1/auth/config")
    assert dev_cfg.status_code == 200
    assert dev_cfg.json()["demo_mode"] is True

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    prod_cfg = await client.get("/api/v1/auth/config")
    assert prod_cfg.status_code == 200
    assert prod_cfg.json()["demo_mode"] is False


@pytest.mark.asyncio
async def test_signup_and_login_flow(client):
    signup_res = await client.post(
        "/api/v1/auth/signup",
        json={
            "email": "testuser@example.com",
            "password": "Password123!",
            "full_name": "Test User",
        },
    )
    assert signup_res.status_code == 201, signup_res.text
    data = signup_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "testuser@example.com"
    assert "breatheiq_refresh" in signup_res.cookies

    dup_res = await client.post(
        "/api/v1/auth/signup",
        json={"email": "testuser@example.com", "password": "Password123!"},
    )
    assert dup_res.status_code == 400

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    bad_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com", "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_rotation_and_reuse_detection(client):
    signup_res = await client.post(
        "/api/v1/auth/signup",
        json={"email": "rotate@example.com", "password": "Password123!"},
    )
    assert signup_res.status_code == 201
    initial_refresh_cookie = signup_res.cookies["breatheiq_refresh"]

    client.cookies.set("breatheiq_refresh", initial_refresh_cookie)
    ref1 = await client.post("/api/v1/auth/refresh")
    assert ref1.status_code == 200
    new_refresh_cookie = ref1.cookies["breatheiq_refresh"]
    assert new_refresh_cookie != initial_refresh_cookie

    client.cookies.set("breatheiq_refresh", initial_refresh_cookie)
    reuse_res = await client.post("/api/v1/auth/refresh")
    assert reuse_res.status_code == 401
    assert "compromise detected" in reuse_res.json()["detail"].lower()

    client.cookies.set("breatheiq_refresh", new_refresh_cookie)
    family_dead_res = await client.post("/api/v1/auth/refresh")
    assert family_dead_res.status_code == 401


@pytest.mark.asyncio
async def test_csrf_origin_rejected_on_refresh_and_logout(client):
    res = await client.post(
        "/api/v1/auth/refresh",
        headers={"Origin": "https://evil.untrusted.example"},
    )
    assert res.status_code == 403

    res_out = await client.post(
        "/api/v1/auth/logout",
        headers={"Origin": "https://evil.untrusted.example"},
    )
    assert res_out.status_code == 403


@pytest.mark.asyncio
async def test_account_lockout_and_rate_limiting(client):
    await client.post(
        "/api/v1/auth/signup",
        json={"email": "lockout@example.com", "password": "Password123!"},
    )
    for _ in range(5):
        r = await client.post(
            "/api/v1/auth/login",
            json={"email": "lockout@example.com", "password": "WrongPassword!"},
        )
        assert r.status_code == 401

    locked = await client.post(
        "/api/v1/auth/login",
        json={"email": "lockout@example.com", "password": "Password123!"},
    )
    assert locked.status_code == 429


@pytest.mark.asyncio
async def test_profile_update_password_change_sessions_and_delete(client):
    signup = await client.post(
        "/api/v1/auth/signup",
        json={
            "email": "profile@example.com",
            "password": "Password123!",
            "full_name": "Initial Name",
        },
    )
    token = signup.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me = await client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["full_name"] == "Initial Name"

    updated = await client.patch(
        "/api/v1/auth/me",
        json={"full_name": "Updated Resident"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["full_name"] == "Updated Resident"

    bad_pw = await client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "WrongPassword!", "new_password": "NewPassword456!"},
        headers=headers,
    )
    assert bad_pw.status_code == 400

    ok_pw = await client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "Password123!", "new_password": "NewPassword456!"},
        headers=headers,
    )
    assert ok_pw.status_code == 200

    relogin = await client.post(
        "/api/v1/auth/login",
        json={"email": "profile@example.com", "password": "NewPassword456!"},
    )
    assert relogin.status_code == 200
    new_headers = {"Authorization": f"Bearer {relogin.json()['access_token']}"}

    sessions = await client.get("/api/v1/auth/sessions", headers=new_headers)
    assert sessions.status_code == 200
    assert len(sessions.json()) >= 1
    sid = sessions.json()[0]["id"]
    rev = await client.delete(f"/api/v1/auth/sessions/{sid}", headers=new_headers)
    assert rev.status_code == 200

    deleted = await client.delete("/api/v1/auth/me", headers=new_headers)
    assert deleted.status_code == 200

    post_delete_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "profile@example.com", "password": "NewPassword456!"},
    )
    assert post_delete_login.status_code == 401


@pytest.mark.asyncio
async def test_forgot_password_reset_and_verify_email_flows(client):
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": "recovery@example.com", "password": "Password123!"},
    )
    uid = signup.json()["user"]["id"]

    # forgot-password returns safe generic message without token leak
    forgot = await client.post(
        "/api/v1/auth/forgot-password", json={"email": "recovery@example.com"}
    )
    assert forgot.status_code == 200
    assert "eyJ" not in forgot.text

    # Test single-use verify-email + reset-password via signed token persisted in DB
    from app.db.session import get_db
    from app.main import app

    raw_verify, v_hash, v_exp = create_one_time_token(uid, "verify_email")
    raw_reset, r_hash, r_exp = create_one_time_token(uid, "reset_password")

    db_gen = app.dependency_overrides[get_db]()
    session = await anext(db_gen)
    session.add(
        OneTimeToken(user_id=uid, jti_hash=v_hash, purpose="verify_email", expires_at=v_exp)
    )
    session.add(
        OneTimeToken(user_id=uid, jti_hash=r_hash, purpose="reset_password", expires_at=r_exp)
    )
    await session.commit()
    with contextlib.suppress(StopAsyncIteration):
        await anext(db_gen)

    ver = await client.post("/api/v1/auth/verify-email", json={"token": raw_verify})
    assert ver.status_code == 200

    rst = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_reset, "new_password": "ResetPassword99!"},
    )
    assert rst.status_code == 200

    # Replay of used reset token must fail
    replay = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_reset, "new_password": "AnotherPassword99!"},
    )
    assert replay.status_code == 400
