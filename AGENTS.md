# AGENTS.md — BreatheIQ RECOVERY Master Brief

## 1. SITUATION

This repository already contains an incomplete attempt at **BreatheIQ — "Breathe Smarter. Live Healthier."** (Challenge 6: GenAI Urban Air Quality Assistant for families and communities facing winter smog). The previous work **over-claimed**: the README describes features and routes that were not actually built or verified. The existing UI is basic and the landing page is half done.

Your job: **audit honestly, then build every screen with real functionality, and prove it.** Where `AGENTS.md` conflicts with older instructions, this file wins. The per-screen functional requirements for all 93 routes are in **`docs/SCREEN_SPECS.md`** ("Part 2" in the batch prompts). Read both files at the start of every session.

## 2. ASSETS

- Workspace root: `C:\Users\Mrigesh koyande\OneDrive\Desktop\breatheiq\breatheiq`
- **Design file folder** (Stitch exports; visual source of truth): `C:\Users\Mrigesh koyande\OneDrive\Desktop\breatheiq\breatheiq\Design file`
- **Logo:** `C:\Users\Mrigesh koyande\OneDrive\Desktop\breatheiq\breatheiq\Media\BreatheIQ Clean Air Logo.png`
- Quote all paths (spaces). Never modify or delete originals. Never commit `Design file/` or `Media/`. (They stay in `.gitignore`.)
- Stitch project (reference only, probably not reachable): `https://stitch.google.com/projects/8634616541614705577`

## 3. THE TRUTH RULES (most important)

1. **Never claim anything is done unless a script or a browser run proves it.** "Done" means status `VERIFIED` in the ledger (Section 5).
2. **The README, status badges and any marketing text are generated LAST from the ledger.** Do not edit the README until Batch B16. Remove unverifiable claims (listed in Section 11).
3. **No placeholder pages.** Banned: "Coming soon", "Lorem ipsum", "TODO", "Under construction", empty `onClick` handlers, `href="#"`, buttons that only `console.log`, pages that render only a title, fake spinners, hardcoded arrays of sample content inside components.
4. **Demo data lives in the database,** created by `scripts/seed.py` and served by the API, labeled `DEMO`. Frontend components never contain hardcoded business data. (UI copy and translations are fine.)
5. **Never fabricate environmental data, statistics, citations, testimonials, partner logos or quotes.** Sample content is labeled `SAMPLE`/`DEMO`. Emission factors, thresholds and health guidance must carry a source field; if you cannot confirm a value, mark it `NEEDS_VERIFICATION` in config and show "estimate" in the UI.
6. **If blocked, say so.** Missing API key, missing design, ambiguous requirement → record it in the ledger notes and the report, then continue with other routes. Don't invent around it.
7. **Do not end your turn with batch items remaining** unless you are genuinely blocked. If you must stop, update the ledger and state exactly what remains.

## 4. HARD CONSTRAINTS

- **JWT-only authentication.** No Firebase, OAuth, social login or third-party auth SDK.
- **Repo < 10 MB tracked.** No `node_modules`, builds, venvs, DB files, videos, large images, raw design exports, raw logo. Run `python scripts/check_repo_size.py` before every commit.
- **No secrets in code/git.** Env vars + `.env.example`. Gemini and data-provider calls server-side only.
- **Windows-friendly** scripts (Python/Node, PowerShell-safe). Stay compatible with macOS/Linux.
- **No medical diagnosis or guarantees.** Health guidance follows CPCB/WHO public advisories with "guidance only — not medical advice."
- **Every data card shows a badge:** `LIVE`, `MODELED`, `FORECAST`, `ESTIMATED`, `USER-REPORTED`, `DEMO` (+ `UNVERIFIED/VERIFIED` for community items) and a timestamp. Never mix demo and live in one view.
- **Auth security (use exactly):** access JWT ~15 min kept in memory only; refresh token 7–14 days, rotated every use, `HttpOnly` cookie with `SameSite=Strict` (document and justify if deployment needs Lax), hashed in DB with token-family reuse detection; argon2id; generic login errors; rate limiting + lockout; single-use signed reset/verify tokens; role re-checked from DB for admin actions. Demo accounts and one-click quick-fill exist **only** when `DEMO_MODE=true` and `ENVIRONMENT != production`.

