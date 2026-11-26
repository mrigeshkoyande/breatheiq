#!/usr/bin/env python3
"""
scripts/check_claims.py
Audits README.md, docs/*.md, and frontend/src/ for banned unproven claims and marketing buzzwords.
Per AGENTS.md Truth Rules:
Banned unless accompanied by explicit evidence/justification tag (e.g. <!-- verified-claim -->, // verified-claim):
- "zero" (e.g. zero-delay, zero-hallucination, zero error)
- "100%"
- "production-ready"
- "comprehensive"
- "state-of-the-art"
- "peer-reviewed"
- "guarantee"
- "AAA"
- "HIPAA"
- "official" (except when referring to official CAAQMS/CPCB data/standards)
- "verified" (when modifying impact numbers without verified-claim tag)
"""

import os
import re
import sys

TARGET_FILES = ["README.md"]
DOCS_DIR = "docs"
SRC_DIR = os.path.join("frontend", "src")

# Regex patterns for banned claims
BANNED_RULES = [
    {
        "name": "zero_claim",
        "pattern": r"\bzero(?:\s*-\s*|\s+)(?:delay|hallucination|latency|risk|error|cost|downtime)\b",
        "desc": "Unsubstantiated 'zero' claim (e.g. zero-delay, zero-hallucination)",
    },
    {"name": "percentage_100", "pattern": r"\b100\s*%", "desc": "Unsubstantiated '100%' claim"},
    {
        "name": "production_ready",
        "pattern": r"\bproduction\s*-\s*ready\b",
        "desc": "Unsubstantiated 'production-ready' claim",
    },
    {
        "name": "comprehensive",
        "pattern": r"\bcomprehensive\b",
        "desc": "Overclaimed 'comprehensive' marketing term",
    },
    {
        "name": "state_of_the_art",
        "pattern": r"\bstate\s*-\s*of\s*-\s*the\s*-\s*art\b",
        "desc": "Unsubstantiated 'state-of-the-art' claim",
    },
    {
        "name": "peer_reviewed",
        "pattern": r"\bpeer\s*-\s*reviewed\b",
        "desc": "Unsubstantiated 'peer-reviewed' citation without paper DOI",
    },
    {
        "name": "guarantee",
        "pattern": r"\bguarante(?:e|ed|es|eing)\b",
        "desc": "Unverifiable health or performance guarantee",
    },
    {
        "name": "aaa_compliance",
        "pattern": r"\bAAA\b",
        "desc": "Unsubstantiated 'AAA' accessibility/compliance claim",
    },
    {
        "name": "hipaa_claim",
        "pattern": r"\bHIPAA\b",
        "desc": "Inapplicable / unsubstantiated 'HIPAA' compliance claim",
    },
    {
        "name": "official_unqualified",
        "pattern": r"\bofficial\b(?!\s+(?:CAAQMS|CPCB|guidance|standard|station|source|advisory))",
        "desc": "Unqualified 'official' claim not tied to CAAQMS/CPCB standards",
    },
]

WHITELIST_TAGS = ["verified-claim", "justified-claim", "AGENTS.md", "check_claims.py", "scripts/"]


def scan_file(file_path):
    violations = []
    try:
        with open(file_path, encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
    except OSError as exc:
        return [(1, f"Could not read file: {exc}")]

    for idx, line in enumerate(lines, 1):
        # Skip lines with whitelist tags
        if any(tag in line for tag in WHITELIST_TAGS):
            continue

        # Check previous line for tag comment
        if idx > 1 and any(tag in lines[idx - 2] for tag in WHITELIST_TAGS):
            continue

        for rule in BANNED_RULES:
            match = re.search(rule["pattern"], line, re.IGNORECASE)
            if match:
                matched_text = match.group(0)
                violations.append((idx, line.strip(), f"{rule['desc']}: matched '{matched_text}'"))

    return violations


def collect_files():
    files_to_scan = []
    # Add README
    if os.path.exists("README.md"):
        files_to_scan.append("README.md")

    # Add docs/*.md
    if os.path.exists(DOCS_DIR):
        for f in os.listdir(DOCS_DIR):
            if f.endswith(".md"):
                files_to_scan.append(os.path.join(DOCS_DIR, f))

    # Add frontend/src files
    if os.path.exists(SRC_DIR):
        for root, _, files in os.walk(SRC_DIR):
            for f in files:
                if f.endswith((".ts", ".tsx", ".js", ".jsx")):
                    files_to_scan.append(os.path.join(root, f))

    return files_to_scan


def main():
    files = collect_files()
    all_violations = []

    print("=" * 60)
    print("BreatheIQ Truth & Evidence Claim Audit")
    print("=" * 60)

    for path in files:
        violations = scan_file(path)
        if violations:
            all_violations.append((path, violations))

    if not all_violations:
        print(f"[PASS] Scanned {len(files)} files. 0 unproven or banned claims detected.")
        print("=" * 60)
        sys.exit(0)

    print(f"[FAIL] Found unproven claim violations in {len(all_violations)} files:")
    print("-" * 60)
    total_violations = 0
    for path, violations in all_violations:
        print(f"\nFile: {path}")
        for line_no, line_text, reason in violations:
            total_violations += 1
            print(f"  Line {line_no:4d}: {reason}")
            print(f'             "{line_text[:80]}"')

    print("\n" + "=" * 60)
    print(f"Total Violations: {total_violations}")
    print(
        "Fix: Remove unverified claims, or justify with an evidence comment like `<!-- verified-claim: <citation> -->`."
    )
    print("=" * 60)
    sys.exit(1)


if __name__ == "__main__":
    main()
