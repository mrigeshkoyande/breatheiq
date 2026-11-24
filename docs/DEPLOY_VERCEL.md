# Deploying BreatheIQ Frontend to Vercel

This guide documents the configuration and troubleshooting steps for deploying the BreatheIQ React SPA frontend to Vercel.

---

## 1. Overview & Repository Architecture

In this repository:
- The React application resides in the `frontend/` directory.
- `frontend/package.json` contains dependencies and build scripts (`vite`, `tsc && vite build`).
- The repository root also contains a `vercel.json` configured with `--prefix frontend` to ensure builds succeed whether the project root in Vercel is set to `.` (repo root) or `frontend`.

---

## 2. Recommended Vercel Configurations

You can configure Vercel using either of two consistent setups in the Vercel Dashboard (**Settings** → **General**):

### Setup A (Recommended: Root Directory = `frontend`)
This is the cleanest and most standard configuration for monorepo frontends on Vercel:
- **Root Directory:** `frontend`
- **Framework Preset:** `Vite`
- **Install Command:** default (`npm install` or `npm ci`)
- **Build Command:** default (`npm run build`) — *Ensure any manual override containing `cd frontend` is toggled OFF.*
- **Output Directory:** default (`dist`)

When Root Directory is set to `frontend`, Vercel reads `frontend/vercel.json` which provides SPA routing rewrites:
```json
{
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Setup B (Root Directory = repository root `.`)
If you leave Root Directory at the repository root:
- **Root Directory:** `.` (or empty)
- **Framework Preset:** `Vite`
- **Install Command:** `npm --prefix frontend install` (or override toggle OFF)
- **Build Command:** `npm --prefix frontend run build` (or override toggle OFF)
- **Output Directory:** `frontend/dist`

When Root Directory is `.`, Vercel reads the root `vercel.json` which executes via `--prefix frontend` and routes all deep links (`/app/dashboard`, etc.) to `/index.html`.

> [!IMPORTANT]
> **Why the earlier Vercel build failed:**
> The error `sh: line 1: cd: frontend: No such file or directory` happens when Vercel's **Root Directory** was already set to `frontend`, but a manual **Build Command Override** in the dashboard had `cd frontend && npm install && npm run build`. Inside `frontend`, there is no nested `frontend` folder.
> **Fix:** In your Vercel Project Settings → General → Build & Development Settings, turn the **Build Command Override** toggle **OFF** or remove `cd frontend &&`.

---

## 3. Environment Variables on Vercel

Only client-facing environment variables starting with `VITE_` are bundled into the frontend.

| Variable Name | Required | Default / Example | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | Optional | `/api/v1` (relative) or `https://breatheiq.onrender.com/api/v1` | URL of the deployed backend API |

> [!WARNING]
> **Never add backend secrets to Vercel!**
> Variables such as `JWT_SECRET_KEY`, `DATABASE_URL`, `GEMINI_API_KEY`, and `OPENAQ_API_KEY` are server-only. Adding them to Vercel does nothing and exposes sensitive tokens if prefixed with `VITE_`.
> BreatheIQ's frontend API client (`frontend/src/services/api.ts`) defaults to `/api/v1` and **never** falls back to `localhost` in production.

---

## 4. SPA Deep Linking & 404 Prevention

Because BreatheIQ is a client-side Single Page Application (SPA), refreshing deep routes such as `/app/dashboard`, `/explore`, or `/admin` must be rewritten to `/index.html` rather than returning a 404. Both `vercel.json` and `frontend/vercel.json` include:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 5. Troubleshooting Reference

| Symptom | Root Cause | Solution |
|---|---|---|
| `cd: frontend: No such file or directory` | Build command override in Vercel settings has `cd frontend` while Root Directory is already `frontend`. | In Vercel Project Settings → Build & Development Settings, toggle Build Command Override OFF. |
| Deep links 404 on refresh | Missing SPA rewrite rule in `vercel.json`. | Ensure `rewrites` array points `/(.*)` to `/index.html`. (Already included in repo). |
| CORS error contacting backend | Backend `ALLOWED_ORIGINS` does not list the Vercel domain. | Add `https://<your-project>.vercel.app` to backend `ALLOWED_ORIGINS` in Render dashboard. |
| Esbuild install script warning | npm 10+ notice about unapproved postinstall scripts. | Benign warning. Build succeeds normally. |