## 5. THE ROUTE LEDGER (the single source of truth)

Create and maintain:

- `docs/routes.manifest.json` — one entry per route (93 total, see Part 2): `path, name, tier, access (public|user|moderator|admin), designFile, apiEndpoints[], interactiveChecks[], minInteractiveElements`.
- `scripts/build_status.py` — reads the manifest + latest test results and writes **`docs/BUILD_STATUS.md`** (table of every route with status and evidence) and exits non-zero if any route claimed `VERIFIED` fails a check.
- `scripts/audit_stubs.py` — scans `frontend/src` and `backend/app` for the banned patterns in Rule 3, pages under ~60 lines, page components that import no hook from `src/api/`, hardcoded arrays over 5 items outside `*.test.*`/`i18n`, `except: pass`, and endpoints returning constant data; prints offenders and exits non-zero.
- `frontend/tests/e2e/route-smoke.spec.ts` (Playwright) — iterates the manifest, signs in with the right role (seeded accounts), visits each route at **390, 768 and 1440 px**, and asserts: HTTP success, one `h1`, no banned strings, **no console errors**, **no failed network requests** (except expected 401/403 tests), at least `minInteractiveElements` interactive elements, no horizontal scroll, and saves a screenshot to `test-results/` (git-ignored).
- Per-route interaction tests for the checks listed in the manifest (click, type, submit, assert result via UI **and** API/DB).

**Status definitions**
| Status | Meaning |
|---|---|
| `MISSING` | route/component doesn't exist |
| `STUB` | exists but placeholder, static, or fails audit |
| `UI-ONLY` | looks right but data/actions aren't wired to the API |
| `FUNCTIONAL` | wired to API, actions work, but not yet fully checked |
| `VERIFIED` | passes ALL of: (a) smoke test at 3 widths, (b) data from API/DB (labeled badges), (c) every listed interactive check passes, (d) loading + empty + error states exist and were exercised, (e) design comparison screenshot recorded with deviations noted (or `NO-DESIGN` flagged), (f) axe accessibility scan with no serious/critical violations, (g) `audit_stubs.py` clean for that route's files |

Only `VERIFIED` may be reported as complete.

## 6. DESIGN COMPLIANCE PROTOCOL

For every route:
1. Find its design in `Design file` (record in the manifest). Open the design (HTML/image) and read structure, spacing, hierarchy, copy and components.
2. Build as real React + Tailwind components using shared primitives (never paste exported HTML or inline styles).
3. Run the page, screenshot it, compare against the design at the same width, list deviations in the ledger, and fix significant ones.
4. If a route has no design: build it from the design system and components, mark `NO-DESIGN`, and list it in the report.
5. If only desktop exists: derive tablet and mobile layouts from the system and mark them `DERIVED`.
6. Tokens (colors, type, spacing, radii) come from designs + logo. Logo wins over default palette. AQI category colors always appear with label + icon.

Palette defaults (overridden by designs/logo): primary `#0F766E`, deep `#115E59`, mint `#DDF5EC`, soft green `#A7E8C6`, cream `#F8FAF7`, charcoal `#182A29`, gray `#64748B`, amber `#F59E0B`, danger `#DC5252`, info `#3B82F6`. AQI: Good `#2F9E62`, Satisfactory `#7CB342`, Moderate `#F2B705`, Poor `#F28C28`, Very Poor `#DC5252`, Severe `#8B1E3F`.

## 7. DEFINITION OF "FUNCTIONAL" FOR ANY SCREEN

- **Data:** loaded through TanStack Query hooks in `src/api/*` from real endpoints; server persists user-created data in the DB (not memory/localStorage).
- **Actions:** every button, link, tab, toggle, form, filter, sort, pagination and menu does something real or isn't rendered.
- **Forms:** React Hook Form + Zod, inline errors, disabled/loading submit, success toast, server error mapping, double-submit protection.
- **States:** skeleton loading, empty state with a useful action, error state with retry, offline/unavailable-data state, permission-denied state.
- **Destructive actions:** confirmation dialog + undo/toast.
- **Persistence:** reload the page → state is correct.
- **Access control:** UI guard **and** server enforcement; user data isolation tests.
- **i18n:** all UI strings via i18next (EN/HI/MR). Machine-translated HI/MR must be flagged for human review in `docs/i18n-review.md`.
- **A11y:** semantic landmarks, keyboard operable, visible focus, labels, chart text summaries, reduced motion, non-color AQI cues.
- **Responsive:** verified at 390/768/1440.
- **Performance:** lazy route, no unnecessary re-renders, debounced search, cached queries.

