# BreatheIQ — "Breathe Smarter. Live Healthier."

<p align="center">
  <img src="frontend/public/logo.webp" alt="BreatheIQ Logo" width="160" />
</p>

<p align="center">
  <strong>GenAI-Powered Atmospheric Intelligence & Urban Air Quality Assistant</strong><br />
  <em>Challenge 6 — Urban Air Quality Assistant</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11%2B-blue?logo=python" alt="Python 3.11+" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react" alt="React 18.3" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Auth-JWT%20Argon2id-critical" alt="JWT Only" />
  <img src="https://img.shields.io/badge/Status-Batch%20B0%20Audit-amber" alt="Build Status" />
</p>

---

> [!IMPORTANT]
> **Active Implementation Ledger**: This repository is undergoing a verified vertical-slice build adhering to strict evidence rules (`AGENTS.md`). Feature claims are governed by the route ledger at [`docs/BUILD_STATUS.md`](docs/BUILD_STATUS.md). The final release README will be generated at Batch B16 strictly from proven ledger results.

---

## 📖 Project Overview

**BreatheIQ** is an urban air quality assistant designed to help families and communities navigate severe winter smog and urban particulate pollution across Indian cities.

### Core Philosophy
$$\textbf{DETECT} \longrightarrow \textbf{UNDERSTAND} \longrightarrow \textbf{PROTECT} \longrightarrow \textbf{OPTIMIZE} \longrightarrow \textbf{IMPROVE}$$

1. **DETECT**: Ingest ground monitoring data (OpenAQ stations) and hourly atmospheric forecasts (Open-Meteo Air Quality & Weather), with labeled provenance badges on every metric (`LIVE`, `MODELED`, `FORECAST`, `ESTIMATED`, `USER-REPORTED`, `DEMO`).
2. **UNDERSTAND**: Break down composite air pollution into dominant particulate drivers (PM2.5, PM10, NO2, SO2, CO, O3) using official CPCB National Air Quality Index (NAQI) breakpoints.
3. **PROTECT**: Provide indoor air quality tools including hourly forecast-based ventilation timing (Window Oracle), air purifier sizing calculations, and sensitivity-based family guidance.
4. **OPTIMIZE**: Offer route exposure comparisons and adaptive daily routine planning to minimize outdoor exposure during high-risk hours.
5. **IMPROVE**: Encourage collective community action through citizen reports (Air Watch), sustainability score tracking, and low-emission habit challenges.

---

## 📊 Current Implementation Status (Batch B0 Audit)

Per the truthful audit in [`docs/BUILD_STATUS.md`](docs/BUILD_STATUS.md):

| Category | Total Routes | Verified | Functional | UI-Only | Stub | Missing |
|---|---|---|---|---|---|---|
| **Public** | 18 | 0 | 0 | 0 | 1 | 17 |
| **Auth & Onboarding** | 11 | 0 | 5 | 0 | 0 | 6 |
| **Core App** | 32 | 0 | 0 | 0 | 1 | 31 |
| **Community** | 9 | 0 | 0 | 0 | 0 | 9 |
| **Learning** | 7 | 0 | 0 | 0 | 0 | 7 |
| **Admin** | 13 | 0 | 0 | 0 | 0 | 13 |
| **System** | 3 | 0 | 0 | 1 | 0 | 2 |
| **Total** | **93** | **0** | **5** | **1** | **2** | **85** |

### Verified Existing Components:
- **Backend Auth Architecture**: JWT authentication with in-memory access tokens, rotating `HttpOnly` refresh tokens, Argon2id password hashing, and token-family reuse detection (`backend/app/api/v1/endpoints/auth.py`). Passing async test suite (`backend/tests/test_auth.py`).
- **Logo Derivatives**: Brand mark, favicon, apple-touch-icon, and OpenGraph derivatives formatted in WebP/PNG adhering to the repo budget.
- **Route Ledger System**: Single source of truth at [`docs/routes.manifest.json`](docs/routes.manifest.json) and automated reporting via `scripts/build_status.py`.

---

## 🚀 Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm

### Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Verification & Compliance Commands

```bash
# Verify repository size budget (< 8.0 MB)
python scripts/check_repo_size.py

# Check for placeholder strings and codebase stubs
python scripts/audit_stubs.py

# Generate route ledger from actual codebase state
python scripts/build_status.py

# Run backend unit and auth integration tests
cd backend && python -m pytest tests -v
```

---
*For the complete 93-route specification and functional requirements, see [`docs/SCREEN_SPECS.md`](docs/SCREEN_SPECS.md).*
