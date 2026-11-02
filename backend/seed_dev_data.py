"""
seed_dev_data.py — Inisialisasi data awal (Admin, Customer, dan Katalog Produk)
"""
import asyncio
import os
import uuid
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.users.models import User
from app.profiles.models import Profile
from app.addresses.models import UserAddress
from app.products.importer import import_products_from_json

async def seed():
    print("🌱 Memulai seeding data awal...")
    async with AsyncSessionLocal() as db:
        # 1. Seed Admin
        admin_email = "admin@topshopbeauty.cloud"
        stmt = select(User).where(User.email == admin_email)
        res = await db.execute(stmt)
        admin = res.scalar_one_or_none()
        if not admin:
            admin = User(
                id=uuid.uuid4(),
                email=admin_email,
                password_hash=hash_password("Admin123!"),
                is_active=True,
                email_verified=True,
                is_admin=True,
            )
            db.add(admin)
            await db.flush()
            admin_profile = Profile(
                id=uuid.uuid4(),
                user_id=admin.id,
                full_name="Administrator Topshop",
            )
            db.add(admin_profile)
            print(f"  ✅ Admin dibuat: {admin_email} / Admin123!")
        else:
            admin.is_admin = True
            admin.email_verified = True
            admin.password_hash = hash_password("Admin123!")
            print(f"  ℹ️  Admin diupdate: {admin_email}")

        # 2. Seed Customer Verified
        customer_email = "customer@topshopbeauty.cloud"
        stmt = select(User).where(User.email == customer_email)
        res = await db.execute(stmt)
        customer = res.scalar_one_or_none()
        if not customer:
            customer = User(
                id=uuid.uuid4(),
                email=customer_email,
                password_hash=hash_password("Customer123!"),
                is_active=True,
                email_verified=True,
                is_admin=False,
            )
            db.add(customer)
            await db.flush()
            cust_profile = Profile(
                id=uuid.uuid4(),
                user_id=customer.id,
                full_name="Pelanggan Setia Topshop",
                phone="081234567890",
            )
            db.add(cust_profile)

            # Buat alamat default
            address = UserAddress(
                id=uuid.uuid4(),
                user_id=customer.id,
                label="Rumah",
                recipient_name="Pelanggan Setia",
                phone="081234567890",
                address="Jl. Raden Intan No. 10",
                province="Lampung",
                city="Bandar Lampung",
                district="Tanjung Karang Pusat",
                postal_code="35111",
                is_default=True,
            )
            db.add(address)
            print(f"  ✅ Customer dibuat: {customer_email} / Customer123!")
        else:
            customer.email_verified = True
            customer.password_hash = hash_password("Customer123!")
            print(f"  ℹ️  Customer diupdate: {customer_email}")

        await db.commit()

        # 3. Import Produk dari products.json
        json_path = os.path.join(os.path.dirname(__file__), "products.json")
        if os.path.exists(json_path):
            count = await import_products_from_json(db, json_path, limit=None)
            print(f"  ✅ Berhasil import/update {count} produk ke katalog.")
        else:
            print("  ⚠️  File products.json tidak ditemukan, lewati import produk.")

    print("🎉 Seeding selesai!")

if __name__ == "__main__":
    asyncio.run(seed())
