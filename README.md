# BreatheIQ — "Breathe Smarter. Live Healthier."

<p align="center">
  <img src="frontend/public/logo.webp" alt="BreatheIQ Logo" width="160" />
</p>

<p align="center">
  <strong>GenAI-Assisted Atmospheric Intelligence & Urban Air Quality Defense</strong><br />
  <em>Hackathon Challenge 6: GenAI Urban Air Quality Assistant for Families & Communities Facing Winter Smog</em>
</p>

---

## 🎯 Challenge Alignment Matrix

| Challenge Requirement | How BreatheIQ Solves It | Where to Inspect |
|---|---|---|
| **1. Low-Emission Daily Routines** | Dynamic routine planner that schedules outdoor errands around lower-particulate aeration windows. | Route `/app/routine`, Engine `backend/app/engines/ventilation.py` |
| **2. Indoor Air Quality Hacks** | Sourced aeration guidance via Window Oracle and room-by-room CADR sizing calculators for purifiers and filters. | Route `/app/home`, Engine `backend/app/engines/purifier.py` |
| **3. Sustainable Alternatives** | CleanRoute multimodal commute comparison estimating inhaled PM2.5 dosage and transit CO2 emissions. | Route `/app/routes`, Engine `backend/app/engines/routing.py` |
| **4. Direct Impact Explanation** | Personal impact ledger quantifying averted particulate intake and CO2 savings using sourced factors. | Routes `/app/impact`, `/app/impact/what-if`, Engine `backend/app/engines/impact.py` |
| **5. Family & Vulnerability Guidance** | AirTwin profiling adjusting daily exposure guidance for infants, children, seniors, and respiratory sensitivities. | Route `/app/family`, `backend/app/api/v1/endpoints/user_routes/household.py` |
| **6. Community Smog Watch** | Citizen air hazard reporting feed with moderator queue for local dust, smoke, and burning incidents. | Routes `/app/community`, `/admin`, `backend/app/api/v1/endpoints/community.py` |

---

## 📖 Executive Summary

BreatheIQ is an urban air quality assistant built for families navigating severe seasonal winter smog across Indian metropolitan corridors. Standard weather apps report aggregate AQI numbers without actionable household steps. BreatheIQ translates pollutant readings into specific hourly decisions: identifying natural ventilation windows, calculating room filtration requirements, comparing commute exposures, and scheduling daily routines. Guidance reflects public advisories with explicit provenance badges and timestamps on every data card.

---

## 🏗️ Repository Architecture

Every module in `backend/app` (54 module files; max 199 lines) and `frontend/src` (79 `.ts`/`.tsx` files + `index.css`; max 199 lines) follows strict single-responsibility layering:

```text
breatheiq/
├── .github/workflows/ci.yml      # Ruff check+format (backend + scripts), mypy strict, >=95% pytest cov, Prettier, ESLint, >=85% Vitest cov, Vite build, npm/pip audits
├── .editorconfig                 # Consistent UTF-8, LF/indent rules
├── LICENSE                       # MIT License
├── Makefile                      # Unified targets: make lint | format | test | coverage | run | check
├── pyproject.toml                # Ruff lint/format, Mypy strict, and Coverage configuration
├── backend/
│   ├── .coveragerc               # Greenlet+thread branch coverage config for SQLAlchemy async tests
│   ├── requirements.txt          # Pinned runtime Python dependencies
│   ├── requirements-dev.txt      # Ruff, mypy, pytest-cov, pip-audit
│   ├── app/
│   │   ├── api/deps.py           # JWT Bearer auth, DB-verified active user, RBAC role guards
│   │   ├── api/v1/endpoints/     # Thin HTTP route controllers (auth, auth_account, auth_recovery, user_routes/*, admin, community, copilot, engines, air_quality, health)
│   │   ├── core/                 # Settings validation, constants, BreatheIQError hierarchy, argon2id/PyJWT, rate limiter
│   │   ├── data/                 # Sourced YAML emission and inhalation factor tables
│   │   ├── db/                   # Async SQLAlchemy engine/session and idempotent demo seeding
│   │   ├── engines/              # Pure deterministic domain logic (naqi, purifier, ventilation, routing, impact)
│   │   ├── models/               # SQLAlchemy 2 ORM models (auth, app_data, alerts_impact, community, copilot)
│   │   ├── schemas/              # Strict Pydantic v2 input/output schemas
│   │   └── services/             # External I/O & orchestration (OpenAQ/Open-Meteo adapters, Gemini gateway, guardrails, admin probes, auth helpers)
│   └── tests/                    # Mirrored unit and ASGI integration suites (113 tests)
├── frontend/
│   ├── .prettierrc.json          # Frontend code formatting configuration
│   ├── eslint.config.js          # ESLint + jsx-a11y + no-explicit-any strict rules
│   ├── tailwind.config.js        # Brand, ink, edge, danger, and CPCB semantic palette tokens
│   ├── src/
│   │   ├── api/hooks.ts          # TanStack Query data-fetching and cache invalidation hooks
│   │   ├── components/           # Feature-scoped accessible UI panels (admin, assistant, community, dashboard, explore, home, landing, layout, methodology, onboarding, routine, settings, ui)
│   │   ├── config/               # Navigation & capability metadata
│   │   ├── context/              # In-memory JWT AuthProvider + HttpOnly refresh lifecycle
│   │   ├── i18n/                 # Localization (English / Hindi / Marathi)
│   │   ├── pages/                # 24 lazy-loaded route pages + verification/UI specs
│   │   ├── routes/               # ProtectedRoute guards & lazy route registry
│   │   ├── services/api.ts       # Typed Fetch wrapper with timeout, 401 refresh lock, and ApiError handling
│   │   ├── types/                # Domain-split TypeScript contracts (auth, admin, household, telemetry)
│   │   └── utils/                # Type guards, CPCB calculations (`calculations.ts`), and safe storage (`storage.ts`)
│   └── tests/                    # Vitest unit tests (8 files; 56 tests) & Playwright 3-viewport E2E + Axe specs (29 tests)
├── docs/                         # Route manifest, BUILD_STATUS ledger, deployment guides, screen specs
└── scripts/                      # Quality gates (check_all.py, check_claims.py, audit_stubs.py, check_repo_size.py, measure_bundle.py, build_status.py, smoke_live.py)
```

