# BreatheIQ Judging Scorecard

This document tracks verifiable empirical evidence and current open gaps across all six judging criteria for **Hackathon Challenge 6: GenAI Urban Air Quality Assistant**. All criteria are weighted equally. No arbitrary self-assigned numerical scores are used.

---

## 📊 Live Evidence Matrix

| Criterion | What Judges Check | Verifiable Evidence (Commands / Scripts / Tests) | Current Real Result | Active Gaps to Close |
|---|---|---|---|---|
| **Problem Statement Alignment** | Targets root winter smog challenge, user needs, actionable low-emission daily routines, indoor air quality hacks, sustainable alternatives, direct impact explanation | `pytest tests/test_copilot.py tests/test_ventilation.py tests/test_purifier.py tests/test_impact.py` <br>`docs/PROBLEM_ALIGNMENT.md` <br>`docs/DEMO_SCRIPT.md` | 24 core routes verified; Window Oracle, CADR sizing, CleanRoute, and personal impact tracker operational. | Add visible "Because you..." profiling chips; add dynamic "Why is today bad?" winter-smog explainer; expand to 10 sourced indoor hacks; add "Impact of this choice" drawer across pages. |
| **Security** | Safe practices, JWT hardening, cookie flags, no secrets, RBAC, IDOR prevention, input validation, rate limiting, prompt injection defense | `pytest tests/test_auth.py tests/test_community_admin.py` <br>`scripts/smoke_live.py` <br>`docs/SECURITY.md` | In-memory JWT access token; rotating HttpOnly SameSite=Strict refresh cookies; Argon2id hashing; basic RBAC. | Strict CSP and security headers; IDOR isolation test suite; route-auth enumeration test; rate limiting on auth & copilot endpoints; Pydantic extra="forbid" hardening. |
| **Code Quality** | Clean, readable, well-structured code; type hints; thin routers; shared API client; no dead code | `npx tsc --noEmit` <br>`npm run build` <br>`scripts/audit_stubs.py` <br>`scripts/check_claims.py` <br>`scripts/check_all.py` | Strict TypeScript clean; 0 placeholder stubs; 0 unproven marketing buzzwords; canonical `/api/v1` prefix. | Split large page components (`LandingPage.tsx`, `DashboardPage.tsx`) under 300 lines; add central error handler with consistent shape `{"error": {"code", "message", "request_id"}}`; add docstrings with statutory formulas. |
| **Efficiency** | Time & memory usage; bundle size; API response latency; caching; DB indexing | `scripts/measure_bundle.py` <br>`python -m pytest tests/test_air_data.py` <br>`docs/PERFORMANCE.md` | In-memory TTL cache on air data (15m current / 1h forecast); total tracked repo size 1.05 MB (< 1.5 MB limit). | Single-flight request coalescing for upstream provider calls; shared `httpx.AsyncClient`; route-level lazy code splitting (`React.lazy`); bundle size enforcement script. |
| **Testing** | Ease of testing, maintaining, validating; edge case coverage; deterministic design | `python -m pytest -v --cov` <br>`npm test` <br>`npx playwright test` <br>`docs/TESTING.md` <br>`.github/workflows/ci.yml` | 55 backend tests passing; 25 frontend vitest passing; 72 Playwright viewport smoke tests passing. | Add NAQI CPCB breakpoint boundary tests; auth negative & token tampering tests; provider failure fallback tests; automated CI GitHub workflow. |
| **Accessibility** | Usable by diverse users and environments; WCAG 2.2 AA target; non-color cues; keyboard navigation | Playwright axe-core audit <br>`docs/ACCESSIBILITY.md` <br>Dual-channel AQI badges | Semantic landmarks; non-color AQI category badges; focusable controls; skip link. | Contrast verification script; automated axe-core Playwright smoke tests; screen-reader `aria-live` and `aria-describedby` announcements; persisted solid-surfaces setting. |

---

*Last updated: 2026-11-24 baseline session.*
