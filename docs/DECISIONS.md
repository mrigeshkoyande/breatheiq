# Architectural Decision Records (ADR) — BreatheIQ

## ADR 001: 24-Route Release Scope Consolidation

### Date
2026-11-24

### Status
Accepted & Implemented

### Context
The original specification proposed 93 routes across deep administrative, hyper-specific research, and multi-step onboarding sub-routes. An honest audit revealed that attempting to implement 93 shallow pages would result in widespread placeholder stubs, unverified mocks, and brittle user experiences.

The hackathon judging rubric for **Challenge 6: GenAI Urban Air Quality Assistant** prioritizes:
1. **Problem Alignment & Depth:** Solving the daily winter smog crisis for families through real daily routines, indoor ventilation optimization (Window Oracle), CADR air purifier guidance, and verifiable personal impact.
2. **AI Integration:** Grounded atmospheric copilot with strict prompt injection guardrails, safety validation, evidence citation, and fallback routines.
3. **Engineering Rigor:** Clean type-checked React 18, FastAPI with Argon2id auth, automated stub auditing, real data provider fallbacks, and zero unverified marketing claims.
4. **Performance & Repo Budget:** Fast load times, responsive UI across mobile/tablet/desktop, and strict repository diet (< 2.0 MB).

### Decision
Consolidate the application to **24 High-Impact, Real Routes** for the v1 Release Scope:
- **Public (4):** `/`, `/explore`, `/methodology`, `/privacy`
- **Auth & Onboarding (5):** `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/onboarding`
- **Core Application (13):** `/app/dashboard`, `/app/air-quality`, `/app/analytics`, `/app/assistant`, `/app/routine`, `/app/home`, `/app/family`, `/app/routes`, `/app/impact`, `/app/impact/what-if`, `/app/notifications`, `/app/settings`, `/app/community`
- **Administration (1):** `/admin` (Unified command dashboard with tabs for Users, Moderation Queue, AI Trace Log, Audit Log, Integration Status)
- **System (1):** `/404` (Error recovery and emergency health guidance)

All remaining 70 routes are formally marked `DEFERRED` in `docs/routes.manifest.json` with clear rationales. No dead links or placeholder cards exist in user navigation.

