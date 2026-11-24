# BreatheIQ Route Ledger & Implementation Status

> **Single Source of Truth** — Generated automatically by `scripts/build_status.py`.  
> Last audit: `2026-11-24 06:09:43Z`.  
> Release Scope: **24 Routes** | Deferred: **70 Routes**

---

## 📊 Status Summary (Release Scope: 24 Routes)

| Status | Count | Percentage of Release | Definition |
|---|---|---|---|
| 🟢 **VERIFIED** | `0` | `0.0%` | Passes 3-width smoke, real API data, interaction tests, axe a11y, no stubs |
| 🟡 **FUNCTIONAL** | `7` | `29.2%` | Wired to API and mounted, awaiting full automated verification run |
| 🔵 **UI-ONLY** | `0` | `0.0%` | UI exists but not connected to backend APIs |
| 🟠 **STUB** | `0` | `0.0%` | Placeholder, partial layout, or hardcoded component data |
| 🔴 **MISSING** | `17` | `70.8%` | Route and component do not exist |
| ⚪ **DEFERRED** | `70` | — | Scoped out for v1 release to ensure rigorous depth on core family flow |

---

## 📋 Release Scope Ledger (24 Routes)

| # | Route | Name | Category | Tier | Access | Status | Design Asset | Evidence / Audit Findings |
|---|---|---|---|---|---|---|---|---|
| 1 | `/` | Landing Page | Public | T1 | public | 🟡 FUNCTIONAL | breatheiq_landing_page_mumbai_hero_redesign | Complete Mumbai redesign (1215 lines); What-If simulator, bento grid, location search, FAQ |
| 5 | `/explore` | Explore Indian Cities | Public | T1 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 7 | `/methodology` | CPCB NAQI Methodology & Calculator | Public | T1 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 17 | `/privacy` | Privacy Policy | Public | T2 | public | 🔴 MISSING | breatheiq_privacy_policy_terms | Route not mounted in App.tsx or page component missing |
| 19 | `/login` | Sign In | Auth and onboarding | T1 | public | 🟡 FUNCTIONAL | breatheiq_login_a1 | Form wired to backend /api/v1/auth endpoints (210 lines) |
| 20 | `/signup` | Create Account | Auth and onboarding | T1 | public | 🟡 FUNCTIONAL | breatheiq_signup_a2 | Form wired to backend /api/v1/auth endpoints (162 lines) |
| 21 | `/forgot-password` | Forgot Password | Auth and onboarding | T1 | public | 🟡 FUNCTIONAL | breatheiq_forgot_password_a3 | Form wired to backend /api/v1/auth endpoints (100 lines) |
| 22 | `/reset-password` | Reset Password | Auth and onboarding | T1 | public | 🟡 FUNCTIONAL | breatheiq_reset_password_a4 | Form wired to backend /api/v1/auth endpoints (124 lines) |
| 30 | `/app/dashboard` | Atmospheric Dashboard | Core app | T1 | user | 🟡 FUNCTIONAL | breatheiq_main_dashboard_andheri_west_mumbai | Complete Andheri West dashboard (663 lines); interactive routine, Window Oracle, AQI dial |
| 31 | `/app/air-quality` | Atmospheric Command Center | Core app | T1 | user | 🔴 MISSING | breatheiq_atmospheric_command_center | Route not mounted in App.tsx or page component missing |
| 33 | `/app/analytics` | Inversion & AQI Analytics | Core app | T1 | user | 🔴 MISSING | breatheiq_air_quality_inversion_analytics | Route not mounted in App.tsx or page component missing |
| 35 | `/app/assistant` | AI Atmospheric Copilot | Core app | T1 | user | 🔴 MISSING | breatheiq_ai_atmospheric_assistant | Route not mounted in App.tsx or page component missing |
| 38 | `/app/routine` | Adaptive Daily Routine | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 40 | `/app/home` | Home & Indoor Air Oracle | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 44 | `/app/family` | Family Air Guardians | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 47 | `/app/routes` | CleanRoute Commute Navigator | Core app | T1 | user | 🔴 MISSING | breatheiq_cleanroute_commute_navigator | Route not mounted in App.tsx or page component missing |
| 51 | `/app/impact` | Sustainability Score & Avoided Emissions | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 52 | `/app/impact/what-if` | What-If Impact Scenario Builder | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 58 | `/app/notifications` | Notification Center | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 59 | `/app/settings` | User Settings & Accessibility | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 62 | `/app/community` | Community Air Pulse | Community | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 78 | `/admin` | Admin Command Center | Admin | T2 | admin | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 92 | `/404` | Not Found (404) | System | T1 | public | 🟡 FUNCTIONAL | — | Accessible 404 view (101 lines); emergency air hotline, search fallback, quick nav |
| 94 | `/onboarding` | Personalized Setup Wizard | Auth | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |

