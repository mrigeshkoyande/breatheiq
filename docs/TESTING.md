# BreatheIQ Verification & Testing Strategy

## 1. Test Architecture Matrix

BreatheIQ maintains an automated test pyramid spanning unit calculations, integration endpoints, end-to-end multi-viewport browser automation, and repository hygiene audits.

| Tier | Tool | Test Count | Scope |
|---|---|---|---|
| **Backend Unit & Integration** | `pytest` | 55 Tests | NAQI breakpoints, CADR sizing, Inversion ventilation, Auth tokens, Copilot validator, CRUD flow |
| **Frontend Unit** | `vitest` | 25 Tests | CPCB category classification, Inhaled dose formulas, CADR recommendations, In-memory auth service |
| **End-to-End Viewport Smoke** | `Playwright` | 72 Tests (24 routes × 3 viewports) | 390px Mobile, 768px Tablet, 1440px Desktop, screenshot capture, DOM anti-placeholder checks |
| **Anti-Placeholder Audit** | `audit_stubs.py` | Full Workspace | Scans for banned strings ("TODO", "Coming soon"), min line counts, empty components |
| **Truth & Evidence Claims** | `check_claims.py` | 45 Documentation & Source files | Scans for banned marketing overclaims ("100%", "zero-delay", "production-ready") |
| **Storage & Repo Diet** | `check_repo_size.py` | Full Repository | Enforces tracked files < 1.5 MB and Git store < 2.0 MB |

## 2. Running Automated Tests

### Backend Test Suite
```bash
cd backend
python -m pytest -v
```

### Frontend Unit Tests
```bash
cd frontend
npm test
```

### Playwright Viewport Smoke Matrix
```bash
cd frontend
npx playwright test
```

### Truth and Integrity Checks
```bash
python scripts/check_claims.py
python scripts/audit_stubs.py
python scripts/build_status.py
python scripts/check_repo_size.py
```

## 3. Evidence Collection

During the Playwright smoke matrix run, full-page screenshots are captured for all 24 release scope routes across 3 distinct device viewports:
- Mobile: 390 × 844 px (iPhone standard)
- Tablet: 768 × 1024 px (iPad standard)
- Desktop: 1440 × 900 px (MacBook / Desktop standard)

Captured assets reside in `test-results/screenshots/` and form the empirical validation evidence recorded in `docs/BUILD_STATUS.md`.
