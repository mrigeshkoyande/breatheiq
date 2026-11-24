# Baseline Audit — Complete/100

Captured: 2026-11-24T21:35:00+05:30
Branch: complete/100 (branched from main at commit 37fe405)

## 1. Summary of Baseline Checks

| Check | Tool / Script | Status | Metric / Details |
|---|---|---|---|
| Truth & Claims Audit | `python scripts/check_claims.py` | PASS | Scanned 56 files, 0 unproven or banned claims detected |
| Stub & Placeholder Audit | `python scripts/audit_stubs.py` | PASS | 0 stubs or banned patterns found |
| Route Scope & Ledger | `python scripts/build_status.py` | PASS | 24/24 in-scope routes verified, 0 functional, 0 missing (70 deferred from initial 94 spec) |
| Repository Size Budget | `python scripts/check_repo_size.py` | PASS | Tracked files: 143 files, 1.117 MB (< 1.5 MB budget). Loose objects: 1.010 MB (< 2.0 MB budget). Pack file: 0 MB |
| Git Object Storage | `git count-objects -vH` | PASS | count: 542, size: 1.01 MiB, in-pack: 0, packs: 0, size-pack: 0 bytes |
| Frontend Unit Tests | `npm --prefix frontend test` | PASS | 2 test files, 25 passed, 0 failed (755 ms) |
| Frontend Production Build | `npm --prefix frontend run build` | PASS | Vite built dist (473.83 kB JS, 51.57 kB CSS) |
| Backend Pytest Suite | `python -m pytest backend/tests` | PASS | 66 passed, 0 failed, 22 warnings (2.36s) |

## 2. Invariant Gates

Any change on this branch must not cause:
- Any of the 66 backend tests to fail.
- Any of the 25 frontend tests to fail.
- Tracked repo size to exceed 1.5 MB.
- Git pack or loose storage to exceed 2.0 MB.
- Any banned placeholder, stub, or unverified claim to appear.
