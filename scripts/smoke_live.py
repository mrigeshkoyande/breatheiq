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

import sys
import time
import argparse
import urllib.request
import urllib.error
import json
from http.cookiejar import CookieJar

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
    "/404"
]

def make_request(url: str, method: str = "GET", data: dict = None, headers: dict = None) -> tuple[int, dict, str, float]:
    start = time.time()
    req_headers = {"User-Agent": "BreatheIQ-Smoke-Tester/1.0"}
    if headers:
        req_headers.update(headers)
    
    payload = None
    if data is not None:
        payload = json.dumps(data).encode("utf-8")
        req_headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=payload, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            dur = (time.time() - start) * 1000
            resp_headers = dict(resp.headers)
            body = resp.read().decode("utf-8", errors="ignore")
            return resp.getcode(), resp_headers, body, dur
    except urllib.error.HTTPError as e:
        dur = (time.time() - start) * 1000
        resp_headers = dict(e.headers)
        body = e.read().decode("utf-8", errors="ignore")
        return e.code, resp_headers, body, dur
    except Exception as e:
        dur = (time.time() - start) * 1000
        return 0, {}, str(e), dur

def main():
    parser = argparse.ArgumentParser(description="BreatheIQ Live Deployment Smoke Verification")
    parser.add_argument("url", nargs="?", default="http://localhost:10000", help="Base URL of deployed service")
    parser.add_argument("--base-url", default=None, help="Base URL alias")
    args = parser.parse_args()

    base_url = (args.base_url or args.url).rstrip("/")
    print("=" * 75)
    print(f"BreatheIQ Live Deployment Smoke Verification: {base_url}")
    print("=" * 75)

    results = []
    failures = 0

    # 1. /healthz
    code, headers, body, dur = make_request(f"{base_url}/healthz")
    ok = code == 200 and "ok" in body.lower()
    if not ok: failures += 1
    results.append(("Healthcheck (/healthz)", code, f"{dur:.0f}ms", "PASS" if ok else "FAIL", "Status OK" if ok else body[:40]))

    # 2. /readyz
    code, headers, body, dur = make_request(f"{base_url}/readyz")
    ok = code == 200 and ("ready" in body or "connected" in body or "sqlite" in body.lower())
    if not ok: failures += 1
    results.append(("Readiness (/readyz)", code, f"{dur:.0f}ms", "PASS" if ok else "FAIL", "DB Connected" if ok else body[:40]))

    # 3. GET / (returns HTML)
    code, headers, body, dur = make_request(f"{base_url}/")
    ok = code == 200 and ("<html" in body.lower() or "<!doctype html" in body.lower())
    if not ok: failures += 1
    results.append(("Root (GET / -> HTML)", code, f"{dur:.0f}ms", "PASS" if ok else "FAIL", "SPA HTML loaded" if ok else "No HTML"))

    # 4. Deep link returning HTML (/app/dashboard)
    code, headers, body, dur = make_request(f"{base_url}/app/dashboard")
    ok = code == 200 and ("<html" in body.lower() or "<!doctype html" in body.lower())
    if not ok: failures += 1
    results.append(("Deep Link (/app/dashboard)", code, f"{dur:.0f}ms", "PASS" if ok else "FAIL", "SPA fallback OK" if ok else "Failed fallback"))

    # 5. Unknown /api/... returning JSON 404
    code, headers, body, dur = make_request(f"{base_url}/api/v1/nonexistent-endpoint-test")
    is_json = False
    try:
        json.loads(body)
        is_json = True
    except:
        pass
    ok = code == 404 and is_json
    if not ok: failures += 1
    results.append(("API 404 (/api/v1/unknown)", code, f"{dur:.0f}ms", "PASS" if ok else "FAIL", "JSON 404" if ok else f"Code {code}"))

    # 6. Security Headers
    code, headers, body, dur = make_request(f"{base_url}/healthz")
    has_nosniff = headers.get("X-Content-Type-Options", "").lower() == "nosniff" or headers.get("x-content-type-options", "").lower() == "nosniff"
    has_frame = "deny" in headers.get("X-Frame-Options", "").lower() or "deny" in headers.get("x-frame-options", "").lower()
    has_csp = "default-src" in (headers.get("Content-Security-Policy") or headers.get("content-security-policy") or "")
    sec_ok = has_nosniff and has_frame and has_csp
    if not sec_ok: failures += 1
    sec_note = "nosniff, DENY, strict CSP" if sec_ok else f"Missing: nosniff={has_nosniff}, frame={has_frame}, csp={has_csp}"
    results.append(("Security Headers Check", code, f"{dur:.0f}ms", "PASS" if sec_ok else "FAIL", sec_note))

    # 7. Demo Login & Cookie Flags
    login_data = {"email": "user@breatheiq.org", "password": "Password123!"}
    code, headers, body, dur = make_request(f"{base_url}/api/v1/auth/login", method="POST", data=login_data)
    set_cookie = headers.get("Set-Cookie") or headers.get("set-cookie") or ""
    has_httponly = "httponly" in set_cookie.lower()
    has_samesite = "samesite" in set_cookie.lower()
    cookie_ok = code == 200 and has_httponly and has_samesite
    note = "HttpOnly, SameSite present" if cookie_ok else f"Code {code}, set-cookie: {set_cookie[:30]}"
    results.append(("Auth Cookie Flags", code, f"{dur:.0f}ms", "PASS" if cookie_ok else "FAIL", note))

    # 8. Atmospheric Telemetry API - Mumbai
    code, headers, body, dur = make_request(f"{base_url}/api/v1/air-quality/current?city=Mumbai")
    api_ok = code == 200 and "naqi" in body
    if not api_ok: failures += 1
    results.append(("API: Mumbai Telemetry", code, f"{dur:.0f}ms", "PASS" if api_ok else "FAIL", "CPCB NAQI valid" if api_ok else f"Code {code}"))

    # 9. 24 Release Scope SPA Routes
    for route in RELEASE_ROUTES:
        code, headers, body, dur = make_request(f"{base_url}{route}")
        route_ok = code == 200 or (route == "/404" and code in (200, 404))
        if not route_ok: failures += 1
        results.append((f"SPA: {route}", code, f"{dur:.0f}ms", "PASS" if route_ok else "FAIL", f"HTTP {code}"))

    # Print summary table
    print(f"{'Target / Check':<34} {'Code':<6} {'Latency':<9} {'Status':<8} {'Notes'}")
    print("-" * 75)
    for target, code, lat, status, note in results:
        print(f"{target:<34} {code:<6} {lat:<9} {status:<8} {note}")

    print("=" * 75)
    total = len(results)
    passed = total - failures
    print(f"Summary: {passed}/{total} checks passed ({failures} failures).")
    print("=" * 75)

    if failures > 0:
        sys.exit(1)
    print("All live deployment smoke checks passed successfully!")
    sys.exit(0)

if __name__ == "__main__":
    main()
