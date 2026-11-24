# docs/SCREEN_SPECS.md — BreatheIQ Screen Spec Library (93 routes)

Format: **route** — features/actions · data/API. "T1" = must be done first. Every route also needs the standard states in AGENTS.md Section 7. Extend the API as needed and keep OpenAPI accurate.

## Public (18)

1. **`/` Landing (T1)** — all sections from the Stitch landing design: announcement bar; sticky navbar (scroll state, mobile menu, working language switch EN/HI/MR, theme toggle, Log in / Get started); hero with location typeahead and **live air card** (AQI gauge, category label + icon, dominant pollutant, PM2.5/PM10, hourly sparkline with dashed forecast, source badge, "updated X min ago", "Explain this number" popover); sources strip (text chips) + badge legend; problem section (stats clearly labeled SAMPLE); 5-step loop with mini UIs; **bento grid of 8 features** linking to their pages; Copilot showcase (scripted sample conversation labeled SAMPLE, with expandable "Why this advice?"); **What-If teaser that actually calls the impact engine** (sliders → ranges + ESTIMATED badge + assumptions drawer); tabs For families / schools / communities; day-in-the-life timeline (hover/click nodes); trust cards; impact-math card; learn cards (from API); sample testimonials labeled SAMPLE; FAQ accordion (from API/content); final CTA; footer with real links. Scroll-reveal animations (reduced-motion aware). · `/locations/search`, `/air-quality/current`, `/impact/what-if/preview`, `/content/faq`.
2. **`/about`** — mission, vision, problem, solution, timeline, values, team placeholders labeled SAMPLE, CTAs. · static content via CMS or i18n.
3. **`/features`** — module sections with tabs and anchor nav, mini previews, "generic AQI app vs BreatheIQ" comparison table, CTA per module.
4. **`/how-it-works`** — interactive 5-step stepper; each step shows a **real computed example** (NAQI worked example from the engine, Window Oracle sample, impact range) · `/engines/examples`.
5. **`/explore` (T1)** — location search; curated grid of ≥12 Indian cities (Mumbai, Delhi, Pune, Kolkata, Chennai, Bengaluru, Hyderabad, Ahmedabad, Lucknow, Patna, Jaipur, Chandigarh) with AQI via batched cached API; sort by AQI/name, filter by category, compare up to 3 cities in a table/chart; map with markers and popups; badges and freshness · `/air-quality/cities`, `/air-quality/compare`.
6. **`/explore/:city`** — current AQI + pollutants, weather, 24h trend, 5-day forecast, nearby stations, seasonal pattern chart (historical data if available, else labeled DEMO), advisory per category, share link, "Add to my dashboard" (login required), invalid-city state · `/air-quality/city/:slug`.
7. **`/methodology` (T1)** — breakpoint table **rendered from the same config the engine uses**; interactive calculator (enter concentrations → sub-indices, dominant pollutant, category, validity rule) calling the engine; badge legend; limitations; links to official sources · `/engines/naqi`.
8. **`/data-sources`** — card per provider (what we use, frequency, limits, last success, status) from live provider health; no secrets · `/health/providers`.
9. **`/resources`** — search, topic filter, sort, pagination; downloadable PDFs generated server-side (e.g., Smog Emergency Checklist, School Advisory) · `/content/resources`, `/downloads/:id`.
10. **`/resources/:slug`** — TOC with scroll-spy, reading progress, key takeaways, related items, print stylesheet, share, "Explain simpler" (Copilot-lite, requires login or rate-limited).
11. **`/for-schools`** — threshold table; **"Generate school advisory"** for a chosen city (live data) with print/PDF; getting-started steps; FAQ.
12. **`/for-communities`** — benefits, sample campaigns (from API), "Start a community" CTA (signup with intent).
13. **`/faq`** — search, categories, accordion, deep links, "Was this helpful?" feedback POST · `/content/faq`, `/feedback`.
14. **`/contact`** — validated form (topic: support, feedback, partnership), stored in DB, rate limited, success state; admin sees submissions · `POST /feedback`.
15. **`/help`** — search across help articles, categories, popular topics, contact fallback.
16. **`/status`** — provider health tiles, 30-day uptime sparkline from stored checks, incident list (admin-managed) · `/health/history`.
17. **`/privacy`**, 18. **`/terms`** — legal layout with sticky TOC, last-updated date, accurate to what the app actually stores; link to data export/delete.

