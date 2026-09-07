#!/usr/bin/env python3
"""
Quick setup script — creates the default admin and runs DB init.
Run once: python setup.py
"""
import asyncio
import os
import sys

# Add parent to path
sys.path.insert(0, os.path.dirname(__file__))

async def main():
    print("🚀 ACES Backend Setup")
    print("=" * 40)

    try:
        from database import init_db, AsyncSessionLocal
        from models import Admin, AdminRole
        from auth import hash_password
        from sqlalchemy import select, func

        print("📦 Initializing database tables...")
        await init_db()
        print("✅ Tables created successfully")

        async with AsyncSessionLocal() as db:
            count = (await db.execute(select(func.count(Admin.id)))).scalar()
            if count == 0:
                print("\n👤 Creating default Super Admin...")
                username = input("   Username [aces0101]: ").strip() or "aces0101"
                password = input("   Password [aces@26]: ").strip() or "aces@26"
                email = input("   Email [admin@aces.com]: ").strip() or "admin@aces.com"

                admin = Admin(
                    username=username,
                    email=email,
                    password_hash=hash_password(password),
                    role=AdminRole.super_admin,
                )
                db.add(admin)
                await db.commit()
                print(f"\n✅ Admin created: username={username}")
                print("⚠️  IMPORTANT: Change the password immediately after first login!\n")
            else:
                print(f"\nℹ️  {count} admin(s) already exist. Skipping admin creation.")

        print("\n🎉 Setup complete! Run the server with:")
        print("   uvicorn main:app --reload --port 8000")

    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        print("\nMake sure your DATABASE_URL in .env is correct and the database exists.")
        raise


if __name__ == "__main__":
    asyncio.run(main())
