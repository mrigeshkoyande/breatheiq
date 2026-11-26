"""Targeted branch and edge-case tests covering auth, deps, services, engines, and main app."""

import contextlib
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import httpx
import jwt
import pytest
from starlette.requests import Request

from app.api.v1.endpoints.user_flow import compute_vulnerability_score
from app.core.config import Settings, settings
from app.core.rate_limit import get_client_key
from app.core.security import (
    create_access_token,
    create_one_time_token,
    create_refresh_token,
    hash_token,
)
from app.db.session import get_db
from app.engines import impact_data
from app.engines.naqi import calculate_cpcb_naqi
from app.engines.ventilation_rules import boundary_layer_modifier, pm25_base_score
from app.main import _domain_error_handler, _rate_limit_handler, app, build_app, lifespan
from app.models.auth import RefreshToken, User
from app.services.air_cities import match_city
from app.services.air_data import AirDataService
from app.services.air_models import _demo_diurnal_multiplier
from app.services.air_upstream import OpenAQAndMeteoProvider, parse_openaq_measurements
from app.services.auth_service import parse_refresh_claims, validate_csrf_origin
from app.services.copilot_llm import fetch_gemini_reply


def _make_request(headers: list[tuple[bytes, bytes]] | None = None) -> Request:
    scope = {
        "type": "http",
        "method": "POST",
        "scheme": "http",
        "server": ("testserver", 80),
        "path": "/api/v1/auth/refresh",
        "headers": headers or [],
        "client": ("127.0.0.1", 12345),
    }
    return Request(scope)


@pytest.mark.asyncio
async def test_deps_missing_sub_inactive_user_and_optional_auth(client):
    # Access token without subject triggers 401 in _extract_access_user_id
    bad_payload = {
        "exp": datetime.now(UTC) + timedelta(minutes=5),
        "iat": datetime.now(UTC),
        "type": "access",
    }
    no_sub_jwt = jwt.encode(bad_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    res_nosub = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {no_sub_jwt}"}
    )
    assert res_nosub.status_code == 401

    # Valid authenticated call to /assistant/chat exercises get_current_user_optional happy path
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "user@breatheiq.org", "password": "Password123!"},
    )
    user_token = login.json()["access_token"]
    chat_auth = await client.post(
        "/api/v1/assistant/chat",
        json={"message": "Check indoor PM2.5"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert chat_auth.status_code == 200

    # Deactivate user via admin -> valid pre-issued access token gets 403 on get_current_user
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@breatheiq.org", "password": "Password123!"},
    )
    admin_hdrs = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    users = (await client.get("/api/v1/admin/users", headers=admin_hdrs)).json()
    target = next(u for u in users if u["email"] == "user@breatheiq.org")

    await client.patch(
        f"/api/v1/admin/users/{target['id']}/status",
        json={"is_active": False},
        headers=admin_hdrs,
    )
    inactive_res = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {user_token}"}
    )
    assert inactive_res.status_code == 403

    await client.patch(
        f"/api/v1/admin/users/{target['id']}/status",
        json={"is_active": True},
        headers=admin_hdrs,
    )


