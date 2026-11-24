#!/usr/bin/env python3
"""
scripts/measure_bundle.py
Measures Vite frontend build artifacts in frontend/dist/assets.
Computes uncompressed and gzip compressed byte sizes and verifies against budget:
- Initial entry JS bundle: <= 200 KB (gzipped)
- Consolidated CSS bundle: <= 50 KB (gzipped, baseline target <= 30 KB)
"""

import os
import sys
import gzip
from pathlib import Path

DIST_ASSETS = Path(__file__).resolve().parent.parent / "frontend" / "dist" / "assets"

BUDGET_JS_GZIP_KB = 200.0
BUDGET_CSS_GZIP_KB = 50.0

def get_gzip_size_bytes(file_path: Path) -> int:
    with open(file_path, "rb") as f_in:
        return len(gzip.compress(f_in.read()))

def main():
    if not DIST_ASSETS.exists():
        print(f"[FAIL] Dist assets directory does not exist: {DIST_ASSETS}")
        print("Run 'npm --prefix frontend run build' first.")
        sys.exit(1)

    files = list(DIST_ASSETS.glob("*.*"))
    if not files:
        print("[FAIL] No build assets found in frontend/dist/assets.")
        sys.exit(1)

    print("=" * 75)
    print("BreatheIQ Frontend Asset Bundle & Compression Measurement")
    print("=" * 75)
    print(f"{'Asset File':<38} {'Raw Size':<12} {'Gzip Size':<12} {'Budget / Status'}")
    print("-" * 75)

    failures = 0
    for f in sorted(files, key=lambda x: x.name):
        raw_bytes = f.stat().st_size
        gzip_bytes = get_gzip_size_bytes(f)
        raw_kb = raw_bytes / 1024.0
        gzip_kb = gzip_bytes / 1024.0

        budget_kb = BUDGET_JS_GZIP_KB if f.suffix == ".js" else BUDGET_CSS_GZIP_KB if f.suffix == ".css" else 100.0
        status = "PASS" if gzip_kb <= budget_kb else "FAIL (OVER BUDGET)"
        if gzip_kb > budget_kb:
            failures += 1

        print(f"{f.name:<38} {raw_kb:>8.2f} KB  {gzip_kb:>8.2f} KB  {status}")

    print("=" * 75)
    if failures > 0:
        print(f"[FAIL] {failures} assets exceeded performance budget.")
        sys.exit(1)

    print("[PASS] All frontend build assets are within gzip performance budget.")
    sys.exit(0)

if __name__ == "__main__":
    main()
