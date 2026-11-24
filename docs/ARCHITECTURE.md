# BreatheIQ System Architecture

## 1. High-Level Topology

BreatheIQ employs a decoupled client-server architecture engineered for data provenance, responsive client execution, and auditable telemetry.

```
[ Client Browser (React 18 + Vite) ]
         │ (JWT Bearer Token in-memory + HttpOnly SameSite=Strict Refresh Cookie)
         ▼
[ FastAPI Backend (Python 3.11) ]
    ├── Router & Rate Limiter (SlowAPI)
    ├── Auth & RBAC Middleware (Argon2id + PyJWT)
    ├── Deterministic Computation Engines (NAQI, Ventilation, CADR, Inhaled Dose)
    ├── Atmospheric Data Service (Open-Meteo & Station Telemetry with TTL Cache)
    └── Grounded Copilot (Gemini API + Code-Based Safety & Evidence Validator)
         │
         ├── [ SQLite / PostgreSQL + PostGIS (SQLAlchemy 2 Async) ]
         └── [ AI Trace & Audit Logs ]
```

## 2. Core Components

### Frontend (Client-Side)
- **Framework:** React 18, TypeScript (strict mode), Vite 5, Tailwind CSS.
- **State & Caching:** TanStack Query v5 for server state and background refetching.
- **Routing:** React Router DOM v6 with route-level authentication guards (`ProtectedRoute`).
- **Icons & Motion:** Lucide React icons, Framer Motion with reduced-motion support.

### Backend (Server-Side)
- **Application Engine:** FastAPI on Uvicorn ASGI server with async endpoints.
- **Database Layer:** SQLAlchemy 2 async session with SQLite fallback and PostgreSQL/PostGIS support.
- **Deterministic Calculation Engines:**
  - `naqi.py`: Statutory CPCB National Air Quality Index breakpoints with 3-pollutant / particulate rule.
  - `ventilation.py`: Window Oracle boundary layer height and thermal inversion lifting engine.
  - `purifier.py`: CADR requirement calculator and single-zone decay kinetics.
  - `impact.py`: Inhaled PM2.5 dosage ($V_{air} \times \Delta C \times t$) and commute emission savings.

### Data Ingestion & Provenance Tier
- **Data Providers:** Abstract `AirDataProvider` interface implemented by `OpenMeteoAirQualityProvider` and `DemoAirDataProvider`.
- **TTL Cache:** In-memory 15-minute caching layer preventing external API quota exhaustion.
- **Strict Evidence Labeling:** Every data card outputs an explicit badge (`LIVE`, `MODELED`, `FORECAST`, `ESTIMATED`, `DEMO`, or `USER-REPORTED`) with source timestamp.

### Grounded Copilot Pipeline
1. **Adversarial Sanitizer:** Detects prompt injections and system override attempts.
2. **Context Router:** Formulates spatial and demographic context from user's active household.
3. **Model Invocation:** Queries Gemini 2.5 Flash with structured system prompt and context constraints.
4. **Safety & Evidence Validator:** Code-based post-processor verifying every stated numeric metric against ground truth before presentation.
5. **Trace Auditing:** Records input, retrieved context, raw response, and validation status to `ai_traces` table.
