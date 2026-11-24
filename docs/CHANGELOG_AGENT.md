# Agent Changelog — complete/100

| Timestamp (ISO) | File Modified | Reason | Requirement / Check |
|---|---|---|---|
| 2026-11-24T21:35:00Z | `docs/BASELINE.md` | Created initial baseline measurement | Section 1: Capture baseline before changing anything |
| 2026-11-24T21:43:00Z | `backend/app/core/config.py` | Implemented multi-format ALLOWED_ORIGINS parser, startup error logging, and production JWT secret validator | P0: 5.1 Render boot repair |
| 2026-11-24T21:43:00Z | `backend/app/main.py` | Added strict CSP/HSTS headers, conditional demo seeding, and JSON 404 response for unmatched API routes | P0: 5.1 & 7.2 Security |
| 2026-11-24T21:43:00Z | `backend/tests/test_settings.py` | Added 5 regression tests for empty origins, wildcard rejection, and production secret refusal | P0: 5.1 Regression tests |
| 2026-11-24T21:44:00Z | `.dockerignore` | Created .dockerignore to keep Docker images lean and secure | P0: 5.3 Multi-stage Dockerfile |
| 2026-11-24T21:44:00Z | `Dockerfile` | Updated default port to 10000, bound to 0.0.0.0 with --proxy-headers | P0: 5.3 Render port binding |
| 2026-11-24T21:44:00Z | `render.yaml` | Standardized blueprint to runtime: docker, ENVIRONMENT=demo, secrets sync: false (32 lines <= 40) | P0: 5.3 Render blueprint specification |
| 2026-11-24T21:45:00Z | `scripts/smoke_live.py` | Updated live smoke tester using Python standard library to test health, readyz, deep links, JSON 404, headers, and cookies | P0: 5.1 & 5.3 Live smoke test |
| 2026-11-24T21:46:00Z | `docs/DEPLOY_VERCEL.md` | Created comprehensive Vercel deployment guide documenting Setup A vs B, SPA rewrites, and environment variable rules | P0: 5.2 Vercel deployment repair |
| 2026-11-24T21:47:00Z | `docs/DEPLOY_RENDER.md` | Updated Render deployment guide with manual workarounds, platform facts, and troubleshooting matrix | P0: 5.1 & 5.3 Render deployment repair |
| 2026-11-24T21:47:00Z | `docs/DECISIONS.md` | Recorded ADR 002 (Canonical Single-Origin) and ADR 003 (ALLOWED_ORIGINS & Hardening) | Section 2 & 5: Architectural decision records |
| 2026-11-24T22:04:00Z | `backend/app/core/security.py` | Configured Argon2id with OWASP recommendations (m=64MB, t=2, p=1) | 7.2 Security |
| 2026-11-24T22:04:00Z | `backend/app/schemas/auth.py` | Configured extra='forbid' on authentication request schemas | 7.2 Security & 6 Service Matrix |
| 2026-11-24T22:04:00Z | `backend/app/api/v1/endpoints/user_flow.py` | Configured extra='forbid' on user flow request schemas | 7.2 Security & 6 Service Matrix |
| 2026-11-24T22:04:00Z | `backend/app/api/v1/endpoints/community.py` | Configured extra='forbid' on community report creation schema | 7.2 Security & 6 Service Matrix |
| 2026-11-24T22:04:00Z | `backend/tests/test_isolation_and_rbac.py` | Added test suite covering user data isolation, route auth enumeration, and extra forbidden fields | 7.2 & 7.5 Testing |
| 2026-11-24T22:04:00Z | `docs/SERVICE_MATRIX.md` | Created detailed 14-service matrix with verification evidence across all 10 checks | Section 6: Service Matrix |
| 2026-11-24T22:05:00Z | `scripts/measure_bundle.py` | Created script to measure frontend build assets and assert gzip size budgets | 7.4 Efficiency |
| 2026-11-24T22:05:00Z | `scripts/check_all.py` | Created unified master quality gate script executing all 8 verification suites | 7.3 Code Quality |
