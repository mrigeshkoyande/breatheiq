#!/usr/bin/env python3
"""
scripts/check_all.py
Unified cross-platform verification suite for BreatheIQ.
Executes all gates in sequence and fails fast:
1. Truth & anti-hallucination claims audit (check_claims.py)
2. Anti-placeholder and stub audit (audit_stubs.py)
3. Repository storage and file size audit (check_repo_size.py)
4. Frontend production typecheck & Vite build (npm run build)
5. Frontend bundle gzip budget measurement (measure_bundle.py)
6. Frontend unit test suite (vitest)
7. Backend pytest test suite
8. Route ledger status regeneration (build_status.py)
"""

import sys
import subprocess
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

CHECKS = [
    ("Claims & Anti-Hallucination Audit", [sys.executable, "scripts/check_claims.py"]),
    ("Anti-Placeholder & Stub Audit", [sys.executable, "scripts/audit_stubs.py"]),
    ("Repository Size Budget Audit", [sys.executable, "scripts/check_repo_size.py"]),
    ("Frontend TypeScript & Vite Build", ["npm", "--prefix", "frontend", "run", "build"]),
    ("Frontend Bundle Gzip Measurement", [sys.executable, "scripts/measure_bundle.py"]),
    ("Frontend Vitest Suite", ["npm", "--prefix", "frontend", "test"]),
    ("Backend Pytest Test Suite", [sys.executable, "-m", "pytest", "backend/tests"]),
    ("Route Ledger & Build Status", [sys.executable, "scripts/build_status.py"]),
]

def run_step(name: str, cmd: list) -> bool:
    print(f"\n[RUNNING] {name}...")
    start = time.time()
    res = subprocess.run(cmd, cwd=str(ROOT_DIR), shell=False)
    elapsed = time.time() - start
    if res.returncode != 0:
        print(f"[FAIL] {name} failed with exit code {res.returncode} ({elapsed:.1f}s)")
        return False
    print(f"[PASS] {name} completed successfully ({elapsed:.1f}s)")
    return True

def main():
    print("=" * 75)
    print("BreatheIQ Master Automated Quality & Evidence Gate (check_all.py)")
    print("=" * 75)

    for name, cmd in CHECKS:
        # On Windows, npm is a cmd/bat
        if sys.platform == "win32" and cmd[0] == "npm":
            cmd[0] = "npm.cmd"
        success = run_step(name, cmd)
        if not success:
            print("\n" + "=" * 75)
            print(f"ABORTED: Quality gate failed on '{name}'. Fix the failure above.")
            print("=" * 75)
            sys.exit(1)

    print("\n" + "=" * 75)
    print("ALL GATES PASSED! Codebase is completely verified and compliant.")
    print("=" * 75)
    sys.exit(0)

if __name__ == "__main__":
    main()