---

## 📦 Dependency Justifications

- **Backend Runtime (`backend/requirements.txt`)**: `fastapi` & `uvicorn[standard]` (async ASGI routing and server hosting); `pydantic` & `pydantic-settings` (strict runtime validation and typed env config); `sqlalchemy[asyncio]`, `aiosqlite`, `asyncpg` (async ORM with PostgreSQL and SQLite fallback); `pyjwt` & `argon2-cffi` (HS256 access/refresh JWTs and Argon2id password hashing); `httpx` (async pooled HTTP client for OpenAQ/Open-Meteo/Gemini); `slowapi` (endpoint rate limiting); `python-multipart` (form parsing support); `pyyaml` (loading sourced emission factors YAML); `typing-extensions` (`TypedDict` compatibility on Python 3.11+); `pytest` & `pytest-asyncio` (test runner dependencies).
- **Frontend Runtime (`frontend/package.json`)**: `react` & `react-dom` (UI rendering); `react-router-dom` (client-side lazy routing); `@tanstack/react-query` (cached server state and mutations); `lucide-react` (accessible vector icons); `framer-motion` (reduced-motion-aware UI transitions); `clsx` & `tailwind-merge` (deterministic Tailwind class composition).

---

## 🛡️ Telemetry Provenance & Scientific Integrity

Every data card displays an explicit provenance badge and timestamp:

| Provenance Badge | Underlying Source | Description |
|---|---|---|
| `LIVE` | OpenAQ Station Adapter | Ground observation station telemetry with station name and timestamp. |
| `MODELED` | Open-Meteo Atmospheric Grid | Modeled particulate concentration grid derived from atmospheric reanalysis. |
| `FORECAST` | Open-Meteo Forecast Models | Multi-hour predictive models for PM2.5, PM10, wind speed, humidity, and boundary height. |
| `ESTIMATED` | Deterministic Calculation Engines | Window Oracle ventilation scores, CADR sizing, CleanRoute dosage, and impact estimates. |
| `USER-REPORTED` | Citizen Air Watch | Community incident reports submitted by residents, marked `UNVERIFIED` until reviewed. |
| `DEMO` | Offline Seed Data | Deterministic offline profiles representing diurnal winter smog cycles. |

> [!NOTE]
> **Advisory Boundary**: Guidance reflects public health advisories published by the Central Pollution Control Board (CPCB) and World Health Organization (WHO). Guidance is for daily planning only and is not medical advice.

---

## 🤖 AI Copilot & Deterministic Safety

BreatheIQ integrates Gemini server-side (`backend/app/services/copilot_llm.py`) for atmospheric guidance:
- **One Call Per Turn**: Prompt includes retrieved telemetry context and location parameters.
- **Code-Based Evidence Validator**: `copilot_guardrails.py` checks responses for numeric consistency with retrieved telemetry, source citations, and advisory boundaries.
- **Deterministic Fallback**: When `GEMINI_API_KEY` is unset or upstream AI calls fail, BreatheIQ switches cleanly to grounded template responses without blocking core workflows.

---

## 📊 Verified 24-Route Release Scope

24 in-scope routes verified against automated Playwright and server smoke checks (`docs/BUILD_STATUS.md`):