## Auth and onboarding (11)

19. **`/login` (T1)** — validation, show/hide, lockout/rate-limit messaging, redirect-back, demo quick-fill only in demo mode.
20. **`/signup` (T1)** — strength meter, confirm, terms, intent selector (family / school / community), document the account-enumeration trade-off.
21. **`/forgot-password` (T1)** — neutral response, resend timer, dev-mode link display when SMTP missing.
22. **`/reset-password` (T1)** — token validation, expired/used states, strength meter, revokes all sessions on success.
23. **`/verify-email`** — pending/success/expired/resend.
24. **`/onboarding/profile` (T1)** — name, language (switches UI immediately), saves draft.
25. **`/onboarding/location` (T1)** — typeahead, consent dialog before geolocation, map pin, saved locations, manual selection always available.
26. **`/onboarding/household` (T1)** — size, add/remove members with age group + optional sensitivity preference (no diagnosis fields).
27. **`/onboarding/lifestyle` (T1)** — commute modes, outdoor activities, home type, cooking fuel, heating, vehicle ownership.
28. **`/onboarding/alerts`** — threshold slider (shows what the category means), quiet hours, channels; push permission only when enabled by the user.
29. **`/onboarding/complete`** — AirTwin summary, generates first routine via API, redirects to dashboard; onboarding guard for incomplete users.
All steps autosave to the API, support Back/Next, skip where optional, and show a live AirTwin preview.

## Core app (32)

