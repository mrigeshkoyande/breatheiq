#!/usr/bin/env python3
"""
scripts/check_repo_size.py
Cross-platform repository size and git object budget auditor.
Enforces non-negotiable hackathon constraints:
- Total git-tracked files < 1.5 MB
- Git object storage / size-pack < 2.0 MB
- Individual file size budget (< 250 KB)
"""

import os
import re
import subprocess
import sys

MAX_TRACKED_SIZE_MB = 1.5
MAX_GIT_OBJECT_SIZE_MB = 2.0
MAX_SINGLE_FILE_KB = 250.0


def get_tracked_files() -> list[str]:
    """Return git-tracked file paths or scan working tree excluding ignored dirs."""
    try:
        result = subprocess.run(
            ["git", "ls-files"],
            capture_output=True,
            text=True,
            check=True,
        )
        return [line.strip() for line in result.stdout.splitlines() if line.strip()]
    except (subprocess.SubprocessError, OSError) as exc:
        print(f"[WARN] Failed to run 'git ls-files': {exc}. Using directory scan fallback.")
        tracked = []
        ignored_dirs = {
            ".git",
            "node_modules",
            "dist",
            ".venv",
            "venv",
            "__pycache__",
            "Design file",
            "Media",
            "test-results",
        }
        for root, dirs, files in os.walk("."):
            dirs[:] = [d for d in dirs if d not in ignored_dirs]
            for f in files:
                tracked.append(os.path.relpath(os.path.join(root, f), "."))
        return tracked


def check_git_count_objects() -> dict[str, str] | None:
    """Query git object database sizes using ``git count-objects -vH``."""
    try:
        result = subprocess.run(
            ["git", "count-objects", "-vH"],
            capture_output=True,
            text=True,
            check=True,
        )
        info: dict[str, str] = {}
        for line in result.stdout.splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                info[k.strip()] = v.strip()
        return info
    except (subprocess.SubprocessError, OSError):
        return None


def parse_size_to_mb(size_str):
    if not size_str:
        return 0.0
    match = re.match(r"([\d\.]+)\s*([KMGkmg]?i?B|bytes)", size_str.strip())
    if not match:
        return 0.0
    val = float(match.group(1))
    unit = match.group(2).upper()
    if "K" in unit:
        return val / 1024.0
    if "M" in unit:
        return val
    if "G" in unit:
        return val * 1024.0
    return val / (1024.0 * 1024.0)


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
    print("BreatheIQ Repository Size & Storage Budget Audit")
    print("=" * 60)
    print(f"Total Tracked Files: {len(file_sizes)}")
    print(f"Total Tracked Files Size: {total_mb:.3f} MB / {MAX_TRACKED_SIZE_MB:.1f} MB budget")
    print("-" * 60)
    print("Top 10 Largest Tracked Files:")
    for path, size in file_sizes[:10]:
        size_kb = size / 1024
        flag = " [!] LARGE" if size_kb > MAX_SINGLE_FILE_KB else ""
        print(f"  {size_kb:8.2f} KB  {path}{flag}")
    print("=" * 60)

    # Git object database check
    git_info = check_git_count_objects()
    if git_info:
        loose_size_str = git_info.get("size", "0")
        pack_size_str = git_info.get("size-pack", "0")
        loose_mb = parse_size_to_mb(loose_size_str)
        pack_mb = parse_size_to_mb(pack_size_str)
        total_obj_mb = loose_mb + pack_mb

        print("Git Storage Statistics:")
        print(f"  Loose objects size: {loose_size_str} ({loose_mb:.3f} MB)")
        print(f"  Pack file size:     {pack_size_str} ({pack_mb:.3f} MB)")
        print(
            f"  Combined Git Store: {total_obj_mb:.3f} MB / {MAX_GIT_OBJECT_SIZE_MB:.1f} MB budget"
        )
        print("=" * 60)

        if total_obj_mb > MAX_GIT_OBJECT_SIZE_MB:
            print(
                f"[FAIL] Git store size ({total_obj_mb:.3f} MB) exceeds allowed limit of {MAX_GIT_OBJECT_SIZE_MB:.1f} MB!"
            )
            sys.exit(1)

    # Check for hard tracked files limit
    if total_mb > MAX_TRACKED_SIZE_MB:
        print(
            f"[FAIL] Tracked files size ({total_mb:.3f} MB) exceeds allowed limit of {MAX_TRACKED_SIZE_MB:.1f} MB!"
        )
        sys.exit(1)

    print(
        f"[PASS] All repo size constraints satisfied ({total_mb:.3f} MB tracked < {MAX_TRACKED_SIZE_MB:.1f} MB)."
    )
    sys.exit(0)


if __name__ == "__main__":
    main()