| # | Route | Screen Name | Access Tier | Description |
|---|---|---|---|---|
| 1 | `/` | Landing Page | Public | Clean air overview, city selector, What-If simulator preview. |
| 2 | `/explore` | Telemetry Explorer | Public | Multi-corridor pollutant breakdown, driver metrics, 6-hour PM2.5 outlook. |
| 3 | `/methodology` | Scientific Methodology | Public | CPCB NAQI linear sub-index equation and interactive sandbox calculator. |
| 4 | `/privacy` | Privacy & Data Sovereignty | Public | Data retention policy, token handling, and account export/deletion rights. |
| 5 | `/login` | User Sign In | Public | Argon2id authentication, optional dev/demo quick-fill, rotating refresh cookie. |
| 6 | `/signup` | Account Registration | Public | Input validation and automatic initial session issuance. |
| 7 | `/forgot-password` | Password Recovery | Public | Rate-limited recovery request flow without account enumeration. |
| 8 | `/reset-password` | Password Reset | Public | Single-use signed token verification and password update. |
| 9 | `/onboarding` | Household Setup Wizard | Authenticated | 3-step setup: corridor, AirTwin profiles, and smog alert threshold. |
| 10 | `/app/dashboard` | Main Command Center | Authenticated | Telemetry card, Window Oracle, routine checklist, and route preview. |
| 11 | `/app/air-quality` | Atmospheric Detail View | Authenticated | Pollutant readings, weather drivers, and boundary mixing depth. |
| 12 | `/app/analytics` | Diurnal Trends & Inversion | Authenticated | Hourly concentration progression and dispersion view. |
| 13 | `/app/assistant` | AI Atmospheric Copilot | Authenticated | Grounded Gemini assistant, prompt-injection defense, and evidence badges. |
| 14 | `/app/routine` | Adaptive Smog Routine | Authenticated | Daily smog task scheduler with persisted completion toggles. |
| 15 | `/app/home` | Indoor Air & Ventilation | Authenticated | Room profiles, Window Oracle summary, and CADR HEPA decay calculator. |
| 16 | `/app/family` | Family Air Guardians | Authenticated | Household vulnerability scoring for infants, children, seniors, and sensitivities. |
| 17 | `/app/routes` | CleanRoute Commute Guide | Authenticated | Multimodal transit comparison for inhaled PM2.5 dosage and CO2. |
| 18 | `/app/impact` | Personal Impact Ledger | Authenticated | Cumulative averted PM2.5 intake and transit CO2 ledger. |
| 19 | `/app/impact/what-if` | Scenario Impact Builder | Authenticated | Lifestyle shift calculator modeling multi-week particulate savings. |
| 20 | `/app/notifications` | Notification Hub | Authenticated | Smog alert rules manager and notification feed. |
| 21 | `/app/settings` | Settings & Preferences | Authenticated | Display profile, password rotation, EN/HI/MR language toggle, account deletion. |
| 22 | `/app/community` | Community Air Watch | Authenticated | Citizen hazard reporting feed with severity filters and peer confirmation. |
| 23 | `/admin` | Administrative Dashboard | Admin | Moderation approval queue, user management, AI traces, audit logs, health probes. |
| 24 | `/404` | Not Found Recovery | Public | Fallback recovery navigation back to home or dashboard. |

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python 3.11+**
- **Node.js 20+** and **npm**

### 1. Run Quality Gates (`Makefile` / Unified Script)
```bash
# Run lint, format check, strict typechecks, tests, bundle/size audits
make check

# Or execute the Python quality gate directly
python scripts/check_all.py
```

### 2. Local Development Servers
```bash
# Terminal 1: Backend (http://localhost:8000)
pip install -r backend/requirements.txt
make run

# Terminal 2: Frontend (http://localhost:5173)
npm --prefix frontend install
npm --prefix frontend run dev
```

### 3. Demo Credentials (Development & Demo Mode)
- **Standard User:** `user@breatheiq.org` / `Password123!`
- **Moderator:** `moderator@breatheiq.org` / `Password123!`
- **Administrator:** `admin@breatheiq.org` / `Password123!`

---

## 🔧 Environment Variables Reference

| Variable Name | Scope | Required | Accepted Formats / Example | Purpose |
|---|---|---|---|---|
| `ENVIRONMENT` | Backend | No (default `development`) | `development`, `demo`, `production` | Controls demo seeding and secure cookie flags |
| `ALLOWED_ORIGINS` | Backend | No | `["https://app.vercel.app"]` or CSV | CORS origins; empty for single-origin hosting |
| `JWT_SECRET_KEY` | Backend | Yes in production | 32+ character random string | Signs access, refresh, and one-time JWTs |
| `DATABASE_URL` | Backend | No | `postgresql+asyncpg://...` or `sqlite+aiosqlite:///...` | DB URL; defaults to local SQLite |
| `GEMINI_API_KEY` | Backend | No | Google AI Studio key | Enables server-side Gemini Copilot replies |
| `OPENAQ_API_KEY` | Backend | No | OpenAQ v3 API key | Enables live OpenAQ ground station telemetry |
| `VITE_API_BASE_URL` | Frontend | No | `/api/v1` (default) or `https://.../api/v1` | Backend API base path |

