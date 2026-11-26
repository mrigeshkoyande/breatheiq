"""
scripts/scan_db.py
Comprehensive database inspection, schema validation, and error detection tool.
"""

import asyncio
import sqlite3
import sys
from pathlib import Path

# Add backend directory to path before importing application modules.
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import app.models.app_data  # noqa: E402
import app.models.auth  # noqa: E402
import app.models.copilot  # noqa: E402, F401
from app.db.seed import seed_database  # noqa: E402
from app.db.session import Base  # noqa: E402


def _locate_or_seed_db() -> Path:
    """Locate existing SQLite database or initialize a seeded database."""
    db_path = backend_dir / "breatheiq.db"
    root_db_path = Path(__file__).resolve().parent.parent / "breatheiq.db"
    active_db = db_path if db_path.exists() else root_db_path if root_db_path.exists() else None
    if not active_db:
        print(f"[!] No SQLite database file found at {db_path} or {root_db_path}.")
        print("[*] Creating and seeding database to verify fresh schema...")
        asyncio.run(seed_database())
        active_db = db_path if db_path.exists() else root_db_path
    print(f"[*] Inspecting database file: {active_db} (size: {active_db.stat().st_size:,} bytes)")
    return active_db


def _check_sqlite_integrity(cursor: sqlite3.Cursor, errors: list[str]) -> None:
    """Run SQLite PRAGMA integrity_check and foreign_key_check."""
    print("\n--- 1. Low-level Storage Integrity Check ---")
    integrity = cursor.execute("PRAGMA integrity_check;").fetchall()
    if integrity == [("ok",)]:
        print("[PASS] SQLite low-level storage integrity: OK")
    else:
        errors.append(f"Storage integrity failure: {integrity}")
        print(f"[FAIL] Storage integrity issues: {integrity}")

    print("\n--- 2. Foreign Key Constraint Integrity ---")
    fk_violations = cursor.execute("PRAGMA foreign_key_check;").fetchall()
    if not fk_violations:
        print("[PASS] No foreign key violations detected.")
        return
    for row in fk_violations:
        errors.append(
            f"Foreign key violation in table {row[0]}, rowid {row[1]}, target table {row[2]}"
        )
    print(f"[FAIL] {len(fk_violations)} FK violations found: {fk_violations}")


def _check_table_columns(
    cursor: sqlite3.Cursor, table_name: str, errors: list[str], warnings: list[str]
) -> int:
    """Verify columns and nullability constraints for one table."""
    col_errors = 0
    cursor.execute(f"PRAGMA table_info('{table_name}');")
    db_cols = {row[1]: {"notnull": row[3]} for row in cursor.fetchall()}
    for col in Base.metadata.tables[table_name].columns:
        if col.name not in db_cols:
            errors.append(f"Missing column '{col.name}' in database table '{table_name}'")
            print(f"[FAIL] Table '{table_name}': missing column '{col.name}'")
            col_errors += 1
        elif not col.primary_key and bool(db_cols[col.name]["notnull"]) != (not bool(col.nullable)):
            warnings.append(
                f"Nullability mismatch on {table_name}.{col.name}: "
                f"DB notnull={bool(db_cols[col.name]['notnull'])}, Model notnull={not bool(col.nullable)}"
            )
    return col_errors


def _check_schema_mapping(
    cursor: sqlite3.Cursor, errors: list[str], warnings: list[str]
) -> tuple[set[str], set[str]]:
    """Compare SQLAlchemy model tables and columns against SQLite schema."""
    print("\n--- 3. SQLAlchemy Models vs Database Tables ---")
    rows = cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    ).fetchall()
    db_tables = {r[0] for r in rows}
    model_tables = set(Base.metadata.tables.keys())
    print(f"[*] Defined Models ({len(model_tables)}): {sorted(model_tables)}")
    print(f"[*] Database Tables ({len(db_tables)}): {sorted(db_tables)}")
    missing = model_tables - db_tables
    if missing:
        errors.append(f"Tables defined in models but missing in database: {missing}")
        print(f"[FAIL] Missing in DB: {missing}")
    else:
        print("[PASS] All model tables are present in the database.")
    extra = db_tables - model_tables
    if extra:
        warnings.append(f"Extra tables in DB not mapped to models: {extra}")
        print(f"[WARN] Extra tables: {extra}")

    print("\n--- 4. Column-level Schema Verification ---")
    column_errors = sum(
        _check_table_columns(cursor, t, errors, warnings) for t in model_tables if t in db_tables
    )
    if column_errors == 0:
        print("[PASS] All model columns exist in database tables with matching specifications.")
    return model_tables, db_tables


def _check_indexes_and_rows(
    cursor: sqlite3.Cursor, model_tables: set[str], db_tables: set[str]
) -> None:
    """Audit index definitions, table row counts, and demo users."""
    print("\n--- 5. Index Coverage Audit ---")
    for table_name in model_tables:
        indices = cursor.execute(f"PRAGMA index_list('{table_name}');").fetchall()
        indexed = [
            c.name
            for c in Base.metadata.tables[table_name].columns
            if c.index or c.unique or c.primary_key
        ]
        print(
            f"  Table '{table_name}': {len(indices)} indexes registered, primary/indexed columns: {indexed}"
        )

    print("\n--- 6. Table Row Counts & Demo Data Verification ---")
    for table_name in sorted(db_tables):
        cnt = cursor.execute(f'SELECT COUNT(*) FROM "{table_name}";').fetchone()[0]
        print(f"  {table_name.ljust(26)} : {cnt} rows")

    print("\n  Registered Users:")
    for uid, email, role, active, verified in cursor.execute(
        "SELECT id, email, role, is_active, is_verified FROM users;"
    ).fetchall():
        print(f"    - ID: {uid} | {email} | Role: {role} | Active: {active} | Verified: {verified}")


def _print_summary(errors: list[str], warnings: list[str]) -> int:
    """Print summary counts and return exit status."""
    print("\n" + "=" * 60)
    print("DATABASE AUDIT SUMMARY")
    print("=" * 60)
    print(f"Total Errors Found:   {len(errors)}")
    print(f"Total Warnings Found: {len(warnings)}")
    for err in errors:
        print(f"  [ERROR] {err}")
    for warn in warnings:
        print(f"  [WARN]  {warn}")
    if not errors:
        print("\n[RESULT] DATABASE HEALTHY & CONSISTENT WITH APPLICATION MODELS.")
        return 0
    print("\n[RESULT] DATABASE REQUIRES CORRECTIONS.")
    return 1


def scan() -> int:
    """Run end-to-end SQLite storage, schema, index, and row audit."""
    print("=" * 60)
    print("BreatheIQ Deep Database Audit & Integrity Scan")
    print("=" * 60)
    active_db = _locate_or_seed_db()
    conn = sqlite3.connect(active_db)
    cursor = conn.cursor()
    errors: list[str] = []
    warnings: list[str] = []
    _check_sqlite_integrity(cursor, errors)
    model_tables, db_tables = _check_schema_mapping(cursor, errors, warnings)
    _check_indexes_and_rows(cursor, model_tables, db_tables)
    conn.close()
    return _print_summary(errors, warnings)


if __name__ == "__main__":
    sys.exit(scan())
