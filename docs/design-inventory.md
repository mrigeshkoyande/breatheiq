# Design Inventory — BreatheIQ Visual Source of Truth Mapping

## Overview
Source of truth folder: `Design file/stitch_breatheiq_urban_air_platform/`  
Total Stitch designs: **16 screens / modules**  
Target route architecture: **93 routes** across 7 tiers.

Each Stitch design folder includes high-fidelity `code.html` and visual `screen.png` exports generated from Google Stitch, along with a master `DESIGN.md` specification.

---

## 1. Design File to Route Mapping

| # | Stitch Design Folder | Format & Dimensions | Primary BreatheIQ Route(s) | Tier | Notes & Coverage |
|---|---|---|---|---|---|
| 1 | `breatheiq_landing_page_mumbai_hero_redesign` | HTML + PNG (240x1600 mobile/full) | `/` (Public Landing) | T1 | Complete hero, live AQI card, sources strip, bento grid, feature modules, testimonials, CTA, footer. |
| 2 | `breatheiq_login_a1` | HTML + PNG (1600x1280 desktop) | `/login` | T1 | Split-screen auth layout, environmental brand imagery, input states, validation messages. |
| 3 | `breatheiq_signup_a2` | HTML + PNG (1600x1280 desktop) | `/signup` | T1 | Split-screen registration, password strength indicators, terms confirmation. |
| 4 | `breatheiq_forgot_password_a3` | HTML + PNG (1600x1280 desktop) | `/forgot-password` | T1 | Password recovery flow with clean card elevation. |
| 5 | `breatheiq_reset_password_a4` | HTML + PNG (1600x1354 desktop) | `/reset-password` | T1 | Tokenized reset entry with strict password requirements. |
| 6 | `breatheiq_verify_email_a5` | HTML + PNG (1600x1369 desktop) | `/verify-email` | T1 | Email verification code and activation screen. |
| 7 | `breatheiq_main_dashboard_andheri_west_mumbai` | HTML + PNG (830x1600 responsive) | `/app/dashboard` | T1 | Core dashboard: live CPCB AQI hero card, pollutant grid, Window Oracle status, family risk chips. |
| 8 | `breatheiq_atmospheric_command_center` | HTML + PNG (1178x1600 desktop) | `/app/air-quality`, `/app/air-quality/stations/:id` | T1 | Geospatial station explorer, CPCB monitoring station telemetry, pollutant layers, micro-sensors. |
| 9 | `breatheiq_air_quality_inversion_analytics` | HTML + PNG (803x1600 responsive) | `/app/analytics`, `/app/analytics/reports` | T1 | Inversion layer analysis, diurnal pollutant cycles, meteorological correlation, export actions. |
| 10 | `breatheiq_ai_atmospheric_assistant` | HTML + PNG (1100x1600 responsive) | `/app/assistant`, `/app/assistant/history` | T1 | BreatheIQ Copilot conversation shell, evidence chips, reasoning summary, suggested prompts. |
| 11 | `breatheiq_cleanroute_commute_navigator` | HTML + PNG (851x1600 responsive) | `/app/routes`, `/app/routes/history` | T1 | Multimodal commute exposure comparison (walk, cycle, transit, carpool), CleanRoute pathing. |
| 12 | `breatheiq_faq_knowledge_base` | HTML + PNG (806x1600 responsive) | `/faq` | T1 | Categorized accordion FAQ, search bar, CPCB vs WHO guidance explanation. |
| 13 | `breatheiq_help_center_user_guides` | HTML + PNG (646x1600 responsive) | `/help`, `/resources`, `/resources/:slug` | T1 | Knowledge base, device setup guides, emergency smog protocol manuals. |
| 14 | `breatheiq_contact_partnerships` | HTML + PNG (986x1600 responsive) | `/contact` | T1 | Municipal and school partnership contact forms, community inquiries. |
| 15 | `breatheiq_privacy_policy_terms` | HTML + PNG (318x1600 responsive) | `/privacy`, `/terms` | T1 | Legal, GDPR/DPDP-compliant privacy architecture, telemetry data disclosures. |
| 16 | `breatheiq_atmospheric_precision` | `DESIGN.md` (Tokens & specs) | Global Design System & Component Library (`/dev/ui`) | T1 | Formal tokens for colors, typography, spacing, elevation, CPCB bands, pill states. |

