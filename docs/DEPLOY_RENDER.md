# Deploying BreatheIQ to Render

This guide provides instructions and troubleshooting steps for deploying BreatheIQ to Render as a unified, single-origin containerized web service.

---

## 1. Architecture Overview (Single-Origin Container)

BreatheIQ deploys as a multi-stage Docker web service (`Dockerfile`):
- **Stage 1 (`frontend-builder`):** Compiles the React 18 + Vite frontend into static assets (`dist/`).
- **Stage 2 (`runner`):** Runs the Python 3.11 FastAPI backend and serves both the API endpoints (`/api/v1/*`) and the static React SPA from the same domain and port (`10000`).

### Benefits of the Canonical Single-Origin Stack:
1. **Zero CORS Friction:** Frontend and backend share the exact same host and protocol, eliminating cross-origin browser rejections.
2. **Secure Cookies:** `HttpOnly; SameSite=Strict; Secure` refresh cookies work out of the box without third-party cookie restrictions.
3. **Simplicity:** One service to manage, one URL, and unified SSL/TLS.

---

## 2. Render Deployment Options

### Option A: Render Blueprints (Recommended)
1. Push your repository to GitHub (`https://github.com/mrigeshkoyande/breatheiq`).
2. Open the [Render Dashboard](https://dashboard.render.com).
3. Click **New** → **Blueprint**.
4. Select your `breatheiq` repository and branch `main` (or `complete/100`).
5. Render detects `render.yaml` and provisions:
   - **breatheiq** (Web Service, Docker runtime, Singapore region)
   - **breatheiq-db** (Managed PostgreSQL database, Free plan)
6. Click **Apply**. Render will automatically build the container and start the service.

### Option B: Manual Web Service Setup
If creating the service manually:
1. Click **New** → **Web Service** in Render.
2. Connect your GitHub repository.
3. Configure settings:
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Context:** `.` (Repository root)
   - **Plan:** `Free`
   - **Health Check Path:** `/healthz`
4. Set Environment Variables:
   - `ENVIRONMENT`: `demo` (or `production`)
   - `SERVE_FRONTEND`: `true`
   - `COOKIE_SECURE`: `true`
   - `PORT`: `10000`
   - `DATABASE_URL`: Your PostgreSQL connection string (or leave unset for internal SQLite fallback)
   - `JWT_SECRET_KEY`: A secure 32+ character string
   - `GEMINI_API_KEY`: Your Gemini API key (optional)
   - `OPENAQ_API_KEY`: Your OpenAQ key (optional)

---

## 3. Important Render Platform Facts (Free Tier)

- **Port Binding:** Render requires services to listen on `0.0.0.0` and port `${PORT:-10000}`. Binding to `127.0.0.1` or failing to bind `${PORT}` causes deploy timeouts ("No open ports detected").
- **Cold Starts:** Free tier web services spin down after 15 minutes of inactivity. When a new request arrives, it takes approximately 50–60 seconds for the container to wake.
- **Ephemeral Filesystem:** Free web services do not have persistent disks. When using SQLite fallback, data resets when the container restarts. Use Render Managed PostgreSQL (`breatheiq-db`) for persistent storage.
- **Managed PostgreSQL Expiry:** Render's free tier databases expire 30 days after creation. Re-create the database instance near judging or demo presentation days.
- **Outbound Email:** Ports 25, 465, and 587 are blocked on Render free tier to prevent spam abuse. In demo mode, email delivery is gracefully simulated, and password reset links are surfaced on-screen.
- **Background Schedulers:** Schedulers run only while the web container is awake. 24/7 background cron execution requires a paid background worker.

---

## 4. Immediate Workarounds & Settings Fixes

### Resolving ALLOWED_ORIGINS Crash
If you previously saw:
```
pydantic_settings.exceptions.SettingsError: error parsing value for field "ALLOWED_ORIGINS" from source "EnvSettingsSource"
```
The codebase now natively handles all four formats:
1. **Empty / Unset:** Defaults to local development origins or same-origin.
2. **Single Origin:** `"https://breatheiq.vercel.app"`
3. **Comma-Separated String:** `"https://breatheiq.vercel.app, https://preview.vercel.app"`
4. **JSON Array:** `'["https://breatheiq.vercel.app"]'`

**Immediate Manual Workaround in Render Dashboard:**
In Render Dashboard → Environment, set `ALLOWED_ORIGINS` to a JSON array:
`["https://your-service.onrender.com"]`
or delete the variable entirely (the backend will use the safe default).

---

## 5. Troubleshooting Reference Table

| Issue | Root Cause | Solution |
|---|---|---|
| **No open ports detected / Exited with status 1** | App failed during startup (e.g., config error) or uvicorn did not bind `0.0.0.0:${PORT}`. | Check deployment logs. BreatheIQ prints clean `[FATAL CONFIGURATION ERROR]` explanations. Dockerfile binds `0.0.0.0:${PORT:-10000}`. |
| **SettingsError on ALLOWED_ORIGINS** | Raw comma-separated string passed to pydantic-settings list field. | Fixed in codebase. Set `ALLOWED_ORIGINS` as JSON array `'["https://..."]'` or remove the variable. |
| **PostgreSQL SSL Error (`unexpected keyword 'sslmode'`)** | Render PostgreSQL URL contains `?sslmode=require` which asyncpg does not accept. | Fixed in `config.py` (`normalize_database_url` automatically translates `sslmode=require` to `ssl=require`). |
| **Blank page on deep link refresh** | Static SPA files not routing unmatched routes to `index.html`. | FastAPI `serve_spa` catch-all route returns `index.html` for non-API deep links. |
| **Server sleeping / slow first request** | Render free tier 15-minute idle spin-down. | Expected behavior on free plan. Frontend displays cold-start retry banner while container wakes. |
| **Database disconnected after 30 days** | Render free PostgreSQL instances expire after 30 days. | Delete and re-create `breatheiq-db` in the Render dashboard, or rely on automatic SQLite fallback. |
| **Database migration error** | Database schema out of date with code. | In development/demo, `seed_database()` runs on startup. In production, run migrations using the Render Shell. |

---

## 6. Live Smoke Verification

Verify your live deployment with the automated standard-library smoke test:
```bash
python scripts/smoke_live.py https://<your-service>.onrender.com
```
Checks:
- `/healthz` returns `{"status": "ok"}`
- `/readyz` confirms database connectivity
- `GET /` and `/app/dashboard` return compiled SPA HTML
- Unknown `/api/...` returns JSON 404
- Security headers (nosniff, frame-ancestors, CSP)
- Auth cookie flags (`HttpOnly; SameSite`)
- Atmospheric telemetry APIs
- All 24 SPA routes