## 8. ARCHITECTURE (keep and harden what exists; replace what is fake)

**Frontend:** React 19, TypeScript (strict, no `any`), Vite, Tailwind, Framer Motion (reduced-motion aware), Lucide, Recharts, React Router (lazy), React Hook Form + Zod, TanStack Query, Leaflet + OSM (attribution), i18next.
**Backend:** FastAPI, Pydantic v2, SQLAlchemy 2, Alembic migrations (not `create_all` in production), PyJWT, argon2-cffi, httpx, slowapi, APScheduler (or equivalent) for periodic jobs, pywebpush (VAPID), SMTP (optional), reportlab (PDF export).
**DB:** PostgreSQL + PostGIS (docker compose) with SQLite fallback via `DATABASE_URL`; repository layer; ownership checks everywhere.
**AI:** Gemini server-side, `GEMINI_MODEL` env (check current docs for valid model names), function calling + structured JSON output; one LLM call per user turn; code-based Safety and Evidence Validator; labeled template fallback; trace logging.
**Data:** `AirDataProvider` interface → OpenAQ (stations; key required; coverage varies) → Open-Meteo Air Quality (**MODELED/FORECAST**) → Open-Meteo Weather → DEMO. Fallback never silent; UI shows active source. Cache with TTL; validate responses; handle rate limits; record source + timestamp. CPCB NAQI computed from CPCB breakpoints (verify against the official CPCB technical document), label "computed NAQI-style"; show raw concentrations; never mix AQI scales silently.
**Engines (unit-tested, no LLM):** `naqi`, `ventilation` (Window Oracle must use **hourly forecast data** — PM2.5, wind speed, temperature, humidity, and boundary-layer height *if the provider offers it* — and output slots, reasons, confidence, `ESTIMATED` badge; fixed time-of-day rules may be a labeled fallback only), `exposure`, `purifier`, `impact` (range + assumptions + methodology + sourced factors), `routing`, `smogshield`.
**Scheduler jobs:** refresh air data for active locations, evaluate SmogShield rules, create notifications, send push/email when configured, daily/weekly digests, provider health checks (store history for `/status`).

## 9. BATCH PROTOCOL (applies to every batch)

At the start of each session: read `AGENTS.md`, `docs/BUILD_STATUS.md` and `docs/routes.manifest.json`.
For each batch:
1. Post a short plan (routes, endpoints, tables, components).
2. Implement backend first (migrations, endpoints, tests), then frontend, route by route.
3. After each route: run it in the browser, exercise every interactive check, record screenshots (desktop + mobile), update the ledger.
4. At the end: run `npm run build`, `npm run typecheck`, `npm run lint`, backend `pytest`, `python scripts/audit_stubs.py`, `python scripts/build_status.py`, the Playwright smoke/interaction tests for the batch, and `python scripts/check_repo_size.py`.
5. Commit with a clear message.
6. Final report (artifact): table of the batch's routes with ledger status, commands run with real results, screenshots, deviations from design, blockers, and **what is NOT done**. No marketing language.

## 10. REPORTING STYLE

Plain, factual, short. Report failures first. Never say "fully implemented", "production-ready", "comprehensive" or "zero" anything. State counts: "27 of 93 routes VERIFIED."

## 11. KNOWN FALSE OR RISKY CLAIMS TO REMOVE NOW (in the audit batch)

"93 lazy routes", "zero-delay CPCB telemetry", "peer-reviewed emission factors", "zero hallucination", "Eulerian photochemical model", "thermal inversion modeling/prediction" (unless truly computed from forecast data), fixed-window Window Oracle presented as prediction, any repo-size badge not produced by the script, version badges not matching `package.json`/`requirements.txt`, SameSite mismatch, demo accounts/quick-fill active outside demo mode. Replace with accurate statements or delete.
