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
| **1. Low-Emission Daily Routines** | Dynamic routine planner that reschedules outdoor errands around peak morning and twilight pollution spikes. | Route `/app/routine`, Engine `app/engines/ventilation.py` |
| **2. Indoor Air Quality Hacks** | Sourced aeration guidance via Window Oracle and room-by-room CADR sizing calculators for purifiers and DIY filters. | Route `/app/home`, Engine `app/engines/purifier.py` |
| **3. Sustainable Alternatives** | CleanRoute multimodal commute comparison comparing inhaled particulate intake and transit emissions. | Route `/app/routes`, Engine `app/engines/impact.py` |
| **4. Direct Impact Explanation** | Personal impact ledger quantifying avoided particulate intake and emissions using sourced factors. | Route `/app/impact` & `/app/impact/what-if` |
| **5. Family & Vulnerability Guidance** | AirTwin profiling adjusting daily exposure advice for infants, children, seniors, and asthmatic family members. | Route `/app/family`, Dependency `compute_vulnerability_score` |
| **6. Community Smog Watch** | Citizen air hazard reporting feed with moderation queue for local dust, smoke, and trash burning incidents. | Route `/app/community` & `/admin` |

---

## 📖 Executive Summary

BreatheIQ is an urban air quality assistant built for families navigating severe seasonal winter smog across Indian metropolitan corridors. Standard weather applications display aggregate index values that create anxiety without actionable next steps. BreatheIQ translates particulate readings into specific hourly respiratory decisions: identifying natural ventilation windows, calculating room filtration requirements, comparing commute exposures, and scheduling daily tasks. Guidance reflects public advisories with explicit provenance badges on every data card.

---

## 🛡️ Telemetry Provenance & Scientific Integrity

BreatheIQ displays an explicit provenance badge and timestamp on every data card:

| Provenance Badge | Underlying Source | Description |
|---|---|---|
| `LIVE` | OpenAQ Station Adapter | Ground observation station telemetry with station name and timestamp. |
| `MODELED` | Open-Meteo Atmospheric Grid | Modeled particulate concentration grid derived from atmospheric chemistry reanalysis. |
| `FORECAST` | Open-Meteo Forecast Models | Multi-hour predictive models for PM2.5, PM10, wind vectors, and relative humidity. |
| `ESTIMATED` | Deterministic Calculation Engines | Window Oracle ventilation scores, CADR filtration sizing, and inhalation exposure estimates. |
| `USER-REPORTED` | Citizen Air Watch | Community incident reports submitted by residents, marked UNVERIFIED until reviewed. |
| `DEMO` | Offline Seed Data | Deterministic offline profiles representing typical diurnal winter smog cycles. |

> [!NOTE]
> **Advisory Boundary**: Guidance reflects public health advisories published by the Central Pollution Control Board (CPCB) and World Health Organization (WHO). Guidance is provided for daily planning and is not medical advice.

---

## 🤖 AI Copilot & Deterministic Safety

BreatheIQ integrates Gemini 2.5 Flash server-side for atmospheric natural language guidance:
- **One Call Per Turn**: Prompt contains user profile and retrieved air telemetry.
- **Code-Based Evidence Validator**: Model responses are inspected by code to verify numbers cite retrieved data, include source attribution, and maintain advisory boundaries.
- **Fallback Mode**: If external AI APIs are unreachable, BreatheIQ falls back to deterministic rule-based guidance labeled `Template guidance — not AI generated`. The validator reduces errors; it does not eliminate all model hallucinations.

---

## 📊 Verified 24-Route Release Scope

The application focuses on 24 functional routes verified against automated tests and audits (`docs/BUILD_STATUS.md`):

