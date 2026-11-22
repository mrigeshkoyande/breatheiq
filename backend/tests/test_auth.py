import pytest

@pytest.mark.asyncio
async def test_health_endpoints(client):
    res = await client.get("/healthz")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    res = await client.get("/readyz")
    assert res.status_code == 200
    assert res.json()["status"] == "ready"

@pytest.mark.asyncio
async def test_signup_and_login_flow(client):
    # Signup
    signup_res = await client.post("/api/auth/signup", json={
        "email": "testuser@example.com",
        "password": "Password123!",
        "full_name": "Test User"
    })
    assert signup_res.status_code == 201, signup_res.text
    data = signup_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "testuser@example.com"
    assert "breatheiq_refresh" in signup_res.cookies

    # Duplicate signup should fail
    dup_res = await client.post("/api/auth/signup", json={
        "email": "testuser@example.com",
        "password": "Password123!"
    })
    assert dup_res.status_code == 400

    # Login
    login_res = await client.post("/api/auth/login", json={
        "email": "testuser@example.com",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Login with bad password
    bad_login = await client.post("/api/auth/login", json={
        "email": "testuser@example.com",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

@pytest.mark.asyncio
async def test_refresh_token_rotation_and_reuse_detection(client):
    # Signup to get initial cookie
    signup_res = await client.post("/api/auth/signup", json={
        "email": "rotate@example.com",
        "password": "Password123!"
    })
    assert signup_res.status_code == 201, signup_res.text
    initial_refresh_cookie = signup_res.cookies["breatheiq_refresh"]

    # First refresh (valid)
    client.cookies.set("breatheiq_refresh", initial_refresh_cookie)
    ref1 = await client.post("/api/auth/refresh")
    assert ref1.status_code == 200
    new_refresh_cookie = ref1.cookies["breatheiq_refresh"]
    assert new_refresh_cookie != initial_refresh_cookie

    # Attempt to reuse old rotated token (reuse attack!)
    client.cookies.set("breatheiq_refresh", initial_refresh_cookie)
    reuse_res = await client.post("/api/auth/refresh")
    assert reuse_res.status_code == 401
    assert "compromise detected" in reuse_res.json()["detail"].lower()

    # Legitimate token should now also be invalidated because whole family was revoked
    client.cookies.set("breatheiq_refresh", new_refresh_cookie)
    family_dead_res = await client.post("/api/auth/refresh")
    assert family_dead_res.status_code == 401
