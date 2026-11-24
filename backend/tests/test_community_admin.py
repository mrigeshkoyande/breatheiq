import pytest
from app.core.security import create_access_token

@pytest.mark.asyncio
async def test_community_reports_feed(client):
    response = await client.get("/api/v1/community/reports")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    assert data[0]["status"] in ["UNVERIFIED", "VERIFIED"]

@pytest.mark.asyncio
async def test_community_report_creation_and_upvote(client):
    # Create test user token
    token = create_access_token(user_id=1, role="user")
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = await client.post(
        "/api/v1/community/reports",
        json={
            "report_type": "construction_dust",
            "severity": "severe",
            "location_name": "Linking Road Bandra",
            "latitude": 19.0600,
            "longitude": 72.8360,
            "description": "Loose construction debris without dust suppression"
        },
        headers=headers
    )
    assert create_resp.status_code == 200
    report = create_resp.json()
    assert report["status"] == "UNVERIFIED"
    assert report["upvote_count"] == 1

    # Upvote report
    upvote_resp = await client.post(
        f"/api/v1/community/reports/{report['id']}/verify",
        headers=headers
    )
    assert upvote_resp.status_code == 200
    upvoted = upvote_resp.json()
    assert upvoted["upvote_count"] == 2

@pytest.mark.asyncio
async def test_admin_rbac_protection(client):
    # Standard user attempting admin endpoint should receive 403 Forbidden
    user_token = create_access_token(user_id=1, role="user")
    resp = await client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {user_token}"})
    assert resp.status_code == 403

@pytest.mark.asyncio
async def test_admin_endpoints_with_admin_role(client):
    admin_token = create_access_token(user_id=3, role="admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Users list
    u_resp = await client.get("/api/v1/admin/users", headers=headers)
    assert u_resp.status_code == 200
    assert len(u_resp.json()) >= 1

    # 2. Moderation queue
    mod_resp = await client.get("/api/v1/admin/moderation/queue", headers=headers)
    assert mod_resp.status_code == 200

    # 3. AI traces
    traces_resp = await client.get("/api/v1/admin/ai-traces", headers=headers)
    assert traces_resp.status_code == 200

    # 4. Audit logs
    audit_resp = await client.get("/api/v1/admin/audit-logs", headers=headers)
    assert audit_resp.status_code == 200

    # 5. Integrations health
    health_resp = await client.get("/api/v1/admin/integrations/health", headers=headers)
    assert health_resp.status_code == 200
    assert len(health_resp.json()) >= 3
