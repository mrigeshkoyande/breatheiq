# BreatheIQ Accessibility (a11y) Conformance

## 1. Compliance Standard

BreatheIQ aligns with **WCAG 2.1 Level AA** standards to ensure critical air quality alerts and life-saving environmental guidance remain accessible to all users.

## 2. Implemented Accessibility Safeguards

### 1. Dual-Channel AQI Presentation (Color + Text/Icon)
In accordance with WCAG Success Criterion 1.4.1 (Use of Color), environmental health categories never rely on color alone:
- Every AQI indicator pairs statutory CPCB color badges with:
  - Numeric AQI score (e.g. "172 AQI")
  - Explicit text category ("Moderate", "Poor", "Severe")
  - Distinct status glyphs and descriptive health impact text

### 2. Semantic Landmarks & Hierarchy
- Standard landmark elements (`<header>`, `<main>`, `<nav>`, `<footer>`, `<aside>`) structure every screen.
- Exactly one `<h1>` per view providing page purpose.
- Logical heading cascades (`h1` -> `h2` -> `h3`) without skipped levels.

### 3. Keyboard Operability & Visible Focus
- All interactive controls (buttons, links, inputs, scenario toggles, modal dialogs) are keyboard focusable via standard Tab indexing.
- Visible focus rings (`focus:ring-2 focus:ring-[#0F766E] focus:outline-none`) implemented across all interactive elements.

### 4. Screen Reader Support & ARIA
- Form inputs feature persistent associated `<label>` elements.
- Informational badges carry explicit `aria-label` tags describing provenance (e.g., `aria-label="Data source: MODELED from Open-Meteo"`).
- Dynamic alerts and Copilot stream containers feature `aria-live="polite"` regions.

### 5. Reduced-Motion Awareness
- Framer Motion animation components respect user system preferences via CSS `prefers-reduced-motion: reduce`.
- Subtle fades replace sliding or bouncy animations when reduced motion is requested.

### 6. Contrast Ratios
- Foreground typography against neutral and tinted card backgrounds exceeds the 4.5:1 ratio requirement for normal text and 3:1 for large text.
