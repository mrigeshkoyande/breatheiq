# Deploying BreatheIQ to Render & Vercel

This guide documents the single-command and dashboard deployment procedures for BreatheIQ.

---

## 1. Deploying to Render (Recommended: Full Single-Origin Stack)

BreatheIQ includes a multi-stage `Dockerfile` and declarative `render.yaml` Blueprint that deploys both the FastAPI backend and compiled React SPA in a single container.

### Option A: Using Render Blueprints (1-Click Automated)
1. Push this repository to GitHub (`https://github.com/mrigeshkoyande/breatheiq`).
2. Log into the [Render Dashboard](https://dashboard.render.com).
3. Click **New** → **Blueprint**.
4. Select your `breatheiq` repository and branch `main`.
5. Render detects `render.yaml` and provisions:
   - **breatheiq** (Web Service, Docker environment)
   - **breatheiq-db** (Managed PostgreSQL database)
6. Click **Apply**. Deployment will build the frontend and run the containerized backend automatically.

### Option B: Manual Web Service Setup
If creating a Web Service manually without Blueprints:
1. In the Render Dashboard, click **New** → **Web Service**.
2. Connect your `breatheiq` GitHub repository.
3. Configure settings:
   - **Name:** `breatheiq`
   - **Region:** `Singapore` (or nearest region)
   - **Environment / Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Context:** `.` (Repository root)
   - **Plan:** `Free`
4. Environment Variables:
   - `ENVIRONMENT`: `production`
   - `SERVE_FRONTEND`: `true`
   - `COOKIE_SECURE`: `true`
   - `DATABASE_URL`: Your PostgreSQL connection string or internal SQLite fallback
   - `JWT_SECRET_KEY`: Any 32+ character random string
5. Health Check Path: `/healthz`
6. Click **Create Web Service**.

---

## 2. Deploying Frontend to Vercel (Alternative Frontend-Only Host)

If you deploy the React frontend to Vercel while keeping the backend on Render:

1. Import the repository in [Vercel Dashboard](https://vercel.com/new).
2. Configure Project Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** default / override off (`npm run build`)
   - **Output Directory:** default / override off (`dist`)
   - **Install Command:** default / override off (`npm install`)
3. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://<your-render-backend>.onrender.com/api/v1`
4. Deploy. Vercel automatically deploys the frontend and uses `frontend/vercel.json` for SPA rewrites.
   - **Output Directory:** `frontend/dist`
   - **Framework:** `Vite`
3. If prompted for **Root Directory**, you can leave it at repository root (`.`) or select `frontend`.
4. Click **Deploy**.

---

## 3. Post-Deployment Verification

Run the automated live smoke verification script against your production URL:

```bash
python scripts/smoke_live.py --base-url https://breatheiq.onrender.com
```

The script asserts:
- `/healthz` responds with HTTP 200
- Public telemetry APIs return valid CPCB NAQI JSON payloads
- All 24 release-scope SPA routes return HTTP 200 without routing errors
