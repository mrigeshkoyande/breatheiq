import pytest


@pytest.mark.asyncio
async def test_request_body_size_limit_returns_413(client):
    oversized = "x" * 1_100_000
    res = await client.post(
        "/api/v1/engines/naqi/calculate",
        content=oversized,
        headers={"Content-Type": "application/json"},
    )
    assert res.status_code == 413


@pytest.mark.asyncio
async def test_user_flow_crud_and_cleanroute_city_grounding(client):
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": "flowtester@example.com", "password": "Password123!", "full_name": "Flow Tester"},
    )
    headers = {"Authorization": f"Bearer {signup.json()['access_token']}"}

    # Routine add, toggle, delete
    added_task = await client.post(
        "/api/v1/user/routine",
        json={"title": "Seal Living Room Doors", "time_slot": "evening", "category": "ventilation"},
        headers=headers,
    )
    assert added_task.status_code == 200
    tid = added_task.json()["id"]
    toggled = await client.patch(f"/api/v1/user/routine/{tid}/toggle", headers=headers)
    assert toggled.status_code == 200
    assert toggled.json()["is_completed"] is True
    deleted_task = await client.delete(f"/api/v1/user/routine/{tid}", headers=headers)
    assert deleted_task.status_code == 200

    # Alert rules & notification mark read
    alerts = await client.get("/api/v1/user/alerts", headers=headers)
    assert alerts.status_code == 200
    nid = alerts.json()["notifications"][0]["id"]
    read_res = await client.patch(f"/api/v1/user/alerts/{nid}/read", headers=headers)
    assert read_res.status_code == 200

    rule_res = await client.post(
        "/api/v1/user/alerts/rules",
        json={"aqi_threshold": 250, "target_member": "Kids"},
        headers=headers,
    )
    assert rule_res.status_code == 200
    rid = rule_res.json()["id"]
    del_rule = await client.delete(f"/api/v1/user/alerts/rules/{rid}", headers=headers)
    assert del_rule.status_code == 200

    # CleanRoute compares cities dynamically (Delhi higher PM2.5 than Bengaluru)
    delhi_routes = await client.post(
        "/api/v1/user/routes/navigate",
        json={"origin": "CP", "destination": "Noida", "city": "Delhi", "distance_km": 12.0, "departure_hour": 9},
    )
    blr_routes = await client.post(
        "/api/v1/user/routes/navigate",
        json={"origin": "MG Road", "destination": "Whitefield", "city": "Bengaluru", "distance_km": 12.0, "departure_hour": 9},
    )
    assert delhi_routes.status_code == 200 and blr_routes.status_code == 200
    d_hw = next(r for r in delhi_routes.json()["routes"] if r["id"] == "route_arterial")
    b_hw = next(r for r in blr_routes.json()["routes"] if r["id"] == "route_arterial")
    assert d_hw["average_pm25"] > b_hw["average_pm25"]


@pytest.mark.asyncio
async def test_admin_search_ai_traces_audit_and_integrations_health(client):
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@breatheiq.org", "password": "Password123!"},
    )
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    users = await client.get("/api/v1/admin/users?search=priya", headers=headers)
    assert users.status_code == 200
    assert any("user@breatheiq.org" == u["email"] for u in users.json())

    # Search with SQL LIKE wildcard must not throw or leak unintended regex
    wild = await client.get("/api/v1/admin/users?search=%25_admin", headers=headers)
    assert wild.status_code == 200

    traces = await client.get("/api/v1/admin/ai-traces", headers=headers)
    assert traces.status_code == 200

    audit = await client.get("/api/v1/admin/audit-logs", headers=headers)
    assert audit.status_code == 200
    assert len(audit.json()) >= 1

    health = await client.get("/api/v1/admin/integrations/health", headers=headers)
    assert health.status_code == 200
    assert len(health.json()) == 4
