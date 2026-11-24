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