| # | Route | Screen Name | Access Tier | Description |
|---|---|---|---|---|
| 1 | `/` | Landing Page | Public | Clean air overview, hero section, city selector, What-If preview. |
| 2 | `/explore` | Telemetry Explorer | Public | Multi-corridor particulate comparison, diurnal graphs, sub-index breakdowns. |
| 3 | `/methodology` | Scientific Methodology | Public | CPCB NAQI formula details, breakpoint tables, health tier explanations. |
| 4 | `/privacy` | Privacy & Data Sovereignty | Public | Data retention policies, user rights, and session storage details. |
| 5 | `/login` | User Sign In | Public | Argon2id verification, demo quick-fill buttons, rotating refresh cookie. |
| 6 | `/signup` | Account Registration | Public | Client and server validation with password strength scoring. |
| 7 | `/forgot-password`| Password Recovery | Public | Rate-limited password recovery flow with signed single-use reset tokens. |
| 8 | `/reset-password` | Password Reset | Public | Token verification and cryptographic password update. |
| 9 | `/onboarding` | Household Setup Wizard | Authenticated | 3-step setup: location corridor, vulnerability factors, lifestyle. |
| 10 | `/app/dashboard` | Main Command Center | Authenticated | Corridor card, Window Oracle verdict, adaptive routine overview. |
| 11 | `/app/air-quality` | Atmospheric Detail View | Authenticated | Multi-pollutant gauges, weather vector graphs, mixing height indicators. |
| 12 | `/app/analytics` | Diurnal Trends & Inversion | Authenticated | Historical 24h concentration curves and diurnal boundary dynamics. |
| 13 | `/app/assistant` | AI Atmospheric Copilot | Authenticated | Grounded Gemini Copilot, prompt-injection defense, code-based safety validation. |
| 14 | `/app/routine` | Adaptive Smog Routine | Authenticated | Routine scheduler shifting activities to minimize twilight exposure. |
| 15 | `/app/home` | Indoor Air & Ventilation | Authenticated | Room CADR purifier sizing calculator, DIY filtration guidance, aeration slots. |
| 16 | `/app/family` | Family Air Guardians | Authenticated | Vulnerability scoring (infants, children, seniors, respiratory conditions). |
| 17 | `/app/routes` | CleanRoute Commute Guide | Authenticated | Transit exposure comparison (Metro vs Car vs Bus) and avoided intake estimates. |
| 18 | `/app/impact` | Personal Impact Ledger | Authenticated | Estimated particulate dosage avoided and transit CO2 mitigation. |
| 19 | `/app/impact/what-if`| Scenario Impact Builder | Authenticated | Winter season cumulative emission projections based on lifestyle adjustments. |
| 20 | `/app/notifications`| Notification Hub | Authenticated | Risk evaluation rules, threshold alert preferences, local smog alerts. |
| 21 | `/app/settings` | Settings & Preferences | Authenticated | Theme display, language switch, telemetry export, and account controls. |
| 22 | `/app/community` | Community Air Pulse | Authenticated | Citizen hazard incident submission, neighborhood reports, peer verification. |
| 23 | `/admin` | Administrative Dashboard | Admin | Moderation approval queue, AI trace explorer, and security audit log. |
| 24 | `/404` | Not Found Recovery | Public | Recovery navigation, topic search, and direct return to dashboard. |

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python 3.11+**
- **Node.js 20+** and **npm**

### 1. Unified Quality Gate (Run All Checks)
```bash
python scripts/check_all.py
```

### 2. Backend Setup
```bash
# Install backend dependencies
pip install -r backend/requirements.txt

# Run backend development server (binds to 8000)
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
# Install dependencies and build
npm --prefix frontend install
npm --prefix frontend run dev
```
Open **`http://localhost:5173`** in your browser.

### 4. Demo Credentials (in Development & Demo Mode)
- **Standard User:** `user@breatheiq.org` / `Password123!`
- **Moderator:** `moderator@breatheiq.org` / `Password123!`
- **Administrator:** `admin@breatheiq.org` / `Password123!`

---

## 🔧 Environment Variables Reference

| Variable Name | Scope | Required | Accepted Formats / Example | Purpose |
|---|---|---|---|---|
| `ENVIRONMENT` | Backend | No (default `development`) | `development`, `demo`, `production` | Governs demo accounts, seed execution, and cookie security |
| `ALLOWED_ORIGINS` | Backend | No | `["https://app.vercel.app"]` or `https://app.vercel.app` or comma-separated | CORS origins; empty for single-origin deployments |
| `JWT_SECRET_KEY` | Backend | Yes in production | 32+ character random string | Secret for signing JWT access and refresh tokens |
| `DATABASE_URL` | Backend | No | `postgresql+asyncpg://...` or `sqlite+aiosqlite:///...` | Database connection string; falls back to internal SQLite |
| `GEMINI_API_KEY` | Backend | No | Google AI Studio key | Server-side Gemini 2.5 Flash assistant |
| `OPENAQ_API_KEY` | Backend | No | OpenAQ v3 API key | Ground monitoring station observations |
| `VITE_API_BASE_URL`| Frontend | No | `/api/v1` (default) or `https://.../api/v1` | Base URL for API requests |

---

## 🧪 Real Verification Metrics

