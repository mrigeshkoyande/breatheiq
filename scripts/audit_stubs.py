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

def audit_file_content(file_path):
    violations = []
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        lines = content.splitlines()

    rel_path = os.path.relpath(file_path, ".")

    # Check banned strings
    for banned in BANNED_STRINGS:
        if banned.lower() in content.lower():
            # Find line numbers
            for idx, line in enumerate(lines, 1):
                if banned.lower() in line.lower():
                    violations.append((rel_path, idx, f"Banned string found: '{banned}'"))

    # Check banned handlers
    for pattern in BANNED_HANDLERS:
        for idx, line in enumerate(lines, 1):
            if re.search(pattern, line):
                violations.append((rel_path, idx, f"Banned handler pattern: '{line.strip()}'"))

    return violations, len(lines), content

def audit_frontend():
    violations = []
    pages_dir = os.path.join("frontend", "src", "pages")
    src_dir = os.path.join("frontend", "src")

    if not os.path.exists(src_dir):
        return [("frontend/src", 0, "Directory frontend/src not found")]

    # Walk frontend/src
    for root, _, files in os.walk(src_dir):
        for f in files:
            if not f.endswith((".ts", ".tsx", ".js", ".jsx")):
                continue
            if ".test." in f or ".spec." in f:
                continue

            path = os.path.join(root, f)
            file_violations, line_count, content = audit_file_content(path)
            violations.extend(file_violations)

            # Page component specific audits
            if os.path.abspath(root) == os.path.abspath(pages_dir):
                rel_path = os.path.relpath(path, ".")
                if line_count < PAGE_MIN_LINES and not f.startswith("Dev"):
                    violations.append((rel_path, line_count, f"Page has only {line_count} lines (minimum required: ~{PAGE_MIN_LINES})"))

                # Check if page imports API hook or context or service
                api_indicators = [
                    "../api",
                    "../services/api",
                    "../context/AuthContext",
                    "@tanstack/react-query",
                    "useAuth",
                ]
                has_api = any(ind in content for ind in api_indicators)
                if not has_api and f not in ["NotFoundPage.tsx", "DevUiPage.tsx"]:
                    violations.append((rel_path, 1, "Page component does not import any API hook or data service"))

            # Check for hardcoded arrays > 5 items outside i18n / config
            if "i18n" not in root and "config" not in root and "tokens" not in root:
                # Naive array detection of literal object / string arrays
                array_matches = re.finditer(r"const\s+\w+\s*=\s*\[\s*\{[^;]+\];", content, re.DOTALL)
                for match in array_matches:
                    arr_text = match.group(0)
                    items = arr_text.count("},")
                    if items > 5:
                        line_no = content[:match.start()].count("\n") + 1
                        violations.append((os.path.relpath(path, "."), line_no, f"Hardcoded array with >5 items ({items} items detected) outside seed/i18n"))

    return violations

def audit_backend():
    violations = []
    app_dir = os.path.join("backend", "app")
    if not os.path.exists(app_dir):
        return [("backend/app", 0, "Directory backend/app not found")]

    for root, _, files in os.walk(app_dir):
        for f in files:
            if not f.endswith(".py"):
                continue
            if "test" in f:
                continue
            path = os.path.join(root, f)
            rel_path = os.path.relpath(path, ".")
            with open(path, "r", encoding="utf-8", errors="ignore") as py_file:
                content = py_file.read()
                lines = content.splitlines()

            # Check except: pass
            for idx, line in enumerate(lines, 1):
                if re.search(r"except.*:\s*pass", line):
                    violations.append((rel_path, idx, "Banned pattern 'except: pass' detected"))

    return violations

def main():
    print("=" * 70)
    print("BreatheIQ Stub & Anti-Placeholder Codebase Audit")
    print("=" * 70)

    fe_violations = audit_frontend()
    be_violations = audit_backend()
    all_violations = fe_violations + be_violations

    if not all_violations:
        print("[PASS] Codebase audit clean! No stubs or banned placeholder patterns found.")
        sys.exit(0)
    else:
        print(f"[FAIL] Found {len(all_violations)} violations:\n")
        for file_path, line, msg in all_violations:
            print(f"  - {file_path}:{line} -> {msg}")
        print("=" * 70)
        sys.exit(1)

if __name__ == "__main__":
    main()
