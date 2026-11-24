# BreatheIQ — Production Deployment Guide

**BreatheIQ** ("Breathe Smarter. Live Healthier.") is architected with a decoupled frontend (React 18 + Vite + Tailwind) and high-performance backend (FastAPI + SQLAlchemy async).

This guide provides exact deployment instructions for:
1. **Frontend Hosting on Vercel**
2. **Backend Hosting on Render (or Google Cloud Run)**
3. **Single-Origin Deployment on Render (Full-Stack Container)**

---

## Architecture Overview

```
                                      ┌──────────────────────────────────────────────┐
                                      │              Vercel (Frontend)               │
                                      │  - React 18 / TypeScript / Vite              │
                                      │  - Domain: https://<your-app>.vercel.app     │
                                      └──────────────────────┬───────────────────────┘
                                                             │
                                                    HTTPS API Requests
                                              (CORS credentials: 'include')
                                                             │
                                                             ▼
┌──────────────────────────────────────────┐  SQLAlchemy Async  ┌──────────────────────────────────────────┐
│             Render (Backend)             │ ────────────────── │          Managed PostgreSQL              │
│  - FastAPI / Python 3.11 / Uvicorn       │    (asyncpg)       │  - PostGIS / SSL                         │
│  - Healthcheck: /healthz                 │                    │  - Internal Render / Supabase / Neon DB  │
│  - Domain: https://<your-api>.onrender.com                    └──────────────────────────────────────────┘
└──────────────────────────────────────────┘
```

---

## 1. Frontend Deployment — Vercel

### Step 1: Import Repository
1. Log in to [Vercel Dashboard](https://vercel.com/new).
2. Click **Add New...** → **Project** and select your GitHub repository (`breatheiq`).

### Step 2: Configure Project Settings

#### Recommended (Vercel Monorepo Setting):
- **Framework Preset:** `Vite`
- **Root Directory:** Click "Edit" and choose `frontend`
- **Build Command:** Leave default / Override OFF (runs `npm run build`)
- **Output Directory:** Leave default / Override OFF (`dist`)
- **Install Command:** Leave default / Override OFF (runs `npm install`)

*(Note: `frontend/vercel.json` is provided in the repository to automatically handle SPA client-side routing on page refreshes).*

#### Alternative (Root Directory Setting):
If you leave **Root Directory** as `./` (repository root):
- **Framework Preset:** `Vite`
- **Install Command:** `npm --prefix frontend install`
- **Build Command:** `npm --prefix frontend run build`
- **Output Directory:** `frontend/dist`

> ⚠️ **Important:** Do NOT set Build Command to `cd frontend && ...` if your Root Directory in Vercel is already set to `frontend`. Doing so causes `sh: line 1: cd: frontend: No such file or directory` because Vercel is already inside the `frontend` folder.

### Step 3: Configure Environment Variables
In the Vercel project settings (**Settings** → **Environment Variables**), add:

| Variable Name | Required | Example Production Value | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | **Yes** | `https://<your-backend>.onrender.com/api/v1` | URL of your deployed FastAPI backend |
| `VITE_DEFAULT_LANGUAGE` | No | `en` | Default UI locale (`en`, `hi`, `mr`) |
| `VITE_MAP_TILES_URL` | No | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | OSM tile provider URL |

### Step 4: Deploy & Verify
Click **Deploy**. Once built, Vercel provides your production URL (e.g., `https://breatheiq-production.vercel.app`).
Save this URL for backend CORS configuration.

---

## 2. Backend Deployment — Render

You can deploy the backend using either **Render Blueprints** or **Manual Web Service**.

### Option A: Using Render Blueprints (Recommended)
1. In [Render Dashboard](https://dashboard.render.com), click **New** → **Blueprint**.
2. Connect your `breatheiq` repository (`main` branch).
3. Render detects `render.yaml` and provisions:
   - Web Service: `breatheiq` (Docker environment)
   - Database: `breatheiq-db` (Free PostgreSQL)
4. Click **Apply**.

### Option B: Manual Web Service Setup (Python 3 Native)
1. In Render Dashboard, click **New** → **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Name:** `breatheiq-backend`
   - **Region:** `Singapore` (or closest region)
   - **Runtime:** `Python 3`
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/healthz`
   - **Plan:** `Free`

### Option C: Manual Web Service Setup (Docker Container)
1. In Render Dashboard, click **New** → **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Name:** `breatheiq-backend`
   - **Region:** `Singapore`
   - **Runtime / Environment:** `Docker`
   - **Branch:** `main`
   - **Root Directory:** Leave blank (repository root)
   - **Dockerfile Path:** `./Dockerfile`
   - **Health Check Path:** `/healthz`
   - **Plan:** `Free`

### Step 4: Configure Backend Environment Variables
In **Environment** settings on Render, set:

| Variable Name | Required | Example Production Value | Description |
|---|---|---|---|
| `ENVIRONMENT` | **Yes** | `production` | Enables production security controls |
| `DEBUG` | **Yes** | `false` | Disables debug stack traces |
| `DATABASE_URL` | **Yes** | `postgresql+asyncpg://user:pass@host/db` | Database connection string. Note: `postgres://` is automatically mapped to `postgresql+asyncpg://` |
| `JWT_SECRET_KEY` | **Yes** | *Generate random 32+ hex string* | Secret key for signing Argon2id/JWT tokens |
| `ALLOWED_ORIGINS` | **Yes** | `["https://<your-app>.vercel.app"]` | Allowed CORS origins (JSON array or comma-separated) |
| `COOKIE_SECURE` | **Yes** | `true` | Enforces HTTPS-only cookies |
| `COOKIE_SAMESITE` | **Yes** | `none` (if Vercel frontend) / `lax` (if same origin) | Cross-site cookie attribute for HttpOnly refresh tokens |
| `DEMO_MODE` | No | `true` | Set to `true` for deterministic CPCB air data when API keys are absent |
| `OPENAQ_API_KEY` | No | `<your-openaq-key>` | Optional OpenAQ API key for real CAAQMS telemetry |
| `GEMINI_API_KEY` | No | `<your-gemini-key>` | Optional Google Gemini API key for AI Copilot |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |

---

## 3. Post-Deployment Verification Checklist

Once both frontend and backend are deployed:

- [ ] **Health Endpoint:** Verify `https://<your-backend>.onrender.com/healthz` returns `{"status":"ok","service":"BreatheIQ API"}` with HTTP 200.
- [ ] **CORS Verification:** In browser dev tools on your Vercel frontend domain, verify no CORS errors occur when fetching `/api/v1/air-quality/cities`.
- [ ] **Authentication:** Test login with `user@breatheiq.org` / `Password123!` (or create a new account). Confirm the `breatheiq_refresh` cookie is stored with `HttpOnly` and `Secure`.
- [ ] **Page Refresh:** Refresh a protected route (e.g. `/app/dashboard`) and confirm session persistence without 401 redirect loops.
- [ ] **Public Route Navigation:** Navigate `/`, `/explore`, `/methodology`, `/privacy` without logging in. Verify zero 401 console errors.
- [ ] **Automated Smoke Test:** Run the included smoke test tool:
  ```bash
  python scripts/smoke_live.py --base-url https://<your-deployed-domain>
  ```
