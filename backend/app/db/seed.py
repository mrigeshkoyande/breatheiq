import asyncio
from sqlalchemy import select
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal, Base, engine
from app.models.auth import User

DEMO_ACCOUNTS = [
    {
        "email": "user@breatheiq.org",
        "password": "Password123!",
        "full_name": "Priya Sharma (Demo User)",
        "role": "user",
        "is_active": True,
        "is_verified": True
    },
    {
        "email": "moderator@breatheiq.org",
        "password": "Password123!",
        "full_name": "Aarav Mehta (Community Moderator)",
        "role": "moderator",
        "is_active": True,
        "is_verified": True
    },
    {
        "email": "admin@breatheiq.org",
        "password": "Password123!",
        "full_name": "System Administrator",
        "role": "admin",
        "is_active": True,
        "is_verified": True
    }
]

async def seed_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for acc in DEMO_ACCOUNTS:
            res = await session.execute(select(User).where(User.email == acc["email"]))
            existing = res.scalars().first()
            if not existing:
                user = User(
                    email=acc["email"],
                    hashed_password=hash_password(acc["password"]),
                    full_name=acc["full_name"],
                    role=acc["role"],
                    is_active=acc["is_active"],
                    is_verified=acc["is_verified"]
                )
                session.add(user)
                print(f"[SEED] Created demo account: {acc['email']} ({acc['role']})")
        await session.commit()

if __name__ == "__main__":
    asyncio.run(seed_database())
