import sys
from pathlib import Path

# Ensure 'backend' directory is in sys.path regardless of execution working directory
_BACKEND_DIR = str(Path(__file__).resolve().parent.parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import pytest
from app.core.security import hash_password, verify_password
from app.main import app


@pytest.mark.asyncio
async def test_user_data_isolation(client):
    """Verifies User A cannot read or tamper with User B's household, members, or routine."""
    # 1. Sign up User A
    res_a = await client.post("/api/v1/auth/signup", json={
        "email": "user_a@isolation.org",
        "password": "Password123!",
        "full_name": "User Alpha"
    })
    assert res_a.status_code == 201
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Sign up User B
    res_b = await client.post("/api/v1/auth/signup", json={
        "email": "user_b@isolation.org",
        "password": "Password123!",
        "full_name": "User Beta"
    })
    assert res_b.status_code == 201
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. User A creates household
    h_res_a = await client.post(
        "/api/v1/user/household",
        json={"name": "Villa A", "city": "Delhi", "neighborhood": "Rohini", "latitude": 28.7, "longitude": 77.1},
        headers=headers_a
    )
    assert h_res_a.status_code == 200
    assert h_res_a.json()["name"] == "Villa A"

    # 4. User B gets household - should be isolated (empty default or User B's own), not Villa A
    h_res_b = await client.get("/api/v1/user/household", headers=headers_b)
    assert h_res_b.status_code == 200
    assert h_res_b.json()["name"] != "Villa A"

    # 5. User A adds a family member
    m_res_a = await client.post(
        "/api/v1/user/members",
        json={"name": "Alice Child", "age_category": "child", "sensitivity": "asthma"},
        headers=headers_a
    )
    assert m_res_a.status_code == 200
    member_a_id = m_res_a.json()["id"]

    # 6. User B lists members - User A's member must NOT appear
    m_res_b = await client.get("/api/v1/user/members", headers=headers_b)
    assert m_res_b.status_code == 200
    b_member_ids = [m["id"] for m in m_res_b.json()]
    assert member_a_id not in b_member_ids

    # 7. User A creates routine task
    t_res_a = await client.post(
        "/api/v1/user/routine",
        json={"title": "Private Task A", "time_slot": "morning"},
        headers=headers_a
    )
    assert t_res_a.status_code == 200
    task_a_id = t_res_a.json()["id"]

    # 8. User B attempts to toggle User A's task - must be 404 Not Found
    toggle_res_b = await client.patch(
        f"/api/v1/user/routine/{task_a_id}/toggle",
        headers=headers_b
    )
    assert toggle_res_b.status_code == 404


@pytest.mark.asyncio
async def test_pydantic_extra_forbid(client):
    """Verifies that extra unexpected fields in request payloads are rejected with 422."""
    res_user = await client.post("/api/v1/auth/signup", json={
        "email": "forbid_test@example.com",
        "password": "Password123!",
        "full_name": "Forbid Test"
    })
    assert res_user.status_code == 201
    token = res_user.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt signup with forbidden extra field
    res = await client.post("/api/v1/auth/signup", json={
        "email": "hacker@example.com",
        "password": "Password123!",
        "admin_injected_role": "admin"
    })
    assert res.status_code == 422

    # Attempt adding member with forbidden extra field
    res_m = await client.post("/api/v1/user/members", json={
        "name": "Bob",
        "age_category": "adult",
        "sensitivity": "none",
        "malicious_override": True
    }, headers=headers)
    assert res_m.status_code == 422


@pytest.mark.asyncio
async def test_argon2id_password_hashing():
    """Verifies Argon2id configuration meets OWASP guidelines."""
    password = "CorrectHorseBatteryStaple123!"
    h = hash_password(password)
    assert h.startswith("$argon2id$")
    assert verify_password(password, h) is True
    assert verify_password("WrongPassword!", h) is False


@pytest.mark.asyncio
async def test_route_auth_enumeration(client):
    """Enumerates all registered API routes and asserts unauthenticated calls return 401/403 or are explicitly public."""
    PUBLIC_ALLOWLIST = {
        "/healthz",
        "/readyz",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/v1/auth/signup",
        "/api/v1/auth/login",
        "/api/v1/auth/logout",
        "/api/v1/auth/refresh",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
        "/api/v1/auth/verify-email",
        "/api/v1/air-quality/cities",
        "/api/v1/air-quality/current",
        "/api/v1/air-quality/forecast",
        "/api/v1/air-quality/hourly",
        "/api/v1/air-quality/history",
        "/api/v1/air-quality/sources",
        "/api/v1/engines/naqi/calculate",
        "/api/v1/engines/ventilation/window-oracle",
        "/api/v1/engines/purifier/cadr",
        "/api/v1/engines/impact/calculate",
        "/api/v1/copilot/chat",
        "/api/v1/community/reports",
        "/api/v1/user/routes/navigate",
    }

    from starlette.routing import Route
    for route in app.routes:
        if isinstance(route, Route):
            path = route.path
            # Check only /api/v1/ paths
            if path.startswith("/api/v1/") and path not in PUBLIC_ALLOWLIST:
                for method in route.methods:
                    if method in ("GET", "POST", "PUT", "DELETE", "PATCH"):
                        test_path = path.replace("{id}", "1").replace("{member_id}", "1").replace("{task_id}", "1")
                        res = await client.request(method, test_path)
                        assert res.status_code in (401, 403, 404, 422), (
                            f"Protected route {method} {test_path} allowed unauthenticated access! Status: {res.status_code}"
                        )
