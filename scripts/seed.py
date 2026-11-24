"""
scripts/seed.py
CLI entrypoint to seed BreatheIQ database tables, demo users, and family flow records.
Usage: python scripts/seed.py
"""

import sys
import asyncio
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.db.seed import seed_database

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    print("[*] Starting BreatheIQ database seed process...")
    asyncio.run(seed_database())
    print("[+] Database seeding finished successfully.")
