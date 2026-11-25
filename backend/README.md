# BreatheIQ Backend

FastAPI + Pydantic v2 + SQLAlchemy 2.0 application powering BreatheIQ:
- **JWT Security:** Short-lived in-memory access tokens, rotating `HttpOnly; SameSite=Strict` refresh cookies with token-family reuse detection, Argon2id password hashing, DB-backed login lockout, `slowapi` rate limiting, strict CSP headers, and 1 MB request body caps
- **Deterministic Engines:** CPCB NAQI sub-index calculator, hourly-forecast Window Oracle ventilation engine, indoor CADR purifier sizing, inhalation dose exposure, and sourced impact math
- **Air Data & Copilot Layer:** Async OpenAQ v3 + Open-Meteo reanalysis/forecast adapter with bounded TTL caching and labeled demo fallback; server-side Gemini Copilot with deterministic output validation
- **Quality Commands (run from `backend/` or repo root):**
  - `ruff check backend/app backend/tests/conftest.py` — Linting and import hygiene
  - `mypy -p app` (from `backend/`) — Strict static type checking
  - `pytest tests --cov=app --cov-branch --cov-report=term-missing -q` (from `backend/`) — Unit and integration test suite with branch coverage
  - `pip-audit -r backend/requirements.txt` — Dependency vulnerability scan
