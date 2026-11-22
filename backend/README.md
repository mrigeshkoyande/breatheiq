# BreatheIQ Backend

FastAPI application providing:
- High-security JWT authentication (HttpOnly refresh token rotation, argon2id, audit logs)
- CPCB NAQI calculation engine and deterministic environmental modules
- Air Quality Data Layer (OpenAQ live stations, Open-Meteo modeled/forecast, deterministic demo provider)
- BreatheIQ Copilot AI orchestrator (Google Gemini function calling + strict evidence validator)
- Relational schema (SQLAlchemy 2.0 async + Alembic + SQLite/PostgreSQL)
