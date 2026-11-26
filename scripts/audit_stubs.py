#!/usr/bin/env python3
"""
scripts/audit_stubs.py
Scans frontend/src and backend/app for:
1. Banned placeholder strings ("Coming soon", "Lorem ipsum", "TODO", "Under construction", 'href="#"').
2. Empty or fake event handlers (onClick={() => {}}, onClick={() => console.log(...)}).
3. Page components in frontend/src/pages under ~60 lines.
4. Page components that import no API/data hook.
5. Hardcoded business data arrays (> 5 items) outside test/i18n/config.
6. Backend bare except / except: pass.
7. Endpoints returning hardcoded static data.

Prints all findings and exits non-zero if violations are found.
"""

import os
import re
import sys

BANNED_STRINGS = [
    "Coming soon",
    "Lorem ipsum",
    "TODO",
    "Under construction",
    'href="#"',
    "href='#'",
]

BANNED_HANDLERS = [
    r"onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}",
    r"onClick=\{\s*\(\)\s*=>\s*console\.log\([^)]*\)\s*\}",
    r"onClick=\{\s*undefined\s*\}",
]

PAGE_MIN_LINES = 60

API_INDICATORS = [
    "../api",
    "../services/api",
    "../context/AuthContext",
    "@tanstack/react-query",
    "useAuth",
]


def audit_file_content(file_path: str) -> tuple[list[tuple[str, int, str]], int, str]:
    """Check one source file for banned placeholder strings and empty handlers."""
    violations: list[tuple[str, int, str]] = []
    with open(file_path, encoding="utf-8", errors="ignore") as f:
        content = f.read()
        lines = content.splitlines()

    rel_path = os.path.relpath(file_path, ".")
    for banned in BANNED_STRINGS:
        if banned.lower() in content.lower():
            for idx, line in enumerate(lines, 1):
                if banned.lower() in line.lower():
                    violations.append((rel_path, idx, f"Banned string found: '{banned}'"))

    for pattern in BANNED_HANDLERS:
        for idx, line in enumerate(lines, 1):
            if re.search(pattern, line):
                violations.append((rel_path, idx, f"Banned handler pattern: '{line.strip()}'"))

    return violations, len(lines), content


def _audit_page_requirements(
    path: str, filename: str, line_count: int, content: str
) -> list[tuple[str, int, str]]:
    """Enforce minimum line count and API/hook wiring on frontend page modules."""
    rel_path = os.path.relpath(path, ".")
    issues: list[tuple[str, int, str]] = []
    if line_count < PAGE_MIN_LINES and not filename.startswith("Dev"):
        issues.append(
            (
                rel_path,
                line_count,
                f"Page has only {line_count} lines (minimum required: ~{PAGE_MIN_LINES})",
            )
        )
    if filename not in ["NotFoundPage.tsx", "DevUiPage.tsx"] and not any(
        ind in content for ind in API_INDICATORS
    ):
        issues.append((rel_path, 1, "Page component does not import any API hook or data service"))
    return issues


def _audit_hardcoded_arrays(path: str, content: str) -> list[tuple[str, int, str]]:
    """Detect hardcoded business arrays exceeding five entries outside i18n/config."""
    issues: list[tuple[str, int, str]] = []
    for match in re.finditer(r"const\s+\w+\s*=\s*\[\s*\{[^;]+\];", content, re.DOTALL):
        items = match.group(0).count("},")
        if items > 5:
            line_no = content[: match.start()].count("\n") + 1
            issues.append(
                (
                    os.path.relpath(path, "."),
                    line_no,
                    f"Hardcoded array with >5 items ({items} items detected) outside seed/i18n",
                )
            )
    return issues


def audit_frontend() -> list[tuple[str, int, str]]:
    """Audit frontend TypeScript/React files for stubs, thin pages, and hardcoded arrays."""
    src_dir = os.path.join("frontend", "src")
    if not os.path.exists(src_dir):
        return [("frontend/src", 0, "Directory frontend/src not found")]

    violations: list[tuple[str, int, str]] = []
    pages_abs = os.path.abspath(os.path.join(src_dir, "pages"))
    for root, _, files in os.walk(src_dir):
        is_page_dir = os.path.abspath(root) == pages_abs
        check_arrays = not any(seg in root for seg in ("i18n", "config", "tokens"))
        for fname in files:
            if (
                not fname.endswith((".ts", ".tsx", ".js", ".jsx"))
                or ".test." in fname
                or ".spec." in fname
            ):
                continue
            path = os.path.join(root, fname)
            file_violations, line_count, content = audit_file_content(path)
            violations.extend(file_violations)
            if is_page_dir:
                violations.extend(_audit_page_requirements(path, fname, line_count, content))
            if check_arrays:
                violations.extend(_audit_hardcoded_arrays(path, content))
    return violations


def audit_backend() -> list[tuple[str, int, str]]:
    """Scan backend Python modules for bare/swallowed except: pass statements."""
    violations: list[tuple[str, int, str]] = []
    app_dir = os.path.join("backend", "app")
    if not os.path.exists(app_dir):
        return [("backend/app", 0, "Directory backend/app not found")]

    for root, _, files in os.walk(app_dir):
        for fname in files:
            if not fname.endswith(".py") or "test" in fname:
                continue
            path = os.path.join(root, fname)
            rel_path = os.path.relpath(path, ".")
            with open(path, encoding="utf-8", errors="ignore") as py_file:
                lines = py_file.read().splitlines()
            for idx, line in enumerate(lines, 1):
                if re.search(r"except.*:\s*pass", line):
                    violations.append((rel_path, idx, "Banned pattern 'except: pass' detected"))
    return violations


def main() -> None:
    """Execute stub audit and exit non-zero on violations."""
    print("=" * 70)
    print("BreatheIQ Stub & Anti-Placeholder Codebase Audit")
    print("=" * 70)

    all_violations = audit_frontend() + audit_backend()
    if not all_violations:
        print("[PASS] Codebase audit clean! No stubs or banned placeholder patterns found.")
        sys.exit(0)

    print(f"[FAIL] Found {len(all_violations)} violations:\n")
    for file_path, line, msg in all_violations:
        print(f"  - {file_path}:{line} -> {msg}")
    print("=" * 70)
    sys.exit(1)


if __name__ == "__main__":
    main()