@pytest.mark.asyncio
async def test_auth_recovery_and_token_edge_branches(client):
    # Unknown email on forgot-password still returns generic 200 without leaking existence
    unknown = await client.post(
        "/api/v1/auth/forgot-password", json={"email": "doesnotexist@example.com"}
    )
    assert unknown.status_code == 200

    # Sign up, record 1 failed login, then succeed to verify attempt counter resets cleanly
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": "clearfail@example.com", "password": "Password123!"},
    )
    uid = signup.json()["user"]["id"]
    cookie = signup.cookies["breatheiq_refresh"]

    bad_try = await client.post(
        "/api/v1/auth/login",
        json={"email": "clearfail@example.com", "password": "WrongPassword!"},
    )
    assert bad_try.status_code == 401
    good_try = await client.post(
        "/api/v1/auth/login",
        json={"email": "clearfail@example.com", "password": "Password123!"},
    )
    assert good_try.status_code == 200

    # Malformed cookie on logout is safely ignored and clears cookie
    client.cookies.set("breatheiq_refresh", "not.a.valid.jwt")
    out = await client.post("/api/v1/auth/logout")
    assert out.status_code == 200

    # Expired refresh token in DB yields 401 Session expired
    db_gen = app.dependency_overrides[get_db]()
    session = await anext(db_gen)
    _, _, jti = parse_refresh_claims(cookie)
    rec = await session.get(
        RefreshToken,
        (
            await session.execute(
                __import__("sqlalchemy")
                .select(RefreshToken.id)
                .where(RefreshToken.jti_hash == hash_token(jti))
            )
        ).scalar_one(),
    )
    assert rec is not None
    rec.expires_at = datetime.now(UTC) - timedelta(hours=2)
    await session.commit()

    client.cookies.set("breatheiq_refresh", cookie)
    exp_res = await client.post("/api/v1/auth/refresh")
    assert exp_res.status_code == 401
    assert "expired" in exp_res.json()["detail"].lower()

    # Valid unrevoked refresh token belonging to deactivated user yields 401 inactive
    user_row = await session.get(User, uid)
    assert user_row is not None
    user_row.is_active = False
    fresh_raw, fresh_hash, fresh_exp = create_refresh_token(uid, "inactive-fam")
    session.add(
        RefreshToken(
            user_id=uid,
            family_id="inactive-fam",
            jti_hash=fresh_hash,
            expires_at=fresh_exp,
        )
    )
    await session.commit()

    client.cookies.set("breatheiq_refresh", fresh_raw)
    inact_ref = await client.post("/api/v1/auth/refresh")
    assert inact_ref.status_code == 401
    assert "inactive" in inact_ref.json()["detail"].lower()

    with contextlib.suppress(StopAsyncIteration):
        await anext(db_gen)


def test_auth_service_csrf_and_refresh_parsing():
    # Allowed preview vercel origin passes CSRF check cleanly
    req_vercel = _make_request([(b"origin", b"https://breatheiq-preview.vercel.app")])
    validate_csrf_origin(req_vercel)

    # Access token sent as refresh cookie fails type guard
    access = create_access_token(1, "user")
    with pytest.raises(Exception, match="Invalid token type"):
        parse_refresh_claims(access)

    # Corrupted string fails decode guard
    with pytest.raises(Exception, match="Invalid or expired"):
        parse_refresh_claims("bad.token.data")