30. **`/app/dashboard` (T1)** — greeting; location switcher (saved locations); AQI gauge + category + dominant pollutant + badges; pollutant cards with sparklines; weather cards; hourly chart with forecast; AI recommendation cards with evidence chips and "Why?" (generated from engines + Copilot, or labeled templates); today's routine checklist (toggle persists); family summary; indoor summary; SmogShield alerts; sustainability score; community feed; refresh button; "Explain this number" · many endpoints (aggregate `/dashboard/summary`).
31. **`/app/air-quality` (T1)** — Leaflet map with station markers (AQI color + label), layers (AQI, PM2.5, PM10, wind), search, station list with distance/AQI/badge/age, sort/filter, clusters, detail drawer, city compare, missing-data indicators.
32. **`/app/air-quality/stations/:id`** — station info, current readings, 24h/7d charts, source details, Confidence Meter, nearby stations, "Report a problem" (feedback).
33. **`/app/analytics` (T1)** — filters (location, pollutant, 24h/7d/30d/season); PM2.5/PM10 time series with forecast area; pollutant comparison; location comparison table (sortable); weekly summary cards; chart text summaries; export CSV/PDF · `/analytics/*`.
34. **`/app/analytics/reports`** — list of generated weekly/monthly reports, generate modal, preview, download PDF/CSV, delete with confirm.
35. **`/app/assistant` (T1)** — Copilot chat with streaming or progress state, evidence chips (source/timestamp/badge), "Why this advice?", limitations, follow-ups, suggested prompts, feedback thumbs, language selector, voice input (Web Speech API with fallback), data-used side panel, new chat, rate-limit messaging, labeled template fallback.
36. **`/app/assistant/history`** — search, group by date, pin, rename, delete with confirm, open into chat.
37. **`/app/smogshield` (T1)** — 48h risk timeline from forecast; rule CRUD (threshold, applies-to member, channels, quiet hours, enable toggle); test-alert button; alert history with "Why did I get this?" (stores the data snapshot); GRAP-aware toggle for Delhi-NCR (labeled; mention that rules must be verified against current official advisory orders).
38. **`/app/routine` (T1)** — AI/engine-generated plan for today (morning/afternoon/evening), per-member tabs, task toggle/add/edit/delete/reorder, exercise with indoor alternative, commute plan, window schedule, cleaning reminders, "Plan updated because…" banner when the forecast changes, "Adapt my plan", progress ring, streak.
39. **`/app/routine/calendar`** — week/month calendar with AQI-day coloring, tasks, reminders, add/edit modal, legend.
40. **`/app/home` (T1)** — rooms CRUD (tabs), manual/sensor readings (PM2.5, CO2, temp, humidity) with `Manual/Sensor/No data` badges, indoor vs outdoor chart, **Window Oracle** (slots + reasons + confidence), purifier sizing summary, filter reminders, tips, sensor setup panel showing the real ingest endpoint + per-home API key (regenerate/revoke).
41. **`/app/home/rooms/:id`** — room profile edit, readings history chart, add reading modal, maintenance tasks, recommendations.
42. **`/app/home/purifier-guide`** — sizing calculator (area, height, CADR → ACH, expected reduction ESTIMATED with limitations), DIY Corsi-Rosenthal guide, honest limits, saved calculation per room.
43. **`/app/home/checklist`** — Daily/Weekly/Monthly checklist, persisted, progress, reminder toggles, indoor sources audit (incense, coils, cooking, heating).
44. **`/app/family` (T1)** — members CRUD, per-member guidance today, sensitivity preference, shared tasks (assign/complete), family notifications, weekly report, School Mode link.
45. **`/app/family/members/:id`** — profile, today's guidance, routine, reminders, alert prefs, recent alerts, edit/remove with confirm.
46. **`/app/school-mode`** — traffic-light guidance for PE/assembly/recess by hour, schedule adjuster, printable/PDF one-page advisory, share link.
47. **`/app/routes` (T1)** — origin/destination with geocoding, modes (walk/cycle/metro/bus/car-pool/car), map with route(s), comparison table (duration, distance, emissions ESTIMATED, nearest-station AQI), badges (lowest emissions/fastest), "neighborhood-level estimate" note, save route, log commute.
48. **`/app/routes/history`** — commute log, edit/delete, mode-share chart, savings (ESTIMATED), filters.
49. **`/app/green-living`** — categories (transport, energy, waste, recycling, shopping, cooking/heating), personalized suggestions with effort and impact range, accept → creates habit/challenge.
50. **`/app/green-living/habits`** — daily check-ins, streaks, weekly heatmap, add/edit/archive habits.
51. **`/app/impact` (T1)** — sustainability score (documented formula), estimated emissions avoided with "How is this calculated?" drawer (inputs, factors + sources, formula, range), logs, goals CRUD, weekly/monthly charts, family comparison, achievements preview.
52. **`/app/impact/what-if` (T1)** — scenario builder (metro days, car-pool, energy habits, community campaign), ranges + ESTIMATED badge, before/after chart, cost/time change, assumptions & method drawer, save/rename/delete scenarios, share link.
53. **`/app/impact/reports`** — generate report, preview, export PDF/CSV, methodology section.
54. **`/app/airtwin`** — profile sections editable inline, completeness meter, "how this personalizes advice" with a live example, change history.
55. **`/app/protect/masks`** — mask/respirator education, fit-check steps, replacement guidance, sources, disclaimer, saved checklist.
56. **`/app/protect/emergency-kit`** — checklist with assignees, progress, print/PDF, offline-capable (service worker caches this page).
57. **`/app/pollution-sources`** — winter smog drivers explainer with diagrams (inversion illustration), per-source "what you can do", no invented daily attribution.
58. **`/app/notifications` (T1)** — tabs (All, Alerts, Forecasts, Family, Community, Reminders), unread indicators, mark read/all read, delete, filters, pagination, preferences (thresholds, quiet hours, channels), push subscribe/unsubscribe, real-time updates (polling/SSE).
59. **`/app/settings` (T1)** — profile edit, location settings, language, theme, accessibility (font size, reduced motion), notification defaults, save feedback.
60. **`/app/settings/security`** — change password, active sessions (revoke), logout everywhere, login activity.
61. **`/app/settings/privacy-data`** — data export (JSON/ZIP generated server-side), consent toggles, what's stored, delete account (confirm + password), audit entry.