| Verification Gate | Command | Latest Real Result | Notes |
|---|---|---|---|
| **Master Quality Gate** | `python scripts/check_all.py` | **8/8 GATES PASSED** | Executes claims, stubs, repo size, build, bundle, vitest, pytest, ledger. |
| **Backend Lint & Strict Types** | `ruff check backend/app && mypy -p app` | **0 lint / 0 type issues** (36 files) | Enforced via `pyproject.toml` (`ruff` + strict `mypy` with `pydantic.mypy`). |
| **Backend Pytest + Branch Cov** | `pytest tests --cov=app --cov-branch` | **94 passed** in 11.85s | Covers auth, rotation, NAQI, Window Oracle, CADR, isolation, RBAC (76% branch+line; core engines 91%–96%). |
| **Frontend Lint & Strict TS** | `npm --prefix frontend run lint && npm --prefix frontend run typecheck` | **0 errors, 0 warnings** | ESLint flat config + `eslint-plugin-jsx-a11y` + `tsc --noEmit` strict mode. |
| **Frontend Vitest + Coverage** | `npm --prefix frontend run test:coverage` | **33 passed** (3 files) | Unit tests for API client, calculation helpers, and shared UI primitives. |
| **Playwright E2E + Axe A11y** | `npx playwright test` (in `frontend/`) | **29 passed** (`390px`/`768px`/`1440px`) | 24 release routes at 3 viewports + routine persistence + `@axe-core/playwright` WCAG 2.2 AA scan. |
| **Live Smoke Test** | `python scripts/smoke_live.py` | **32/32 passed** (0 failures)| Tests health, readyz, deep links, JSON 404, headers, cookies, 24 routes. |
| **Dependency Security Audits** | `pip-audit -r backend/requirements.txt` & `npm audit` | **0 vulnerabilities found** | Verified across backend Python and frontend npm dependencies. |
| **Truth & Claims Audit** | `python scripts/check_claims.py` | **0 violations** (78 files) | Verifies absence of unproven marketing and health guarantees. |
| **Stub & Anti-Placeholder** | `python scripts/audit_stubs.py` | **0 stubs detected** | Verifies absence of empty handlers or placeholder text. |
| **Route Ledger Audit** | `python scripts/build_status.py` | **24/24 verified** (70 deferred) | Verifies mounted routes, line counts, and 3-viewport screenshots. |
| **Frontend Bundle Size** | `python scripts/measure_bundle.py` | **55.13 KB** JS / **5.93 KB** CSS (gzip) | Within performance budget (`<= 200 KB` JS, `<= 50 KB` CSS). |
| **Tracked Repository Size** | `python scripts/check_repo_size.py` | **1.125 MB** (< 1.5 MB budget)| Git store: `1.10 MiB` (`<= 2.0 MB` budget). |

---

## 🚀 Deployment Overview (Render & Vercel)

- **Canonical Deployment (Render):** Multi-stage `Dockerfile` running both the FastAPI backend and serving compiled frontend assets on the same origin (`0.0.0.0:${PORT:-10000}`). Eliminates CORS overhead and cross-site cookie restrictions. See [`docs/DEPLOY_RENDER.md`](docs/DEPLOY_RENDER.md).
- **Secondary Deployment (Vercel Frontend):** Documented in [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md) with SPA rewrite configuration and CORS origin setup.
- **Free-Tier Limits:** Free tier services on Render spin down after 15 minutes of inactivity (taking approximately 50-60 seconds to wake) and free databases expire after 30 days. Background schedulers run while the instance is awake.

---

## ⚠️ Known Limitations

1. **Air Data Coverage:** Real-time physical monitoring coverage depends on OpenAQ ground station availability in specific urban sectors; modeled estimates and satellite forecasts bridge coverage gaps with explicit labeling.
2. **Cold Starts on Free Cloud Hosting:** On free container plans, initial cold-start requests may take up to a minute while the service spins up from idle.
3. **Medical Disclaimer:** Recommendations are based on CPCB and WHO public advisories; users with acute medical conditions should follow physician instructions.

---

## ⚖️ License & Attribution

BreatheIQ is licensed under the MIT License.

### Statutory & Data Attributions
- **CPCB NAQI Standards:** Statutory National Air Quality Index breakpoints and sub-index equations published by the **Central Pollution Control Board, Ministry of Environment, Forest and Climate Change, Government of India**.
- **Meteorological Forecast Models:** Atmospheric mixing height, wind vectors, and particulate forecasts provided by **Open-Meteo**.
- **Ground Station Telemetry:** Supported via **OpenAQ API** integration.
- **Inhalation Factors:** Standard adult and pediatric respiratory volumes referenced from the **USEPA Exposure Factors Handbook** and **ICMR Pediatric Guidelines**.
