import sys
import re
from pathlib import Path

# Ensure 'backend' directory is in sys.path regardless of execution working directory
_BACKEND_DIR = str(Path(__file__).resolve().parent.parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import pytest
from starlette.routing import Route
from app.core.security import create_access_token, hash_password, verify_password
from app.main import app


@pytest.mark.asyncio
async def test_user_data_isolation(client):
    """Verifies User A cannot read, tamper with, or delete User B's data across all entities."""
    # 1. Sign up User A
    res_a = await client.post("/api/v1/auth/signup", json={
        "email": "user_alpha@isolation.org",
        "password": "Password123!",
        "full_name": "User Alpha"
    })
    assert res_a.status_code == 201
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Sign up User B
    res_b = await client.post("/api/v1/auth/signup", json={
        "email": "user_beta@isolation.org",
        "password": "Password123!",
        "full_name": "User Beta"
    })
    assert res_b.status_code == 201
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. User A creates household
    h_res_a = await client.post(
        "/api/v1/user/household",
        json={"name": "Villa Alpha", "city": "Delhi", "neighborhood": "Rohini", "latitude": 28.7, "longitude": 77.1},
        headers=headers_a
    )
    assert h_res_a.status_code == 200
    assert h_res_a.json()["name"] == "Villa Alpha"

    # 4. User B gets household - should be isolated (User B's own default), not Villa Alpha
    h_res_b = await client.get("/api/v1/user/household", headers=headers_b)
    assert h_res_b.status_code == 200
    assert h_res_b.json()["name"] != "Villa Alpha"

    # 5. User A adds family member
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

    # 7. User B attempts to delete User A's member - must return 404
    del_member_b = await client.delete(f"/api/v1/user/members/{member_a_id}", headers=headers_b)
    assert del_member_b.status_code == 404

    # 8. User A creates room
    r_res_a = await client.post(
        "/api/v1/user/rooms",
        json={"name": "Master Bedroom Alpha", "length_m": 5.0, "width_m": 4.0, "height_m": 2.8},
        headers=headers_a
    )
    assert r_res_a.status_code == 200
    room_a_id = r_res_a.json()["id"]

    # 9. User B lists rooms - User A's room must NOT appear
    r_res_b = await client.get("/api/v1/user/rooms", headers=headers_b)
    assert r_res_b.status_code == 200
    b_room_ids = [r["id"] for r in r_res_b.json()]
    assert room_a_id not in b_room_ids

    # 10. User B attempts to record a reading in User A's room - must return 404
    reading_res_b = await client.post(
        f"/api/v1/user/rooms/{room_a_id}/readings",
        json={"pm25": 180.0, "co2": 800.0, "temperature_c": 24.0, "humidity_pct": 50.0},
        headers=headers_b
    )
    assert reading_res_b.status_code == 404

    # 11. User B attempts to delete User A's room - must return 404
    del_room_b = await client.delete(f"/api/v1/user/rooms/{room_a_id}", headers=headers_b)
    assert del_room_b.status_code == 404

    # 12. User A creates routine task
    t_res_a = await client.post(
        "/api/v1/user/routine",
        json={"title": "Private Task Alpha", "time_slot": "morning"},
        headers=headers_a
    )
    assert t_res_a.status_code == 200
    task_a_id = t_res_a.json()["id"]

    # 13. User B attempts to toggle User A's task - must return 404
    toggle_res_b = await client.patch(
        f"/api/v1/user/routine/{task_a_id}/toggle",
        headers=headers_b
    )
    assert toggle_res_b.status_code == 404

    # 14. User B attempts to delete User A's task - must return 404
    del_task_b = await client.delete(
        f"/api/v1/user/routine/{task_a_id}",
        headers=headers_b
    )
    assert del_task_b.status_code == 404


@pytest.mark.asyncio
async def test_admin_rbac_enforcement(client):
    """Verifies standard users receive 403 Forbidden on all admin endpoints, while admins receive 200 OK."""
    # Standard user
    user_token = create_access_token(user_id=1, role="user")
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # Admin user
    admin_token = create_access_token(user_id=3, role="admin")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    admin_endpoints = [
        ("GET", "/api/v1/admin/users"),
        ("GET", "/api/v1/admin/moderation/queue"),
        ("GET", "/api/v1/admin/ai-traces"),
        ("GET", "/api/v1/admin/audit-logs"),
        ("GET", "/api/v1/admin/integrations/health"),
    ]

    for method, path in admin_endpoints:
        # Standard user -> 403 Forbidden
        user_res = await client.request(method, path, headers=user_headers)
        assert user_res.status_code == 403, f"Expected 403 for user on {path}, got {user_res.status_code}"

        # Admin user -> 200 OK
        admin_res = await client.request(method, path, headers=admin_headers)
        assert admin_res.status_code == 200, f"Expected 200 for admin on {path}, got {admin_res.status_code}"


@pytest.mark.asyncio
async def test_pydantic_extra_forbid(client):
    """Verifies that extra unexpected fields in request payloads are rejected with 422."""
    res_user = await client.post("/api/v1/auth/signup", json={
        "email": "forbid_tester@example.com",
        "password": "Password123!",
        "full_name": "Forbid Tester"
    })
    assert res_user.status_code == 201
    token = res_user.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt signup with forbidden extra field
    res = await client.post("/api/v1/auth/signup", json={
        "email": "hacker2@example.com",
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


def test_argon2id_password_hashing():
    """Verifies Argon2id configuration meets OWASP guidelines."""
    password = "CorrectHorseBatteryStaple123!"
    h = hash_password(password)
    assert h.startswith("$argon2id$")
    assert verify_password(password, h) is True
    assert verify_password("WrongPassword!", h) is False


@pytest.mark.asyncio
async def test_route_auth_enumeration(client):
    """Enumerates all registered API routes and asserts unauthenticated calls return 401 Unauthorized or are explicitly public."""
    PUBLIC_ROUTES = {
        ("GET", "/healthz"),
        ("GET", "/readyz"),
        ("GET", "/docs"),
        ("GET", "/redoc"),
        ("GET", "/openapi.json"),
        ("POST", "/api/v1/auth/signup"),
        ("POST", "/api/v1/auth/login"),
        ("POST", "/api/v1/auth/logout"),
        ("POST", "/api/v1/auth/refresh"),
        ("POST", "/api/v1/auth/forgot-password"),
        ("POST", "/api/v1/auth/reset-password"),
        ("POST", "/api/v1/auth/verify-email"),
        ("GET", "/api/v1/auth/config"),
        ("GET", "/api/v1/air-quality/cities"),
        ("GET", "/api/v1/air-quality/current"),
        ("GET", "/api/v1/air-quality/forecast"),
        ("GET", "/api/v1/engines/naqi/breakpoints"),
        ("GET", "/api/v1/engines/factors"),
        ("POST", "/api/v1/engines/naqi/calculate"),
        ("POST", "/api/v1/engines/window-oracle"),
        ("POST", "/api/v1/engines/purifier-size"),
        ("POST", "/api/v1/engines/impact/calculate"),
        ("POST", "/api/v1/assistant/chat"),
        ("POST", "/api/v1/user/routes/navigate"),
        ("GET", "/api/v1/community/reports"),
    }

    for route in app.routes:
        if isinstance(route, Route):
            path = route.path
            if path.startswith("/api/v1/"):
                for method in route.methods:
                    if method in ("GET", "POST", "PUT", "DELETE", "PATCH"):
                        if (method, path) in PUBLIC_ROUTES:
                            continue
                        test_path = re.sub(r"\{[a-zA-Z_]+\}", "1", path)
                        res = await client.request(method, test_path)
                        assert res.status_code in (401, 403), (
                            f"Protected route {method} {test_path} allowed access without auth! Status: {res.status_code}"
                        )