@pytest.mark.asyncio
async def test_user_auto_provisioning_and_repeat_reads(client):
    signup = await client.post(
        "/api/v1/auth/signup",
        json={"email": "newresident@example.com", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {signup.json()['access_token']}"}

    # First read auto-provisions defaults; second read takes existing-rows branch
    for path in (
        "/api/v1/user/routine",
        "/api/v1/user/alerts",
        "/api/v1/user/household",
        "/api/v1/user/rooms",
        "/api/v1/user/impact",
    ):
        first = await client.get(path, headers=headers)
        second = await client.get(path, headers=headers)
        assert first.status_code == 200 and second.status_code == 200

    # Unknown category defaults cleanly
    assert compute_vulnerability_score("other", "unknown") == 30


@pytest.mark.asyncio
async def test_admin_probes_engines_and_air_quality_branches(client, monkeypatch):
    # Custom lat/lon on air-quality/current hits coordinate branch
    geo_res = await client.get("/api/v1/air-quality/current?lat=18.52&lon=73.85&city=CustomTown")
    assert geo_res.status_code == 200
    assert geo_res.json()["city"] == "Pune"

    # Explicit hourly_forecast skips external forecast fetch in window-oracle
    oracle_res = await client.post(
        "/api/v1/engines/window-oracle",
        json={
            "hourly_forecast": [
                {
                    "time": "2026-01-10T14:00:00Z",
                    "pm25": 25.0,
                    "wind_speed_ms": 3.5,
                    "temperature_c": 26.0,
                    "relative_humidity_pct": 52.0,
                    "boundary_layer_height_m": 950.0,
                }
            ]
        },
    )
    assert oracle_res.status_code == 200

    # Purifier endpoint ValueError mapping -> 400
    def _raise_val(**_kwargs):
        raise ValueError("Invalid room dimensions")

    monkeypatch.setattr("app.api.v1.endpoints.engines.calculate_purifier_sizing", _raise_val)
    pur_err = await client.post(
        "/api/v1/engines/purifier-size",
        json={"length_m": 4.0, "width_m": 4.0, "height_m": 2.5, "target_ach": 5.0},
    )
    assert pur_err.status_code == 400

    # Admin integrations health with shared client returning 200 and then raising HTTPError
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@breatheiq.org", "password": "Password123!"},
    )
    hdrs = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    class _OkClient:
        async def get(self, _url: str, **_kwargs):
            return httpx.Response(200, request=httpx.Request("GET", "https://example.test"))

    class _FailClient:
        async def get(self, _url: str, **_kwargs):
            raise httpx.ConnectError("offline")

    prev_client = app.state.http_client
    try:
        app.state.http_client = _OkClient()
        ok_health = await client.get("/api/v1/admin/integrations/health", headers=hdrs)
        assert ok_health.status_code == 200
        assert ok_health.json()[0]["status"] == "HEALTHY"

        app.state.http_client = _FailClient()
        fail_health = await client.get("/api/v1/admin/integrations/health", headers=hdrs)
        assert fail_health.status_code == 200
        assert fail_health.json()[0]["status"] == "OFFLINE_DEMO_FALLBACK"
    finally:
        app.state.http_client = prev_client


def test_engines_and_config_edge_branches(tmp_path, monkeypatch):
    # NAQI extreme >500, negative ignored, unsupported ignored
    res = calculate_cpcb_naqi({"pm25": 600.0, "pm10": 620.0, "no2": 500.0, "o3": -5.0, "bad": 10.0})
    assert res.aqi == 500
    assert res.category == "Severe"

    assert pm25_base_score(350.0) == 5
    assert boundary_layer_modifier(None) == 0
    assert boundary_layer_modifier(350.0) == 0

    # load_factors handles missing and invalid YAML files gracefully
    impact_data.load_factors.cache_clear()
    monkeypatch.setattr(impact_data, "FACTORS_PATH", tmp_path / "missing.yaml")
    assert "transit_emissions" in impact_data.load_factors()

    bad_yaml = tmp_path / "bad.yaml"
    bad_yaml.write_text(": [unclosed", encoding="utf-8")
    impact_data.load_factors.cache_clear()
    monkeypatch.setattr(impact_data, "FACTORS_PATH", bad_yaml)
    assert "transit_emissions" in impact_data.load_factors()
    impact_data.load_factors.cache_clear()
    monkeypatch.undo()
    impact_data.load_factors.cache_clear()

    # Config normalizers & cookie guards
    cfg = Settings(
        DATABASE_URL="postgres://user:pass@localhost/db?sslmode=require",
        DEBUG="1",
        COOKIE_SAMESITE="NONE",
        ENVIRONMENT="demo",
    )
    assert cfg.DATABASE_URL.startswith("postgresql+asyncpg://")
    assert "ssl=require" in cfg.DATABASE_URL
    assert cfg.DEBUG is True
    assert cfg.COOKIE_SAMESITE == "none"
    assert cfg.COOKIE_SECURE is True

    cfg_empty_db = Settings(DATABASE_URL="")
    assert cfg_empty_db.DATABASE_URL.startswith("sqlite+aiosqlite:///")
    assert Settings.parse_debug_flag(object()) is False

    # Utilities: forwarded key, distant city fallback, diurnal afternoon factor
    fwd_req = _make_request([(b"x-forwarded-for", b"203.0.113.9, 10.0.0.1")])
    assert get_client_key(fwd_req) == "203.0.113.9"
    assert match_city(-33.8, 151.2, None)["city"] in (
        "Bengaluru",
        "Mumbai",
        "Delhi",
        "Pune",
        "Kolkata",
    )
    # Diurnal factors across morning/evening/afternoon
    assert _demo_diurnal_multiplier(8) == 1.25
    assert _demo_diurnal_multiplier(20) == 1.20
    assert _demo_diurnal_multiplier(13) == 0.70

    # Additional config normalizer branches
    assert Settings.normalize_database_url("postgresql://u:p@h/db").startswith(
        "postgresql+asyncpg://"
    )
    assert Settings.normalize_database_url("sqlite:///test.db").startswith("sqlite+aiosqlite:///")
    assert Settings.normalize_samesite(123) == "123"
    assert parse_openaq_measurements([{"parameter": {"name": "pm25"}, "value": -2}], "S") == (
        None,
        None,
    )


@pytest.mark.asyncio
async def test_services_upstream_llm_and_main_lifespan(monkeypatch):
    # Bounded LRU eviction & move_to_end in AirDataService
    svc = AirDataService()
    monkeypatch.setattr(settings, "CACHE_MAX_SIZE", 2)
    await svc.get_current_air_quality(19.07, 72.87, "Mumbai")
    await svc.get_current_air_quality(28.61, 77.20, "Delhi")
    await svc.get_current_air_quality(12.97, 77.59, "Bengaluru")
    svc._store_bounded(
        svc._current_cache, next(iter(svc._current_cache)), next(iter(svc._current_cache.values()))
    )
    assert len(svc._current_cache) <= 2

    # OpenAQAndMeteoProvider without shared client falls back gracefully on upstream transport error
    provider = OpenAQAndMeteoProvider(http_client=None)
    monkeypatch.setattr(settings, "DEMO_MODE", False)
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "OPENAQ_API_KEY", "dummy-key")
    monkeypatch.setattr(
        httpx.AsyncClient,
        "get",
        lambda *_a, **_kw: (_ for _ in ()).throw(httpx.ConnectError("no network")),
    )
    fallback_cur = await provider.get_current(19.07, 72.87, "Mumbai")
    assert fallback_cur.source == "DEMO"
    fallback_fc = await provider.get_forecast(19.07, 72.87, hours=6)
    assert len(fallback_fc) == 6

    # Copilot LLM non-200 fallback cleanly returns (None, 0)
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "fake-key")
    mock_req = SimpleNamespace(app=SimpleNamespace(state=SimpleNamespace(http_client=None)))

    async def _post_fail(*_args, **_kwargs):
        return httpx.Response(503, request=httpx.Request("POST", "https://example.test"))

    monkeypatch.setattr(httpx.AsyncClient, "post", _post_fail)
    reply, tokens = await fetch_gemini_reply(
        mock_req,  # type: ignore[arg-type]
        "Mumbai",
        "Is air safe?",
        {
            "aqi": 180,
            "category": "Moderate",
            "dominant_pollutant": "PM2.5",
            "pm25": 84.0,
            "best_window_start": "12:00",
            "best_window_end": "15:00",
            "current_action": "PURIFY",
        },
        "gemini-2.0-flash",
    )
    assert reply is None and tokens == 0

    # Main handlers + lifespan
    rl_res = await _rate_limit_handler(_make_request(), RuntimeError("slow down"))
    assert rl_res.status_code == 429
    err_res = await _domain_error_handler(_make_request(), RuntimeError("unexpected"))
    assert err_res.status_code == 500
    async with lifespan(app):
        assert app.state.http_client is not None
    assert app.state.http_client is None


