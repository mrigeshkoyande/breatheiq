# BreatheIQ Frontend

React 19 + Vite + TypeScript strict-mode client for BreatheIQ:
- **Release Scope:** 24 active routes with `React.lazy` code-splitting and role guards (`70` non-core routes documented as deferred in `docs/routes.manifest.json`)
- **Atmospheric Visualizations:** Dual-channel CPCB NAQI badges (label + icon + numeric value), Window Oracle hourly forecast slots, CADR sizing calculator, CleanRoute comparison, and impact ledger
- **Accessibility & Localization:** WCAG 2.2 AA target verified via `@axe-core/playwright`, skip links, keyboard-accessible controls, and EN/HI/MR UI switcher (`docs/i18n-review.md`)
- **Quality Commands:**
  - `npm run lint` — ESLint + `jsx-a11y` strict checks
  - `npm run typecheck` — `tsc --noEmit` strict TypeScript check
  - `npm run test:coverage` — Vitest unit tests with V8 branch coverage
  - `npm run build` — Production Vite build
  - `npx playwright test` — 3-viewport (`390px`, `768px`, `1440px`) smoke, persistence, and Axe WCAG 2.2 AA tests against a running backend
