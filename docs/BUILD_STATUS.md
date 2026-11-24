# BreatheIQ Route Ledger & Implementation Status

> **Single Source of Truth** — Generated automatically by `scripts/build_status.py`.  
> Last audit: `2026-11-24 05:50:18Z`.  
> Total Routes Specified: **93**

---

## 📊 Status Summary

| Status | Count | Percentage | Definition |
|---|---|---|---|
| 🟢 **VERIFIED** | `0` | `0.0%` | Passes 3-width smoke, real API data, interaction tests, axe a11y, no stubs |
| 🟡 **FUNCTIONAL** | `8` | `8.6%` | Wired to API and works, but awaiting full verification tests |
| 🔵 **UI-ONLY** | `0` | `0.0%` | UI exists but not connected to backend APIs |
| 🟠 **STUB** | `0` | `0.0%` | Placeholder, partial layout, or hardcoded component data |
| 🔴 **MISSING** | `85` | `91.4%` | Route and component do not exist |

---

## 📋 Comprehensive 93-Route Ledger

| # | Route | Name | Category | Tier | Access | Status | Design Asset | Evidence / Audit Findings |
|---|---|---|---|---|---|---|---|---|
| 1 | `/` | Landing Page | Public | T1 | public | 🟡 FUNCTIONAL | breatheiq_landing_page_mumbai_hero_redesign | Complete Mumbai redesign (1215 lines); What-If simulator, bento grid, location search, FAQ |
| 2 | `/about` | About BreatheIQ | Public | T2 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 3 | `/features` | Features & Comparison | Public | T2 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 4 | `/how-it-works` | How It Works (Engine Stepper) | Public | T2 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 5 | `/explore` | Explore Indian Cities | Public | T1 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 6 | `/explore/:city` | City Air Quality Detail | Public | T2 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 7 | `/methodology` | CPCB NAQI Methodology & Calculator | Public | T1 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 8 | `/data-sources` | Data Sources & Provider Health | Public | T2 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 9 | `/resources` | Resources & Downloadable Guides | Public | T2 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 10 | `/resources/:slug` | Resource Detail & Copilot-Lite | Public | T2 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 11 | `/for-schools` | For Schools & Clean Air Advisory | Public | T2 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 12 | `/for-communities` | For Communities & Neighborhoods | Public | T2 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 13 | `/faq` | FAQ Knowledge Base | Public | T2 | public | 🔴 MISSING | breatheiq_faq_knowledge_base | Route not mounted in App.tsx or page component missing |
| 14 | `/contact` | Contact & Partnerships | Public | T2 | public | 🔴 MISSING | breatheiq_contact_partnerships | Route not mounted in App.tsx or page component missing |
| 15 | `/help` | Help Center & User Guides | Public | T2 | public | 🔴 MISSING | breatheiq_help_center_user_guides | Route not mounted in App.tsx or page component missing |
| 16 | `/status` | System & Provider Status | Public | T2 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 17 | `/privacy` | Privacy Policy | Public | T2 | public | 🔴 MISSING | breatheiq_privacy_policy_terms | Route not mounted in App.tsx or page component missing |
| 18 | `/terms` | Terms of Service | Public | T2 | public | 🔴 MISSING | breatheiq_privacy_policy_terms | Route not mounted in App.tsx or page component missing |
| 19 | `/login` | Sign In | Auth and onboarding | T1 | public | 🟡 FUNCTIONAL | breatheiq_login_a1 | Form wired to backend /api/v1/auth endpoints; pending full Playwright 3-viewport test suite |
| 20 | `/signup` | Create Account | Auth and onboarding | T1 | public | 🟡 FUNCTIONAL | breatheiq_signup_a2 | Form wired to backend /api/v1/auth endpoints; pending full Playwright 3-viewport test suite |
| 21 | `/forgot-password` | Forgot Password | Auth and onboarding | T1 | public | 🟡 FUNCTIONAL | breatheiq_forgot_password_a3 | Form wired to backend /api/v1/auth endpoints; pending full Playwright 3-viewport test suite |
| 22 | `/reset-password` | Reset Password | Auth and onboarding | T1 | public | 🟡 FUNCTIONAL | breatheiq_reset_password_a4 | Form wired to backend /api/v1/auth endpoints; pending full Playwright 3-viewport test suite |
| 23 | `/verify-email` | Verify Email | Auth and onboarding | T2 | public | 🟡 FUNCTIONAL | breatheiq_verify_email_a5 | Form wired to backend /api/v1/auth endpoints; pending full Playwright 3-viewport test suite |
| 24 | `/onboarding/profile` | Onboarding: Profile | Auth and onboarding | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 25 | `/onboarding/location` | Onboarding: Location | Auth and onboarding | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 26 | `/onboarding/household` | Onboarding: Household | Auth and onboarding | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 27 | `/onboarding/lifestyle` | Onboarding: Lifestyle | Auth and onboarding | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 28 | `/onboarding/alerts` | Onboarding: Alerts | Auth and onboarding | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 29 | `/onboarding/complete` | Onboarding: Complete & AirTwin | Auth and onboarding | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 30 | `/app/dashboard` | Atmospheric Dashboard | Core app | T1 | user | 🟡 FUNCTIONAL | breatheiq_main_dashboard_andheri_west_mumbai | Complete Andheri West dashboard (663 lines); interactive routine checklist, Window Oracle, AQI dial |
| 31 | `/app/air-quality` | Atmospheric Command Center | Core app | T1 | user | 🔴 MISSING | breatheiq_atmospheric_command_center | Route not mounted in App.tsx or page component missing |
| 32 | `/app/air-quality/stations/:id` | Station Telemetry Detail | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 33 | `/app/analytics` | Inversion & AQI Analytics | Core app | T1 | user | 🔴 MISSING | breatheiq_air_quality_inversion_analytics | Route not mounted in App.tsx or page component missing |
| 34 | `/app/analytics/reports` | Analytics Reports Archive | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 35 | `/app/assistant` | AI Atmospheric Copilot | Core app | T1 | user | 🔴 MISSING | breatheiq_ai_atmospheric_assistant | Route not mounted in App.tsx or page component missing |
| 36 | `/app/assistant/history` | Copilot Chat History | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 37 | `/app/smogshield` | SmogShield 48h Risk & Rules | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 38 | `/app/routine` | Adaptive Daily Routine | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 39 | `/app/routine/calendar` | Routine Monthly Calendar | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 40 | `/app/home` | Home & Indoor Air Oracle | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 41 | `/app/home/rooms/:id` | Room Profile & Sensor Telemetry | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 42 | `/app/home/purifier-guide` | Purifier CADR Sizing & DIY Guide | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 43 | `/app/home/checklist` | Indoor Air Quality Checklist | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 44 | `/app/family` | Family Air Guardians | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 45 | `/app/family/members/:id` | Family Member Guidance Profile | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 46 | `/app/school-mode` | School Mode Hourly Guidance | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 47 | `/app/routes` | CleanRoute Commute Navigator | Core app | T1 | user | 🔴 MISSING | breatheiq_cleanroute_commute_navigator | Route not mounted in App.tsx or page component missing |
| 48 | `/app/routes/history` | Commute Log & Exposure History | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 49 | `/app/green-living` | Green Living Hub | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 50 | `/app/green-living/habits` | Daily Green Habits Tracker | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 51 | `/app/impact` | Sustainability Score & Avoided Emissions | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 52 | `/app/impact/what-if` | What-If Impact Scenario Builder | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 53 | `/app/impact/reports` | Impact Reports & Verification | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 54 | `/app/airtwin` | AirTwin Personalized Exposure Profile | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 55 | `/app/protect/masks` | Respirator & Mask Sizing Guide | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 56 | `/app/protect/emergency-kit` | Offline Smog Emergency Kit | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 57 | `/app/pollution-sources` | Winter Smog Drivers & Inversion Explainer | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 58 | `/app/notifications` | Notification Center | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 59 | `/app/settings` | User Settings & Accessibility | Core app | T1 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 60 | `/app/settings/security` | Security & Session Management | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 61 | `/app/settings/privacy-data` | Privacy & Data Export/Deletion | Core app | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 62 | `/app/community` | Community Air Pulse | Community | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 63 | `/app/community/air-watch` | Citizen Air Watch Map & Feed | Community | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 64 | `/app/community/air-watch/new` | Submit Air Watch Report | Community | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 65 | `/app/community/campaigns` | Community Clean Air Campaigns | Community | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 66 | `/app/community/campaigns/:id` | Campaign Action Hub | Community | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 67 | `/app/community/leaderboard` | Clean Air Impact Leaderboard | Community | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 68 | `/app/community/events` | Clean Air Events Calendar | Community | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 69 | `/app/community/events/:id` | Event Detail & RSVP | Community | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 70 | `/app/community/groups/:id` | Community Group Portal | Community | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 71 | `/app/learn` | Atmospheric Learning Hub | Learning | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 72 | `/app/learn/:slug` | Learning Article View | Learning | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 73 | `/app/learn/glossary` | Atmospheric Science Glossary | Learning | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 74 | `/app/challenges` | Clean Air Challenges | Learning | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 75 | `/app/challenges/:id` | Challenge Task Runner | Learning | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 76 | `/app/quiz/:id` | Clean Air Quiz Runner | Learning | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 77 | `/app/achievements` | Badges & Achievements | Learning | T2 | user | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 78 | `/admin` | Admin Command Center | Admin | T2 | admin | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 79 | `/admin/users` | User Management | Admin | T2 | admin | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 80 | `/admin/users/:id` | User Detail & Role Control | Admin | T2 | admin | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 81 | `/admin/roles` | Role Permission Matrix | Admin | T2 | admin | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 82 | `/admin/air-data` | Air Telemetry Provider Control | Admin | T2 | admin | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 83 | `/admin/integrations` | Integrations & External APIs | Admin | T2 | admin | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 84 | `/admin/moderation` | Citizen Report Moderation Queue | Admin | T2 | moderator | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 85 | `/admin/ai-management` | AI Models & Prompt Versioning | Admin | T2 | admin | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 86 | `/admin/ai-management/logs` | AI Safety & Trace Explorer | Admin | T2 | admin | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 87 | `/admin/content` | CMS Content Manager | Admin | T2 | admin | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 88 | `/admin/analytics` | Platform Telemetry & Adoption | Admin | T2 | admin | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 89 | `/admin/audit-logs` | Immutable Security Audit Trail | Admin | T2 | admin | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 90 | `/admin/system-health` | System Health & Schedulers | Admin | T2 | admin | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 91 | `/403` | Forbidden (403) | System | T2 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |
| 92 | `/404` | Not Found (404) | System | T1 | public | 🟡 FUNCTIONAL | — | Accessible 404 view (101 lines); emergency air hotline, search fallback, quick nav |
| 93 | `/500` | Server Error (500) | System | T2 | public | 🔴 MISSING | — | Route not mounted in App.tsx or page component missing |

---
*Ledger maintained per `AGENTS.md` Section 5. Only routes with status `VERIFIED` may be cited in final release materials.*
