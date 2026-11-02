"""
database.py — Konfigurasi database async untuk Topshop Kosmetik AI
Menggunakan SQLAlchemy async engine dengan asyncpg sebagai driver PostgreSQL
"""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


# =========================================================
# Async Engine
# =========================================================
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.is_development,  # Log query SQL di mode development
    pool_pre_ping=True,            # Cek koneksi sebelum digunakan
    pool_size=10,                  # Jumlah koneksi di pool
    max_overflow=20,               # Koneksi tambahan di luar pool_size
    pool_timeout=30,               # Timeout menunggu koneksi dari pool (detik)
    pool_recycle=1800,             # Daur ulang koneksi setiap 30 menit
)

# =========================================================
# Session Factory
# =========================================================
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Objek tidak expired setelah commit
    autocommit=False,
    autoflush=False,
)


# =========================================================
# Base Declarative Model
# Semua model SQLAlchemy harus mewarisi kelas ini
# =========================================================
class Base(DeclarativeBase):
    """
    Kelas dasar untuk semua model database.
    Semua model di seluruh aplikasi harus mewarisi kelas ini
    agar Alembic dapat mendeteksi perubahan schema secara otomatis.
    """
    pass


# =========================================================
# Dependency FastAPI
# =========================================================
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency FastAPI untuk mendapatkan sesi database async.
    Sesi akan otomatis ditutup setelah request selesai.

    Penggunaan:
        @router.get("/example")
        async def example(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# =========================================================
# Fungsi Inisialisasi Database
# =========================================================
async def init_db() -> None:
    """
    Inisialisasi database saat aplikasi pertama kali dijalankan.
    Membuat semua tabel yang belum ada (jika tidak menggunakan Alembic).
    Catatan: Dalam production, gunakan Alembic migration.
    """
    async with engine.begin() as conn:
        # Buat semua tabel berdasarkan metadata model
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """
    Tutup semua koneksi database saat aplikasi dihentikan.
    Dipanggil di lifespan shutdown event.
    """
    await engine.dispose()
