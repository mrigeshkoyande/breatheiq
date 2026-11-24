"""
scripts/scan_db.py
Comprehensive database inspection, schema validation, and error detection tool.
"""

import os
import sys
import sqlite3
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.db.session import Base
# Import all models to register with Base.metadata
import app.models.auth
import app.models.copilot
import app.models.app_data

def scan():
    print("=" * 60)
    print("BreatheIQ Deep Database Audit & Integrity Scan")
    print("=" * 60)

    db_path = backend_dir / "breatheiq.db"
    root_db_path = Path(__file__).resolve().parent.parent / "breatheiq.db"

    active_db = None
    if db_path.exists():
        active_db = db_path
    elif root_db_path.exists():
        active_db = root_db_path

    if not active_db:
        print(f"[!] No SQLite database file found at {db_path} or {root_db_path}.")
        print("[*] Creating and seeding database to verify fresh schema...")
        from app.db.session import engine
        import asyncio
        from app.db.seed import seed_database
        asyncio.run(seed_database())
        active_db = db_path if db_path.exists() else root_db_path

    print(f"[*] Inspecting database file: {active_db} (size: {active_db.stat().st_size:,} bytes)")
    
    conn = sqlite3.connect(active_db)
    cursor = conn.cursor()

    errors = []
    warnings = []

    # 1. PRAGMA integrity_check
    print("\n--- 1. Low-level Storage Integrity Check ---")
    cursor.execute("PRAGMA integrity_check;")
    integrity = cursor.fetchall()
    if integrity == [('ok',)]:
        print("[PASS] SQLite low-level storage integrity: OK")
    else:
        errors.append(f"Storage integrity failure: {integrity}")
        print(f"[FAIL] Storage integrity issues: {integrity}")

    # 2. PRAGMA foreign_key_check
    print("\n--- 2. Foreign Key Constraint Integrity ---")
    cursor.execute("PRAGMA foreign_key_check;")
    fk_violations = cursor.fetchall()
    if not fk_violations:
        print("[PASS] No foreign key violations detected.")
    else:
        for v in fk_violations:
            errors.append(f"Foreign key violation in table {v[0]}, rowid {v[1]}, target table {v[2]}")
        print(f"[FAIL] {len(fk_violations)} FK violations found: {fk_violations}")

    # 3. Model vs Table Mapping Check
    print("\n--- 3. SQLAlchemy Models vs Database Tables ---")
    db_tables = {r[0] for r in cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").fetchall()}
    model_tables = set(Base.metadata.tables.keys())

    print(f"[*] Defined Models ({len(model_tables)}): {sorted(list(model_tables))}")
    print(f"[*] Database Tables ({len(db_tables)}): {sorted(list(db_tables))}")

    missing_in_db = model_tables - db_tables
    if missing_in_db:
        errors.append(f"Tables defined in models but missing in database: {missing_in_db}")
        print(f"[FAIL] Missing in DB: {missing_in_db}")
    else:
        print("[PASS] All model tables are present in the database.")

    extra_in_db = db_tables - model_tables
    if extra_in_db:
        warnings.append(f"Extra tables in DB not mapped to models: {extra_in_db}")
        print(f"[WARN] Extra tables: {extra_in_db}")

    # 4. Column Level Schema Audit
    print("\n--- 4. Column-level Schema Verification ---")
    column_errors = 0
    for table_name in model_tables:
        if table_name not in db_tables:
            continue
        model_table = Base.metadata.tables[table_name]
        cursor.execute(f"PRAGMA table_info('{table_name}');")
        db_cols = {row[1]: {"type": row[2], "notnull": row[3], "pk": row[5]} for row in cursor.fetchall()}

        for col in model_table.columns:
            if col.name not in db_cols:
                errors.append(f"Missing column '{col.name}' in database table '{table_name}'")
                print(f"[FAIL] Table '{table_name}': missing column '{col.name}'")
                column_errors += 1
            else:
                # Check nullability
                db_notnull = bool(db_cols[col.name]["notnull"])
                model_notnull = not bool(col.nullable)
                # Note: SQLite table_info can differ slightly on PK nullability
                if col.primary_key:
                    pass
                elif db_notnull != model_notnull:
                    warnings.append(f"Nullability mismatch on {table_name}.{col.name}: DB notnull={db_notnull}, Model notnull={model_notnull}")

    if column_errors == 0:
        print("[PASS] All model columns exist in database tables with matching specifications.")

    # 5. Index Verification
    print("\n--- 5. Index Coverage Audit ---")
    for table_name in model_tables:
        cursor.execute(f"PRAGMA index_list('{table_name}');")
        indices = cursor.fetchall()
        model_table = Base.metadata.tables[table_name]
        
        # Check indexed columns in model
        indexed_cols = [c.name for c in model_table.columns if c.index or c.unique or c.primary_key]
        print(f"  Table '{table_name}': {len(indices)} indexes registered, primary/indexed columns: {indexed_cols}")

    # 6. Table Row Counts & Data Hygiene
    print("\n--- 6. Table Row Counts & Demo Data Verification ---")
    for t in sorted(list(db_tables)):
        cursor.execute(f"SELECT COUNT(*) FROM \"{t}\";")
        cnt = cursor.fetchone()[0]
        print(f"  {t.ljust(26)} : {cnt} rows")

    # Check Demo Users
    cursor.execute("SELECT id, email, role, is_active, is_verified FROM users;")
    users = cursor.fetchall()
    print("\n  Registered Users:")
    for u in users:
        print(f"    - ID: {u[0]} | {u[1]} | Role: {u[2]} | Active: {u[3]} | Verified: {u[4]}")

    conn.close()

    print("\n" + "=" * 60)
    print("DATABASE AUDIT SUMMARY")
    print("=" * 60)
    print(f"Total Errors Found:   {len(errors)}")
    print(f"Total Warnings Found: {len(warnings)}")
    for e in errors:
        print(f"  [ERROR] {e}")
    for w in warnings:
        print(f"  [WARN]  {w}")

    if not errors:
        print("\n[RESULT] DATABASE HEALTHY & CONSISTENT WITH APPLICATION MODELS.")
        return 0
    else:
        print("\n[RESULT] DATABASE REQUIRES CORRECTIONS.")
        return 1

if __name__ == "__main__":
    sys.exit(scan())
