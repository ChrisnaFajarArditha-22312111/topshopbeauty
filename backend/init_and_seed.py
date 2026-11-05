"""
init_and_seed.py — Inisialisasi struktur database & otomatis seed jika database kosong.
Dipanggil oleh scripts/start.bat untuk memastikan sistem selalu siap pakai tanpa error.
"""
import asyncio
import logging
from sqlalchemy import select, func

from app.core.database import AsyncSessionLocal, init_db
from app.products.models import Product
from seed_dev_data import seed

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


async def main():
    logger.info("⏳ [1/2] Menyiapkan struktur tabel database...")
    await init_db()
    logger.info("✅ Struktur tabel database siap.")

    async with AsyncSessionLocal() as db:
        res = await db.execute(select(func.count(Product.id)))
        count = res.scalar() or 0

    if count == 0:
        logger.info("🌱 [2/2] Database baru terdeteksi (0 produk). Melakukan seeding data awal otomatis...")
        await seed()
        logger.info("🎉 Seeding otomatis selesai! Akun admin dan katalog siap digunakan.")
    else:
        logger.info(f"ℹ️  [2/2] Database sudah terisi ({count} produk). Melewati seeding otomatis.")


if __name__ == "__main__":
    asyncio.run(main())