@pytest.mark.asyncio
async def test_session_get_db_streaming_limit_and_spa_routing(client):
    # Real get_db dependency yields and closes a clean AsyncSession
    db_iter = get_db()
    real_sess = await anext(db_iter)
    assert real_sess is not None
    await db_iter.aclose()

    # RequestSizeLimitMiddleware rejects >1 MB chunked payload even if content-length header is absent
    oversized_bytes = b"a" * 1_100_000
    chunk_res = await client.post(
        "/api/v1/engines/naqi/calculate",
        content=oversized_bytes,
        headers={"Transfer-Encoding": "chunked", "Content-Type": "application/json"},
    )
    assert chunk_res.status_code == 413

    # serve_spa routes work when built frontend assets are present
    spa_api = await client.get("/api/nonexistent-endpoint")
    assert spa_api.status_code == 404
    assert spa_api.json()["detail"] == "Not Found"

    spa_root = await client.get("/app/dashboard")
    assert spa_root.status_code in (200, 404)

    # Admin status PATCH changing role alone (is_active omitted)
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@breatheiq.org", "password": "Password123!"},
    )
    hdrs = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    users = (await client.get("/api/v1/admin/users", headers=hdrs)).json()
    mod_u = next(u for u in users if u["email"] == "moderator@breatheiq.org")
    role_upd = await client.patch(
        f"/api/v1/admin/users/{mod_u['id']}/status",
        json={"role": "moderator"},
        headers=hdrs,
    )
    assert role_upd.status_code == 200 and role_upd.json()["role"] == "moderator"