---

## ⏸️ Deferred Routes (70 Routes)
*Scoped out for v1 hackathon release to ensure depth on core problem flow.*

| Route | Name | Reason |
|---|---|---|
| `/about` | About BreatheIQ | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/features` | Features & Comparison | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/how-it-works` | How It Works (Engine Stepper) | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/explore/:city` | City Air Quality Detail | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/data-sources` | Data Sources & Provider Health | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/resources` | Resources & Downloadable Guides | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/resources/:slug` | Resource Detail & Copilot-Lite | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/for-schools` | For Schools & Clean Air Advisory | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/for-communities` | For Communities & Neighborhoods | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/faq` | FAQ Knowledge Base | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/contact` | Contact & Partnerships | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/help` | Help Center & User Guides | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/status` | System & Provider Status | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/terms` | Terms of Service | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/verify-email` | Verify Email | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/onboarding/profile` | Onboarding: Profile | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/onboarding/location` | Onboarding: Location | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/onboarding/household` | Onboarding: Household | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/onboarding/lifestyle` | Onboarding: Lifestyle | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/onboarding/alerts` | Onboarding: Alerts | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/onboarding/complete` | Onboarding: Complete & AirTwin | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/air-quality/stations/:id` | Station Telemetry Detail | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/analytics/reports` | Analytics Reports Archive | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/assistant/history` | Copilot Chat History | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/smogshield` | SmogShield 48h Risk & Rules | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/routine/calendar` | Routine Monthly Calendar | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/home/rooms/:id` | Room Profile & Sensor Telemetry | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/home/purifier-guide` | Purifier CADR Sizing & DIY Guide | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/home/checklist` | Indoor Air Quality Checklist | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/family/members/:id` | Family Member Guidance Profile | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/school-mode` | School Mode Hourly Guidance | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/routes/history` | Commute Log & Exposure History | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/green-living` | Green Living Hub | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/green-living/habits` | Daily Green Habits Tracker | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/impact/reports` | Impact Reports & Verification | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/airtwin` | AirTwin Personalized Exposure Profile | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/protect/masks` | Respirator & Mask Sizing Guide | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/protect/emergency-kit` | Offline Smog Emergency Kit | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/pollution-sources` | Winter Smog Drivers & Inversion Explainer | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/settings/security` | Security & Session Management | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/settings/privacy-data` | Privacy & Data Export/Deletion | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/community/air-watch` | Citizen Air Watch Map & Feed | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/community/air-watch/new` | Submit Air Watch Report | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/community/campaigns` | Community Clean Air Campaigns | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/community/campaigns/:id` | Campaign Action Hub | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/community/leaderboard` | Clean Air Impact Leaderboard | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/community/events` | Clean Air Events Calendar | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/community/events/:id` | Event Detail & RSVP | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/community/groups/:id` | Community Group Portal | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/learn` | Atmospheric Learning Hub | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/learn/:slug` | Learning Article View | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/learn/glossary` | Atmospheric Science Glossary | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/challenges` | Clean Air Challenges | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/challenges/:id` | Challenge Task Runner | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/quiz/:id` | Clean Air Quiz Runner | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/app/achievements` | Badges & Achievements | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/admin/users` | User Management | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/admin/users/:id` | User Detail & Role Control | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/admin/roles` | Role Permission Matrix | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/admin/air-data` | Air Telemetry Provider Control | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/admin/integrations` | Integrations & External APIs | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/admin/moderation` | Citizen Report Moderation Queue | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/admin/ai-management` | AI Models & Prompt Versioning | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/admin/ai-management/logs` | AI Safety & Trace Explorer | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/admin/content` | CMS Content Manager | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/admin/analytics` | Platform Telemetry & Adoption | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/admin/audit-logs` | Immutable Security Audit Trail | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/admin/system-health` | System Health & Schedulers | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/403` | Forbidden (403) | Scoped out for v1 hackathon release; prioritizes depth on core family flow |
| `/500` | Server Error (500) | Scoped out for v1 hackathon release; prioritizes depth on core family flow |

---
*Ledger maintained per `AGENTS.md` Section 5. Only routes with status `VERIFIED` may be cited in final release materials.*
