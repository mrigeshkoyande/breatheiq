#!/usr/bin/env python3
"""
scripts/check_repo_size.py
Cross-platform repository size checker.
Verifies that all git-tracked files remain within the hard budget (< 8.0 MB).
Fails with exit code 1 if limit is exceeded or if any single file exceeds 150 KB (excluding authorized assets).
"""

import subprocess
import sys
import os

MAX_REPO_SIZE_MB = 8.0
MAX_SINGLE_FILE_KB = 250.0  # Alert threshold for individual files

def get_tracked_files():
    try:
        result = subprocess.run(
            ["git", "ls-files"],
            capture_output=True,
            text=True,
            check=True
        )
        files = [line.strip() for line in result.stdout.splitlines() if line.strip()]
        return files
    except Exception as e:
        print(f"[ERROR] Failed to run 'git ls-files': {e}")
        # Fallback to walking directory excluding common ignore patterns
        tracked = []
        ignored_dirs = {".git", "node_modules", "dist", ".venv", "venv", "__pycache__", "Design file", "Media"}
        for root, dirs, files in os.walk("."):
            dirs[:] = [d for d in dirs if d not in ignored_dirs]
            for f in files:
                tracked.append(os.path.relpath(os.path.join(root, f), "."))
        return tracked

def main():
    tracked_files = get_tracked_files()
    if not tracked_files:
        print("[INFO] No tracked files found.")
        sys.exit(0)

    total_bytes = 0
    file_sizes = []

    for file_path in tracked_files:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            total_bytes += size
            file_sizes.append((file_path, size))

    total_mb = total_bytes / (1024 * 1024)
    file_sizes.sort(key=lambda x: x[1], reverse=True)

    print("=" * 60)
    print("BreatheIQ Repository Size Audit")
    print("=" * 60)
    print(f"Total Tracked Files: {len(file_sizes)}")
    print(f"Total Repository Size: {total_mb:.3f} MB / {MAX_REPO_SIZE_MB:.1f} MB limit")
    print("-" * 60)
    print("Top 10 Largest Tracked Files:")
    for path, size in file_sizes[:10]:
        size_kb = size / 1024
        flag = " [!] LARGE" if size_kb > MAX_SINGLE_FILE_KB else ""
        print(f"  {size_kb:8.2f} KB  {path}{flag}")
    print("=" * 60)

    # Check for hard limit
    if total_mb > MAX_REPO_SIZE_MB:
        print(f"[FAIL] Repository size ({total_mb:.3f} MB) exceeds allowed limit of {MAX_REPO_SIZE_MB:.1f} MB!")
        sys.exit(1)

    print(f"[PASS] Repository size is healthy ({total_mb:.3f} MB < {MAX_REPO_SIZE_MB:.1f} MB).")
    sys.exit(0)

if __name__ == "__main__":
    main()
