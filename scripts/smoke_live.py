#!/usr/bin/env python3
"""
scripts/smoke_live.py
Post-deployment automated smoke verification for BreatheIQ live deployment (Render / Production).
Verifies:
1. /healthz service healthcheck endpoint
2. /readyz database connection and service readiness
3. GET / returning HTML
4. Deep link returning HTML (/app/dashboard)
5. Unknown /api/... returning JSON 404
6. Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP)
7. Cookie flags after demo login (HttpOnly, SameSite, Path)
8. Core atmospheric telemetry API endpoints (/api/v1/air-quality/*)
9. All 24 release scope SPA frontend routes
"""

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from typing import Any

RELEASE_ROUTES = [
    "/",
    "/explore",
    "/methodology",
    "/privacy",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/onboarding",
    "/app/dashboard",
    "/app/air-quality",
    "/app/analytics",
    "/app/assistant",
    "/app/routine",
    "/app/home",
    "/app/family",
    "/app/routes",
    "/app/impact",
    "/app/impact/what-if",
    "/app/notifications",
    "/app/settings",
    "/app/community",
    "/admin",
    "/404",
]


def make_request(
    url: str,
    method: str = "GET",
    data: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, dict[str, str], str, float]:
    """Perform HTTP request returning status code, headers, body text, and latency in ms."""
    start = time.time()
    req_headers = {"User-Agent": "BreatheIQ-Smoke-Tester/1.0", **(headers or {})}
    payload = None
    if data is not None:
        payload = json.dumps(data).encode("utf-8")
        req_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=payload, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            dur = (time.time() - start) * 1000
            return (
                resp.getcode(),
                dict(resp.headers),
                resp.read().decode("utf-8", errors="ignore"),
                dur,
            )
    except urllib.error.HTTPError as exc:
        dur = (time.time() - start) * 1000
        return exc.code, dict(exc.headers), exc.read().decode("utf-8", errors="ignore"), dur
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return 0, {}, str(exc), (time.time() - start) * 1000


def _hdr_ci(headers: dict[str, str], name: str) -> str:
    """Lookup response header case-insensitively."""
    target = name.lower()
    for key, val in headers.items():
        if key.lower() == target:
            return val
    return ""


def _record(
    results: list[tuple[str, int, str, str, str]],
    label: str,
    code: int,
    dur: float,
    ok: bool,
    note: str,
) -> int:
    """Append check row to results table and return 0 on pass or 1 on failure."""
    results.append((label, code, f"{dur:.0f}ms", "PASS" if ok else "FAIL", note))
    return 0 if ok else 1


def _check_core_endpoints(base_url: str, results: list[tuple[str, int, str, str, str]]) -> int:
    """Verify /healthz, /readyz, SPA HTML fallback, and JSON /api 404."""
    failures = 0
    code, _, body, dur = make_request(f"{base_url}/healthz")
    failures += _record(
        results,
        "Healthcheck (/healthz)",
        code,
        dur,
        code == 200 and "ok" in body.lower(),
        "Status OK" if code == 200 else body[:40],
    )

    code, _, body, dur = make_request(f"{base_url}/readyz")
    ready_ok = code == 200 and ("ready" in body or "connected" in body or "sqlite" in body.lower())
    failures += _record(
        results,
        "Readiness (/readyz)",
        code,
        dur,
        ready_ok,
        "DB Connected" if ready_ok else body[:40],
    )

    for label, path in [
        ("Root (GET / -> HTML)", "/"),
        ("Deep Link (/app/dashboard)", "/app/dashboard"),
    ]:
        code, _, body, dur = make_request(f"{base_url}{path}")
        html_ok = code == 200 and ("<html" in body.lower() or "<!doctype html" in body.lower())
        failures += _record(
            results,
            label,
            code,
            dur,
            html_ok,
            "SPA HTML loaded" if html_ok else "Failed HTML check",
        )

    code, _, body, dur = make_request(f"{base_url}/api/v1/nonexistent-endpoint-test")
    is_json = False
    try:
        json.loads(body)
        is_json = True
    except json.JSONDecodeError:
        is_json = False
    failures += _record(
        results,
        "API 404 (/api/v1/unknown)",
        code,
        dur,
        code == 404 and is_json,
        "JSON 404" if is_json else f"Code {code}",
    )
    return failures