---

## 2. Derived Routes (Using Shared Component Library & Design Tokens)

The remaining 77 routes across the 93-route architecture share the components and layout system defined in `DESIGN.md` and the 16 primary screens above:

### Onboarding Suite (Derived from Auth split-screen & Card system)
- `/onboarding/profile`, `/onboarding/location`, `/onboarding/household`, `/onboarding/lifestyle`, `/onboarding/alerts`, `/onboarding/complete`.

### Core App & Lifestyle Modules (Derived from Dashboard & Command Center)
- **Home Air Guardian:** `/app/home`, `/app/home/rooms/:id`, `/app/home/purifier-guide`, `/app/home/checklist` (derived from Window Oracle & sensor grid).
- **Family Center:** `/app/family`, `/app/family/members/:id`, `/app/school-mode` (derived from vulnerability callouts).
- **Routine Planner:** `/app/routine`, `/app/routine/calendar` (derived from diurnal timeline & commute cards).
- **Green Living & Impact:** `/app/green-living`, `/app/green-living/habits`, `/app/impact`, `/app/impact/what-if`, `/app/impact/reports` (derived from CleanRoute impact calculations).
- **SmogShield & Notifications:** `/app/smogshield`, `/app/notifications`, `/app/settings`, `/app/settings/security`, `/app/settings/privacy-data`.
- **Specialty Views:** `/app/airtwin`, `/app/protect/masks`, `/app/protect/emergency-kit`, `/app/pollution-sources`.

### Community Suite (Derived from Command Center & Cards)
- `/app/community`, `/app/community/air-watch`, `/app/community/air-watch/new`, `/app/community/campaigns`, `/app/community/campaigns/:id`, `/app/community/leaderboard`, `/app/community/events`, `/app/community/events/:id`, `/app/community/groups/:id`.

### Learning & Gamification Suite (Derived from Help Center & Bento cards)
- `/app/learn`, `/app/learn/:slug`, `/app/learn/glossary`, `/app/challenges`, `/app/challenges/:id`, `/app/quiz/:id`, `/app/achievements`.

### Admin Console (Derived from Command Center tables & analytics)
- `/admin`, `/admin/users`, `/admin/users/:id`, `/admin/roles`, `/admin/air-data`, `/admin/integrations`, `/admin/moderation`, `/admin/ai-management`, `/admin/ai-management/logs`, `/admin/content`, `/admin/analytics`, `/admin/audit-logs`, `/admin/system-health`.

### Public & System Pages
- `/about`, `/features`, `/how-it-works`, `/explore`, `/explore/:city`, `/methodology`, `/data-sources`, `/for-schools`, `/for-communities`, `/status`, `/403`, `/404`, `/500`.

---

## 3. Visual Assets Summary

- **Stitch Design Exports:** 15 screen folders containing `code.html` (15 KB to 104 KB) and `screen.png` (198 KB to 776 KB) + 1 design system specification folder with `DESIGN.md`. Total raw size: ~7.5 MB (excluded from git via `.gitignore`).
- **Logo (`Media/BreatheIQ Clean Air Logo.png`):** 1254 × 1254 px, 1.42 MB, RGB. Features lungs filled with clean cityscape, leaves, CPCB AQI pill badge, and "BreatheIQ — Breathe Smarter. Live Healthier."
  - Target production derivatives in Phase 1: `logo.webp` (≤ 45 KB), `logo-mark.webp` (≤ 20 KB), `favicon.ico`, `apple-touch-icon.png` (180px), `og-image.webp` (1200×630, ≤ 120 KB).