### Deferred Routes (70 total)
- `/about` — About BreatheIQ (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/features` — Features & Comparison (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/how-it-works` — How It Works (Engine Stepper) (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/explore/:city` — City Air Quality Detail (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/data-sources` — Data Sources & Provider Health (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/resources` — Resources & Downloadable Guides (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/resources/:slug` — Resource Detail & Copilot-Lite (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/for-schools` — For Schools & Clean Air Advisory (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/for-communities` — For Communities & Neighborhoods (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/faq` — FAQ Knowledge Base (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/contact` — Contact & Partnerships (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/help` — Help Center & User Guides (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/status` — System & Provider Status (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/terms` — Terms of Service (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/verify-email` — Verify Email (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/onboarding/profile` — Onboarding: Profile (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/onboarding/location` — Onboarding: Location (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/onboarding/household` — Onboarding: Household (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/onboarding/lifestyle` — Onboarding: Lifestyle (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/onboarding/alerts` — Onboarding: Alerts (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/onboarding/complete` — Onboarding: Complete & AirTwin (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/air-quality/stations/:id` — Station Telemetry Detail (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/analytics/reports` — Analytics Reports Archive (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/assistant/history` — Copilot Chat History (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/smogshield` — SmogShield 48h Risk & Rules (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/routine/calendar` — Routine Monthly Calendar (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/home/rooms/:id` — Room Profile & Sensor Telemetry (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/home/purifier-guide` — Purifier CADR Sizing & DIY Guide (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/home/checklist` — Indoor Air Quality Checklist (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/family/members/:id` — Family Member Guidance Profile (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/school-mode` — School Mode Hourly Guidance (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/routes/history` — Commute Log & Exposure History (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/green-living` — Green Living Hub (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/green-living/habits` — Daily Green Habits Tracker (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/impact/reports` — Impact Reports & Verification (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/airtwin` — AirTwin Personalized Exposure Profile (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/protect/masks` — Respirator & Mask Sizing Guide (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/protect/emergency-kit` — Offline Smog Emergency Kit (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/pollution-sources` — Winter Smog Drivers & Inversion Explainer (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/settings/security` — Security & Session Management (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/settings/privacy-data` — Privacy & Data Export/Deletion (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/community/air-watch` — Citizen Air Watch Map & Feed (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/community/air-watch/new` — Submit Air Watch Report (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/community/campaigns` — Community Clean Air Campaigns (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/community/campaigns/:id` — Campaign Action Hub (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/community/leaderboard` — Clean Air Impact Leaderboard (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/community/events` — Clean Air Events Calendar (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/community/events/:id` — Event Detail & RSVP (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/community/groups/:id` — Community Group Portal (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/learn` — Atmospheric Learning Hub (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/learn/:slug` — Learning Article View (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/learn/glossary` — Atmospheric Science Glossary (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/challenges` — Clean Air Challenges (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/challenges/:id` — Challenge Task Runner (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/quiz/:id` — Clean Air Quiz Runner (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/app/achievements` — Badges & Achievements (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/admin/users` — User Management (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/admin/users/:id` — User Detail & Role Control (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/admin/roles` — Role Permission Matrix (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/admin/air-data` — Air Telemetry Provider Control (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/admin/integrations` — Integrations & External APIs (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/admin/moderation` — Citizen Report Moderation Queue (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/admin/ai-management` — AI Models & Prompt Versioning (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/admin/ai-management/logs` — AI Safety & Trace Explorer (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/admin/content` — CMS Content Manager (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/admin/analytics` — Platform Telemetry & Adoption (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/admin/audit-logs` — Immutable Security Audit Trail (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/admin/system-health` — System Health & Schedulers (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/403` — Forbidden (403) (Scoped out for v1 hackathon release; prioritizes depth on core family flow)
- `/500` — Server Error (500) (Scoped out for v1 hackathon release; prioritizes depth on core family flow)

### Consequences
- **Positive:** Every route in the release scope is fully built, backed by real database models and API endpoints, tested across 3 viewport widths (390px, 768px, 1440px), and audited for 0 stubs.
- **Positive:** Repo footprint remains under 1.5 MB tracked files.
- **Positive:** Development focus is centered on deep, reliable features directly answering the hackathon brief.
- **Negative:** Some secondary tools (e.g. standalone industrial sensor provisioning, enterprise billing, individual multi-page research whitepapers) are postponed to future releases.


## ADR 002: Canonical Single-Origin Deployment Architecture

### Date
2026-11-24

### Status
Accepted & Implemented

### Context
Deploying the React SPA to Vercel and the FastAPI API to Render causes the browser to treat them as different sites (`vercel.app` vs `onrender.com`). Under modern browser privacy defaults (e.g. Chrome, Safari, Firefox), cross-site requests require `SameSite=None; Secure` cookies, third-party cookie permissions, and complex CORS preflight negotiations. If cookie partitioning or adblockers block third-party cookies, JWT refresh tokens fail silently.

### Decision
Establish a **Single Render Docker Web Service** as the canonical production deployment architecture:
1. Multi-stage `Dockerfile`: Stage 1 compiles the Vite frontend (`frontend/dist`); Stage 2 runs FastAPI and serves both the API (`/api/v1/*`) and the compiled SPA (`/*`).
2. Single-origin relative requests (`/api/v1`): zero CORS overhead, zero cross-origin latency, and robust `HttpOnly; SameSite=Strict; Secure` refresh cookies.
3. Vercel remains fully supported as a secondary/decoupled frontend host via `docs/DEPLOY_VERCEL.md` with explicit CORS origin configuration and SPA rewrites.

### Consequences
- **Positive:** Consistent cookie delivery on all browsers without third-party cookie degradation.
- **Positive:** Single URL for users and judges to access the complete application.
- **Positive:** Simplified environment variable management (no public API URL required in frontend builds).


## ADR 003: Robust Multi-Format ALLOWED_ORIGINS Parsing & Deployment Guardrails

### Date
2026-11-24

### Status
Accepted & Implemented

### Context
Render failed to boot because `ALLOWED_ORIGINS` was typed as `list[str]`, causing `pydantic-settings` to attempt JSON decoding on raw comma-separated environment variables, throwing `json.JSONDecodeError` during `Settings()` instantiation.

### Decision
1. Update `ALLOWED_ORIGINS: Union[List[str], str]` with a robust `mode="before"` field validator supporting:
   - Empty or unset string -> empty list `[]`
   - Single URL string -> single-element list
   - Comma-delimited string -> trimmed list of URLs
   - JSON array string -> parsed list of URLs
2. Enforce CORS security invariants:
   - Prohibit wildcard `*` origins when credentials (`allow_credentials=True`) are enabled.
   - Require explicit `http://` or `https://` protocols for each origin.
3. Wrap settings initialization in `config.py` with an informative error catcher that logs the exact configuration error and accepted formats to `sys.stderr` before exiting with code 1.
4. Bound start command to `${PORT:-10000}` and `0.0.0.0` with `--proxy-headers` for reverse proxy compatibility.
5. In production environment (`ENVIRONMENT=production`): refuse to boot without a strong, non-default `JWT_SECRET_KEY` (minimum 32 characters) and never seed demo accounts.

### Consequences
- **Positive:** Eliminates Render boot crashes caused by environment variable syntax variations.
- **Positive:** Hardens production security against default secrets and wildcard credential leaks.