@pytest.mark.asyncio
async def test_security_headers_prod_cors_admin_guards_and_audit_trail(client, monkeypatch):
    # Security headers include strict CSP directives, COOP, and cross-domain policy
    health_res = await client.get("/healthz")
    assert health_res.status_code == 200
    assert health_res.headers["X-Permitted-Cross-Domain-Policies"] == "none"
    assert health_res.headers["Cross-Origin-Opener-Policy"] == "same-origin"
    csp = health_res.headers["Content-Security-Policy"]
    assert "object-src 'none'" in csp
    assert "base-uri 'self'" in csp
    assert "form-action 'self'" in csp

    # Untrusted Vercel origin is rejected even outside production; preview regex disabled in prod
    with pytest.raises(Exception, match="Cross-origin cookie request rejected"):
        validate_csrf_origin(_make_request([(b"origin", b"https://evil-attacker.vercel.app")]))
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    with pytest.raises(Exception, match="Cross-origin cookie request rejected"):
        validate_csrf_origin(_make_request([(b"origin", b"https://breatheiq-preview.vercel.app")]))
    monkeypatch.undo()

    # Production FastAPI build disables Swagger/ReDoc docs and preview Vercel CORS regex
    prod_app = build_app("production")
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=prod_app), base_url="http://testserver"
    ) as prod_client:
        docs_res = await prod_client.get("/docs")
        assert docs_res.status_code == 404
        cors_prod = await prod_client.options(
            "/healthz",
            headers={
                "Origin": "https://breatheiq-preview.vercel.app",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert "access-control-allow-origin" not in cors_prod.headers

    staging_app = build_app("staging")
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=staging_app), base_url="http://testserver"
    ) as staging_client:
        cors_ok = await staging_client.options(
            "/healthz",
            headers={
                "Origin": "https://breatheiq-preview.vercel.app",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert (
            cors_ok.headers.get("access-control-allow-origin")
            == "https://breatheiq-preview.vercel.app"
        )

    # Admin cannot self-suspend or self-demote
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@breatheiq.org", "password": "Password123!"},
    )
    admin_data = admin_login.json()
    hdrs = {"Authorization": f"Bearer {admin_data['access_token']}"}
    admin_id = admin_data["user"]["id"]
    self_suspend = await client.patch(
        f"/api/v1/admin/users/{admin_id}/status",
        json={"is_active": False},
        headers=hdrs,
    )
    assert self_suspend.status_code == 400
    assert "suspend or demote" in self_suspend.json()["detail"].lower()

    self_demote = await client.patch(
        f"/api/v1/admin/users/{admin_id}/status",
        json={"role": "user"},
        headers=hdrs,
    )
    assert self_demote.status_code == 400

    # Admin actions & email verification write AuditLog entries
    users = (await client.get("/api/v1/admin/users", headers=hdrs)).json()
    regular = next(u for u in users if u["email"] == "user@breatheiq.org")
    await client.patch(
        f"/api/v1/admin/users/{regular['id']}/status",
        json={"is_active": True},
        headers=hdrs,
    )
    queue = (await client.get("/api/v1/admin/moderation/queue", headers=hdrs)).json()
    if queue:
        await client.patch(
            f"/api/v1/admin/moderation/{queue[0]['id']}",
            json={"action": "VERIFY"},
            headers=hdrs,
        )

    verify_jwt, verify_hash, _ = create_one_time_token(regular["id"], "verify_email", 30)
    db_gen = app.dependency_overrides[get_db]()
    session = await anext(db_gen)
    from app.models.auth import OneTimeToken

    session.add(
        OneTimeToken(
            user_id=regular["id"],
            jti_hash=verify_hash,
            purpose="verify_email",
            expires_at=datetime.now(UTC) + timedelta(minutes=30),
        )
    )
    await session.commit()
    verify_res = await client.post("/api/v1/auth/verify-email", json={"token": verify_jwt})
    assert verify_res.status_code == 200

    logs_res = await client.get("/api/v1/admin/audit-logs?limit=25", headers=hdrs)
    assert logs_res.status_code == 200
    actions = {entry["action"] for entry in logs_res.json()}
    assert "ADMIN_USER_STATUS_UPDATED" in actions
    assert "AUTH_EMAIL_VERIFIED" in actions
    if queue:
        assert "MODERATION_REPORT_UPDATED" in actions
    with contextlib.suppress(StopAsyncIteration):
        await anext(db_gen)
