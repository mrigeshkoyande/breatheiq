# AGENTS.md — BreatheIQ Master Brief

## 1. ROLE AND MISSION
BreatheIQ — "Breathe Smarter. Live Healthier."
Challenge 6 — Urban Air Quality Assistant: GenAI-powered assistant helping families and communities navigate severe winter smog and urban air pollution. Suggests low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to location and lifestyle.
Philosophy: DETECT → UNDERSTAND → PROTECT → OPTIMIZE → IMPROVE.

## 2. PROJECT ASSETS
- Design file: "Design file" (read-only visual source of truth from Google Stitch). Never edit/delete originals.
- Logo: "Media/BreatheIQ Clean Air Logo.png". Inspect PNG, create optimized derivatives in `frontend/public/`. Logo colors win over default tokens.
- Never commit `Design file/` or `Media/` raw contents.

## 3. HARD CONSTRAINTS
1. Authentication: JWT only. No Firebase, OAuth, social login, or third-party auth SDKs.
2. Final public GitHub repo must be under 10 MB. Tracked size check at `scripts/check_repo_size.py` failing if > ~8 MB. Run before commit.
3. No secrets in code or git. Environment variables only (`.env.example`). Gemini/API calls are server-side.
4. Never fabricate environmental data. Every metric shows a badge: LIVE, MODELED, FORECAST, ESTIMATED, USER-REPORTED, or DEMO. Never mix demo and live in one view.
5. No dead buttons, no empty pages. Remove unfinished items from navigation.
6. No medical diagnosis or guarantees. Follow public-health advisories (CPCB, WHO) with disclaimers.
7. Never claim something works without running it. Evidence required.
8. Windows-friendly: PowerShell, macOS, Linux compatible scripts. Line endings normalized.

## 4. WORKING RULES
- Work in phases (0 through 8) and vertical slices.
- Before coding each phase: post plan artifact. After each phase: verification report.
- Maintain a runnable app at all times.
- Strict TypeScript (no `any`), Pydantic v2 schemas, small reusable components.
- Check current docs for Open-Meteo, OpenAQ, Gemini API.

## 5. TECH STACK
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts, React Router, React Hook Form + Zod, TanStack Query, Leaflet + OSM, i18next (EN, HI, MR).
- Backend: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, PyJWT, argon2-cffi, httpx, slowapi, pywebpush.
- Database: PostgreSQL (+PostGIS) via Docker Compose; SQLite fallback for zero-setup demo & tests. In-memory TTL cache fallback for Redis.
- AI: Google Gemini API, server-side, single call with function calling & structured JSON schema + deterministic validator.
- Testing: Vitest + RTL, Pytest, Playwright.

## 6. DESIGN SYSTEM & TOKENS
Visual truth: Stitch designs in `Design file/`.
- Background: `#F8FAF7` (Canvas), `#FFFFFF` (Surface)
- Primary Teal: `#0F766E` / `#005C55`, Deep Teal: `#115E59`, Mint: `#DDF5EC`, Soft Green: `#A7E8C6`, Ink: `#182A29`, Muted: `#64748B`, Border: `#E2E8F0`
- CPCB AQI Scale: Good (0–50) `#2F9E62`, Satisfactory (51–100) `#7CB342`, Moderate (101–200) `#F2B705`, Poor (201–300) `#F28C28`, Very Poor (301–400) `#DC5252`, Severe (401–500) `#8B1E3F`
- Typography: Plus Jakarta Sans (Headings, display metrics), Inter (body, labels, controls)

## 7. AUTH SPECIFICATION
- Endpoints: signup, login, refresh, logout, logout-all, forgot-password, reset-password, verify-email, me, sessions.
- Access token: In-memory only (~15 min).
- Refresh token: HttpOnly cookie (7-14d), rotated on every use, stored hashed, family reuse detection.
- Passwords: argon2id, rate limits, lockout, generic errors.
- Roles: user, moderator, admin.

## 8. DATA LAYER & ENGINES
- Providers: OpenAQ (LIVE), Open-Meteo Air Quality (MODELED/FORECAST), Open-Meteo Weather, DEMO provider.
- Confidence Meter: source, observed_vs_modeled, station_distance_km, timestamp, age_minutes, missing_pollutants.
- Deterministic Engines: `naqi.py` (CPCB NAQI), `ventilation.py` (Window Oracle), `exposure.py`, `purifier.py`, `impact.py` (Choice Impact Engine), `routing.py`, `smogshield.py`.