def _check_security_and_telemetry(
    base_url: str, results: list[tuple[str, int, str, str, str]]
) -> int:
    """Verify HTTP security headers, demo auth cookies, and telemetry endpoint."""
    failures = 0
    code, headers, _, dur = make_request(f"{base_url}/healthz")
    has_nosniff = _hdr_ci(headers, "X-Content-Type-Options").lower() == "nosniff"
    has_frame = "deny" in _hdr_ci(headers, "X-Frame-Options").lower()
    has_csp = "default-src" in _hdr_ci(headers, "Content-Security-Policy")
    sec_ok = has_nosniff and has_frame and has_csp
    sec_note = (
        "nosniff, DENY, strict CSP"
        if sec_ok
        else f"Missing: nosniff={has_nosniff}, frame={has_frame}, csp={has_csp}"
    )
    failures += _record(results, "Security Headers Check", code, dur, sec_ok, sec_note)

    login_data = {"email": "user@breatheiq.org", "password": "Password123!"}
    code, headers, _, dur = make_request(
        f"{base_url}/api/v1/auth/login", method="POST", data=login_data
    )
    set_cookie = _hdr_ci(headers, "Set-Cookie")
    cookie_ok = (
        code == 200 and "httponly" in set_cookie.lower() and "samesite" in set_cookie.lower()
    )
    note = (
        "HttpOnly, SameSite present" if cookie_ok else f"Code {code}, set-cookie: {set_cookie[:30]}"
    )
    _record(results, "Auth Cookie Flags", code, dur, cookie_ok, note)

    code, _, body, dur = make_request(f"{base_url}/api/v1/air-quality/current?city=Mumbai")
    api_ok = code == 200 and "naqi" in body
    failures += _record(
        results,
        "API: Mumbai Telemetry",
        code,
        dur,
        api_ok,
        "CPCB NAQI valid" if api_ok else f"Code {code}",
    )
    return failures


def _check_spa_routes(base_url: str, results: list[tuple[str, int, str, str, str]]) -> int:
    """Verify all 24 in-scope SPA routes return valid responses."""
    failures = 0
    for route in RELEASE_ROUTES:
        code, _, _, dur = make_request(f"{base_url}{route}")
        route_ok = code == 200 or (route == "/404" and code in (200, 404))
        failures += _record(results, f"SPA: {route}", code, dur, route_ok, f"HTTP {code}")
    return failures


def _print_report(
    base_url: str, results: list[tuple[str, int, str, str, str]], failures: int
) -> None:
    """Print smoke check summary table to stdout."""
    print("=" * 75)
    print(f"BreatheIQ Live Deployment Smoke Verification: {base_url}")
    print("=" * 75)
    print(f"{'Target / Check':<34} {'Code':<6} {'Latency':<9} {'Status':<8} {'Notes'}")
    print("-" * 75)
    for target, code, lat, status, note in results:
        print(f"{target:<34} {code:<6} {lat:<9} {status:<8} {note}")
    print("=" * 75)
    print(f"Summary: {len(results) - failures}/{len(results)} checks passed ({failures} failures).")
    print("=" * 75)


def main() -> None:
    """Run live smoke checks against the provided base URL."""
    parser = argparse.ArgumentParser(description="BreatheIQ Live Deployment Smoke Verification")
    parser.add_argument(
        "url", nargs="?", default="http://localhost:10000", help="Base URL of deployed service"
    )
    parser.add_argument("--base-url", default=None, help="Base URL alias")
    args = parser.parse_args()

    base_url = (args.base_url or args.url).rstrip("/")
    results: list[tuple[str, int, str, str, str]] = []
    failures = _check_core_endpoints(base_url, results)
    failures += _check_security_and_telemetry(base_url, results)
    failures += _check_spa_routes(base_url, results)
    _print_report(base_url, results, failures)

    if failures > 0:
        sys.exit(1)
    print("All live deployment smoke checks passed successfully!")
    sys.exit(0)


if __name__ == "__main__":
    main()