## Community (9)

62. **`/app/community`** — Air Pulse dashboard: my groups, map of verified reports, feed with UNVERIFIED/VERIFIED, campaigns, events, mini leaderboard, impact summary.
63. **`/app/community/air-watch`** — reports feed + map, filters (type/distance/status), sort, upvote, flag, pagination.
64. **`/app/community/air-watch/new`** — type, pin, description, optional photo (size-limited, compressed, stored outside git), consent note, always UNVERIFIED until a moderator acts, rate limit.
65. **`/app/community/campaigns`** — list, join/leave, progress, filters.
66. **`/app/community/campaigns/:id`** — goal, tasks, participants, updates feed, impact estimate (ESTIMATED), join/leave, post update (members).
67. **`/app/community/leaderboard`** — individuals/families/groups tabs, time range, my rank, how points are calculated.
68. **`/app/community/events`** — list/calendar, filters, RSVP.
69. **`/app/community/events/:id`** — details, map, RSVP/cancel, attendees, add-to-calendar (.ics).
70. **`/app/community/groups/:id`** — header, members, recent reports, campaigns, updates, join/leave; group admin tools (edit, remove members, approve joins).

## Learning (7)

71. **`/app/learn`** — featured, topic chips, search, article cards, progress ring, resume learning.
72. **`/app/learn/:slug`** — reading layout, TOC, mark complete (persists), "Explain simpler" via Copilot, related, bookmarks.
73. **`/app/learn/glossary`** — A–Z search with term detail and links to articles.
74. **`/app/challenges`** — active/available/completed tabs, join, progress, streak banner.
75. **`/app/challenges/:id`** — daily tasks check-in, progress, rules, leaderboard, badge reward.
76. **`/app/quiz/:id`** — question flow, hints, per-answer feedback, results, score saved, retake, badge awarding.
77. **`/app/achievements`** — badge grid (earned/locked) with criteria, progress, streak calendar, share image (client-generated, small).

## Admin (13; server-enforced roles)

78. **`/admin`** — KPIs from real DB aggregates, integration health, moderation queue preview, AI trace preview, recent audit events.
79. **`/admin/users`** — search, sort, filter by role/status, pagination, bulk actions, suspend/restore, export CSV.
80. **`/admin/users/:id`** — profile, role change (confirm + audit), sessions (revoke), activity, suspend/delete.
81. **`/admin/roles`** — role matrix (read-only view of server-defined permissions, editable only for custom flags if implemented), who-has-what.
82. **`/admin/air-data`** — per-provider ingestion status, freshness chart, failed fetches, manual refresh (rate limited), station management CRUD (demo stations flagged).
83. **`/admin/integrations`** — configured/not configured status, last success, rate-limit usage, test-connection button; **never show secret values**.
84. **`/admin/moderation` (moderator+)** — report queue, detail with map, Verify / Reject / Request info with reason, history, bulk actions, SLA indicators; verification updates the public badge.
85. **`/admin/ai-management`** — model/config view, prompt template versions with diff and rollback, rate limits, fallback toggle, safety rules list.
86. **`/admin/ai-management/logs`** — trace table (input summary, tools used, model, validator result, latency), filters, detail drawer, export.
87. **`/admin/content`** — CRUD for articles, quizzes, FAQ, help, resources; draft/publish; markdown editor with preview; versioning.
88. **`/admin/analytics`** — usage, feature adoption, retention, language split, AI usage and fallback rate (real aggregates).
89. **`/admin/audit-logs`** — filterable (actor, action, target, date), export CSV, immutable (no edit/delete endpoints).
90. **`/admin/system-health`** — service status, latency, error rates, job status (scheduler last runs), DB/cache status.

## System (3)

91. **`/403`**, 92. **`/404` (T1)**, 93. **`/500`** — friendly, helpful actions, error boundary integration, request ID shown on 500.
