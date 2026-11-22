# BreatheIQ — Breathe Smarter. Live Healthier.

> **Challenge 6 — Urban Air Quality Assistant:** A GenAI-powered platform empowering families and communities to navigate severe winter smog and urban air pollution with deterministic atmospheric science, CPCB standards, and personalized AI guidance.

---

## Architecture & System Overview

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Leaflet, TanStack Query, i18next (English, Hindi, Marathi).
- **Backend:** FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy 2.x async, Alembic, PyJWT (argon2id), slowapi, pywebpush.
- **Database:** PostgreSQL (+PostGIS) via Docker Compose with automatic SQLite fallback for zero-setup demo and test environments.
- **AI Core:** BreatheIQ Copilot powered by Google Gemini API with single-call function calling, structured Pydantic JSON schema, and strict deterministic evidence validation.
- **Data Providers:** OpenAQ (ground stations, LIVE), Open-Meteo Air Quality (MODELED/FORECAST), Open-Meteo Weather, and deterministic DEMO provider.

---

## Quick Start (Zero-Setup Demo Mode)

### Prerequisites
- Node.js 20+
- Python 3.11+

### 1. Clone & Setup Environment
```powershell
cp .env.example .env
```

### 2. Run Backend
```powershell
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Run Frontend
```powershell
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to explore BreatheIQ.

---

## Verification & Repository Budget
Run the repository size check to ensure tracked files remain under 8 MB:
```powershell
python scripts/check_repo_size.py
```

---

## License
Built for Hackathon Challenge 6. All rights reserved.