---

## 🧪 Real Verification Metrics

| Verification Gate | Command | Latest Measured Result | Notes |
|---|---|---|---|
| **Master Quality Gate** | `python scripts/check_all.py` | **8/8 GATES PASSED** | Runs claims, stubs, repo size, Vite build, bundle size, Vitest, Pytest, ledger. |
| **Backend & Scripts Lint / Types** | `python -m ruff check backend scripts && python -m mypy --strict backend/app` | **0 lint / 0 type issues** (54 app + 12 script modules) | Enforced via `pyproject.toml` (`ruff` format/check + `C901`/`RET`/`ARG` + `mypy --strict`). |
| **Backend Pytest + Branch Cov** | `python -m pytest tests --cov=app --cov-config=.coveragerc --cov-branch` | **113 passed** (`97.69%` branch+stmt cov) | Engines, models, schemas `>= 96%`; includes admin self-demotion & prod CORS/CSP tests. |
| **Frontend Lint & Format** | `npm --prefix frontend run format:check && npm --prefix frontend run lint && npm --prefix frontend run typecheck` | **0 errors, 0 warnings** | Prettier + ESLint + `jsx-a11y` + strict `tsc --noEmit`. |
| **Frontend Vitest + V8 Cov** | `npm --prefix frontend run test:coverage` | **56 passed** (8 files; `86.45%` stmts, `88.37%` lines) | Covers routes, hooks, auth flows, modal keyboard focus traps, and storage/type guards (`85%` floor enforced). |
| **Playwright E2E + Axe A11y** | `npx playwright test` (in `frontend/`) | **29 passed** (`390px`/`768px`/`1440px`) | 24 release routes at 3 viewports + routine persistence + `@axe-core/playwright` WCAG 2.2 AA scan. |
| **Live Smoke Verification** | `python scripts/smoke_live.py` | **32/32 passed** (0 failures) | Tests `/healthz`, `/readyz`, SPA fallback, JSON 404, CSP/HSTS headers, cookies, and 24 routes. |
| **Dependency Security Audits** | `python -m pip_audit -r backend/requirements.txt` & `npm --prefix frontend audit --audit-level=high` | **0 vulnerabilities found** | Verified across Python runtime and npm dependencies. |
| **Claims & Stubs Audits** | `python scripts/check_claims.py && python scripts/audit_stubs.py` | **0 violations / 0 stubs** | Enforces no banned buzzwords, no unverified claims, and no placeholder code. |
| **Route Ledger Audit** | `python scripts/build_status.py` | **24/24 verified** (70 deferred) | Verifies mounted routes, line bounds, and 3-viewport screenshots. |
| **Frontend Bundle Budget** | `python scripts/measure_bundle.py` | **55.29 KB** JS / **5.98 KB** CSS (gzip) | Within performance budget (`<= 200 KB` JS, `<= 50 KB` CSS). |
| **Tracked Repository Size** | `python scripts/check_repo_size.py` | **1.374 MB** tracked (< 1.5 MB budget) | Git store `< 2.0 MB`; single active branch `main`. |

---

## 🚀 Deployment Overview & Limitations

- **Canonical Deployment (Render):** Multi-stage `Dockerfile` running FastAPI and serving compiled `frontend/dist` assets on the same origin (`0.0.0.0:${PORT:-10000}`), preventing cross-origin cookie issues. See [`docs/DEPLOY_RENDER.md`](docs/DEPLOY_RENDER.md).
- **Secondary Deployment (Vercel Frontend):** Documented in [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md).
- **Known Limitations:** Real-time ground monitoring coverage depends on OpenAQ station availability in specific urban corridors (`MODELED`/`DEMO` fallbacks apply with explicit labels); free-tier container hosting exhibits ~50–60s cold starts; health advisories follow public CPCB/WHO guidance and are not medical advice.

---

## ⚖️ License

Licensed under the **MIT License** — see [`LICENSE`](LICENSE).

### Statutory & Data Attributions
- **CPCB NAQI Standards:** Central Pollution Control Board, Ministry of Environment, Forest and Climate Change, Government of India.
- **Meteorological Forecasts & Reanalysis:** Open-Meteo.
- **Ground Station Telemetry:** OpenAQ API integration.
- **Inhalation & Vehicular Factors:** USEPA Exposure Factors Handbook, ICMR Pediatric Guidelines, and ARAI/CPCB baselines.
